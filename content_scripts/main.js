var istex = {
  istexBaseURL: "api.istex.fr/document/openurl",
  maxPageLinks: 2500,
  mustDebug   : false,

  message: function(aMessage) {
    if (this.mustDebug) {
      console.log("istex.log: " + aMessage);
    }
  },

  /**
   * Check if the string str ends with given suffix.
   */
  endsWith: function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  },

  /**
   * Check if the string str starts with given prefix.
   *
   */
  startsWith: function(str, prefix) {
    return str.indexOf(prefix) === 0;
  },

  maxPageLinks: function() {
    return this.maxPageLinks;
  },

  istexBaseURL: function() {
    return this.istexBaseURL;
  }

};

var ISTEXLinkInserter = {
  // OpenURL static info
  openUrlVersion: "Z39.88-2004",
  openURLPrefix : "https://api.istex.fr/document/openurl?",

  // DOI pattern
  doiPattern                 : /\/\/(dx\.doi\.org|doi\.acm\.org|dx\.crossref\.org).*\/(10\..*(\/|%2(F|f)).*)/,
  // the index of the group where to find the DOI
  doiGroup                   : 2,
  regexDoiPatternConservative: new RegExp("(10\\.\\d{4,5}\\/[\\S]+[^;,.\\s])", "gi"),

  // PMID
  pubmedPattern         : new RegExp("\\/\\/.*\\.ncbi\\.nlm\\.nih\\.gov.*\\/pubmed.*(\\/|=)([0-9]{4,12})", "i"),
  pubmedGroup           : 1,
  regexPMIDPattern      : new RegExp("(PubMed\\s?(ID\\s?:?|:)|PM\\s?ID)[\\s:\\/]?\\s*([0-9]{4,12})", "gi"),
  regexPrefixPMIDPattern: new RegExp("((PubMed\\s?(ID)?:?)|(PM\\s?ID))[\\s:\\/]*$", "i"),
  regexSuffixPMIDPattern: new RegExp("^\\s*[:\\/]?\\s*([0-9]{4,12})", "i"),
  skipPattern           : new RegExp("^[:\\/\\s]+$", "i"),

  // PII pattern in links
  regexPIIPattern: new RegExp("\\pii\\/([A-Z0-9]{16,20})", "gi"),

  // The last group should be the parameters for openurl resolver - TBD add EBSCO
  openUrlPattern: /.*(sfxhosted|sfx?|search|.hosted).(exlibrisgroup|serialssolutions).com.*(\/|%2(F|f))?\?*(.*)/,
  flags         : {
    OPEN_URL_BASE         : 1,
    DOI_ADDRESS           : 2,
    PUBMED_ADDRESS        : 3,
    HAS_OPEN_URL          : 4,
    HAS_PII               : 5,
    GOOGLE_SCHOLAR_OPENURL: 6
  },

  onDOMContentLoaded: function(event) {

    var rootElement = document.documentElement;
    // check if we have an html page
    istex.message(document.contentType);
    if (document.contentType && document.contentType == "text/html") {
      ISTEXLinkInserter.findAndReplaceLinks(rootElement);
      rootElement.addEventListener("DOMNodeInserted", ISTEXLinkInserter.onDOMNodeInserted, false);
    }

  },

  onDOMNodeInserted: function(event) {
    var node = event.target;
    ISTEXLinkInserter.findAndReplaceLinks(node);
  },

  scanForDoiAndPubmedStrings: function(domNode, prefixStatus) {
    var prefix = prefixStatus;
    // Only process valid dom nodes:
    if (domNode == null || !domNode.getElementsByTagName) {
      return prefix;
    }


    // if the node is already clickable
    if ((domNode.tagName == 'a') || ((domNode.tagName == 'A'))) {
      return false;
    }

    // we do not process user input text area
    if ((domNode.tagName == 'textarea') || (domNode.tagName == 'TEXTAREA')) {
      return false;
    }

    var childs = domNode.childNodes;
    var i      = 0;
    while (nod = childs[i]) {
      if (nod.nodeType == 3) { // text node found, do the replacement
        var text = nod.textContent;
        if (text) {
          var matchDOI  = text.match(this.regexDoiPatternConservative);
          var matchPMID = text.match(this.regexPMIDPattern);
          if (matchDOI || matchPMID) {
            var lnk = document.createElement('span');
            lnk.setAttribute('name', 'ISTEXInserted');

            if (matchDOI) {
              lnk.innerHTML = text.replace(this.regexDoiPatternConservative,
                                           "<a href=\"http://dx.doi.org/$1\" name=\"ISTEXInserted\">$1</a>");
              text          = lnk.innerHTML;
            }
            if (matchPMID) {
              lnk.innerHTML = text.replace(this.regexPMIDPattern,
                                           "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/$3\" name=\"ISTEXInserted\">PubMed ID $3</a>");
            }
            domNode.replaceChild(lnk, nod);
            nod    = lnk;
            text   = lnk.innerHTML;
            prefix = false;
          }
          else {
            if (prefix && (text.match(this.regexSuffixPMIDPattern))) {
              istex.message("regexSuffixPMIDPattern: " + text);
              var lnk = document.createElement('span');
              lnk.setAttribute('name', 'ISTEXInserted');
              lnk.innerHTML = text.replace(this.regexSuffixPMIDPattern,
                                           "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/$1\" name=\"ISTEXInserted\">$1</a>");
              domNode.replaceChild(lnk, nod);
              nod    = lnk;
              text   = lnk.innerHTML;
              prefix = false;
            }
            else if (text.match(this.regexPrefixPMIDPattern)) {
              istex.message("regexPrefixPMIDPattern: " + text);
              prefix = true;
            }
            else if (text.length > 0) {
              if (!text.match(this.skipPattern)) {
                prefix = false;
              }
            }
          }
        }
      }
      else if (nod.nodeType == 1) { // not a text mode but an element node, we look forward
        prefix = this.scanForDoiAndPubmedStrings(nod, prefix);
      }
      i++;
    }
    return prefix;
  },

  findAndReplaceLinks: function(domNode) {
    // Only process valid domNodes:
    if (domNode == null || !domNode.getElementsByTagName) {
      return;
    }

    this.scanForDoiAndPubmedStrings(domNode, false);

    // Detect OpenURL, DOI or PII links not already handled in the code above and replace them with our custom links
    var links = domNode.getElementsByTagName('a');

    if (links.length > istex.maxPageLinks()) {
      if (document) {
        document.title += " - Too many links for ISTEX analyser:" + links.length;
      }
      return;
    }

    for (var i = 0; i < links.length; i++) {
      var linkk = links[i];
      var flags = this.analyzeLink(linkk);

      if (flags == 0) {
        continue;
      }

      var href = decodeURIComponent(linkk.getAttribute("href"));

      // We have found an open url link:
      if (flags == this.flags.HAS_OPEN_URL) {
        // OpenURl
        this.createOpenUrlLink(href, linkk);
      }
      else if (flags == this.flags.DOI_ADDRESS) {
        // doi
        this.createDoiLink(href, linkk);
      }
      else if (flags == this.flags.GOOGLE_SCHOLAR_OPENURL) {
        this.createGoogleScholarLink(href, linkk);
      }
      else if (flags == this.flags.PUBMED_ADDRESS) {
        // PubMed ID
        this.createPubmedLink(href, linkk);
      }
      else if (flags == this.flags.HAS_PII) {
        // Publisher Item Identifier
        this.createPIILink(href, linkk);
      }
    }

    this.createSpanBasedLinks(domNode);
  },

  analyzeLink: function(linkk) {
    // First check if we have to bother:
    var mask = 0;

    if (linkk.getAttribute("href") == undefined) {
      return mask;
    }

    var href = linkk.getAttribute("href");
    if (linkk.getAttribute("name") == 'ISTEXVisited') {
      return mask;
    }
    if (linkk.getAttribute("classname") == 'istex-link') {
      return mask;
    }
    if (href.indexOf(istex.istexBaseURL()) != -1) {
      return mask;
    }

    // check if we have a Google Scholar pre-OpenURL link (the link that will call the OpenURL)
    var contentText = linkk.textContent;
    if (href.indexOf('scholar.google.') != -1 && (contentText === 'ISTEX [PDF]')) {
      mask = this.flags.GOOGLE_SCHOLAR_OPENURL;
      //return mask;
    } else if ((href.indexOf('dx.doi.org') != -1 ||
                href.indexOf('doi.acm.org') != -1 ||
                href.indexOf('dx.crossref.org') != -1)
               && this.doiPattern.test(href)) {
      // Check if the href contains a DOI link
      mask = this.flags.DOI_ADDRESS;
    } else if (href.indexOf('ncbi.nlm.nih.gov') != -1 && this.pubmedPattern.test(href)) {
      // Check if the href contains a PMID link
      mask = this.flags.PUBMED_ADDRESS;
    } else if (this.regexPIIPattern.test(href)) {
      // Check if the href contains a PII link
      mask = this.flags.HAS_PII;
    } else if (href.indexOf('exlibrisgroup.com') != -1 && this.openUrlPattern.test(href)) {
      // Check if the href contains a supported reference to an open url link
      mask = this.flags.OPEN_URL_BASE;
    } else if (href.indexOf('serialssolutions.com') != -1 && this.openUrlPattern.test(href)) {
      if (linkk.getAttribute("class") != 'documentLink') {
        mask = this.flags.OPEN_URL_BASE;
      }
    }

    if (istex.mustDebug && mask > 0) {
      istex.message("URL is " + href + "\n mask value: " + mask);
    }

    return mask;
  },

  createOpenUrlLink: function(href, linkk) {
    var matchInfo = this.openUrlPattern.exec(href);
    if (matchInfo == null) {
      return;
    } else {
      // the last group should be the parameters:
      var child = this.makeLink(matchInfo[matchInfo.length - 1]);
      linkk.parentNode.replaceChild(child, linkk);
    }
  },

  createDoiLink: function(href, linkk) {
    var matchInfo = this.doiPattern.exec(href);
    if (matchInfo.length < this.doiGroup) {
      return;
    }
    var doiString = matchInfo[this.doiGroup];
    var istexUrl  = "rft_id=info:doi/" + doiString;
    var newLink   = this.makeLink(istexUrl);
    linkk.parentNode.insertBefore(newLink, linkk.nextSibling);
    linkk.setAttribute('name', "ISTEXVisited");
  },

  createPubmedLink: function(href, linkk) {
    var istexUrl = href.replace(this.pubmedPattern,
                                "rft_id=info:pmid/$2&rft.genre=article,chapter,bookitem&svc.fulltext=yes");
    var newLink  = this.makeLink(istexUrl, false);
    linkk.parentNode.insertBefore(newLink, linkk.nextSibling);
    linkk.setAttribute('name', "ISTEXVisited");
  },

  createPIILink: function(href, linkk) {
    var matches = href.match(this.regexPIIPattern);
    if (matches && (matches.length > 0)) {
      var istexUrl = "rft_id=info:" + matches[0] + "&rft.genre=article,chapter,bookitem&svc.fulltext=yes";
      var newLink  = this.makeLink(istexUrl, false);
      linkk.parentNode.insertBefore(newLink, linkk.nextSibling);
      linkk.setAttribute('name', "ISTEXVisited");
    }
  },

  createGoogleScholarLink: function(href, linkk) {
    // we simply make the ISTEX button with the existing google scholar url (which will call the ISTEX OpenURL service)
    linkk.textContent = "ISTEX";
    linkk.name        = "ISTEXLink";
    linkk.className   = "istex-link";
    //linkk.setAttribute('name', "ISTEXVisited");
  },

  // Wikipedia for instance is using COInS spans
  createSpanBasedLinks: function(doc) {
    // Detect latent OpenURL SPANS and replace them with ISTEX links
    var spans = doc.getElementsByTagName("span");
    for (var i = 0, n = spans.length; i < n; i++) {
      var span  = spans[i];
      var query = span.getAttribute("title");

      // /Z3988 means OpenURL
      var clazzes = span.getAttribute("class") == null ? "" : span.getAttribute("class");
      var name    = span.getAttribute('name') == null ? "" : span.getAttribute('name');

      if ((name != 'ISTEXVisited') && (clazzes.match(/Z3988/i) != null)) {
        query += "&url_ver=" + ISTEXLinkInserter.openUrlVersion;
        var child = this.makeLink(query);
        span.appendChild(child);
        span.setAttribute('name', 'ISTEXVisited');
      }
    }
  },
  /**
   * Make the ISTEX button.
   *
   * @param {Object} href
   */
  makeLink            : function(href) {
    istex.message("making link: " + this.openURLPrefix + href + "&noredirect&sid=istex-browser-addon");


    var span = document.createElement('span');
    this.makeChild(href, document, span);
    return span;
  },

  imgLoadHandler: function(req, parent, sid) {
    if ((req.responseText.indexOf("404") == -1) && (req.responseText.indexOf("300") == -1)) {
      // get the resource url
      var json = JSON.parse(req.responseText);
      if (json) {
        var istexUrl = json.resourceUrl;
        if (istexUrl) {
          istexUrl = istexUrl.replace("/original", "/pdf") + '?sid=' + sid;

          // set the added link, this will avoid an extra call to the OpenURL API and fix the access url
          var child         = document.createElement('a');
          child.href        = istexUrl;
          child.target      = "_blank";
          child.alt         = "ISTEX";
          child.name        = "ISTEXLink";
          child.className   = "istex-link";
          child.textContent = "ISTEX";
          parent.appendChild(child);
        }
      }
    }
    else {
      parent.parentNode.removeChild(parent);
    }
  },

  makeChild: function(href, document, parent) {

    // insert the sid in the openurl for usage statistics reason
    if (href.indexOf('sid=') === -1) {
      // sid is alone in the given openurl
      href += '&sid=istex-browser-addon';
    } else {
      // sid is not alone in the given openurl
      // then we have to handle special case if
      // the sid value is empty
      // (ex: ?foo=bar&sid= or ?sid=&foo=bar)
      if (/sid=(&|$)/.test(href)) {
        href = href.replace('sid=', 'sid=istex-browser-addon');
      } else {
        href = href.replace('sid=', 'sid=istex-browser-addon,');
      }
    }
    var sid = this.parseQuery(href).sid;

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
      ISTEXLinkInserter.imgLoadHandler(oReq, parent, sid);
    });
    oReq.open("GET", ISTEXLinkInserter.openURLPrefix + href + "&noredirect");
    oReq.send();
  },

  /**
   * To parse the querystring
   * (used for extracting sid value)
   */
  parseQuery: function(qstr) {
//console.log(qstr)
    var query = {},
        a     = qstr.substring(1).split('&'),
        b,
        i
      ;
    for (i = 0; i < a.length; i++) {
      b = a[i].split('=');
    //console.dir(b[1])

        query[decodeURIComponent(b[0])]
          = decodeURIComponent(b[1] || '');

    }

    return query;

  }

};

ISTEXLinkInserter.onDOMContentLoaded();
