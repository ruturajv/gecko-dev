/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global window */

"use strict";

const { DOM: dom, createClass, PropTypes, createFactory } = require("devtools/client/shared/vendor/react");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
const AutocompletePopup = createFactory(createClass({
  displayName: "AutocompletePopup",

  propTypes: {
    list: PropTypes.array,
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
    if (this.state.selectedIndex !== -1) {
      this.refs.selected.scrollIntoView(false);
    }
  },

  setupAutoComplete() {
    let filteredList = this.props.list.filter((item) => {
      return item.toLowerCase().includes(this.props.filter.toLowerCase());
    });

    return {filteredList, selectedIndex: -1};
  },

  cycleDown() {
    let { filteredList, selectedIndex } = this.state;
    let nextIndex = selectedIndex + 1 === filteredList.length ? 0 : selectedIndex + 1;
    this.setState({selectedIndex: nextIndex});
  },

  cycleUp() {
    let { filteredList, selectedIndex } = this.state;
    let nextIndex = selectedIndex - 1 < 0 ? filteredList.length - 1 : selectedIndex - 1;
    this.setState({selectedIndex: nextIndex});
  },

  select() {
    if (this.state.selectedIndex !== -1) {
      this.props.onItemSelected(this.refs.selected.textContent);
    }
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
    let {filteredList} = this.state;

    return dom.ul(
      { className: "search-box-autocomplete-list open",
        onMouseDown: this.onMouseDown
      },
      filteredList.map((item, i) => {
        let autoCompleteItemClass =
          (this.state.selectedIndex == i) ? "selected" : "";
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
      focused: false,
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
    this.setState({focused: true});
  },

  onBlur() {
    this.setState({focused: false});
  },

  onKeyDown(e) {
    let {autoCompleteList} = this.props;
    let {autocomplete} = this.refs;

    if (autoCompleteList.length == 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        autocomplete.cycleDown();
        break;
      case "ArrowUp":
        autocomplete.cycleUp();
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        autocomplete.select();
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
      autoCompleteList.length > 0 && this.state.focused && AutocompletePopup({
        list: this.props.autoCompleteList,
        filter: value,
        ref: "autocomplete",
        onItemSelected: (clickedItemValue) => {
          this.setState({value: clickedItemValue});
          this.refs.input.focus();
          this.onChange();
        }
      })
    );
  }
});
