'use strict';

var config,
    ISTEXLinkInserter,
    whiteList = [
      'scholar.google.*',
      '*.wikipedia.org',
      'scholar.*.fr',
      '*' // Until we get better whitelist
    ]
  ;


config = {
  istexBaseURL: "api.istex.fr/document/openurl",
  maxPageLinks: 2500,
  mustDebug   : false
};

ISTEXLinkInserter = {
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
    debug(document.contentType);
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

    var childNodes = domNode.childNodes,
        i          = 0,
        childNode
      ;

    while (childNode = childNodes[i]) {
      if (childNode.nodeType == 3) { // text node found, do the replacement
        var text = childNode.textContent;
        if (text) {
          var matchDOI  = text.match(this.regexDoiPatternConservative);
          var matchPMID = text.match(this.regexPMIDPattern);
          if (matchDOI || matchPMID) {
            var spanElm = document.createElement('span');
            spanElm.setAttribute('name', 'ISTEXInserted');

            if (matchDOI) {
              spanElm.innerHTML = text.replace(this.regexDoiPatternConservative,
                                               '<a href="http://dx.doi.org/$1" name="ISTEXInserted">$1</a>');
              text              = spanElm.innerHTML;
            }
            if (matchPMID) {
              spanElm.innerHTML =
                text
                  .replace(this.regexPMIDPattern,
                           '<a href="http://www.ncbi.nlm.nih.gov/pubmed/$3" name="ISTEXInserted">PubMed ID $3</a>'
                  );
            }
            domNode.replaceChild(spanElm, childNode);
            childNode = spanElm;
            text      = spanElm.innerHTML;
            prefix    = false;
          }
          else {
            if (prefix && (text.match(this.regexSuffixPMIDPattern))) {
              debug("regexSuffixPMIDPattern: " + text);
              var spanElm = document.createElement('span');
              spanElm.setAttribute('name', 'ISTEXInserted');
              spanElm.innerHTML = text.replace(this.regexSuffixPMIDPattern,
                                               "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/$1\" name=\"ISTEXInserted\">$1</a>");
              domNode.replaceChild(spanElm, childNode);
              childNode = spanElm;
              text      = spanElm.innerHTML;
              prefix    = false;
            }
            else if (text.match(this.regexPrefixPMIDPattern)) {
              debug("regexPrefixPMIDPattern: " + text);
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
      else if (childNode.nodeType == 1) { // not a text node but an element node, we look forward
        prefix = this.scanForDoiAndPubmedStrings(childNode, prefix);
      }
      i++;
    }
    return prefix;
  },

  findAndReplaceLinks: function(domNode) {
    // Only process valid domNodes:
    if (!domNode || !domNode.getElementsByTagName) return;

    this.scanForDoiAndPubmedStrings(domNode, false);

    // Detect OpenURL, DOI or PII links not already handled in the code above and replace them with our custom links
    var links = domNode.getElementsByTagName('a');

    if (links.length > config.maxPageLinks) {
      warn("Too many links for ISTEX analyser:" + links.length);
      return;
    }

    for (var i = 0; i < links.length; i++) {
      var link  = links[i];
      var flags = this.analyzeLink(link);

      if (flags == 0) {
        continue;
      }

      var href = decodeURIComponent(link.getAttribute("href"));

      // We have found an open url link:
      if (flags == this.flags.HAS_OPEN_URL) {
        // OpenURl
        this.createOpenUrlLink(href, link);
      }
      else if (flags == this.flags.DOI_ADDRESS) {
        // doi
        this.createDoiLink(href, link);
      }
      else if (flags == this.flags.GOOGLE_SCHOLAR_OPENURL) {
        this.createGoogleScholarLink(href, link);
      }
      else if (flags == this.flags.PUBMED_ADDRESS) {
        // PubMed ID
        this.createPubmedLink(href, link);
      }
      else if (flags == this.flags.HAS_PII) {
        // Publisher Item Identifier
        this.createPIILink(href, link);
      }
    }

    this.createSpanBasedLinks(domNode);
  },

  analyzeLink: function(link) {
    // First check if we have to bother:
    var mask = 0;

    if (link.getAttribute("href") == undefined) {
      return mask;
    }

    var href = link.getAttribute("href");
    if (link.getAttribute("name") == 'ISTEXVisited') {
      return mask;
    }
    if (link.getAttribute("classname") == 'istex-link') {
      return mask;
    }
    if (href.indexOf(config.istexBaseURL) != -1) {
      return mask;
    }

    // check if we have a Google Scholar pre-OpenURL link (the link that will call the OpenURL)
    var contentText = link.textContent;
    if (href.indexOf('scholar.google.') != -1 && (contentText === '[PDF] ISTEX')) {
      mask = this.flags.GOOGLE_SCHOLAR_OPENURL;
      //return mask;
    } else if ((href.indexOf('dx.doi.org') != -1 ||
                href.indexOf('doi.acm.org') != -1 ||
                href.indexOf('dx.crossref.org') != -1)
               && href.match(this.doiPattern)) {
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
      if (link.getAttribute("class") != 'documentLink') {
        mask = this.flags.OPEN_URL_BASE;
      }
    }

    if (config.mustDebug && mask > 0) {
      debug("URL is " + href + "\n mask value: " + mask);
    }

    return mask;
  },

  createOpenUrlLink: function(href, link) {
    var matchInfo = this.openUrlPattern.exec(href);
    if (matchInfo == null) {
      return;
    } else {
      // the last group should be the parameters:
      var child = this.makeLink(matchInfo[matchInfo.length - 1]);
      link.parentNode.replaceChild(child, link);
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

  createPubmedLink: function(href, link) {
    var istexUrl = href.replace(this.pubmedPattern,
                                "rft_id=info:pmid/$2&rft.genre=article,chapter,bookitem&svc.fulltext=yes");
    var newLink  = this.makeLink(istexUrl, false);
    link.parentNode.insertBefore(newLink, link.nextSibling);
    link.setAttribute('name', "ISTEXVisited");
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

  createGoogleScholarLink: function(href, link) {
    // we simply make the ISTEX button with the existing google scholar url (which will call the ISTEX OpenURL service)
    link.textContent = "ISTEX";
    link.name        = "ISTEXLink";
    link.className   = "istex-link";
    link.target      = "_blank";
    //link.setAttribute('name', "ISTEXVisited");
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
    debug("making link: " + this.openURLPrefix + href + "&noredirect&sid=istex-browser-addon");

    var span = document.createElement('span');
    this.makeChild(href, document, span);
    return span;
  },

  createLink: function(resourceUrl, sid) {
    // set the added link, this will avoid an extra call to the OpenURL API and fix the access url
    var a         = document.createElement('a');
    a.href        = resourceUrl.replace("/original", "/pdf") + '?sid=' + sid;
    a.target      = "_blank";
    a.alt         = "ISTEX";
    a.name        = "ISTEXLink";
    a.className   = "istex-link";
    a.textContent = "ISTEX";

    return a;
  },

  makeChild: function(href, document, parent) {
    var key = LZString.compress(href),
        resourceUrl
      ;

    // insert the sid in the openurl for usage statistics reason
    if (!~href.indexOf('sid=')) {
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

    var sid = this.parseQuery(href).sid
      ;

    if (resourceUrl = localStorage.getItem(key)) {
      if (resourceUrl !== 'NA') {
        parent
          .appendChild(
            ISTEXLinkInserter.createLink(resourceUrl, sid)
          );
      }
      return;
    }

    var requestUrl = ISTEXLinkInserter.openURLPrefix + href + "&noredirect",
        xhr        = new XMLHttpRequest()
      ;

    xhr.responseType = "json";
    xhr.onload       = function() {
      if (~[200, 300, 404].indexOf(xhr.status)) {
        localStorage.setItemOrClear(key, xhr.response.resourceUrl || 'NA');
      }

      if (xhr.status !== 200) {
        parent.parentNode.removeChild(parent);
        return debug('\nAjax response status ' + xhr.status);
      }

      parent
        .appendChild(
          ISTEXLinkInserter.createLink(xhr.response.resourceUrl, sid)
        );
    };

    xhr.onerror = function() {
      warn('Ajax error');
    };
    xhr.open("GET", requestUrl);
    xhr.send(null);
  },

  /**
   * To parse the querystring
   * (used for extracting sid value)
   */
  parseQuery: function(qstr) {
    var query  = {},
        paires = qstr.substring(1).split('&'),
        paire
      ;

    for (var i = 0; i < paires.length; i++) {
      paire = paires[i].split('=');
      query[decodeURIComponent(paire[0])]
            = decodeURIComponent(paire[1] || '');

    }

    return query;

  }

};

function escapeStringForRegex (str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}


var whiteListPatterns = whiteList.map(function(value, key) {
      return new RegExp(
        escapeStringForRegex(value).replace('\\*', '.*'),
        'i'
      );
    })
  ;


$.ajax(
  {
    url    : 'https://api.istex.fr/properties',
    success: function(data) {
      if (data.corpus.lastUpdate > localStorage.getItem('last-refresh')) {
        localStorage.refresh();
      }
    },
    complete: function(){
      for (var i = 0; i < whiteListPatterns.length; ++i) {
        if (window.location.href.match(whiteListPatterns[i])) {
          ISTEXLinkInserter.onDOMContentLoaded();
          break;
        }
      }
    }
  }
);

