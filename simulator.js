/**
 * CPU Scheduling Simulator - Discrete Time Simulation Engine
 * Supports: FCFS, SJF (Preemptive/Non-preemptive), Round Robin, MLFQ
 */

class CPUSimulator {
  /**
   * Run the discrete-time scheduling simulation.
   * @param {Object} config
   * @param {Array<{id: string, at: number, bt: number}>} config.processes
   * @param {'FCFS'|'SJF'|'RR'|'MLFQ'} config.algorithm
   * @param {boolean} [config.isPreemptiveSJF=false]
   * @param {number} [config.timeQuantum=2]
   * @param {number} [config.q0Quantum=2]
   * @param {number} [config.q1Quantum=4]
   * @param {number} [config.agingThreshold=8]
   * @returns {SimulationResult}
   */
  static simulate({
    processes = [],
    algorithm = 'FCFS',
    isPreemptiveSJF = false,
    timeQuantum = 2,
    q0Quantum = 2,
    q1Quantum = 4,
    agingThreshold = 8
  }) {
    // Validate inputs
    const validProcs = (processes || [])
      .map(p => ({
        id: String(p.id).trim() || 'P?',
        at: Math.max(0, parseInt(p.at, 10) || 0),
        bt: Math.max(1, parseInt(p.bt, 10) || 1)
      }))
      .filter(p => p.id && p.bt > 0);

    if (validProcs.length === 0) {
      return {
        processes: [],
        ticks: [],
        gantt: [],
        totalTime: 0,
        avgTAT: '0.00',
        avgWT: '0.00',
        cpuUtil: '0.0%',
        throughput: '0.000',
        algorithm,
        isPreemptiveSJF,
        timeQuantum,
        q0Quantum,
        q1Quantum,
        agingThreshold
      };
    }

    // Process tracking objects
    const procs = validProcs.map(p => ({
      id: p.id,
      at: p.at,
      bt: p.bt,
      remaining: p.bt,
      ct: null,
      tat: null,
      wt: null,
      queueLevel: 0,
      timeInCurrentQuantum: 0,
      waitTimer: 0
    }));

    // Deterministic sort: arrival time ascending, then ID
    procs.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));

    let t = 0;
    let completedCount = 0;
    const totalProcs = procs.length;
    const ticks = [];

    let currentRunning = null;
    let readyQueue = [];
    const mlfq = {
      q0: [],
      q1: [],
      q2: []
    };

    const MAX_TICKS = 25000; // prevents infinite loops in degenerate cases

    while (completedCount < totalProcs && t < MAX_TICKS) {
      // 1. Check newly arriving processes at time t
      const newArrivals = procs.filter(p => p.at === t);
      newArrivals.sort((a, b) => a.id.localeCompare(b.id));

      if (algorithm === 'FCFS') {
        for (const p of newArrivals) {
          readyQueue.push(p);
        }
        if (!currentRunning && readyQueue.length > 0) {
          currentRunning = readyQueue.shift();
        }
      } else if (algorithm === 'SJF') {
        if (!isPreemptiveSJF) {
          // Non-preemptive
          for (const p of newArrivals) {
            readyQueue.push(p);
          }
          if (!currentRunning && readyQueue.length > 0) {
            readyQueue.sort((a, b) => a.bt - b.bt || a.at - b.at || a.id.localeCompare(b.id));
            currentRunning = readyQueue.shift();
          }
        } else {
          // Preemptive SJF (SRTF)
          for (const p of newArrivals) {
            readyQueue.push(p);
          }
          const pool = [...readyQueue];
          if (currentRunning) {
            pool.push(currentRunning);
          }
          if (pool.length > 0) {
            pool.sort((a, b) => {
              if (a.remaining !== b.remaining) return a.remaining - b.remaining;
              if (currentRunning && a.id === currentRunning.id) return -1;
              if (currentRunning && b.id === currentRunning.id) return 1;
              return a.at - b.at || a.id.localeCompare(b.id);
            });
            const chosen = pool[0];
            if (currentRunning && chosen.id !== currentRunning.id) {
              readyQueue.push(currentRunning);
              currentRunning = chosen;
              readyQueue = readyQueue.filter(p => p.id !== chosen.id);
            } else if (!currentRunning) {
              currentRunning = chosen;
              readyQueue = readyQueue.filter(p => p.id !== chosen.id);
            }
          }
        }
      } else if (algorithm === 'RR') {
        for (const p of newArrivals) {
          readyQueue.push(p);
        }
        if (!currentRunning && readyQueue.length > 0) {
          currentRunning = readyQueue.shift();
          currentRunning.timeInCurrentQuantum = 0;
        }
      } else if (algorithm === 'MLFQ') {
        for (const p of newArrivals) {
          p.queueLevel = 0;
          p.timeInCurrentQuantum = 0;
          p.waitTimer = 0;
          mlfq.q0.push(p);
        }

        // Aging promotion for waiting jobs in Q1 and Q2
        const promoteToQ1 = [];
        mlfq.q2 = mlfq.q2.filter(p => {
          if (currentRunning && p.id === currentRunning.id) return true;
          p.waitTimer++;
          if (p.waitTimer >= agingThreshold) {
            p.waitTimer = 0;
            p.queueLevel = 1;
            p.timeInCurrentQuantum = 0;
            promoteToQ1.push(p);
            return false;
          }
          return true;
        });
        mlfq.q1.push(...promoteToQ1);

        const promoteToQ0 = [];
        mlfq.q1 = mlfq.q1.filter(p => {
          if (currentRunning && p.id === currentRunning.id) return true;
          p.waitTimer++;
          if (p.waitTimer >= agingThreshold) {
            p.waitTimer = 0;
            p.queueLevel = 0;
            p.timeInCurrentQuantum = 0;
            promoteToQ0.push(p);
            return false;
          }
          return true;
        });
        mlfq.q0.push(...promoteToQ0);

        // Preemption if a higher priority queue has processes
        const highestLevel = mlfq.q0.length > 0 ? 0 : (mlfq.q1.length > 0 ? 1 : (mlfq.q2.length > 0 ? 2 : -1));
        if (currentRunning && highestLevel !== -1 && highestLevel < currentRunning.queueLevel) {
          // Preempt current running back to HEAD of its queue
          if (currentRunning.queueLevel === 1) mlfq.q1.unshift(currentRunning);
          else if (currentRunning.queueLevel === 2) mlfq.q2.unshift(currentRunning);
          currentRunning = null;
        }

        if (!currentRunning) {
          if (mlfq.q0.length > 0) {
            currentRunning = mlfq.q0.shift();
            currentRunning.timeInCurrentQuantum = 0;
          } else if (mlfq.q1.length > 0) {
            currentRunning = mlfq.q1.shift();
            currentRunning.timeInCurrentQuantum = 0;
          } else if (mlfq.q2.length > 0) {
            currentRunning = mlfq.q2.shift();
            currentRunning.timeInCurrentQuantum = 0;
          }
        }
      }

      // Snapshot at time t
      const procStates = {};
      for (const p of procs) {
        let status = 'NOT ARRIVED';
        if (p.remaining === 0 && p.ct !== null && p.ct <= t) {
          status = 'COMPLETED';
        } else if (currentRunning && p.id === currentRunning.id) {
          status = 'RUNNING';
        } else if (p.at <= t) {
          status = 'READY';
        }
        procStates[p.id] = {
          status,
          remaining: p.remaining,
          queueLevel: p.queueLevel,
          waitTimer: p.waitTimer
        };
      }

      ticks.push({
        t,
        runningId: currentRunning ? currentRunning.id : 'IDLE',
        readyQueue: algorithm === 'MLFQ'
          ? [...mlfq.q0, ...mlfq.q1, ...mlfq.q2].map(p => p.id)
          : readyQueue.map(p => p.id),
        mlfqState: algorithm === 'MLFQ' ? {
          q0: mlfq.q0.map(p => p.id),
          q1: mlfq.q1.map(p => p.id),
          q2: mlfq.q2.map(p => p.id)
        } : null,
        procStates
      });

      // Execute on CPU during [t, t+1)
      if (currentRunning) {
        currentRunning.remaining--;
        currentRunning.timeInCurrentQuantum++;

        if (currentRunning.remaining === 0) {
          currentRunning.ct = t + 1;
          currentRunning.tat = currentRunning.ct - currentRunning.at;
          currentRunning.wt = currentRunning.tat - currentRunning.bt;
          completedCount++;
          currentRunning = null;
        } else {
          // Check quantum expiration
          if (algorithm === 'RR') {
            if (currentRunning.timeInCurrentQuantum >= timeQuantum) {
              // Check any arrivals at t+1 and enqueue them FIRST
              const nextArrivals = procs.filter(p => p.at === t + 1).sort((a, b) => a.id.localeCompare(b.id));
              for (const na of nextArrivals) {
                if (!readyQueue.some(p => p.id === na.id)) {
                  readyQueue.push(na);
                }
              }
              currentRunning.timeInCurrentQuantum = 0;
              readyQueue.push(currentRunning);
              currentRunning = null;
            }
          } else if (algorithm === 'MLFQ') {
            const limit = currentRunning.queueLevel === 0
              ? q0Quantum
              : (currentRunning.queueLevel === 1 ? q1Quantum : Infinity);

            if (currentRunning.timeInCurrentQuantum >= limit) {
              currentRunning.timeInCurrentQuantum = 0;
              currentRunning.waitTimer = 0;
              if (currentRunning.queueLevel === 0) {
                currentRunning.queueLevel = 1;
                mlfq.q1.push(currentRunning);
              } else if (currentRunning.queueLevel === 1) {
                currentRunning.queueLevel = 2;
                mlfq.q2.push(currentRunning);
              } else {
                mlfq.q2.push(currentRunning);
              }
              currentRunning = null;
            }
          }
        }
      }

      t++;
    }

    // Append final completion snapshot at t = totalTime
    const finalProcStates = {};
    for (const p of procs) {
      finalProcStates[p.id] = {
        status: 'COMPLETED',
        remaining: 0,
        queueLevel: p.queueLevel,
        waitTimer: 0
      };
    }
    ticks.push({
      t,
      runningId: 'IDLE',
      readyQueue: [],
      mlfqState: algorithm === 'MLFQ' ? { q0: [], q1: [], q2: [] } : null,
      procStates: finalProcStates
    });

    // Merge consecutive execution ticks into Gantt blocks
    const gantt = [];
    if (ticks.length > 1) {
      let currentBlock = { id: ticks[0].runningId, start: ticks[0].t, end: ticks[0].t + 1 };
      for (let i = 1; i < ticks.length - 1; i++) {
        const tick = ticks[i];
        if (tick.runningId === currentBlock.id) {
          currentBlock.end = tick.t + 1;
        } else {
          currentBlock.duration = currentBlock.end - currentBlock.start;
          gantt.push(currentBlock);
          currentBlock = { id: tick.runningId, start: tick.t, end: tick.t + 1 };
        }
      }
      currentBlock.duration = currentBlock.end - currentBlock.start;
      gantt.push(currentBlock);
    }

    const totalTime = t;
    const totalTAT = procs.reduce((acc, p) => acc + (p.tat || 0), 0);
    const totalWT = procs.reduce((acc, p) => acc + (p.wt || 0), 0);
    const totalBusy = procs.reduce((acc, p) => acc + p.bt, 0);

    return {
      processes: procs.map(p => ({
        id: p.id,
        at: p.at,
        bt: p.bt,
        ct: p.ct,
        tat: p.tat,
        wt: p.wt
      })),
      ticks,
      gantt,
      totalTime,
      avgTAT: (totalTAT / totalProcs).toFixed(2),
      avgWT: (totalWT / totalProcs).toFixed(2),
      cpuUtil: totalTime > 0 ? ((totalBusy / totalTime) * 100).toFixed(1) + '%' : '0.0%',
      throughput: totalTime > 0 ? (totalProcs / totalTime).toFixed(3) : '0.000',
      algorithm,
      isPreemptiveSJF,
      timeQuantum,
      q0Quantum,
      q1Quantum,
      agingThreshold
    };
  }
}

// Export for Node environments (tests) and browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CPUSimulator;
}
if (typeof window !== 'undefined') {
  window.CPUSimulator = CPUSimulator;
}
