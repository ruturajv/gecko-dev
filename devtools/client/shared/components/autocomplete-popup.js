/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { DOM: dom, createClass, PropTypes } = require("devtools/client/shared/vendor/react");

module.exports = createClass({
  displayName: "AutocompletePopup",

  propTypes: {
    list: PropTypes.array,
    filter: PropTypes.string,
    onItemSelected: PropTypes.func,
  },

  getInitialState() {
    let filteredList = this.props.list.filter((item) => {
      return item.toLowerCase().includes(this.props.filter.toLowerCase());
    });

    return { filteredList, selectedIndex: -1 };
  },

  componentWillReceiveProps() {
    this.setState(this.getInitialState());
  },

  componentDidUpdate() {
    if (this.refs.selected) {
      this.refs.selected.scrollIntoView(false);
    }
  },

  cycleDown() {
    let { filteredList, selectedIndex } = this.state;
    let nextIndex = selectedIndex + 1 === filteredList.length ? 0 : selectedIndex + 1;
    this.setState({selectedIndex: nextIndex});
  },

  cycleUp() {
    let { filteredList, selectedIndex } = this.state;
    let nextIndex = selectedIndex - 1 < 0 ? filteredList.length - 1 : selectedIndex - 1;
    this.setState({ selectedIndex: nextIndex });
  },

  select() {
    if (this.refs.selected) {
      this.props.onItemSelected(this.refs.selected.textContent);
    }
  },

  onMouseDown(e) {
    e.preventDefault();
    this.setState({ selectedIndex: Number(e.target.dataset.index) }, this.select);
  },

  render() {
    let { filteredList } = this.state;

    return dom.div(
      { className: "devtools-autocomplete-popup devtools-monospace" },
      dom.ul(
        { className: "devtools-autocomplete-listbox" },
        filteredList.map((item, i) => {
          let isSelected = this.state.selectedIndex == i;
          let itemClassList = ["autocomplete-item"];

          if (isSelected) {
            itemClassList.push("autocomplete-selected");
          }
          return dom.li({
            key: i,
            "data-index": i,
            className: itemClassList.join(" "),
            ref: isSelected ? "selected" : null,
            onMouseDown: this.onMouseDown,
          }, item);
        })
      )
    );
  }
});
