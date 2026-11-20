const CPUSimulator = require('./simulator.js');
const assert = require('assert');

console.log("Running CPU Simulator Unit Tests...");

// 1. Standard Mix - SJF Non-Preemptive
const standardMix = [
  { id: 'P1', at: 0, bt: 5 },
  { id: 'P2', at: 1, bt: 3 },
  { id: 'P3', at: 2, bt: 8 },
  { id: 'P4', at: 3, bt: 2 },
  { id: 'P5', at: 4, bt: 4 }
];

const sjfRes = CPUSimulator.simulate({
  processes: standardMix,
  algorithm: 'SJF',
  isPreemptiveSJF: false
});

assert.strictEqual(sjfRes.avgTAT, '9.60', 'Standard Mix SJF Avg TAT must be 9.60');
assert.strictEqual(sjfRes.avgWT, '5.20', 'Standard Mix SJF Avg WT must be 5.20');
assert.strictEqual(sjfRes.cpuUtil, '100.0%', 'Standard Mix SJF CPU Util must be 100.0%');
assert.strictEqual(sjfRes.throughput, '0.227', 'Standard Mix SJF Throughput must be 0.227');
assert.strictEqual(sjfRes.totalTime, 22, 'Total time must be 22');

console.log("✓ Standard Mix SJF non-preemptive test passed!");

// 2. Convoy Effect Demo
const convoyMix = [
  { id: 'P1', at: 0, bt: 24 },
  { id: 'P2', at: 1, bt: 3 },
  { id: 'P3', at: 2, bt: 3 },
  { id: 'P4', at: 3, bt: 2 }
];

const fcfsRes = CPUSimulator.simulate({
  processes: convoyMix,
  algorithm: 'FCFS'
});
console.log(`Convoy effect FCFS Avg WT: ${fcfsRes.avgWT}, Avg TAT: ${fcfsRes.avgTAT}`);
assert.strictEqual(fcfsRes.totalTime, 32);
console.log("✓ Convoy Effect FCFS test passed!");

// 3. Leading IDLE test
const idleMix = [
  { id: 'P1', at: 3, bt: 2 },
  { id: 'P2', at: 7, bt: 3 }
];
const idleRes = CPUSimulator.simulate({
  processes: idleMix,
  algorithm: 'FCFS'
});
assert.strictEqual(idleRes.gantt[0].id, 'IDLE');
assert.strictEqual(idleRes.gantt[0].start, 0);
assert.strictEqual(idleRes.gantt[0].end, 3);
assert.strictEqual(idleRes.gantt[1].id, 'P1');
assert.strictEqual(idleRes.gantt[1].start, 3);
assert.strictEqual(idleRes.gantt[1].end, 5);
assert.strictEqual(idleRes.gantt[2].id, 'IDLE');
assert.strictEqual(idleRes.gantt[2].start, 5);
assert.strictEqual(idleRes.gantt[2].end, 7);
assert.strictEqual(idleRes.gantt[3].id, 'P2');
assert.strictEqual(idleRes.gantt[3].start, 7);
assert.strictEqual(idleRes.gantt[3].end, 10);
console.log("✓ Idle gaps and leading idle test passed!");

// 4. Empty processes test
const emptyRes = CPUSimulator.simulate({ processes: [] });
assert.strictEqual(emptyRes.avgTAT, '0.00');
assert.strictEqual(emptyRes.totalTime, 0);
console.log("✓ Empty input test passed!");

console.log("ALL SIMULATOR UNIT TESTS PASSED SUCCESSFULLY!");
