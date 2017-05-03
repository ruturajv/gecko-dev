/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global window */

"use strict";

const { DOM: dom, createClass, PropTypes, createFactory } = require("devtools/client/shared/vendor/react");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");

let AutoCompletePopup = createFactory(createClass({
  displayName: "AutoCompletePopup",

  propTypes: {
    autoCompleteList: PropTypes.array,
    filter: PropTypes.string,
    onItemSelected: PropTypes.func,
  },

  getInitialState() {
    return this.setupAutoComplete();
  },

  componentWillReceiveProps() {
    this.setState(this.setupAutoComplete());
  },

  componentDidUpdate() {
    if (this.state.autoCompleteSelectionIndex !== -1) {
      this.refs["autocomplete-selected"].scrollIntoView(false);
    }
  },

  setupAutoComplete() {
    let autoCompleteList = this.props.autoCompleteList.filter((item) => {
      return item.toLowerCase().includes(this.props.filter.toLowerCase());
    });

    return {autoCompleteList, autoCompleteSelectionIndex: -1};
  },

  cycleDown() {
    if (this.state.autoCompleteList[this.state.autoCompleteSelectionIndex + 1]) {
      this.setState({
        autoCompleteSelectionIndex: this.state.autoCompleteSelectionIndex + 1
      });
    } else {
      this.setState({autoCompleteSelectionIndex: 0});
    }
  },

  cycleUp() {
    if (this.state.autoCompleteList[this.state.autoCompleteSelectionIndex - 1]) {
      this.setState({
        autoCompleteSelectionIndex: this.state.autoCompleteSelectionIndex - 1
      });
    } else {
      this.setState({
        autoCompleteSelectionIndex: this.state.autoCompleteList.length - 1
      });
    }
  },

  isItemSelected() {
    return this.state.autoCompleteSelectionIndex !== -1;
  },

  getSelectedItem() {
    return this.refs["autocomplete-selected"].textContent;
  },

  onMouseDown(e) {
    // To prevent Blur event happening on SearchBox component
    e.preventDefault();
    e.stopPropagation();

    if (e.target.nodeName === "LI") {
      let value = e.target.textContent;
      this.props.onItemSelected(value);
    }
  },

  render() {
    let {autoCompleteList} = this.state;

    return dom.ul(
      { id: "search-box-autocomplete-list",
        className: "open",
        onMouseDown: this.onMouseDown
      },
      autoCompleteList.map((item, ix) => {
        let autoCompleteItemClass =
          (this.state.autoCompleteSelectionIndex == ix) ? "autocomplete-selected" : "";
        return dom.li({
          key: item,
          className: autoCompleteItemClass,
          ref: autoCompleteItemClass
        }, item);
      })
    );
  }
}));

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
      value: "",
      isFocused: false,
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
    // This is to handle Tab, Enter keyCode which sets isFocused to false
    this.setState({isFocused: true});

    if (this.state.value !== this.refs.input.value) {
      this.setState({
        value: this.refs.input.value,
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
    this.setState({isFocused: true, autoCompleteSelectionIndex: -1});
  },

  onBlur() {
    this.setState({isFocused: false});
  },

  onKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        this.refs.autoCompletePopup.cycleDown();
        break;
      case "ArrowUp":
        this.refs.autoCompletePopup.cycleUp();
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (this.state.isFocused
          && this.refs.autoCompletePopup.isItemSelected()) {
          this.setState({
            value: this.refs.autoCompletePopup.getSelectedItem(),
            isFocused: false,
          });
          this.refs.input.focus();
        }
        break;
    }
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
      autoCompleteList.length > 0 && this.state.isFocused && AutoCompletePopup({
        autoCompleteList: this.props.autoCompleteList,
        filter: value,
        ref: "autoCompletePopup",
        onItemSelected: (clickedItemValue) => {
          this.setState({value: clickedItemValue, isFocused: false});
          this.refs.input.focus();
        }
      })
    );
  }
});
