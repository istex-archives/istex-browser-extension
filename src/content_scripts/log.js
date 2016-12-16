'use strict';


function log (message) {
  if (!console || !console.log) return;
  if (isObject(message) && console.dir && arguments.length === 1) {
    console.dir(message);
    return;
  }
  console.log.apply(null, arguments);
}

function trace (message) {
  log.apply(null, arguments);

  if (console.trace) {
    console.trace('\n\n')
    console.log('\n\n')
  } else {
    console.log('%c' + (new Error().stack || '').split("\n").slice(1).join("\n") + "\n\n", "color: #9e9ea6");
  }
}

function warn (message) {
  if (!console || !console.warn) return log(message);
  console.warn(message);
}

function debug (message) {
  if (config && config.mustDebug) {
    warn("istex-web-extension: " + message);
  }
}

function isObject (value) {
  return value && "object" == typeof value || "function" == typeof value;
}
