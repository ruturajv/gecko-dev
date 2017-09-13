/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Remove the "raw!" prefix used in some require which confuses webpack.

"use strict";

var fs = require("fs");

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  if (this.cacheable) {
    this.cacheable();
  }

  let request = remainingRequest.split("!");
  let rawUrl = request[request.length - 1];
  let content = fs.readFileSync(rawUrl, "utf8");
  content = content.replace("'", '"');

  return "module.exports = " + JSON.stringify(content) + ";";
};
