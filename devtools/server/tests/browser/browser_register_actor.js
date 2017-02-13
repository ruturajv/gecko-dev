"use strict";

var gClient;

function test() {
  waitForExplicitFinish();
  let {ActorRegistryFront} = require("devtools/shared/fronts/actor-registry");
  let actorURL = "chrome://mochitests/content/chrome/devtools/server/tests/mochitest/hello-actor.js";

  if (!DebuggerServer.initialized) {
    DebuggerServer.init();
    DebuggerServer.addBrowserActors();
  }

  gClient = new DebuggerClient(DebuggerServer.connectPipe());
  gClient.connect()
    .then(() => gClient.listTabs())
    .then(response => {
      let options = {
        prefix: "helloActor",
        constructor: "HelloActor",
        type: { tab: true }
      };

      let registry = ActorRegistryFront(gClient, response);
      registry.registerActor(actorURL, options).then(actorFront => {
        gClient.listTabs(response2 => {
          let tab = response2.tabs[response2.selected];
          ok(!!tab.helloActor, "Hello actor must exist");

          // Make sure actor's state is maintained across listTabs requests.
          checkActorState(tab.helloActor, checkActorCleanup.bind(this, actorFront));
        });
      });
    });
}

function checkActorCleanup(actorFront) {
  // Clean up
  actorFront.unregister().then(() => {
    gClient.close().then(() => {
      DebuggerServer.destroy();
      gClient = null;
      finish();
    });
  });
}

function checkActorState(helloActor, callback) {
  getCount(helloActor, response => {
    countCheck(1, null, response);

    getCount(helloActor, countResponse => {
      countCheck(2, null, countResponse);

      gClient.listTabs(listTabsResponse => {
        let tab = listTabsResponse.tabs[listTabsResponse.selected];
        is(tab.helloActor, helloActor, "Hello actor must be valid");

        // The countCheck will get called with 3rd argument as the response
        getCount(helloActor, countCheck.bind(this, 3, callback));
      });
    });
  });
}

function getCount(actor, callback) {
  gClient.request({
    to: actor,
    type: "count"
  }, callback);
}

function countCheck(count, callback, response) {
  ok(!response.error, "No error");
  is(response.count, count, "The counter must be valid");

  if (typeof callback === "function") {
    callback();
  }
}
