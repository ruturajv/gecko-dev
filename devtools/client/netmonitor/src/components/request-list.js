/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  createFactory,
  DOM,
  PropTypes,
} = require("devtools/client/shared/vendor/react");

// Components
const HeadersModal = createFactory(require("./headers-modal"));
const RequestListContent = createFactory(require("./request-list-content"));
const RequestListEmptyNotice = createFactory(require("./request-list-empty-notice"));
const RequestListHeader = createFactory(require("./request-list-header"));
const StatusBar = createFactory(require("./status-bar"));

const { connect } = require("devtools/client/shared/vendor/react-redux");

const { div } = DOM;

/**
 * Request panel component
 */
function RequestList({ isEmpty, headerColumnsModalShown }) {
  return (
    div({ className: "request-list-container" },
      RequestListHeader(),
      isEmpty ? RequestListEmptyNotice() : RequestListContent(),
      StatusBar(),
      headerColumnsModalShown && HeadersModal(),
    )
  );
}

RequestList.displayName = "RequestList";

RequestList.propTypes = {
  isEmpty: PropTypes.bool.isRequired,
  headerColumnsModalShown: PropTypes.bool.isRequired,
};

module.exports = connect(state => ({
  headerColumnsModalShown: state.ui.headerColumnsModalShown
}))(RequestList);
