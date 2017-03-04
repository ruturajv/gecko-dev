/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

// HeapSnapshot.prototype.takeCensus breakdown: check error handling on property
// gets.
//
// Ported from js/src/jit-test/tests/debug/Memory-takeCensus-07.js

function run_test() {
  let g = newGlobal();
  let dbg = new Debugger(g);

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { get by() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "count", get count() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "count", get bytes() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "objectClass", get then() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "objectClass", get other() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get objects() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get scripts() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get strings() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get other() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "internalType", get then() {
        // eslint-disable-next-line no-throw-literal
        throw "ಠ_ಠ";
      } }
    });
  }, "ಠ_ಠ");

  do_test_finished();
}
