# istex-web-extension

A basic add-on for identifying dynamically ISTEX resources in the browser pages.

This extension is an adaptation of [istex-browser-addon](https://github.com/istex/istex-browser-addon), using "Web extensions" technology.

At the present time, 2 versions are available : one for Mozilla Firefox, the other for Google Chrome.

##Functionalities

This add-on performs the following task:

* Add an ISTEX button next to any DOI, OpenUrl and PMID found in the browser page in case the corresponding document is present in ISTEX, based on the ISTEX OpenURL service. Clicking on the ISTEX button will open a new tab with opening the corresponding PDF, assuming that the access to the ISTEX full-texts is authorized. 

## Supported identifiers and protocols

Linking work at item level (e.g. article) and will try to identifying the following identifiers in the web page:

* OpenURL 1.0, including COInS - link resolver prefixes will be examined in case of SFX and Proquest 360 Link
* DOI
* PubMed ID (PMID)
* Publisher Item Identifier (PII)

## Supported browser

Currently: 

* Firefox
* Chrome

## Examples

* Example of links on a Wikipedia page: https://en.wikipedia.org/wiki/Superfluid_helium-4

## How to install

If you just want to install the extension, follow one of these steps :

  * __for Firefox__, just click one [the XPI file](https://github.com/istex/istex-web-extension/releases/download/v1.2.0/istex-1.2.0-an.fx.xpi), confirm authorization if needed, and click the "Install" button.
  * __for Chrome__, visit the [extension's homepage on the Chrome Web Store](https://chrome.google.com/webstore/detail/istex/fonjnfcanlbgnjgfhiocggldmpnhdhjg?hl=fr) and click on the "Add to Chrome" button

## Developers

How to build the xpi:
```
npm i
npm run build
```

How to run the web extension in developer mode with firefox (you need to install firefox >= 49):
```
npm i
npm run run
``` 
It will open firefox on this page https://en.wikipedia.org/wiki/Superfluid_helium-4 with the istex-web-extension loaded. 
