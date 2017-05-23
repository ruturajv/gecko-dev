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
    autocompleteList: PropTypes.array,
    tokenizer: PropTypes.object,
  },

  getDefaultProps() {
    return {
      autocompleteList: [],
    };
  },

  getInitialState() {
    return {
      value: "",
      focused: false,
      tokens: [""],
      autocompleteFilter: "",
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

  computeFilterTokens(filter) {
    let {tokenizer} = this.props;
    if (!(tokenizer instanceof RegExp)) {
      return {
        autocompleteFilter: filter,
        tokens: [filter],
      };
    }

    let tokens = filter.split(tokenizer);
    let lastFilterChar = filter.length > 0 ? filter.slice(-1) : "";
    let autocompleteFilter = "";
    if (tokens.length > 0) {
      if (lastFilterChar !== " ") {
        autocompleteFilter = tokens.slice(-1)[0];
      } else {
        autocompleteFilter = "";
      }
    } else {
      autocompleteFilter = filter;
    }

    return { autocompleteFilter, tokens };
  },

  onChange() {
    if (this.state.value !== this.refs.input.value) {
      let {
        tokens,
        autocompleteFilter
      } = this.computeFilterTokens(this.refs.input.value);
      this.setState({
        value: this.refs.input.value,
        tokens,
        autocompleteFilter,
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
    let { autocompleteList } = this.props;
    let { autocomplete } = this.refs;

    if (autocompleteList.length == 0) {
      return;
    }

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
      autocompleteList
    } = this.props;
    let { value, autocompleteFilter, tokens } = this.state;
    let divClassList = ["devtools-searchbox", "has-clear-btn"];
    let inputClassList = [`devtools-${type}input`];
    let showAutocomplete =
      autocompleteList.length > 0 && this.state.focused && value !== "";

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
        filter: autocompleteFilter,
        ref: "autocomplete",
        onItemSelected: (itemValue) => {
          let selectionItem = "";
          if (tokens.length > 1) {
            selectionItem = tokens.slice(0, tokens.length - 1).join(" ") +
            " " + itemValue;
          } else {
            selectionItem = itemValue;
          }
          this.setState({ value: selectionItem });
          this.onChange();
        }
      })
    );
  }
});
