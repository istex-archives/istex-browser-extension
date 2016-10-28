var apa = document.getElementById("apa");

var metadata = {
    metadataHandler : function(req) { 
        var document = (window.content) ? window.content.document : window.document;
        var apaNode = document.getElementById("apa");
        var root = req.responseXML; 
        var apa = "";

        // authors
        var nodes = $(root).children().first().children("name");
        if (nodes && (nodes.length>0)) {
            for (var j=0; j<nodes.length; j++) {
                var subNodes = $(nodes[j]).children("namePart");
                if (subNodes && (subNodes.length>0)) {
                    for (var i=0; i<subNodes.length; i++) {
                        if (i != 0)
                            apa += " ";
                        apa += $(subNodes[i]).text();
                    }
                }
                if (j != nodes.length-1)
                    apa += ", ";
                else 
                    apa += " ";
            }
        }

        // date
        nodes = $(root).find("relatedItem[type='host']");
        if (nodes && (nodes.length>0)) {
            var dateNodes = $(root).find("date");
            if (dateNodes && (dateNodes.length>0)) {
                var date = $(dateNodes[0]).text();
                var year = date.substring(0,4);
                apa += "(" +  year + "). ";
            }
        }

        // title
        nodes = $(root).find("title");
        if (nodes && (nodes.length>0))
            apa += $(nodes[0]).text() + ". ";

        // host title
        nodes = $(root).find("relatedItem[type='host']");
        if (nodes && (nodes.length>0)) {
            var titleNodes = $(nodes[0]).find("title");
            if (titleNodes && (titleNodes.length>0)) {
                apa += "In <i>" + $(titleNodes[0]).text() + "</i>";
            }
        
            // volume, 
            var volumeNodes = $(nodes[0]).find("detail[type='volume']");
            if (volumeNodes && (volumeNodes.length>0)) {          
                var numberNode = $(volumeNodes[0]).children("number").first();
                apa += ", " + $(numberNode).text();
            }

            // issue
            var issueNodes = $(nodes[0]).find("detail[type='issue']");
            if (issueNodes && (issueNodes.length>0)) {          
                var issueNode = $(issueNodes[0]).children("number").first();
                apa += "(" + $(issueNode).text() + ")";
            }

            // pages
            var pageNodes = $(nodes[0]).find("extent[unit='pages']");
            if (pageNodes && (pageNodes.length>0)) {              
                var startNode = $(pageNodes[0]).children("start").first();
                if (startNode)
                    apa += ", " + $(startNode).text();
                var endNode = $(pageNodes[0]).children("end").first();
                if (endNode)
                   apa += "-" + $(endNode).text();
            }

        }
        // publisher

        apa += ". ";
        apaNode.innerHTML = apa;
    }
};

addon.port.on("url", function (href) {
    console.log(href);
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
        metadata.metadataHandler(oReq);
    });
    href = href.replace("/fulltext/pdf", "/metadata/mods");
    console.log("sending: " + href);
    oReq.open("GET", href);
    oReq.send();
});

