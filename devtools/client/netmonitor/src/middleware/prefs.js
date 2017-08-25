/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const {
  ADD_CUSTOM_HEADER_COLUMN,
  DELETE_CUSTOM_HEADER_COLUMN,
  ENABLE_REQUEST_FILTER_TYPE_ONLY,
  RENAME_CUSTOM_HEADER_COLUMN,
  RESET_COLUMNS,
  TOGGLE_COLUMN,
  TOGGLE_REQUEST_FILTER_TYPE,
  DISABLE_BROWSER_CACHE,
} = require("../constants");
const { getRequestFilterTypes } = require("../selectors/index");

/**
  * Update the relevant prefs when:
  *   - a column has been toggled
  *   - a filter type has been set
  */
function prefsMiddleware(store) {
  return next => action => {
    const res = next(action);
    switch (action.type) {
      case ADD_CUSTOM_HEADER_COLUMN:
      case DELETE_CUSTOM_HEADER_COLUMN:
      case RENAME_CUSTOM_HEADER_COLUMN:
        Services.prefs.setCharPref(
          "devtools.netmonitor.customHeaderColumns",
          JSON.stringify(store.getState().ui.customHeaderColumns)
        );
        break;
      case ENABLE_REQUEST_FILTER_TYPE_ONLY:
      case TOGGLE_REQUEST_FILTER_TYPE:
        let filters = getRequestFilterTypes(store.getState())
          .filter(([type, check]) => check)
          .map(([type, check]) => type);
        Services.prefs.setCharPref(
          "devtools.netmonitor.filters", JSON.stringify(filters));
        break;
      case DISABLE_BROWSER_CACHE:
        Services.prefs.setBoolPref(
          "devtools.cache.disabled", store.getState().ui.browserCacheDisabled);
        break;
      case TOGGLE_COLUMN:
      case RESET_COLUMNS:
        let visibleColumns = [...store.getState().ui.columns]
          .filter(([column, shown]) => shown)
          .map(([column, shown]) => column);
        Services.prefs.setCharPref(
          "devtools.netmonitor.visibleColumns", JSON.stringify(visibleColumns));
        break;
    }
    return res;
  };
}

module.exports = prefsMiddleware;
