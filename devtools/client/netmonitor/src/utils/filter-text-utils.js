/*
 * Copyright (c) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

const { FILTER_FLAGS } = require("../constants");
const { getFormattedIPAndPort } = require("./format-utils");

/*
  The function `parseFilters` is from:
  https://github.com/ChromeDevTools/devtools-frontend/

  front_end/network/FilterSuggestionBuilder.js#L138-L163
  Commit f340aefd7ec9b702de9366a812288cfb12111fce
*/

function parseFilters(query) {
  let flags = [];
  let text = [];
  let parts = query.split(/\s+/);

  for (let part of parts) {
    if (!part) {
      continue;
    }
    let colonIndex = part.indexOf(":");
    if (colonIndex === -1) {
      text.push(part);
      continue;
    }
    let key = part.substring(0, colonIndex);
    let negative = key.startsWith("-");
    if (negative) {
      key = key.substring(1);
    }
    if (!FILTER_FLAGS.includes(key)) {
      text.push(part);
      continue;
    }
    let value = part.substring(colonIndex + 1);
    value = processFlagFilter(key, value);
    flags.push({
      type: key,
      value,
      negative,
    });
  }

  return { text, flags };
}

function processFlagFilter(type, value) {
  switch (type) {
    case "regexp":
      return value;
    case "size":
    case "transferred":
    case "larger-than":
    case "transferred-larger-than":
      let multiplier = 1;
      if (value.endsWith("k")) {
        multiplier = 1024;
        value = value.substring(0, value.length - 1);
      } else if (value.endsWith("m")) {
        multiplier = 1024 * 1024;
        value = value.substring(0, value.length - 1);
      }
      let quantity = Number(value);
      if (isNaN(quantity)) {
        return null;
      }
      return quantity * multiplier;
    default:
      return value.toLowerCase();
  }
}

function isFlagFilterMatch(item, { type, value, negative }) {
  // Ensures when filter token is exactly a flag ie. "remote-ip:", all values are shown
  if (value.length < 1) {
    return true;
  }

  let match = true;
  let { responseCookies = { cookies: [] } } = item;
  responseCookies = responseCookies.cookies || responseCookies;
  switch (type) {
    case "status-code":
      match = item.status === value;
      break;
    case "method":
      match = item.method.toLowerCase() === value;
      break;
    case "protocol":
      let protocol = item.httpVersion;
      match = typeof protocol === "string" ?
                protocol.toLowerCase().includes(value) : false;
      break;
    case "domain":
      match = item.urlDetails.host.toLowerCase().includes(value);
      break;
    case "remote-ip":
      match = getFormattedIPAndPort(item.remoteAddress, item.remotePort)
        .toLowerCase().includes(value);
      break;
    case "has-response-header":
      if (typeof item.responseHeaders === "object") {
        let { headers } = item.responseHeaders;
        match = headers.findIndex(h => h.name.toLowerCase() === value) > -1;
      } else {
        match = false;
      }
      break;
    case "cause":
      let causeType = item.cause.type;
      match = typeof causeType === "string" ?
                causeType.toLowerCase().includes(value) : false;
      break;
    case "transferred":
      if (item.fromCache) {
        match = false;
      } else {
        match = isSizeMatch(value, item.transferredSize);
      }
      break;
    case "size":
      match = isSizeMatch(value, item.contentSize);
      break;
    case "larger-than":
      match = item.contentSize > value;
      break;
    case "transferred-larger-than":
      if (item.fromCache) {
        match = false;
      } else {
        match = item.transferredSize > value;
      }
      break;
    case "mime-type":
      match = item.mimeType.includes(value);
      break;
    case "is":
      if (value === "from-cache" ||
          value === "cached") {
        match = item.fromCache || item.status === "304";
      } else if (value === "running") {
        match = !item.status;
      }
      break;
    case "scheme":
      match = item.urlDetails.scheme === value;
      break;
    case "regexp":
      try {
        let pattern = new RegExp(value);
        match = pattern.test(item.url);
      } catch (e) {
        match = false;
      }
      break;
    case "set-cookie-domain":
      if (responseCookies.length > 0) {
        let host = item.urlDetails.host;
        let i = responseCookies.findIndex(c => {
          let domain = c.hasOwnProperty("domain") ? c.domain : host;
          return domain.includes(value);
        });
        match = i > -1;
      } else {
        match = false;
      }
      break;
    case "set-cookie-name":
      match = responseCookies.findIndex(c =>
        c.name.toLowerCase().includes(value)) > -1;
      break;
    case "set-cookie-value":
      match = responseCookies.findIndex(c =>
        c.value.toLowerCase().includes(value)) > -1;
      break;
  }
  if (negative) {
    return !match;
  }
  return match;
}

function isSizeMatch(value, size) {
  return value >= (size - size / 10) && value <= (size + size / 10);
}

function isTextFilterMatch({ url }, text) {
  let lowerCaseUrl = url.toLowerCase();
  let lowerCaseText = text.toLowerCase();
  let textLength = text.length;
  // Support negative filtering
  if (text.startsWith("-") && textLength > 1) {
    lowerCaseText = lowerCaseText.substring(1, textLength);
    return !lowerCaseUrl.includes(lowerCaseText);
  }

  // no text is a positive match
  return !text || lowerCaseUrl.includes(lowerCaseText);
}

function isFreetextMatch(item, text) {
  if (!text) {
    return true;
  }

  let filters = parseFilters(text);
  let match = true;

  for (let textFilter of filters.text) {
    match = match && isTextFilterMatch(item, textFilter);
  }

  for (let flagFilter of filters.flags) {
    match = match && isFlagFilterMatch(item, flagFilter);
  }

  return match;
}

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
function getRequestFlagValue(flag, request) {
  let value;
  let { responseCookies = { cookies: [] } } = request;
  responseCookies = responseCookies.cookies || responseCookies;

  switch (flag) {
    case "status-code":
      // Sometimes status comes as Number
      value = request.status + "";
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
  if (!lastToken.endsWith(":")) {
    return [];
  }

  let uniqueValues = new Set();
  for (let request of requests) {
    // strip out "-" and ":" from flags ie. "-method:" and pass as flag
    let value = getRequestFlagValue(lastToken.replace(/^-?(.*?):$/, "$1"), request);
    if (Array.isArray(value)) {
      for (let v of value) {
        uniqueValues.add(v);
      }
    } else {
      uniqueValues.add(value);
    }
  }

  return Array.from(uniqueValues)
    .filter(value =>
      typeof value !== "undefined" && value !== "" && value !== "undefined")
    .sort()
    .map(value => `${lastToken}${value}`);
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
  isFreetextMatch,
  autocompleteProvider,
};
