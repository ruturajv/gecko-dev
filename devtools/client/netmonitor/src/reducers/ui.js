/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const I = require("devtools/client/shared/vendor/immutable");
const Services = require("Services");
const {
  ADD_CUSTOM_HEADER_COLUMN,
  DELETE_CUSTOM_HEADER_COLUMN,
  CLEAR_REQUESTS,
  OPEN_NETWORK_DETAILS,
  DISABLE_BROWSER_CACHE,
  OPEN_STATISTICS,
  REMOVE_SELECTED_CUSTOM_REQUEST,
  RENAME_CUSTOM_HEADER_COLUMN,
  RESET_COLUMNS,
  RESPONSE_HEADERS,
  SELECT_DETAILS_PANEL_TAB,
  SEND_CUSTOM_REQUEST,
  SELECT_REQUEST,
  TOGGLE_CUSTOM_HEADER_MODAL,
  TOGGLE_COLUMN,
  WATERFALL_RESIZE,
} = require("../constants");

const cols = {
  status: true,
  method: true,
  file: true,
  protocol: false,
  scheme: false,
  domain: true,
  remoteip: false,
  cause: true,
  type: true,
  cookies: false,
  setCookies: false,
  transferred: true,
  contentSize: true,
  startTime: false,
  endTime: false,
  responseTime: false,
  duration: false,
  latency: false,
  waterfall: true,
};
const Columns = I.Record(
  Object.assign(
    cols,
    RESPONSE_HEADERS.reduce((acc, header) => Object.assign(acc, { [header]: false }), {})
  )
);

const UI = I.Record({
  columns: new Columns(),
  detailsPanelSelectedTab: "headers",
  networkDetailsOpen: false,
  browserCacheDisabled: Services.prefs.getBoolPref("devtools.cache.disabled"),
  statisticsOpen: false,
  waterfallWidth: null,

  // forced for development
  headerColumnsModalShown: true,
  headerColumns:
    JSON.parse(Services.prefs.getCharPref("devtools.netmonitor.headerColumns"))
});

function resetColumns(state) {
  return state.set("columns", new Columns());
}

function toggleCustomHeaderModal(state) {
  return state.set("headerColumnsModalShown",
    !state.get("headerColumnsModalShown"));
}

function resizeWaterfall(state, action) {
  return state.set("waterfallWidth", action.width);
}

function openNetworkDetails(state, action) {
  return state.set("networkDetailsOpen", action.open);
}

function disableBrowserCache(state, action) {
  return state.set("browserCacheDisabled", action.disabled);
}

function openStatistics(state, action) {
  return state.set("statisticsOpen", action.open);
}

function setDetailsPanelTab(state, action) {
  return state.set("detailsPanelSelectedTab", action.id);
}

function toggleColumn(state, action) {
  let { column } = action;

  if (!state.has(column)) {
    return state;
  }

  let newState = state.withMutations(columns => {
    columns.set(column, !state.get(column));
  });
  return newState;
}

function addCustomHeaderColumn(state, action) {
  let { header } = action;
  if (header.length < 1) {
    return state;
  }

  let headerColumns = state.get("headerColumns");
  headerColumns.push(header);

  return state.set("headerColumns", [...new Set(headerColumns)]);
}

function deleteCustomHeaderColumn(state, action) {
  let { header } = action;
  if (header.length < 1) {
    return state;
  }

  let headerColumns = state.get("headerColumns");
  headerColumns = headerColumns.filter(value => value !== header);

  return state.set("headerColumns", headerColumns);
}

function renameCustomHeaderColumn(state, action) {
  let { oldHeader, newHeader } = action;
  if (newHeader.length < 1) {
    return state;
  }

  let headerColumns = state.get("headerColumns");
  let newCustomHeaderColumns = [];
  headerColumns.forEach(value => {
    let newValue = value === oldHeader ? newHeader : value;
    newCustomHeaderColumns.push(newValue);
  });

  return state.set("headerColumns", newCustomHeaderColumns);
}

function ui(state = new UI(), action) {
  switch (action.type) {
    case ADD_CUSTOM_HEADER_COLUMN:
      return addCustomHeaderColumn(state, action);
    case DELETE_CUSTOM_HEADER_COLUMN:
      return deleteCustomHeaderColumn(state, action);
    case CLEAR_REQUESTS:
      return openNetworkDetails(state, { open: false });
    case OPEN_NETWORK_DETAILS:
      return openNetworkDetails(state, action);
    case DISABLE_BROWSER_CACHE:
      return disableBrowserCache(state, action);
    case OPEN_STATISTICS:
      return openStatistics(state, action);
    case RENAME_CUSTOM_HEADER_COLUMN:
      return renameCustomHeaderColumn(state, action);
    case RESET_COLUMNS:
      return resetColumns(state);
    case REMOVE_SELECTED_CUSTOM_REQUEST:
    case SEND_CUSTOM_REQUEST:
      return openNetworkDetails(state, { open: false });
    case SELECT_DETAILS_PANEL_TAB:
      return setDetailsPanelTab(state, action);
    case SELECT_REQUEST:
      return openNetworkDetails(state, { open: true });
    case TOGGLE_CUSTOM_HEADER_MODAL:
      return toggleCustomHeaderModal(state);
    case TOGGLE_COLUMN:
      return state.set("columns", toggleColumn(state.columns, action));
    case WATERFALL_RESIZE:
      return resizeWaterfall(state, action);
    default:
      return state;
  }
}

module.exports = {
  Columns,
  UI,
  ui
};
