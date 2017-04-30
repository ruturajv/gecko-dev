/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global window */

"use strict";

const { DOM: dom, createClass, PropTypes } = require("devtools/client/shared/vendor/react");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");

/**
 * A generic search box component for use across devtools
 */
module.exports = createClass({
  displayName: "SearchBox",

  propTypes: {
    delay: PropTypes.number,
    keyShortcut: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    autoCompleteList: PropTypes.array,
  },

  getDefaultProps() {
    return {
      autoCompleteList: [],
    };
  },

  getInitialState() {
    return {
      value: ""
    };
  },

  componentDidMount() {
    if (!this.props.keyShortcut) {
      return;
    }

    this.shortcuts = new KeyShortcuts({
      window
    });
    this.shortcuts.on(this.props.keyShortcut, (name, event) => {
      event.preventDefault();
      this.refs.input.focus();
    });
  },

  componentWillUnmount() {
    if (this.shortcuts) {
      this.shortcuts.destroy();
    }

    // Clean up an existing timeout.
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },

  onChange() {
    if (this.state.value !== this.refs.input.value) {
      this.setState({ value: this.refs.input.value });
    }

    if (!this.props.delay) {
      this.props.onChange(this.state.value);
      return;
    }

    // Clean up an existing timeout before creating a new one.
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Execute the search after a timeout. It makes the UX
    // smoother if the user is typing quickly.
    this.searchTimeout = setTimeout(() => {
      this.searchTimeout = null;
      this.props.onChange(this.state.value);
    }, this.props.delay);
  },

  onClearButtonClick() {
    this.refs.input.value = "";
    this.onChange();
  },

  renderAutoCompleteList(autoCompleteList) {
    return autoCompleteList.map(item => {
      return dom.option({}, `${item}`);
    });
  },

  render() {
    let {
      type = "search",
      placeholder,
      autoCompleteList
    } = this.props;
    let { value } = this.state;
    let divClassList = ["devtools-searchbox", "has-clear-btn"];
    let inputClassList = [`devtools-${type}input`];

    if (value !== "") {
      inputClassList.push("filled");
    }
    return dom.div(
      { className: divClassList.join(" ") },
      dom.input({
        className: inputClassList.join(" "),
        onChange: this.onChange,
        placeholder,
        ref: "input",
        value,
        list: "search-box-autocomplete-datalist"
      }),
      dom.button({
        className: "devtools-searchinput-clear",
        hidden: value == "",
        onClick: this.onClearButtonClick
      }),
      dom.datalist({
        id: "search-box-autocomplete-datalist"
      }, this.renderAutoCompleteList(autoCompleteList))
    );
  }
});
