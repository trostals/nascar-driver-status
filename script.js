/**
 * script.js — NASCAR Stage Points Tracker
 */

const state = {
  feedData: null, pointsData: null, currentStage: 1,
  raceComplete: false, lastUpdated: null, refreshTimer: null,
  rowOrder: [], errorMessage: null,
};

function deepGet(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

function flagLabel(fs) {
  return ({1:'Green',2:'Caution',3:'Red Flag',4:'Pending',8:'Checkered',9:'Warm-Up'})[fs] ?? 'Pre-Race';
}
function flagClass(fs) {
  if (fs===8) return 'checkered'; if (fs===2||fs===3) return 'yellow-flag'; if (fs===1) return 'live'; return '';
}
function formatTime(d) {
  return d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function stagePointsForPosition(pos) {
  const max = CONFIG.stagePointPositions;
  return (pos < 1 || pos > max) ? 0 : max - pos + 1;
}
function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function loadData() {
  try {
    const [feed, points] = await Promise.all([fetchJSON(CONFIG.liveFeedUrl), fetchJSON(CONFIG.livePointsUrl)]);
    state.feedData = feed; state.pointsData = points;
    state.errorMessage = null; state.lastUpdated = new Date();
    processAndRender();
  } catch (err) {
    console.error('[NASCAR Tracker]', err);
    state.errorMessage = err.message;
    renderError();
  }
}

function processAndRender() {
  const feed = state.feedData, points = state.pointsData;
  const ff = CONFIG.feedFields, pf = CONFIG.pointsFields;

  const lapNumber  = feed[ff.lapNumber]  ?? 0;
  const lapsInRace = feed[ff.lapsInRace] ?? 0;
  const flagState  = feed[ff.flagState]  ?? 0;
  const stageObj   = deepGet(feed, ff.stage) ?? {};
  const stageNum   = stageObj.stage_num ?? 1;

  state.currentStage = stageNum;
  state.raceComplete = flagState === 8 || lapNumber >= lapsInRace;

  const vehicles = feed[ff.vehicles] ?? [];
  const vehicleByName = {};
  for (const v of vehicles) {
    const name = deepGet(v, ff.driverFullName);
    if (name) vehicleByName[name.toLowerCase()] = v;
  }

  const pointsArr = points[pf.pointsData] ?? points ?? [];
  const pointsByName = {};
  for (const p of (Array.isArray(pointsArr) ? pointsArr : Object.values(pointsArr))) {
    const name = p[pf.driverName];
    if (name) pointsByName[name.toLowerCase()] = p;
  }

  const rows = CONFIG.players.map(player => {
    const key = player.driverName.toLowerCase();
    const vehicle = vehicleByName[key] ?? null;
    const pData   = pointsByName[key]  ?? null;
    const runPos  = vehicle ? (deepGet(vehicle, ff.runningPosition) ?? 99) : 99;
    const carNum  = vehicle ? (deepGet(vehicle, ff.vehicleNumber)   ?? '?') : '?';

    let s1Points = pData ? (pData[pf.stage1Points] ?? null) : null;
    let s2Points = (stageNum >= 3 || state.raceComplete) ? (pData ? (pData[pf.stage2Points] ?? null) : null) : null;
    let finalPoints = state.raceComplete ? (pData ? (pData[pf.racePoints] ?? null) : null) : null;
    let liveS1 = (stageNum === 1 && !state.raceComplete) ? stagePointsForPosition(runPos) : null;

    return { player: player.playerName, driverName: player.driverName, color: player.color,
      carNum, runPos, s1Points, liveS1, s2Points, finalPoints, hasData: !!vehicle, stageNum };
  });

  rows.sort((a,b) => { if(!a.hasData&&!b.hasData)return 0; if(!a.hasData)return 1; if(!b.hasData)return -1; return a.runPos-b.runPos; });

  renderHeader(lapNumber, lapsInRace, flagState, stageNum);
  renderStageStrip(stageNum);
  renderTable(rows, stageNum);
  renderFooter();
}

function renderHeader(lap, totalLaps, flagState, stageNum) {
  document.getElementById('race-name').textContent  = CONFIG.raceName;
  document.getElementById('track-name').textContent = CONFIG.raceTrack || '';

  const pill = document.getElementById('status-pill');
  pill.className = 'status-pill ' + flagClass(flagState);
  pill.querySelector('.label').textContent = flagLabel(flagState);

  const lapBadge = document.getElementById('lap-badge');
  if (totalLaps > 0) { lapBadge.textContent = `Lap ${lap} / ${totalLaps}`; lapBadge.style.display = ''; }
  else lapBadge.style.display = 'none';

  const sb = document.getElementById('stage-badge');
  sb.textContent = state.raceComplete ? 'Race Complete' : stageNum <= 2 ? `Stage ${stageNum}` : 'Final Stage';

  if (state.lastUpdated) document.getElementById('last-updated').textContent = `Updated ${formatTime(state.lastUpdated)}`;
}

function renderStageStrip(stageNum) {
  [{id:'sc1',num:1},{id:'sc2',num:2},{id:'sc3',num:3}].forEach(s => {
    const el = document.getElementById(s.id), statusEl = el.querySelector('.sc-status');
    el.className = 'stage-card';
    if (s.num < stageNum || (s.num===3 && state.raceComplete)) { el.classList.add('complete'); statusEl.textContent = 'Complete ✓'; }
    else if (s.num === stageNum && !state.raceComplete) { el.classList.add('active'); statusEl.textContent = 'In Progress'; }
    else statusEl.textContent = 'Upcoming';
  });
}

function renderPtsCell(val, liveVal, inStage, notStarted=false, inProgress=false) {
  //if (val !== null && val !== undefined) {
    //return `<span class="pts-cell ${val>0?'scored':'zero'}">${val}</span>`;
  }
  if (notStarted) return `<span class="pts-cell pending">—</span>`;
  if (inProgress || inStage) {
    const proj = liveVal ?? 0;
    return proj > 0 ? `<span class="pts-cell scored" title="Projected">${proj}*</span>` : `<span class="pts-cell pending">0*</span>`;
  }
  return `<span class="pts-cell pending">—</span>`;
}

function renderTable(rows, stageNum) {
  const tbody = document.getElementById('points-tbody');
  const newIds = rows.map(r => r.player);
  const changed = JSON.stringify(newIds) !== JSON.stringify(state.rowOrder);
  state.rowOrder = newIds;
  tbody.innerHTML = '';

  rows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    if (changed && idx > 0) tr.classList.add('just-moved');
    if (row.color) { tr.classList.add('has-color'); tr.style.setProperty('--player-color', row.color); }
    const posClass = idx===0?'pos-1':idx===1?'pos-2':idx===2?'pos-3':'';
    tr.innerHTML = `
      <td><span class="pos-cell ${posClass}">${row.hasData ? row.runPos : '—'}</span></td>
      <td class="col-left"><span class="player-name">${escHtml(row.player)}</span></td>
      <td class="col-left col-driver"><span class="driver-name">${escHtml(row.driverName)}</span></td>
      <td class="col-car">${row.hasData ? '#'+escHtml(row.carNum) : '—'}</td>
      <td>${renderPtsCell(row.s1Points, row.liveS1, stageNum===1&&!state.raceComplete)}</td>
      <td>${renderPtsCell(row.s2Points, null, false, stageNum<2&&!state.raceComplete, stageNum===2&&!state.raceComplete)}</td>
      <td>${renderPtsCell(row.finalPoints, null, false, !state.raceComplete)}</td>
      <td><span class="total-cell">${((row.s1Points??0)+(row.s2Points??0)+(row.finalPoints??0)) || '—'}</span></td>`;
    tbody.appendChild(tr);
  });
}

function renderError() {
  document.getElementById('points-tbody').innerHTML = `<tr><td colspan="8"><div class="state-box">
    <div class="state-icon">⚠️</div><p>Unable to load live race data.</p>
    <p class="state-detail">${escHtml(state.errorMessage)}</p>
    <p class="state-detail">Check the race URLs in config.js and ensure the race is active.</p>
  </div></td></tr>`;
  const pill = document.getElementById('status-pill');
  pill.className = 'status-pill error';
  pill.querySelector('.label').textContent = 'No Data';
  document.getElementById('last-updated').textContent = `Failed ${formatTime(new Date())}`;
}

function renderFooter() {
  document.getElementById('footer-refresh').textContent =
    CONFIG.refreshInterval > 0
      ? `Auto-refreshes every ${CONFIG.refreshInterval/1000}s during the race`
      : 'Auto-refresh disabled — reload manually';
}

function startRefresh() {
  if (CONFIG.refreshInterval <= 0) return;
  state.refreshTimer = setInterval(() => { if (!state.raceComplete) loadData(); }, CONFIG.refreshInterval);
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  startRefresh();
  document.getElementById('btn-refresh').addEventListener('click', loadData);
});
