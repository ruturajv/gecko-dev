/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

add_task(function* () {
  let { monitor } = yield initNetMonitor(FILTERING_URL);
  let { document, store, windowRequire, window } = monitor.panelWin;

  info("Starting test... ");

  let wait = waitForNetworkEvents(monitor, 9);
  loadCommonFrameScript();

  EventUtils.synthesizeMouseAtCenter(document.querySelector(".devtools-filterinput"), {}, window)
  EventUtils.synthesizeKey("s", {});
  // Expecting to see a dropdown now...
  ok(document.querySelector(".devtools-autocomplete-popup"), "Autocomplete Popup Created");
  let sExpectation = [
    "scheme:",
    "set-cookie-domain:",
    "set-cookie-name:",
    "set-cookie-value:",
    "size:",
    "status-code:",
  ];
  sExpectation.map(function (item, i) {
    is(
      document
        .querySelector(`.devtools-autocomplete-listbox .autocomplete-item:nth-child(${i + 1})`)
        .textContent,
      item,
      `${sExpectation[i]} found`
    );
  });
  EventUtils.synthesizeKey("c", {});
  EventUtils.synthesizeKey("VK_TAB", {});
  EventUtils.synthesizeKey(" p", {});
    is(
      document.querySelector(".autocomplete-item").textContent,
      "protocol:",
      `protocol: found`
    );

  yield teardown(monitor);
});
