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
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "count", get count() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "count", get bytes() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "objectClass", get then() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "objectClass", get other() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get objects() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get scripts() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get strings() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "coarseType", get other() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  assertThrowsValue(() => {
    saveHeapSnapshotAndTakeCensus(dbg, {
      breakdown: { by: "internalType", get then() {
        let error = "ಠ_ಠ";
        throw error;
      } }
    });
  }, "ಠ_ಠ");

  do_test_finished();
}
