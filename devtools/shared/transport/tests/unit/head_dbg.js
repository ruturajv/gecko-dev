/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

/* exported Cr CC NetUtil defer errorCount initTestDebuggerServer
            writeTestTempFile socket_transport local_transport really_long
*/

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
var Cr = Components.results;
var CC = Components.Constructor;

const { require } =
  Cu.import("resource://devtools/shared/Loader.jsm", {});
const { NetUtil } = require("resource://gre/modules/NetUtil.jsm");
const promise = require("promise");
const defer = require("devtools/shared/defer");
const { Task } = require("devtools/shared/task");

const Services = require("Services");
// const DevToolsUtils = require("devtools/shared/DevToolsUtils");

// We do not want to log packets by default, because in some tests,
// we can be sending large amounts of data. The test harness has
// trouble dealing with logging all the data, and we end up with
// intermittent time outs (e.g. bug 775924).
// Services.prefs.setBoolPref("devtools.debugger.log", true);
// Services.prefs.setBoolPref("devtools.debugger.log.verbose", true);
// Enable remote debugging for the relevant tests.
Services.prefs.setBoolPref("devtools.debugger.remote-enabled", true);

const { DebuggerServer } = require("devtools/server/main");
const { DebuggerClient } = require("devtools/shared/client/main");

// function testExceptionHook(ex) {
//   try {
//     do_report_unexpected_exception(ex);
//   } catch (ex) {
//     return {throw: ex};
//   }
//   return undefined;
// }

// Convert an nsIScriptError 'flags' value into an appropriate string.
function scriptErrorFlagsToKind(flags) {
  let kind;
  if (flags & Ci.nsIScriptError.warningFlag) {
    kind = "warning";
  }
  if (flags & Ci.nsIScriptError.exceptionFlag) {
    kind = "exception";
  } else {
    kind = "error";
  }

  if (flags & Ci.nsIScriptError.strictFlag) {
    kind = "strict " + kind;
  }

  return kind;
}

// Register a console listener, so console messages don't just disappear
// into the ether.
var errorCount = 0;
var listener = {
  observe: function (message) {
    errorCount++;
    let string = "";
    try {
      // If we've been given an nsIScriptError, then we can print out
      // something nicely formatted, for tools like Emacs to pick up.
      // var scriptError = message.QueryInterface(Ci.nsIScriptError);
      dump(message.sourceName + ":" + message.lineNumber + ": " +
           scriptErrorFlagsToKind(message.flags) + ": " +
           message.errorMessage + "\n");
      string = message.errorMessage;
    } catch (x) {
      // Be a little paranoid with message, as the whole goal here is to lose
      // no information.
      try {
        string = message.message;
      } catch (e) {
        string = "<error converting error message to string>";
      }
    }

    // Make sure we exit all nested event loops so that the test can finish.
    while (DebuggerServer.xpcInspector.eventLoopNestLevel > 0) {
      DebuggerServer.xpcInspector.exitNestedEventLoop();
    }

    // Throw in most cases, but ignore the "strict" messages
    if (!(message.flags & Ci.nsIScriptError.strictFlag)) {
      do_throw("head_dbg.js got console message: " + string + "\n");
    }
  }
};

var consoleService = Cc["@mozilla.org/consoleservice;1"]
                     .getService(Ci.nsIConsoleService);
consoleService.registerListener(listener);

// function check_except(func) {
//   try {
//     func();
//   } catch (e) {
//     do_check_true(true);
//     return;
//   }
//   dump("Should have thrown an exception: " + func.toString());
//   do_check_true(false);
// }

// function testGlobal(name) {
//   let systemPrincipal = Cc["@mozilla.org/systemprincipal;1"]
//     .createInstance(Ci.nsIPrincipal);

//   let sandbox = Cu.Sandbox(systemPrincipal);
//   sandbox.__name = name;
//   return sandbox;
// }

// function addTestGlobal(name) {
//   let global = testGlobal(name);
//   DebuggerServer.addTestGlobal(global);
//   return global;
// }

// List the DebuggerClient |client|'s tabs, look for one whose title is
// |title|, and apply |callback| to the packet's entry for that tab.
function getTestTab(client, title, callback) {
  client.listTabs(function (response) {
    for (let tab of response.tabs) {
      if (tab.title === title) {
        callback(tab);
        return;
      }
    }
    callback(null);
  });
}

// Attach to |client|'s tab whose title is |title|; pass |callback| the
// response packet and a TabClient instance referring to that tab.
function attachTestTab(client, title, callback) {
  getTestTab(client, title, function (tab) {
    client.attachTab(tab.actor, callback);
  });
}

// Attach to |client|'s tab whose title is |title|, and then attach to
// that tab's thread. Pass |callback| the thread attach response packet, a
// TabClient referring to the tab, and a ThreadClient referring to the
// thread.
// function attachTestThread(client, title, callback) {
//   attachTestTab(client, title, function (response, tabClient) {
//     function onAttach(attachedResponse, threadClient) {
//       callback(attachedResponse, tabClient, threadClient);
//     }
//     tabClient.attachThread({ useSourceMaps: true }, onAttach);
//   });
// }

// Attach to |aClient|'s tab whose title is |aTitle|, attach to the tab's
// thread, and then resume it. Pass |aCallback| the thread's response to
// the 'resume' packet, a TabClient for the tab, and a ThreadClient for the
// thread.
// function attachTestTabAndResume(aClient, aTitle, aCallback) {
//   attachTestThread(aClient, aTitle, function (aResponse, aTabClient, aThreadClient) {
//     aThreadClient.resume(function (aResponse) {
//       aCallback(aResponse, aTabClient, aThreadClient);
//     });
//   });
// }

/**
 * Initialize the testing debugger server.
 */
function initTestDebuggerServer() {
  DebuggerServer.registerModule("devtools/server/actors/script", {
    prefix: "script",
    constructor: "ScriptActor",
    type: { global: true, tab: true }
  });
  DebuggerServer.registerModule("xpcshell-test/testactors");
  // Allow incoming connections.
  DebuggerServer.init();
}

// function finishClient(aClient) {
//   aClient.close().then(function () {
//     do_test_finished();
//   });
// }

/**
 * Takes a relative file path and returns the absolute file url for it.
 */
// function getFileUrl(aName, aAllowMissing = false) {
//   let file = do_get_file(aName, aAllowMissing);
//   return Services.io.newFileURI(file).spec;
// }

/**
 * Returns the full path of the file with the specified name in a
 * platform-independent and URL-like form.
 */
// function getFilePath(aName, aAllowMissing = false) {
//   let file = do_get_file(aName, aAllowMissing);
//   let path = Services.io.newFileURI(file).spec;
//   let filePrePath = "file://";
//   if ("nsILocalFileWin" in Ci &&
//       file instanceof Ci.nsILocalFileWin) {
//     filePrePath += "/";
//   }
//   return path.slice(filePrePath.length);
// }

/**
 * Wrapper around do_get_file to prefix files with the name of current test to
 * avoid collisions when running in parallel.
 */
function getTestTempFile(fileName, allowMissing) {
  let thisTest = _TEST_FILE.toString().replace(/\\/g, "/");
  thisTest = thisTest.substring(thisTest.lastIndexOf("/") + 1);
  thisTest = thisTest.replace(/\..*$/, "");
  return do_get_file(fileName + "-" + thisTest, allowMissing);
}

function writeTestTempFile(fileName, content) {
  let file = getTestTempFile(fileName, true);
  let stream = Cc["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Ci.nsIFileOutputStream);
  stream.init(file, -1, -1, 0);
  try {
    do {
      let numWritten = stream.write(content, content.length);
      content = content.slice(numWritten);
    } while (content.length > 0);
  } finally {
    stream.close();
  }
}

/** * Transport Factories ***/

var socket_transport = Task.async(function* () {
  if (!DebuggerServer.listeningSockets) {
    let AuthenticatorType = DebuggerServer.Authenticators.get("PROMPT");
    let authenticator = new AuthenticatorType.Server();
    authenticator.allowConnection = () => {
      return DebuggerServer.AuthenticationResult.ALLOW;
    };
    let debuggerListener = DebuggerServer.createListener();
    debuggerListener.portOrPath = -1;
    debuggerListener.authenticator = authenticator;
    yield debuggerListener.open();
  }
  let port = DebuggerServer._listeners[0].port;
  do_print("Debugger server port is " + port);
  return DebuggerClient.socketConnect({ host: "127.0.0.1", port });
});

function local_transport() {
  return promise.resolve(DebuggerServer.connectPipe());
}

/** * Sample Data ***/

var gReallyLong;
function really_long() {
  if (gReallyLong) {
    return gReallyLong;
  }
  let ret = "0123456789";
  for (let i = 0; i < 18; i++) {
    ret += ret;
  }
  gReallyLong = ret;
  return ret;
}
