# ISTEX Firefox add-on  

This is the ISTEX add-on version for Firefox, version 38 or more. It uses Mozilla's Add-on SDK, https://developer.mozilla.org/en-US/Add-ons/SDK

##Build, test, sign

For building and signing the Firefox add-on, __jpm__ must be installed. See the jpm documentation. For instance for Linux Ubuntu:

```bash
> sudo npm install jpm --global 
```

For building the add-on:

```bash
> jpm xpi
```

For running the add-on with a test Firefox:

```bash
> jpm run -b /usr/bin/firefox
```

Replace ```/usr/bin/firefox``` with the path of your firefox executable.

Finally for signing the add-on:

```bash
> jpm sign --api-key ${USER_KEY} --api-secret ${SECRET_KEY}
```

##Install

Simply open the signed xpi file with Firefox. 

##Licence

The MIT License (MIT).
