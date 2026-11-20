# CPU Scheduling Simulator ⚡

A sleek, fully interactive, discrete-time **CPU Scheduling Simulator** web application built with modern vanilla web technologies (HTML5, CSS3, ES6+ JavaScript). It visualizes operating system process scheduling algorithms in real time with an engineering-dashboard aesthetic.

![CPU Scheduling Simulator](https://img.shields.io/badge/Theme-Obsidian%20%26%20Amber-f59e0b)
![Algorithms-Supported](https://img.shields.io/badge/Algorithms-FCFS%20%7C%20SJF%20%7C%20SRTF%20%7C%20RR%20%7C%20MLFQ-10b981)
![Tests](https://img.shields.io/badge/Unit%20Tests-Passing%20(100%25)-6366f1)

---

## 🎯 Supported Scheduling Algorithms

1. **First-Come, First-Served (FCFS)**
   - Non-preemptive, FIFO arrival-order execution.
   - Accurately showcases the convoy effect when long CPU-bound tasks precede short interactive tasks.
2. **Shortest Job First (SJF) & Shortest Remaining Time First (SRTF)**
   - **Non-preemptive SJF**: Dispatches the arrived process with the smallest initial burst time.
   - **Preemptive (SRTF)**: Dynamically checks remaining burst times at each discrete tick and preempts running jobs when shorter jobs arrive.
3. **Round Robin (RR)**
   - Configurable time quantum $Q$.
   - Strict FIFO ready queue with accurate arrival ordering (new arrivals at time $t$ are enqueued before quantum-expired processes are re-queued).
4. **Multi-Level Feedback Queue (MLFQ)**
   - 3 Priority Queues:
     - **Q0 (High Priority)**: Configurable quantum $Q_0$ (default 2).
     - **Q1 (Medium Priority)**: Configurable quantum $Q_1$ (default 4).
     - **Q2 (Low Priority)**: FCFS scheduling.
   - Automatic queue demotion when jobs exhaust their time slice.
   - Starvation prevention via configurable **Aging threshold** (promotes jobs waiting in lower queues).

---

## ✨ Features

- **Proportional Interactive Gantt Chart:**
  - High-contrast color palette for process blocks (Coral, Orange, Emerald, Indigo, Pink, Teal, Gold, Violet, Cyan, Lime).
  - Subtle hatched striping for `IDLE` periods.
  - Boundary timestamps along the bottom timeline axis.
  - Click any Gantt block to jump the timeline inspector directly to its start time.
- **Time Scrubber & Stepper Playback:**
  - Play / Pause animation controls with speed toggling (`0.5x`, `1x`, `2x`).
  - Unit-by-unit step back (◀), step forward (▶), reset (⏮), and jump to end (⏭).
  - Smooth range slider scrubber spanning from $t = 0$ to $t = T_{total}$.
- **Ready Queue State Inspector:**
  - Displays the active process on the CPU (or `IDLE`).
  - Shows head-first ordered processes in the Ready Queue at the currently inspected timestamp $t$.
  - Multi-level queue breakdown (`Q0`, `Q1`, `Q2`) dynamically rendered when MLFQ is selected.
- **Dynamic KPI Stat Cards:**
  - **Average Turnaround Time (TAT)**: $\frac{1}{n} \sum (CT_i - AT_i)$ (2 decimals)
  - **Average Waiting Time (WT)**: $\frac{1}{n} \sum (TAT_i - BT_i)$ (2 decimals)
  - **CPU Utilization (%)**: $\frac{\text{Total Busy Time}}{\text{Total Elapsed Time}} \times 100\%$ (1 decimal)
  - **Throughput**: $\frac{\text{Completed Processes}}{\text{Total Elapsed Time}}$ (3 decimals)
- **Dynamic Process Metrics Table:**
  - Per-process metrics: $AT$, $BT$, $CT$, $TAT$, $WT$.
  - Real-time status badges (`COMPLETED`, `RUNNING`, `READY`, `NOT ARRIVED`) synchronized with inspected time $t$.
- **Preset Scenarios:**
  - `Standard Mix`: Varied arrivals and burst times under non-preemptive SJF (verifies benchmark metrics: Avg TAT 9.60, Avg WT 5.20, CPU Util 100.0%, Throughput 0.227).
  - `Convoy Effect Demo`: Demonstrates FCFS performance degradation when a long job arrives first.
  - `MLFQ Aging & Demotion Demo`: Visualizes job demotion across priority queues and starvation prevention via aging.
- **Inline Editable Process Manager:**
  - Directly edit Arrival Time ($AT$) and Burst Time ($BT$) in the table with instant re-simulation.
  - Quick-add form with auto-incrementing process IDs (`P6`, `P7`, ...).
  - Delete and Clear All functionality.

---

## 🚀 Getting Started

### Option 1: Direct File Open
Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari). No build steps or package installations are required.

### Option 2: Run via Local HTTP Server
You can serve the directory using Python or Node:

```bash
# Using Python
python -m http.server 8080

# Or using Node http-server / npx serve
npx serve .
```

Then navigate to `http://localhost:8080/` in your browser.

---

## 🧪 Running Unit Tests

The discrete-time simulation engine is rigorously tested for edge cases, idle gaps, and benchmark scenarios. Run the automated test suite with Node:

```bash
node test-simulator.js
```

---

## 📂 Project Structure

```
cpu-scheduling-simulator/
├── index.html          # Semantic application layout & DOM structure
├── styles.css          # Dark obsidian/amber styling & responsive dashboard layout
├── simulator.js        # Discrete-time scheduling engine (FCFS, SJF, SRTF, RR, MLFQ)
├── app.js              # UI controller, Gantt chart renderer & playback animator
├── test-simulator.js   # Automated unit tests for mathematical correctness
└── README.md           # Documentation & user guide
```

---

## 📜 License
MIT License. Free for educational and open-source use.
