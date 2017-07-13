/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { FILTER_FLAGS } = require("../constants");

/*
 * Generates a value for the given filter
 * ie. if flag = status-code, will generate "200" from the given request item.
 * For flags related to cookies, it might generate an array based on the request
 * ie. ["cookie-name-1", "cookie-name-2", ...]
 *
 * @param {string} flag - flag specified in filter, ie. "status-code"
 * @param {object} request - Network request item
 * @return {string|Array} - The output is a string or an array based on the request
 */
function getAutocompleteValuesForFlag(flag, request) {
  let value;
  let { responseCookies = { cookies: [] } } = request;
  responseCookies = responseCookies.cookies || responseCookies;

  switch (flag) {
    case "status-code":
      // Sometimes status comes as Number
      value = String(request.status);
      break;
    case "scheme":
      value = request.urlDetails.scheme;
      break;
    case "domain":
      value = request.urlDetails.host;
      break;
    case "remote-ip":
      value = request.remoteAddress;
      break;
    case "cause":
      value = request.cause.type;
      break;
    case "mime-type":
      value = request.mimeType;
      break;
    case "set-cookie-name":
      value = responseCookies.map(c => c.name);
      break;
    case "set-cookie-value":
      value = responseCookies.map(c => c.value);
      break;
    case "set-cookie-domain":
      value = responseCookies.map(c => c.hasOwnProperty("domain") ?
          c.domain : request.urlDetails.host);
      break;
    case "is":
      value = ["cached", "from-cache", "running"];
      break;
    case "has-response-header":
      // Some requests not having responseHeaders..?
      value = request.responseHeaders &&
        request.responseHeaders.headers.map(h => h.name);
      break;
    case "protocol":
      value = request.httpVersion;
      break;
    case "method":
    default:
      value = request[flag];
  }

  return value;
}

/*
 * For a given lastToken passed ie. "is:", returns an array of populated flag
 * values for consumption in autocompleteProvider
 * ie. ["is:cached", "is:running", "is:from-cache"]
 *
 * @param {string} lastToken - lastToken parsed from filter input, ie "is:"
 * @param {object} requests - List of requests from which values are generated
 * @return {Array} - array of autocomplete values
 */
function getLastTokenFlagValues(lastToken, requests) {
  let flag, typedFlagValue;
  if (!lastToken.includes(":")) {
    return [];
  }

  [flag, typedFlagValue] = lastToken.split(":");
  if (!FILTER_FLAGS.includes(flag)) {
    // Flag is some random string, return
    return [];
  }

  let uniqueValues = new Set();
  for (let request of requests) {
    // strip out "-" and ":" from flags ie. "-method:" and pass as flag
    let value = getAutocompleteValuesForFlag(flag.replace(/^-?(.*?):$/, "$1"), request);
    if (Array.isArray(value)) {
      for (let v of value) {
        uniqueValues.add(v);
      }
    } else {
      uniqueValues.add(value);
    }
  }

  return Array.from(uniqueValues)
    .filter(value => {
      if (typedFlagValue) {
        let lowerTyped = typedFlagValue.toLowerCase(),
          lowerValue = value.toLowerCase();
        return lowerValue.startsWith(lowerTyped) && lowerValue !== lowerTyped;
      }
      return typeof value !== "undefined" && value !== "" && value !== "undefined";
    })
    .sort()
    .map(value => `${flag}:${value}`);
}

/**
 * Generates an autocomplete list for the search-box for network monitor
 *
 * It expects an entire string of the searchbox ie "is:cached pr".
 * The string is then tokenized into "is:cached" and "pr"
 *
 * @param {string} filter - The entire search string of the search box
 * @param {object} requests - Iteratable object of requests displayed
 * @return {Array} - The output is an array of objects as below
 * [{value: "is:cached protocol", displayValue: "protocol"}[, ...]]
 * `value` is used to update the search-box input box for given item
 * `displayValue` is used to render the autocomplete list
 */
function autocompleteProvider(filter, requests) {
  if (!filter) {
    return [];
  }

  let negativeAutocompleteList = FILTER_FLAGS.map((item) => `-${item}`);
  let baseList = [...FILTER_FLAGS, ...negativeAutocompleteList]
    .map((item) => `${item}:`);

  // The last token is used to filter the base autocomplete list
  let tokens = filter.split(/\s+/g);
  let lastToken = tokens[tokens.length - 1];
  let previousTokens = tokens.slice(0, tokens.length - 1);

  // Autocomplete list is not generated for empty lastToken
  if (!lastToken) {
    return [];
  }

  let autocompleteList;
  let filledInFlags = getLastTokenFlagValues(lastToken, requests);
  if (filledInFlags.length > 0) {
    autocompleteList = filledInFlags;
  } else {
    autocompleteList = baseList
      .filter((item) => {
        return item.toLowerCase().startsWith(lastToken.toLowerCase())
          && item.toLowerCase() !== lastToken.toLowerCase();
      });
  }

  return autocompleteList
    .sort()
    .map(item => ({
      value: [...previousTokens, item].join(" "),
      displayValue: item,
    }));
}

module.exports = {
  autocompleteProvider,
};
