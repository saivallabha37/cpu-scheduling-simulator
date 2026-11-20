/**
 * CPU Scheduling Simulator - Interactive Application Logic
 */

(function () {
  'use strict';

  // --- Color Palette Mapping ---
  const PROCESS_PALETTE = [
    { bg: '#f43f5e', text: '#ffffff' }, // P1: Coral Rose
    { bg: '#f97316', text: '#ffffff' }, // P2: Vibrant Orange
    { bg: '#10b981', text: '#ffffff' }, // P3: Emerald
    { bg: '#6366f1', text: '#ffffff' }, // P4: Indigo
    { bg: '#ec4899', text: '#ffffff' }, // P5: Pink / Rose
    { bg: '#14b8a6', text: '#ffffff' }, // P6: Teal
    { bg: '#eab308', text: '#0f172a' }, // P7: Gold
    { bg: '#8b5cf6', text: '#ffffff' }, // P8: Violet
    { bg: '#06b6d4', text: '#0f172a' }, // P9: Cyan
    { bg: '#84cc16', text: '#0f172a' }  // P10: Lime
  ];

  function getProcessColor(processId) {
    if (processId === 'IDLE') {
      return { bg: 'transparent', text: '#64748b' };
    }
    const match = String(processId).match(/\d+/);
    if (match) {
      const idx = (parseInt(match[0], 10) - 1) % PROCESS_PALETTE.length;
      return PROCESS_PALETTE[Math.max(0, idx)];
    }
    // String hash fallback
    let hash = 0;
    for (let i = 0; i < processId.length; i++) {
      hash = (hash << 5) - hash + processId.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % PROCESS_PALETTE.length;
    return PROCESS_PALETTE[idx];
  }

  // --- Preset Definitions ---
  const PRESETS = {
    standardMix: {
      algorithm: 'SJF',
      isPreemptiveSJF: false,
      processes: [
        { id: 'P1', at: 0, bt: 5 },
        { id: 'P2', at: 1, bt: 3 },
        { id: 'P3', at: 2, bt: 8 },
        { id: 'P4', at: 3, bt: 2 },
        { id: 'P5', at: 4, bt: 4 }
      ]
    },
    convoy: {
      algorithm: 'FCFS',
      isPreemptiveSJF: false,
      processes: [
        { id: 'P1', at: 0, bt: 24 },
        { id: 'P2', at: 1, bt: 3 },
        { id: 'P3', at: 2, bt: 3 },
        { id: 'P4', at: 3, bt: 2 }
      ]
    },
    mlfq: {
      algorithm: 'MLFQ',
      q0Quantum: 2,
      q1Quantum: 4,
      agingThreshold: 8,
      processes: [
        { id: 'P1', at: 0, bt: 16 },
        { id: 'P2', at: 2, bt: 4 },
        { id: 'P3', at: 6, bt: 2 },
        { id: 'P4', at: 10, bt: 2 },
        { id: 'P5', at: 14, bt: 1 }
      ]
    }
  };

  // --- App State ---
  const state = {
    processes: JSON.parse(JSON.stringify(PRESETS.standardMix.processes)),
    algorithm: 'SJF',
    isPreemptiveSJF: false,
    timeQuantum: 2,
    q0Quantum: 2,
    q1Quantum: 4,
    agingThreshold: 8,

    // Simulation outputs
    simResult: null,
    currentTime: 22,

    // Playback state
    isPlaying: false,
    playTimer: null,
    speed: 1, // 1x, 2x, 0.5x
    baseIntervalMs: 650
  };

  // --- DOM Elements ---
  const elements = {
    // Presets
    presetStandardMix: document.getElementById('presetStandardMix'),
    presetConvoy: document.getElementById('presetConvoy'),
    presetMLFQ: document.getElementById('presetMLFQ'),

    // Process Manager Form
    newProcessId: document.getElementById('newProcessId'),
    newProcessAT: document.getElementById('newProcessAT'),
    newProcessBT: document.getElementById('newProcessBT'),
    quickAddBtn: document.getElementById('quickAddBtn'),
    addProcessBtn: document.getElementById('addProcessBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    processList: document.getElementById('processList'),

    // Algorithm Selector
    segmentBtns: document.querySelectorAll('.segment-btn'),
    sjfOptions: document.getElementById('sjfOptions'),
    preemptiveSjfCheck: document.getElementById('preemptiveSjfCheck'),
    rrOptions: document.getElementById('rrOptions'),
    timeQuantumInput: document.getElementById('timeQuantumInput'),
    mlfqOptions: document.getElementById('mlfqOptions'),
    q0QuantumInput: document.getElementById('q0QuantumInput'),
    q1QuantumInput: document.getElementById('q1QuantumInput'),
    agingThresholdInput: document.getElementById('agingThresholdInput'),

    // KPI Cards
    kpiAvgTAT: document.getElementById('kpiAvgTAT'),
    kpiAvgWT: document.getElementById('kpiAvgWT'),
    kpiCpuUtil: document.getElementById('kpiCpuUtil'),
    kpiThroughput: document.getElementById('kpiThroughput'),

    // Gantt Chart & Controls
    btnReset: document.getElementById('btnReset'),
    btnStepBack: document.getElementById('btnStepBack'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    btnStepForward: document.getElementById('btnStepForward'),
    btnEnd: document.getElementById('btnEnd'),
    currentTimeDisplay: document.getElementById('currentTimeDisplay'),
    totalTimeDisplay: document.getElementById('totalTimeDisplay'),
    timeSlider: document.getElementById('timeSlider'),
    speedBtns: document.querySelectorAll('.speed-btn'),
    ganttTimeline: document.getElementById('ganttTimeline'),
    ganttPlayhead: document.getElementById('ganttPlayhead'),
    playheadTag: document.getElementById('playheadTag'),
    ganttAxis: document.getElementById('ganttAxis'),

    // Ready Queue Inspector
    queueTimeTag: document.getElementById('queueTimeTag'),
    cpuCurrentDisplay: document.getElementById('cpuCurrentDisplay'),
    readyQueueStrip: document.getElementById('readyQueueStrip'),
    readyQueueBadges: document.getElementById('readyQueueBadges'),
    mlfqQueuesStrip: document.getElementById('mlfqQueuesStrip'),
    q0Badges: document.getElementById('q0Badges'),
    q1Badges: document.getElementById('q1Badges'),
    q2Badges: document.getElementById('q2Badges'),

    // Metrics Table
    metricsTableBody: document.getElementById('metricsTableBody'),

    // Tooltip & Shell
    tooltip: document.getElementById('appTooltip'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebar: document.getElementById('sidebar')
  };

  // --- Auto-generate next ID ---
  function getNextProcessId() {
    let maxNum = 0;
    for (const p of state.processes) {
      const match = String(p.id).match(/^P(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `P${maxNum + 1}`;
  }

  function updateNextIdField() {
    elements.newProcessId.value = getNextProcessId();
  }

  // --- Render Process Manager List ---
  function renderProcessList() {
    elements.processList.innerHTML = '';
    state.processes.forEach((proc, index) => {
      const color = getProcessColor(proc.id);
      const row = document.createElement('div');
      row.className = 'process-row';
      row.setAttribute('data-id', proc.id);

      row.innerHTML = `
        <span class="proc-badge-tag" style="background-color: ${color.bg}; color: ${color.text};">${proc.id}</span>
        <input type="number" class="proc-row-input input-at" value="${proc.at}" min="0" data-idx="${index}" aria-label="${proc.id} Arrival Time">
        <input type="number" class="proc-row-input input-bt" value="${proc.bt}" min="1" data-idx="${index}" aria-label="${proc.id} Burst Time">
        <button type="button" class="btn-trash" data-idx="${index}" title="Delete ${proc.id}" aria-label="Delete ${proc.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      elements.processList.appendChild(row);
    });

    updateNextIdField();
  }

  // --- Run Simulation & Update UI ---
  function runSimulation(keepCurrentTime = false) {
    const res = CPUSimulator.simulate({
      processes: state.processes,
      algorithm: state.algorithm,
      isPreemptiveSJF: state.isPreemptiveSJF,
      timeQuantum: state.timeQuantum,
      q0Quantum: state.q0Quantum,
      q1Quantum: state.q1Quantum,
      agingThreshold: state.agingThreshold
    });

    state.simResult = res;

    // Update Slider Bounds
    const maxT = res.totalTime;
    elements.timeSlider.max = maxT;
    elements.totalTimeDisplay.textContent = maxT;

    if (!keepCurrentTime || state.currentTime > maxT) {
      state.currentTime = maxT; // Default inspect final completed state
    }

    elements.timeSlider.value = state.currentTime;
    elements.currentTimeDisplay.textContent = state.currentTime;

    // Render Components
    renderKPIs(res);
    renderGantt(res);
    renderInspectorAtTime(state.currentTime);
  }

  // --- Render KPI Cards ---
  function renderKPIs(res) {
    elements.kpiAvgTAT.textContent = res.avgTAT;
    elements.kpiAvgWT.textContent = res.avgWT;
    elements.kpiCpuUtil.textContent = res.cpuUtil;
    elements.kpiThroughput.textContent = res.throughput;
  }

  // --- Render Gantt Chart ---
  function renderGantt(res) {
    elements.ganttTimeline.innerHTML = '';
    elements.ganttAxis.innerHTML = '';

    const totalTime = res.totalTime;

    if (totalTime === 0 || res.gantt.length === 0) {
      elements.ganttTimeline.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;width:100%;color:var(--text-dim);font-size:12px;">
          No processes scheduled
        </div>
      `;
      return;
    }

    // Append Playhead Line
    const playhead = document.createElement('div');
    playhead.id = 'ganttPlayhead';
    playhead.className = 'gantt-playhead';
    playhead.innerHTML = `<div class="playhead-tag" id="playheadTag">t=${state.currentTime}</div>`;
    elements.ganttTimeline.appendChild(playhead);

    // Build timeline blocks
    const boundaryTimes = new Set([0]);

    res.gantt.forEach((block, idx) => {
      const blockEl = document.createElement('div');
      const widthPct = (block.duration / totalTime) * 100;
      blockEl.className = 'gantt-block';
      blockEl.style.width = `${widthPct}%`;

      if (block.id === 'IDLE') {
        blockEl.classList.add('gantt-block-idle');
        blockEl.textContent = 'IDLE';
      } else {
        const color = getProcessColor(block.id);
        blockEl.style.backgroundColor = color.bg;
        blockEl.style.color = color.text;
        blockEl.textContent = block.id;
      }

      // Block tooltip & jump click
      blockEl.title = `${block.id}: t = ${block.start} to ${block.end} (duration ${block.duration})`;
      blockEl.addEventListener('click', () => {
        jumpToTime(block.start);
      });

      // Hover Tooltip
      blockEl.addEventListener('mouseenter', (e) => {
        showTooltip(e, `<strong>${block.id}</strong><br>Start: ${block.start}<br>End: ${block.end}<br>Duration: ${block.duration}`);
      });
      blockEl.addEventListener('mouseleave', hideTooltip);

      elements.ganttTimeline.appendChild(blockEl);
      boundaryTimes.add(block.end);
    });

    // Render boundary timestamps along bottom axis
    const sortedBoundaries = Array.from(boundaryTimes).sort((a, b) => a - b);
    sortedBoundaries.forEach(timeVal => {
      const tickEl = document.createElement('div');
      tickEl.className = 'axis-tick';
      const pct = (timeVal / totalTime) * 100;
      tickEl.style.left = `${pct}%`;
      tickEl.textContent = timeVal;
      elements.ganttAxis.appendChild(tickEl);
    });

    updatePlayheadPosition();
  }

  // --- Update Playhead Position ---
  function updatePlayheadPosition() {
    const playhead = document.getElementById('ganttPlayhead');
    const playheadTag = document.getElementById('playheadTag');
    if (!playhead || !state.simResult) return;

    const totalTime = state.simResult.totalTime;
    const pct = totalTime > 0 ? (state.currentTime / totalTime) * 100 : 0;
    playhead.style.left = `${pct}%`;
    if (playheadTag) {
      playheadTag.textContent = `t=${state.currentTime}`;
    }
  }

  // --- Jump to Inspected Time t ---
  function jumpToTime(t) {
    if (!state.simResult) return;
    const maxT = state.simResult.totalTime;
    state.currentTime = Math.max(0, Math.min(maxT, t));
    elements.timeSlider.value = state.currentTime;
    elements.currentTimeDisplay.textContent = state.currentTime;
    updatePlayheadPosition();
    renderInspectorAtTime(state.currentTime);
  }

  // --- Render Ready Queue Inspector & Process Metrics Table at Time t ---
  function renderInspectorAtTime(t) {
    if (!state.simResult || state.simResult.ticks.length === 0) return;

    elements.queueTimeTag.textContent = t;

    // Get snapshot at time t (fallback to last snapshot if t exceeds)
    const tickSnapshot = state.simResult.ticks.find(tk => tk.t === t) ||
      state.simResult.ticks[state.simResult.ticks.length - 1];

    if (!tickSnapshot) return;

    // 1. CPU Box
    elements.cpuCurrentDisplay.innerHTML = '';
    if (tickSnapshot.runningId === 'IDLE' || !tickSnapshot.runningId) {
      elements.cpuCurrentDisplay.innerHTML = `<span class="cpu-idle-text">IDLE</span>`;
    } else {
      const color = getProcessColor(tickSnapshot.runningId);
      elements.cpuCurrentDisplay.innerHTML = `
        <span class="proc-badge-tag" style="background-color: ${color.bg}; color: ${color.text}; font-size: 13px; padding: 4px 12px;">
          ${tickSnapshot.runningId}
        </span>
      `;
    }

    // 2. Ready Queue Strip
    if (state.algorithm === 'MLFQ') {
      elements.readyQueueStrip.classList.add('hidden');
      elements.mlfqQueuesStrip.classList.remove('hidden');

      renderQueueBadges(elements.q0Badges, tickSnapshot.mlfqState?.q0 || []);
      renderQueueBadges(elements.q1Badges, tickSnapshot.mlfqState?.q1 || []);
      renderQueueBadges(elements.q2Badges, tickSnapshot.mlfqState?.q2 || []);
    } else {
      elements.readyQueueStrip.classList.remove('hidden');
      elements.mlfqQueuesStrip.classList.add('hidden');

      renderQueueBadges(elements.readyQueueBadges, tickSnapshot.readyQueue || []);
    }

    // 3. Process Metrics Table
    renderMetricsTable(tickSnapshot);
  }

  function renderQueueBadges(container, queueIds) {
    container.innerHTML = '';
    if (!queueIds || queueIds.length === 0) {
      container.innerHTML = `<span class="empty-queue-text">empty</span>`;
      return;
    }
    queueIds.forEach(id => {
      const color = getProcessColor(id);
      const badge = document.createElement('span');
      badge.className = 'proc-badge-tag';
      badge.style.backgroundColor = color.bg;
      badge.style.color = color.text;
      badge.textContent = id;
      container.appendChild(badge);
    });
  }

  function renderMetricsTable(tickSnapshot) {
    elements.metricsTableBody.innerHTML = '';

    if (!state.simResult.processes || state.simResult.processes.length === 0) {
      elements.metricsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:18px;">No process metrics</td></tr>`;
      return;
    }

    state.simResult.processes.forEach(proc => {
      const color = getProcessColor(proc.id);
      const procState = tickSnapshot.procStates ? tickSnapshot.procStates[proc.id] : null;
      const status = procState ? procState.status : 'NOT ARRIVED';

      let statusBadgeClass = 'status-not-arrived';
      if (status === 'RUNNING') statusBadgeClass = 'status-running';
      else if (status === 'READY') statusBadgeClass = 'status-ready';
      else if (status === 'COMPLETED') statusBadgeClass = 'status-completed';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <span class="proc-badge-tag" style="background-color: ${color.bg}; color: ${color.text};">
            ${proc.id}
          </span>
        </td>
        <td>${proc.at}</td>
        <td>${proc.bt}</td>
        <td>${proc.ct !== null ? proc.ct : '-'}</td>
        <td>${proc.tat !== null ? proc.tat : '-'}</td>
        <td>${proc.wt !== null ? proc.wt : '-'}</td>
        <td>
          <span class="status-pill ${statusBadgeClass}">${status}</span>
        </td>
      `;
      elements.metricsTableBody.appendChild(row);
    });
  }

  // --- Playback Engine ---
  function startPlayback() {
    if (state.isPlaying) return;
    if (state.currentTime >= state.simResult.totalTime) {
      state.currentTime = 0; // wrap around
    }
    state.isPlaying = true;
    elements.playIcon.classList.add('hidden');
    elements.pauseIcon.classList.remove('hidden');

    const interval = state.baseIntervalMs / state.speed;
    state.playTimer = setInterval(() => {
      if (state.currentTime >= state.simResult.totalTime) {
        pausePlayback();
        return;
      }
      jumpToTime(state.currentTime + 1);
    }, interval);
  }

  function pausePlayback() {
    state.isPlaying = false;
    clearInterval(state.playTimer);
    state.playTimer = null;
    elements.playIcon.classList.remove('hidden');
    elements.pauseIcon.classList.add('hidden');
  }

  function togglePlayPause() {
    if (state.isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  // --- Tooltip Helpers ---
  function showTooltip(e, html) {
    elements.tooltip.innerHTML = html;
    elements.tooltip.classList.add('visible');
    const x = e.clientX + 10;
    const y = e.clientY - 40;
    elements.tooltip.style.left = `${x}px`;
    elements.tooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    elements.tooltip.classList.remove('visible');
  }

  // --- Event Listeners Initialization ---
  function initEventListeners() {
    // Presets
    elements.presetStandardMix.addEventListener('click', () => {
      applyPreset('standardMix');
    });
    elements.presetConvoy.addEventListener('click', () => {
      applyPreset('convoy');
    });
    elements.presetMLFQ.addEventListener('click', () => {
      applyPreset('mlfq');
    });

    // Add Process
    const handleAddProcess = () => {
      const id = elements.newProcessId.value.trim() || getNextProcessId();
      const at = Math.max(0, parseInt(elements.newProcessAT.value, 10) || 0);
      const bt = Math.max(1, parseInt(elements.newProcessBT.value, 10) || 1);

      // Avoid exact ID collision
      const exists = state.processes.some(p => p.id.toUpperCase() === id.toUpperCase());
      const finalId = exists ? `${id}_1` : id;

      state.processes.push({ id: finalId, at, bt });
      renderProcessList();
      runSimulation();

      // Clear preset active states
      clearPresetActiveButtons();
    };

    elements.quickAddBtn.addEventListener('click', handleAddProcess);
    elements.addProcessBtn.addEventListener('click', handleAddProcess);

    // Enter key in add process inputs
    [elements.newProcessId, elements.newProcessAT, elements.newProcessBT].forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddProcess();
        }
      });
    });

    // Clear All
    elements.clearAllBtn.addEventListener('click', () => {
      state.processes = [];
      renderProcessList();
      runSimulation();
      clearPresetActiveButtons();
    });

    // Process List Inline Editing & Deletion
    elements.processList.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-idx');
      if (idx === null) return;
      const index = parseInt(idx, 10);
      if (e.target.classList.contains('input-at')) {
        state.processes[index].at = Math.max(0, parseInt(e.target.value, 10) || 0);
        runSimulation(true);
      } else if (e.target.classList.contains('input-bt')) {
        state.processes[index].bt = Math.max(1, parseInt(e.target.value, 10) || 1);
        runSimulation(true);
      }
    });

    elements.processList.addEventListener('click', (e) => {
      const trashBtn = e.target.closest('.btn-trash');
      if (trashBtn) {
        const idx = parseInt(trashBtn.getAttribute('data-idx'), 10);
        state.processes.splice(idx, 1);
        renderProcessList();
        runSimulation();
        clearPresetActiveButtons();
      }
    });

    // Segmented Algorithm Selector
    elements.segmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.segmentBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');

        const algo = btn.getAttribute('data-algo');
        state.algorithm = algo;

        // Toggle contextual option groups
        elements.sjfOptions.classList.toggle('hidden', algo !== 'SJF');
        elements.rrOptions.classList.toggle('hidden', algo !== 'RR');
        elements.mlfqOptions.classList.toggle('hidden', algo !== 'MLFQ');

        runSimulation();
      });
    });

    // Preemptive SJF Checkbox
    elements.preemptiveSjfCheck.addEventListener('change', (e) => {
      state.isPreemptiveSJF = e.target.checked;
      runSimulation();
    });

    // Round Robin Time Quantum
    elements.timeQuantumInput.addEventListener('input', (e) => {
      state.timeQuantum = Math.max(1, parseInt(e.target.value, 10) || 1);
      runSimulation(true);
    });

    // MLFQ Controls
    elements.q0QuantumInput.addEventListener('input', (e) => {
      state.q0Quantum = Math.max(1, parseInt(e.target.value, 10) || 1);
      runSimulation(true);
    });
    elements.q1QuantumInput.addEventListener('input', (e) => {
      state.q1Quantum = Math.max(1, parseInt(e.target.value, 10) || 1);
      runSimulation(true);
    });
    elements.agingThresholdInput.addEventListener('input', (e) => {
      state.agingThreshold = Math.max(1, parseInt(e.target.value, 10) || 1);
      runSimulation(true);
    });

    // Playback Controls
    elements.btnReset.addEventListener('click', () => {
      pausePlayback();
      jumpToTime(0);
    });

    elements.btnStepBack.addEventListener('click', () => {
      pausePlayback();
      jumpToTime(state.currentTime - 1);
    });

    elements.btnPlayPause.addEventListener('click', togglePlayPause);

    elements.btnStepForward.addEventListener('click', () => {
      pausePlayback();
      jumpToTime(state.currentTime + 1);
    });

    elements.btnEnd.addEventListener('click', () => {
      pausePlayback();
      if (state.simResult) jumpToTime(state.simResult.totalTime);
    });

    // Scrubber Slider
    elements.timeSlider.addEventListener('input', (e) => {
      pausePlayback();
      jumpToTime(parseInt(e.target.value, 10));
    });

    // Speed Controls
    elements.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.speed = parseFloat(btn.getAttribute('data-speed')) || 1;
        if (state.isPlaying) {
          pausePlayback();
          startPlayback();
        }
      });
    });

    // Sidebar Toggle
    elements.sidebarToggleBtn.addEventListener('click', () => {
      elements.sidebar.classList.toggle('collapsed');
    });
  }

  function clearPresetActiveButtons() {
    [elements.presetStandardMix, elements.presetConvoy, elements.presetMLFQ].forEach(b => b.classList.remove('active'));
  }

  function applyPreset(presetKey) {
    const config = PRESETS[presetKey];
    if (!config) return;

    clearPresetActiveButtons();
    if (presetKey === 'standardMix') elements.presetStandardMix.classList.add('active');
    else if (presetKey === 'convoy') elements.presetConvoy.classList.add('active');
    else if (presetKey === 'mlfq') elements.presetMLFQ.classList.add('active');

    state.processes = JSON.parse(JSON.stringify(config.processes));
    state.algorithm = config.algorithm;
    state.isPreemptiveSJF = config.isPreemptiveSJF || false;
    elements.preemptiveSjfCheck.checked = state.isPreemptiveSJF;

    if (config.q0Quantum) {
      state.q0Quantum = config.q0Quantum;
      elements.q0QuantumInput.value = config.q0Quantum;
    }
    if (config.q1Quantum) {
      state.q1Quantum = config.q1Quantum;
      elements.q1QuantumInput.value = config.q1Quantum;
    }
    if (config.agingThreshold) {
      state.agingThreshold = config.agingThreshold;
      elements.agingThresholdInput.value = config.agingThreshold;
    }

    // Set Algorithm pill
    elements.segmentBtns.forEach(b => {
      const match = b.getAttribute('data-algo') === config.algorithm;
      b.classList.toggle('active', match);
      b.setAttribute('aria-checked', match ? 'true' : 'false');
    });

    elements.sjfOptions.classList.toggle('hidden', config.algorithm !== 'SJF');
    elements.rrOptions.classList.toggle('hidden', config.algorithm !== 'RR');
    elements.mlfqOptions.classList.toggle('hidden', config.algorithm !== 'MLFQ');

    renderProcessList();
    runSimulation();
  }

  // --- Bootstrap App ---
  function init() {
    initEventListeners();
    renderProcessList();
    runSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
