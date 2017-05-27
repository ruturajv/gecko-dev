/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global window */

"use strict";

const { DOM: dom, createClass, PropTypes, createFactory } = require("devtools/client/shared/vendor/react");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
const AutocompletePopup = createFactory(require("devtools/client/shared/components/autocomplete-popup"));

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
    getAutocompleteList: PropTypes.func,
  },

  getDefaultProps() {
    return {
      getAutocompleteList: function () {
        return [];
      },
    };
  },

  getInitialState() {
    return {
      autocompleteList: this.computeAutoCompleteList(""),
      value: "",
      focused: false,
      selected: false,
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

  computeAutoCompleteList(filter) {
    let { getAutocompleteList } = this.props;
    return getAutocompleteList(filter);
  },

  onChange() {
    if (this.state.value !== this.refs.input.value) {
      this.setState({
        value: this.refs.input.value,
        autocompleteList: this.computeAutoCompleteList(this.refs.input.value),
        selected: false,
      });
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

  onFocus() {
    this.setState({ focused: true });
  },

  onBlur() {
    this.setState({ focused: false });
  },

  onKeyDown(e) {
    let { autocompleteList } = this.state;

    if (autocompleteList.length == 0) {
      return;
    }
    let { autocomplete } = this.refs;

    switch (e.key) {
      case "ArrowDown":
        autocomplete.jumpBy(1);
        break;
      case "ArrowUp":
        autocomplete.jumpBy(-1);
        break;
      case "PageDown":
        autocomplete.jumpBy(5);
        break;
      case "PageUp":
        autocomplete.jumpBy(-5);
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        autocomplete.select();
        break;
      case "Escape":
        e.preventDefault();
        this.onBlur();
        break;
      case "Home":
        autocomplete.jumpToTop();
        break;
      case "End":
        autocomplete.jumpToBottom();
        break;
    }
  },

  render() {
    let {
      type = "search",
      placeholder,
    } = this.props;
    let { value, autocompleteList, selected } = this.state;
    let divClassList = ["devtools-searchbox", "has-clear-btn"];
    let inputClassList = [`devtools-${type}input`];
    let showAutocomplete = autocompleteList.length > 0
      && selected !== true && this.state.focused && value !== "";

    if (value !== "") {
      inputClassList.push("filled");
    }
    return dom.div(
      { className: divClassList.join(" ") },
      dom.input({
        className: inputClassList.join(" "),
        onChange: this.onChange,
        onFocus: this.onFocus,
        onBlur: this.onBlur,
        onKeyDown: this.onKeyDown,
        placeholder,
        ref: "input",
        value,
      }),
      dom.button({
        className: "devtools-searchinput-clear",
        hidden: value == "",
        onClick: this.onClearButtonClick
      }),
      showAutocomplete && AutocompletePopup({
        list: autocompleteList,
        filter: value,
        ref: "autocomplete",
        onItemSelected: (selectedValue) => {
          this.setState({ value: selectedValue, selected: true });
          this.onChange();
        }
      })
    );
  }
});
