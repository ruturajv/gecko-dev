/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global window */

"use strict";

const { DOM: dom, createClass, PropTypes, createFactory } = require("devtools/client/shared/vendor/react");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");

let SearchBoxAutocomplete = createFactory(createClass({
  displayName: "SearchBoxAutocomplete",

  propTypes: {
    autoCompleteList: PropTypes.array,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
  },

  // getInitialState() {
  //   return {
  //     autoCompleteList: this.props.autoCompleteList
  //   };
  // },

  componentDidMount() {

  },

  render() {
    let {autoCompleteList} = this.props;

    return dom.ul(
      {id: "search-box-autocomplete-list"},
      autoCompleteList.map(item => {
        return dom.li({key: item}, item);
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
      autoCompleteList: this.props.autoCompleteList,
      isAutoCompleteListOpen: false,
      autoCompleteSelectionIndex: -1
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

  componentDidUpdate() {
    if (this.state.isAutoCompleteListOpen
      && this.state.autoCompleteSelectionIndex !== -1) {
      // Haven't figured out why I had to put this.refs["autocomplete-selected"]
      // Sometimes comes this.refs["autocomplete-selected"] as undefined
      this.refs["autocomplete-selected"].scrollIntoView(false);
    }
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
      this.setupAutoComplete();
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
    this.setState({isAutoCompleteListOpen: true, autoCompleteSelectionIndex: -1});
    this.setupAutoComplete();
  },

  onBlur() {
    this.setState({isAutoCompleteListOpen: false});
  },

  onKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        if (this.state.autoCompleteList[this.state.autoCompleteSelectionIndex + 1]) {
          this.setState({
            autoCompleteSelectionIndex: this.state.autoCompleteSelectionIndex + 1
          });
        } else {
          this.setState({autoCompleteSelectionIndex: 0});
        }
        break;
      case "ArrowUp":
        if (this.state.autoCompleteList[this.state.autoCompleteSelectionIndex - 1]) {
          this.setState({
            autoCompleteSelectionIndex: this.state.autoCompleteSelectionIndex - 1
          });
        } else {
          this.setState({
            autoCompleteSelectionIndex: this.state.autoCompleteList.length - 1
          });
        }
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (this.state.isAutoCompleteListOpen
          && this.state.autoCompleteSelectionIndex !== -1) {
          this.setState({
            value: this.refs["autocomplete-selected"].textContent,
            isAutoCompleteListOpen: false,
          });
          this.refs.input.focus();
        }
        break;
    }
  },

  setupAutoComplete() {
    this.setState({
      autoCompleteList: this.props.autoCompleteList.filter((item) => {
        return item.toLowerCase().includes(this.refs.input.value.toLowerCase());
      }),
      isAutoCompleteListOpen: true,
      autoCompleteSelectionIndex: -1
    });
  },

  cleanUpAutoComplete() {
    this.setState({
      isAutoCompleteListOpen: false,
      autoCompleteSelectionIndex: -1
    });
  },

  onAutoCompleteClick(e) {
    console.log(e.target);
    console.log("This works randomly like 1/20 times");
  },

  render() {
    let {
      type = "search",
      placeholder
    } = this.props;
    let { value, autoCompleteList, isAutoCompleteListOpen } = this.state;
    let divClassList = ["devtools-searchbox", "has-clear-btn"];
    let inputClassList = [`devtools-${type}input`];
    let autoCompleteListClass = "";

    if (value !== "") {
      inputClassList.push("filled");
    }
    if (autoCompleteList.length > 0 && isAutoCompleteListOpen) {
      autoCompleteListClass = "open";
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
      dom.ul(
        { id: "search-box-autocomplete-list",
          className: autoCompleteListClass,
          onClick: this.onAutoCompleteClick,
        },
        autoCompleteList.map((item, ix) => {
          let autoCompleteItemClass =
            (this.state.autoCompleteSelectionIndex == ix) ? "autocomplete-selected" : "";
          return dom.li({
            key: item,
            className: autoCompleteItemClass,
            ref: autoCompleteItemClass,
          }, item);
        })
      )
    );
  }
});
