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

let CustomHeaderColumn = createFactory(createClass({
  displayName: "CustomHeaderColumn",
  propTypes: {
    header: PropTypes.string.isRequired,
    onDeleteCustomHeader: PropTypes.func.isRequired,
  },

  getInitialState() {
    let { header } = this.props;
    return { header };
  },

  componentDidUpdate() {
    if (this.state.editMode) {
      this.refs.inputHeader.focus();
    }
  },

  spanClickHandler(e) {
    this.setState({ editMode: true });
  },

  inputKeyHandler(e) {
    // debugger;
    e.preventDefault();
    e.stopPropagation();
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
      dom.div(
        {},
        dom.span({
          onClick: this.spanClickHandler,
          className: "custom-header1"
        }, header),
        dom.button({
          className: "custom-header-del devtools-button",
          "data-value": header,
          onClick: (e) => {
            this.props.onDeleteCustomHeader(e.target.dataset.value);
          },
        })
      );
  }
}));

module.exports = createClass({
  displayName: "CustomHeadersUI",

  propTypes: {
    customHeadersList: PropTypes.array.isRequired,
    onAddCustomHeader: PropTypes.func.isRequired,
    onDeleteCustomHeader: PropTypes.func.isRequired,
  },

  newHeaderKeyUpHandler(e) {
    let newHeaderRef = this.refs.newHeader;
    switch (e.key) {
      case "Enter":
        this.props.onAddCustomHeader(newHeaderRef.value);
        newHeaderRef.value = "";
        break;
      case "Escape":
        newHeaderRef.value = "";
        break;
    }
  },

  render() {
    let { customHeadersList } = this.props;

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
            key: item,
            title: "Click to edit",
          }, CustomHeaderColumn({
            header: item,
            onDeleteCustomHeader: this.props.onDeleteCustomHeader,
          }));
        })
      ),
      dom.input({
        defaultValue: "",
        placeholder: "x-header",
        className: "devtools-input",
        ref: "newHeader",
        onKeyUp: this.newHeaderKeyUpHandler,
      }),
      dom.button({
        className: "devtools-button",
        onClick: () => {
          let newHeaderRef = this.refs.newHeader;
          this.props.onAddCustomHeader(newHeaderRef.value);
          newHeaderRef.value = "";
          newHeaderRef.focus();
        },
      }, L10N.getStr("netmonitor.toolbar.customHeaderColumnsAdd"))
    );
  }
});
