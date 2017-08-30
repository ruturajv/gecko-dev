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
const { connect } = require("devtools/client/shared/vendor/react-redux");
const Actions = require("../actions/index");

let CustomHeaderColumn = createFactory(createClass({
  displayName: "CustomHeaderColumn",
  propTypes: {
    header: PropTypes.string.isRequired,
    deleteCustomHeaderColumn: PropTypes.func.isRequired,
  },

  getInitialState() {
    return { editMode: false };
  },

  componentDidUpdate() {
    if (this.state.editMode) {
      this.refs.inputHeader.focus();
    }
  },

  spanClickHandler(e) {
    this.setState({ editMode: true });
  },

  inputKeyHandler(e, oldHeader) {
    // debugger;
    e.preventDefault();
    e.stopPropagation();
    switch (e.key) {
      case "Enter":
        this.props.renameCustomHeaderColumn(oldHeader, this.refs.inputHeader.value);
        this.setState({ editMode: false });
        break;
      case "Escape":
        this.setState({ editMode: false, header: this.props.header });
        break;
    }
  },

  render() {
    let { editMode } = this.state;
    let { header } = this.props;

    return editMode ?
      dom.input({
        type: "text",
        defaultValue: header,
        placeholder: "x-header",
        onKeyUp: e => this.inputKeyHandler(e, header),
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
          onClick: e => {
            this.props.deleteCustomHeaderColumn(e.target.dataset.value);
          },
        })
      );
  }
}));

const HeadersModal = createClass({
  displayName: "HeadersModal",

  propTypes: {
    addCustomHeaderColumn: PropTypes.func.isRequired,
    deleteCustomHeaderColumn: PropTypes.func.isRequired,
    renameCustomHeaderColumn: PropTypes.func.isRequired,
    customHeadersList: PropTypes.array.isRequired,
  },

  newHeaderKeyUpHandler(e) {
    let newHeaderRef = this.refs.newHeader;
    switch (e.key) {
      case "Enter":
        this.props.addCustomHeaderColumn(newHeaderRef.value);
        newHeaderRef.value = "";
        break;
      case "Escape":
        newHeaderRef.value = "";
        break;
    }
  },

  render() {
    let {
      customHeadersList,
      deleteCustomHeaderColumn,
      renameCustomHeaderColumn,
    } = this.props;

    return dom.div(
      { className: "devtools-custom-headers" },
      dom.div(
        { className: "custom-headers-title" },
        L10N.getStr("netmonitor.toolbar.headerColumns")
      ),
      dom.ul(
        { className: "devtools-custom-headers-listbox" },
        customHeadersList.map((item, i) => {
          return dom.li({
            key: item,
            title: "Click to edit",
          }, CustomHeaderColumn({
            header: item,
            deleteCustomHeaderColumn,
            renameCustomHeaderColumn,
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
          this.props.addCustomHeaderColumn(newHeaderRef.value);
          newHeaderRef.value = "";
          newHeaderRef.focus();
        },
      }, L10N.getStr("netmonitor.toolbar.headerColumnsAdd"))
    );
  }
});

module.exports = connect(
  (state) => ({
    customHeadersList: state.ui.headerColumns,
  }),
  (dispatch) => ({
    dispatch,
    addCustomHeaderColumn: header =>
      dispatch(Actions.addCustomHeaderColumn(header)),
    deleteCustomHeaderColumn: header =>
      dispatch(Actions.deleteCustomHeaderColumn(header)),
    renameCustomHeaderColumn: (oldHeader, newHeader) =>
      dispatch(Actions.renameCustomHeaderColumn(oldHeader, newHeader)),
  }),
)(HeadersModal);
