/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { L10N } = require("../utils/l10n");
const {
  DOM: dom,
  createClass,
  PropTypes,
  createFactory,
} = require("devtools/client/shared/vendor/react");

let CustomHeader = createFactory(createClass({
  displayName: "CustomHeader",
  propTypes: {
    header: PropTypes.string.isRequired,
  },

  getInitialState() {
    let { header } = this.props;
    return { header };
  },

  spanClickHandler(e) {
    this.setState({ editMode: true });
  },

  inputKeyHandler(e) {
    // debugger;
    e.preventDefault();
    e.stopPropagation();
    console.log(e.key);
    switch (e.key) {
      case "Enter":
        this.setState({ editMode: false, header: this.refs.inputHeader.value });
        break;
      case "Escape":
        this.setState({ editMode: false, header: this.state.header });
        break;
    }
  },

  render() {
    let { editMode, header } = this.state;

    return editMode ?
      dom.input({
        type: "text",
        defaultValue: header,
        placeholder: "x-header",
        onKeyUp: this.inputKeyHandler,
        ref: "inputHeader",
      }) :
      dom.div({
        onClick: this.spanClickHandler,
        className: "custom-header1 devtools-button"
      }, header);
  }
}));

module.exports = createClass({
  displayName: "CustomHeadersUI",

  render() {
    let customHeadersList = ["ABC", "PQR", "XYZ"];

    return dom.div(
      { className: "devtools-custom-headers" },
      dom.div(
        { className: "custom-headers-title" },
        L10N.getStr("netmonitor.toolbar.customHeaderColumns")
      ),
      dom.ul(
        { className: "devtools-custom-headers-listbox" },
        customHeadersList.map((item, i) => {
          return dom.li({
            key: i,
            "data-index": i,
            "data-value": item.value,
            title: "Click to edit",
          }, CustomHeader({ header: item }));
        })
      )
    );
  }
});
