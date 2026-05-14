<template>
  <q-page class="game-page">
    <div class="game-container">

      <div class="hud">
        <div class="hud-topline">
          <div class="top-chip">
            <span>💎</span>
            <strong>73</strong>
            <button class="mini-add">+</button>
          </div>
          <div class="top-chip top-chip-level">👑 Level 14</div>
        </div>
        <div class="hud-score">{{ score.toLocaleString() }}</div>
        <div class="hud-topbar hidden-meta">
          <button class="game-back-btn" @click="goBack" title="Back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div class="hud-item score-box"><span class="hud-label">Score</span><span class="hud-value">{{ score.toLocaleString() }}</span></div>
          <div class="hud-item best-box"><span class="hud-label">Best</span><span class="hud-value">{{ bestTile.toLocaleString() }}</span></div>
          <button class="restart-btn" @click="restartGame" title="Restart">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button class="sound-btn" @click="toggleSound" title="Sound">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path v-if="settings.soundEnabled" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              <path v-else d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
        </div>
        <div class="objective-row">
          <span class="objective-label">Next: {{ mountNumber(highestTile).val }}</span>
          <div class="progress-track"><div class="progress-fill" :style="{ width: objectivePercent + '%' }"></div></div>
          <span class="objective-label">Goal: {{ mountNumber(nextObjective).val }}</span>
        </div>
      </div>

      <div
        ref="boardRef"
        @pointerdown.prevent="onPointerDown"
        @pointermove="onPointerMove"
        @pointercancel="onPointerCancel"
        class="board"
        :style="{ '--ts': tileSize + 'px' }"
      >
        <svg class="selection-svg" v-if="selectionIds.length >= 2 || dragPoint.visible" :viewBox="svgViewBox">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffd700" />
              <stop offset="50%" stop-color="#ff8c00" />
              <stop offset="100%" stop-color="#ffaa00" />
            </linearGradient>
            <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          <path :d="svgPath" class="selection-glow-layer" />
          <path :d="svgPath" class="selection-path" />
          <path :d="svgPath" class="selection-flow" />
          <path v-if="dragTailPath" :d="dragTailPath" class="selection-tail" />
          <circle v-if="dragPoint.visible" :cx="dragPoint.x" :cy="dragPoint.y" class="selection-drag-head" />
          <circle
            v-for="(pt, idx) in svgPoints"
            :key="idx"
            :cx="pt.x"
            :cy="pt.y"
            class="selection-node"
          />
        </svg>
        <div v-for="row in tiles" :key="row.id" class="board-row">
          <div
            v-for="col in row.tiles"
            :key="col.id"
            :data-id="col.id"
            class="tile"
            :class="[
              tileClass(col.value),
              col.active ? 'tile-selected' : '',
              col.animState === 'fall' ? 'tile-fall' : '',
              col.animState === 'new' ? 'tile-new' : '',
              col.animState === 'merge' ? 'tile-merge' : '',
              col.animState === 'deselect' ? 'tile-deselect' : '',
              invalidTiles.has(col.id) ? 'tile-invalid' : '',
            ]"
          >
            <div v-if="col.value > 0" class="tile-inner" :style="{ fontSize: mountNumber(col.value).size }">
              <span class="tile-text">{{ mountNumber(col.value).val }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="floating-score-layer" aria-hidden="true">
        <div
          v-for="pop in floatingScores"
          :key="pop.id"
          class="floating-score"
          :style="{ left: `${pop.x}px`, top: `${pop.y}px` }"
        >
          +{{ mountNumber(pop.value).val }}
        </div>
      </div>

      <Teleport to="body">
        <div v-if="showPopup" class="popup-overlay" @click.self="closePopup">
          <div class="popup-card">
            <div class="popup-star">✨</div>
            <h2 class="popup-title">Novo marco desbloqueado! 🎉</h2>
            <p class="popup-sub">Você alcançou <strong>{{ mountNumber(popupTarget).val }}</strong> e o próximo objetivo é <strong>{{ mountNumber(nextObjective).val }}</strong>.</p>
            <div class="popup-divider"></div>
            <p class="popup-text">
              Obrigado por jogar! Este projeto evolui com apoio da comunidade.<br>
              Se quiser, use o botão abaixo para apoiar o desenvolvimento ❤️
            </p>
            <div class="popup-buttons">
              <button class="popup-btn" @click="closePopup">Continuar jogando</button>
              <button class="popup-btn popup-btn-support" @click="supportProject">Apoiar projeto</button>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
  </q-page>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useStorage, useWindowSize } from "@vueuse/core";

// ==================== ROUTER ====================
const router = useRouter();
function goBack() { router.push("/jogos/2048"); }

// ==================== DEBUG (internal only) ====================
const debug = ref(false);
const chainDebug = ref([]);
const lastMergeResult = ref(0);

// ==================== CONSTANTS ====================
const ROWS = 9;
const COLS = 5;

// ==================== STORAGE ====================
const savedGame = useStorage("2048connect-save", null);
const gameStats = useStorage("2048connect-stats", { merges: 0, chains: 0, highestChain: 0, gamesPlayed: 1 });
const settings = useStorage("2048connect-settings", { soundEnabled: true, soundVolume: 0.5 });

// ==================== STATE ====================
const tiles = ref([]);
const boardRef = ref(null);
const score = ref(0);
const bestTile = ref(0);
const showPopup = ref(false);
const popupTarget = ref(0);
const lastPopupTarget = ref(0);
const invalidTiles = ref(new Set());

// Selection state (plain vars, not reactive — accessed imperatively)
let selectionIds = [];
let isDragging = false;

// SVG connector
const svgPath = ref("");
const svgPoints = ref([]);
const svgViewBox = ref("0 0 1 1");
const dragTailPath = ref("");
const dragPoint = ref({ x: 0, y: 0, visible: false });
const floatingScores = ref([]);
let floatingScoreId = 0;

const highestTile = computed(() => bestTile.value || 2);
const nextObjective = computed(() => { let v = 2048; while (v <= highestTile.value) v *= 2; return v; });
const objectivePercent = computed(() => Math.max(0, Math.min(100, Math.round((highestTile.value / nextObjective.value) * 100))));

const { height: winH, width: winW } = useWindowSize();
const tileSize = computed(() => {
  const vh = winH.value;
  const vw = Math.min(winW.value - 12, 430);
  const isSmall = vw < 400;
  const hudH = isSmall ? 96 : 106;
  const containerPadV = isSmall ? 4 : 8;
  const containerPadH = isSmall ? 6 : 8;
  const boardPad = isSmall ? 8 : 10;
  const gap = isSmall ? 8 : 9;
  const rowGap = (ROWS - 1) * gap;
  const colGap = (COLS - 1) * gap;
  const containerGap = isSmall ? 2 : 4;
  const safety = isSmall ? 8 : 10;
  const availH = vh - hudH - containerPadV - boardPad - rowGap - containerGap - safety;
  const availW = vw - containerPadH - boardPad - colGap;
  return Math.max(16, Math.floor(Math.min(availW / COLS, availH / ROWS)));
});

// ==================== TILE MAP (O(1) lookup) ====================
let tileMap = {};

function rebuildTileMap() {
  const map = {};
  for (const row of tiles.value)
    for (const tile of row.tiles)
      map[tile.id] = tile;
  tileMap = map;
}

function getTile(id) { return tileMap[id]; }

// ==================== BOARD ====================
function createBoard() {
  const board = [];
  for (let i = 0; i < ROWS; i++) {
    const row = { id: i, tiles: [] };
    for (let j = 0; j < COLS; j++)
      row.tiles.push({ id: `r${i}c${j}`, value: 0, active: false, animState: "" });
    board.push(row);
  }
  return board;
}

// ==================== GEOMETRY-BASED HIT DETECTION ====================
// NO elementFromPoint — compute tile positions from layout math

function getBoardRect() {
  const el = boardRef.value?.$el || boardRef.value;
  return el ? el.getBoundingClientRect() : null;
}

function getBoardPadding() {
  return window.innerWidth < 400 ? 6 : 8;
}

function getTileGeometry(row, col) {
  const rect = getBoardRect();
  if (!rect) return null;
  const pad = getBoardPadding();
  const tileW = (rect.width - pad * 2) / COLS;
  const tileH = tileW;
  return {
    left: rect.left + pad + col * tileW,
    top: rect.top + pad + row * tileH,
    width: tileW,
    height: tileH,
    cx: rect.left + pad + col * tileW + tileW / 2,
    cy: rect.top + pad + row * tileH + tileH / 2,
  };
}

function getTileFromPosition(clientX, clientY) {
  const rect = getBoardRect();
  if (!rect) return null;
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom)
    return null;
  const pad = getBoardPadding();
  const tileW = (rect.width - pad * 2) / COLS;
  const tileH = tileW;
  const col = Math.floor((clientX - rect.left - pad) / tileW);
  const row = Math.floor((clientY - rect.top - pad) / tileH);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  const tile = tiles.value[row]?.tiles?.[col];
  if (!tile) return null;
  return { row, col, id: tile.id, value: tile.value };
}

// ==================== SVG CONNECTOR ====================

function buildSvgPath() {
  if (selectionIds.length < 2) { svgPath.value = ""; svgPoints.value = []; return; }
  const rect = getBoardRect();
  if (!rect) { svgPath.value = ""; svgPoints.value = []; return; }
  const pad = getBoardPadding();
  const w = rect.width - pad * 2;
  const tileW = w / COLS;
  const tileH = tileW;
  svgViewBox.value = `0 0 ${w} ${tileH * ROWS}`;
  const pts = [];
  for (const id of selectionIds) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (tiles.value[r].tiles[c].id === id)
          pts.push({ x: pad + c * tileW + tileW / 2, y: pad + r * tileH + tileH / 2 });
  }
  svgPoints.value = pts;
  if (pts.length < 2) { svgPath.value = ""; return; }
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p1 = pts[i - 1], p2 = pts[i];
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / (len || 1) * 3, ny = dx / (len || 1) * 3;
    const useCurve = i < pts.length - 1;
    if (useCurve) {
      const d2x = pts[i + 1].x - p2.x, d2y = pts[i + 1].y - p2.y;
      const a = (dx + d2x) / 2, b = (dy + d2y) / 2;
      d += ` Q ${p2.x + nx + a * 0.2},${p2.y + ny + b * 0.2} ${p2.x},${p2.y}`;
    } else {
      d += ` Q ${mx + nx},${my + ny} ${p2.x},${p2.y}`;
    }
  }
  svgPath.value = d;
}

// ==================== AUDIO ====================
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playTone(freq, dur, type = "sine", vol = 0.3) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}
function playSound(type) {
  if (!settings.value.soundEnabled) return;
  initAudio();
  const v = settings.value.soundVolume;
  switch (type) {
    case "merge": playTone(880, 0.12, "sine", v * 0.4); setTimeout(() => playTone(1100, 0.08, "sine", v * 0.3), 40); break;
    case "complete": [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, "sine", v * 0.4), i * 120)); break;
  }
}
function toggleSound() { settings.value = { ...settings.value, soundEnabled: !settings.value.soundEnabled }; }

// ==================== TILE GENERATION ====================
function analyzeBoard() {
  const freq = {}; let maxVal = 0;
  for (const row of tiles.value) for (const t of row.tiles)
    if (t.value > 0) { freq[t.value] = (freq[t.value] || 0) + 1; maxVal = Math.max(maxVal, t.value); }
  return { freq, maxVal: maxVal || 2 };
}
function generateTileValue() {
  const { freq, maxVal } = analyzeBoard();
  const pool = []; const weights = []; let v = 2;
  while (v <= Math.max(maxVal * 2, 64)) {
    pool.push(v); const c = freq[v] || 0;
    let w;
    if (c === 1) w = 10;
    else if (c === 0 && v <= Math.min(maxVal, 32)) w = 7;
    else if (v <= 8) w = 6;
    else if (v <= maxVal / 2) w = 4;
    else if (v === maxVal && c < 2) w = 3;
    else if (v === maxVal) w = 1;
    else if (v > maxVal) w = 0.3;
    else w = 2;
    weights.push(w); v *= 2;
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return 2;
}

// ==================== MERGE ENGINE ====================
function calculateMerge(values) {
  const count = {};
  for (const v of values) if (v > 0) count[v] = (count[v] || 0) + 1;
  let changed = true;
  while (changed) {
    changed = false;
    const sorted = Object.keys(count).map(Number).sort((a, b) => a - b);
    const next = {};
    for (const v of sorted) {
      const n = (next[v] || 0) + count[v];
      if (n >= 2) { next[v * 2] = (next[v * 2] || 0) + 1; changed = true; }
      else next[v] = n;
    }
    Object.keys(count).forEach(k => delete count[k]);
    Object.assign(count, next);
  }
  const remaining = Object.keys(count).map(Number);
  return remaining.length > 0 ? Math.max(...remaining) : 0;
}

// ==================== SELECTION ENGINE ====================

function isAdjacent(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
  return dr + dc === 1;
}

function getTileRowCol(id) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (tiles.value[r].tiles[c].id === id) return { row: r, col: c };
  return null;
}

function clearSelectionState() {
  for (const row of tiles.value)
    for (const tile of row.tiles) tile.active = false;
  invalidTiles.value = new Set();
  selectionIds = [];
  isDragging = false;
  svgPath.value = "";
  svgPoints.value = [];
  dragTailPath.value = "";
  dragPoint.value = { x: 0, y: 0, visible: false };
}

function startSelection(id) {
  clearSelectionState();
  selectionIds = [id];
  isDragging = true;
  const t = getTile(id);
  if (t) t.active = true;
  buildSvgPath();
}

function handleDeselect(id) {
  const idx = selectionIds.indexOf(id);
  if (idx < 0 || idx === selectionIds.length - 1) return;
  const removed = selectionIds.splice(idx + 1);
  for (const rid of removed) {
    const t = getTile(rid);
    if (t) { t.active = false; t.animState = "deselect"; clearAnim(t); }
  }
  buildSvgPath();
}

function canMergeInto(ids, targetValue) {
  if (ids.length === 0) return false;
  const freq = {};
  for (const id of ids) {
    const t = getTile(id);
    if (t && t.value > 0) freq[t.value] = (freq[t.value] || 0) + 1;
  }
  if (freq[targetValue] > 0) return true;
  const sorted = Object.keys(freq).map(Number).sort((a, b) => a - b);
  const pending = {};
  for (const val of sorted) {
    let count = (pending[val] || 0) + freq[val];
    if (count >= 2) {
      const pairs = Math.floor(count / 2);
      const merged = val * 2;
      if (merged === targetValue) return true;
      pending[merged] = (pending[merged] || 0) + pairs;
      if (count % 2 === 1) pending[val] = (pending[val] || 0) + 1;
    } else {
      pending[val] = (pending[val] || 0) + count;
    }
  }
  const finals = Object.keys(pending).map(Number);
  const processed = [];
  let changed = true;
  while (changed) {
    changed = false;
    const copy = [...finals.filter(v => !processed.includes(v))];
    for (const val of copy) {
      let n = pending[val] || 0;
      if (n >= 2) {
        const merged = val * 2;
        if (merged === targetValue) return true;
        pending[merged] = (pending[merged] || 0) + Math.floor(n / 2);
        pending[val] = n % 2;
        if (pending[val] === 0) delete pending[val];
        changed = true;
      }
      processed.push(val);
    }
  }
  return false;
}

function tryExtendSelection(id) {
  if (!isDragging || selectionIds.includes(id)) return false;
  const t = getTile(id);
  if (!t || t.value <= 0) return false;
  const lastId = selectionIds[selectionIds.length - 1];
  const lastPos = getTileRowCol(lastId);
  const currPos = getTileRowCol(id);
  if (!lastPos || !currPos) return false;
  if (!isAdjacent(lastPos.row, lastPos.col, currPos.row, currPos.col)) {
    showInvalid(id); return false;
  }
  if (!canMergeInto(selectionIds, t.value)) {
    showInvalid(id); return false;
  }
  selectionIds.push(id);
  t.active = true;
  buildSvgPath();
  return true;
}

function showInvalid(id) {
  invalidTiles.value = new Set([...invalidTiles.value, id]);
  setTimeout(() => { const s = new Set(invalidTiles.value); s.delete(id); invalidTiles.value = s; }, 400);
}

function endSelection() {
  if (!isDragging) return;
  isDragging = false;
  if (selectionIds.length >= 2) {
    const values = [];
    for (const id of selectionIds) {
      const t = getTile(id);
      if (t && t.value > 0) values.push(t.value);
    }
    if (values.length >= 2) {
      const finalValue = calculateMerge(values);
      const lastId = selectionIds[selectionIds.length - 1];
      const cols = new Set();
      for (let i = 0; i < selectionIds.length - 1; i++) {
        const d = getTile(selectionIds[i]);
        if (d) { d.value = 0; d.active = false; const p = getTileRowCol(selectionIds[i]); if (p) cols.add(p.col); }
      }
      cols.forEach(j => applyGravity(j));
      const lastData = getTile(lastId);
      if (lastData) {
        lastData.value = finalValue;
        lastData.active = false;
        lastData.animState = "merge";
        clearAnim(lastData);
        spawnFloatingScore(lastId, finalValue);
      }
      score.value += finalValue;
      gameStats.value = {
        ...gameStats.value,
        merges: (gameStats.value?.merges || 0) + 1,
        chains: (gameStats.value?.chains || 0) + selectionIds.length,
        highestChain: Math.max(gameStats.value?.highestChain || 0, selectionIds.length),
      };
      if (finalValue > bestTile.value) bestTile.value = finalValue;
      if (debug.value) lastMergeResult.value = finalValue;
      if (finalValue > 0) playSound("merge");
      checkObjective(finalValue);
      if (hasEmptyTiles()) fillEmptyTiles();
      saveGame();
      scheduleSave();
    }
  } else {
    for (const id of selectionIds) { const t = getTile(id); if (t) t.active = false; }
  }
  selectionIds = [];
  svgPath.value = "";
  svgPoints.value = [];
  dragTailPath.value = "";
  dragPoint.value = { x: 0, y: 0, visible: false };
}

// ==================== BOARD ENGINE ====================

function applyGravity(colIndex) {
  const vals = [];
  for (let i = 0; i < ROWS; i++) { const v = tiles.value[i].tiles[colIndex].value; if (v > 0) vals.push({ val: v }); }
  for (let i = ROWS - 1; i >= 0; i--) {
    const tile = tiles.value[i].tiles[colIndex];
    if (vals.length > 0) { const entry = vals.pop(); if (tile.value !== entry.val) { tile.value = entry.val; tile.animState = "fall"; clearAnim(tile); } }
    else tile.value = 0;
  }
}

function fillEmptyTiles() {
  for (const row of tiles.value)
    for (const tile of row.tiles)
      if (tile.value === 0) { tile.value = generateTileValue(); tile.animState = "new"; clearAnim(tile); }
}

function clearAnim(tile) { setTimeout(() => { if (tile.animState) tile.animState = ""; }, 400); }

function hasEmptyTiles() { return tiles.value.some(r => r.tiles.some(t => t.value === 0)); }

// ==================== INPUT HANDLERS ====================

function onPointerDown(e) {
  const boardEl = boardRef.value?.$el || boardRef.value;
  if (boardEl) try { boardEl.setPointerCapture(e.pointerId); } catch(_) {}
  const tile = getTileFromPosition(e.clientX, e.clientY);
  if (tile && tile.value > 0) startSelection(tile.id);
}

function onPointerMove(e) {
  if (!isDragging) return;
  updateDragVisual(e.clientX, e.clientY);
  const tile = getTileFromPosition(e.clientX, e.clientY);
  if (!tile || tile.value <= 0) return;
  if (selectionIds.includes(tile.id)) handleDeselect(tile.id);
  else tryExtendSelection(tile.id);
}

function onPointerUp() {
  const boardEl = boardRef.value?.$el || boardRef.value;
  if (boardEl) try { boardEl.releasePointerCapture(1); } catch(_) {}
  endSelection();
}

function onPointerCancel() { clearSelectionState(); }

function onVisibilityChange() {
  if (document.hidden && isDragging) clearSelectionState();
}

// ==================== PERSISTENCE ====================

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveGame(), 400);
}

function saveGame() {
  const data = [];
  for (const row of tiles.value) { const r = []; for (const t of row.tiles) r.push(t.value); data.push(r); }
  savedGame.value = {
    board: data,
    score: score.value,
    bestTile: bestTile.value,
    lastPopup: lastPopupTarget.value,
    nextObjective: nextObjective.value,
    settings: settings.value,
    stats: gameStats.value,
    updatedAt: Date.now(),
  };
}

function loadGame() {
  if (!savedGame.value || !savedGame.value.board) { initBoard(); scheduleSave(); return; }
  const sg = savedGame.value;
  score.value = sg.score || 0;
  bestTile.value = sg.bestTile || 0;
  lastPopupTarget.value = sg.lastPopup || 0;
  if (sg.settings) settings.value = { ...settings.value, ...sg.settings };
  if (sg.stats) gameStats.value = { ...gameStats.value, ...sg.stats };
  const data = sg.board;
  if (data && data.length === ROWS)
    for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) tiles.value[i].tiles[j].value = data[i]?.[j] || 0;
  else initBoard();
  rebuildTileMap();
  if (bestTile.value >= 64 && bestTile.value > lastPopupTarget.value) {
    lastPopupTarget.value = bestTile.value;
    popupTarget.value = bestTile.value;
    showPopup.value = true;
  }
}

function initBoard() {
  for (const row of tiles.value)
    for (const tile of row.tiles) { tile.value = generateTileValue(); tile.animState = "new"; clearAnim(tile); }
  rebuildTileMap();
  scheduleSave();
}

function restartGame() {
  score.value = 0; bestTile.value = 0; lastPopupTarget.value = 0;
  tiles.value = createBoard();
  rebuildTileMap();
  initBoard();
  clearSelectionState();
  savedGame.value = null;
}

function checkObjective(justMergedValue) {
  const value = justMergedValue || bestTile.value;
  if (value >= 2048 && value > lastPopupTarget.value) {
    lastPopupTarget.value = value;
    popupTarget.value = value;
    showPopup.value = true;
    playSound("complete");
  }
}

function closePopup() { showPopup.value = false; }

function supportProject() {
  closePopup();
}

function updateDragVisual(clientX, clientY) {
  const rect = getBoardRect();
  if (!rect) return;
  const pad = getBoardPadding();
  const localX = Math.max(0, Math.min(rect.width - pad * 2, clientX - rect.left - pad));
  const localY = Math.max(0, Math.min(rect.height - pad * 2, clientY - rect.top - pad));
  dragPoint.value = { x: localX, y: localY, visible: true };
  const last = svgPoints.value[svgPoints.value.length - 1];
  if (!last) {
    dragTailPath.value = "";
    return;
  }
  const dx = localX - last.x;
  const dy = localY - last.y;
  const ctrlX = last.x + dx * 0.55;
  const ctrlY = last.y + dy * 0.55;
  dragTailPath.value = `M ${last.x},${last.y} Q ${ctrlX},${ctrlY} ${localX},${localY}`;
}

function spawnFloatingScore(tileId, value) {
  const pos = getTileRowCol(tileId);
  if (!pos) return;
  const g = getTileGeometry(pos.row, pos.col);
  if (!g) return;
  const id = ++floatingScoreId;
  floatingScores.value.push({ id, value, x: g.cx, y: g.top + 8 });
  setTimeout(() => {
    floatingScores.value = floatingScores.value.filter((s) => s.id !== id);
  }, 700);
}

// ==================== INIT ====================

tiles.value = createBoard();
rebuildTileMap();
loadGame();

onMounted(() => {
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerCancel);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("resize", rebuildTileMap);
  if (import.meta.env.DEV) debug.value = true;
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerCancel);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("resize", rebuildTileMap);
  clearSelectionState();
});

watch([score, bestTile], () => saveGame());
watch(
  () => tiles.value.map(r => r.tiles.map(t => t.value)),
  () => scheduleSave(),
  { deep: true }
);

// ==================== VISUAL HELPERS ====================

function tileClass(value) {
  if (value === 0) return "tile-empty";
  return `tile-val-${value}`;
}

function mountNumber(val) {
  const len = val.toString().length;
  if (len === 1) return { val, size: "28px" };
  if (len === 2) return { val, size: "24px" };
  if (len === 3) return { val, size: "18px" };
  if (len === 4) return { val, size: "15px" };
  if (len === 5) return { val: val.toString().slice(0, 2) + "K", size: "18px" };
  if (len === 6) return { val: val.toString().slice(0, 3) + "K", size: "16px" };
  if (len === 7) return { val: val.toString().slice(0, 1) + "M", size: "24px" };
  if (len === 8) return { val: val.toString().slice(0, 2) + "M", size: "18px" };
  if (len === 9) return { val: val.toString().slice(0, 3) + "M", size: "16px" };
  if (len === 10) return { val: val.toString().slice(0, 2) + "B", size: "18px" };
  if (len === 11) return { val: val.toString().slice(0, 3) + "B", size: "16px" };
  if (len === 12) return { val: val.toString().slice(0, 1) + "T", size: "24px" };
  if (len === 13) return { val: val.toString().slice(0, 2) + "T", size: "18px" };
  if (len === 14) return { val: val.toString().slice(0, 3) + "T", size: "16px" };
  if (len === 15) return { val: val.toString().slice(0, 1) + "Q", size: "24px" };
  if (len === 16) return { val: val.toString().slice(0, 2) + "Q", size: "18px" };
  return { val, size: "14px" };
}
</script>

<style>
.game-page {
  background: linear-gradient(135deg, #0f0c29 0%, #1a0a2e 30%, #16213e 70%, #0f0c29 100%);
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
 .game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 6px 4px;
  width: 100%;
  max-width: 400px;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* HUD */
.hud { width: 100%; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
.hud-topline { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:0; min-height:36px; }
.top-chip { min-width:124px; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 10px; border-radius:12px; background:linear-gradient(180deg, rgba(38,74,173,.95), rgba(29,55,131,.95)); border:1px solid rgba(255,255,255,.2); color:#fff; font-weight:700; box-shadow: inset 0 1px 0 rgba(255,255,255,.2); }
.top-chip-level { min-width:156px; justify-content:center; padding:6px 14px; }
.mini-add { border:0; border-radius:8px; width:26px; height:26px; background:#6ed21f; color:#fff; font-weight:800; }
.hud-score { text-align:center; font-size: clamp(28px, 7vw, 52px); color:#fff; font-weight:800; letter-spacing:.5px; line-height:1; margin:0; }
.hud-topbar { display: flex; gap: 8px; align-items: center; width: 100%; }
.hidden-meta { display:none; }
.hud-item { background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,215,0,0.15); border-radius: 12px; padding: 6px 12px; display: flex; flex-direction: column; flex: 1; min-width: 0; }
.hud-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,215,0,0.6); font-weight: 600; }
.hud-value { font-size: 18px; font-weight: 800; color: #fff; line-height: 1.2; }
.restart-btn, .sound-btn, .game-back-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,215,0,0.2); border-radius: 12px; color: rgba(255,215,0,0.7); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
.restart-btn:hover, .sound-btn:hover, .game-back-btn:hover { background: rgba(255,215,0,0.15); color: #ffd700; }
.restart-btn:hover { transform: rotate(30deg); }
.objective-row { display: flex; align-items: center; gap: 8px; min-height:36px; }
.objective-label { font-size: 12px; color: rgba(255,255,255,0.95); font-weight: 700; white-space: nowrap; letter-spacing: 0.3px; }
.progress-track { flex: 1; height: 10px; background: rgba(44,77,177,0.65); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #ffd700, #ff8c00); border-radius: 2px; transition: width 0.4s ease; }
.objective-pct { font-size: 10px; color: rgba(255,215,0,0.5); font-weight: 700; min-width: 28px; text-align: right; }

/* BOARD — geometry-based hit detection (no elementFromPoint) */
.board {
  position: relative;
  max-height: calc(100dvh - 154px);
  background: rgba(22, 38, 109, 0.38);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(167,200,255,0.2);
  border-radius: 18px;
  padding: 8px;
  box-shadow: 0 10px 26px rgba(4,10,40,0.42), inset 0 1px 0 rgba(255,255,255,0.1);
  touch-action: none;
  align-self: center;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
.board-row { display: flex; gap: 9px; justify-content: center; margin-bottom: 9px; }
.tile { width: var(--ts); height: var(--ts); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.tile-inner { width: 100%; height: 100%; border-radius: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; z-index: 1; }
.tile-empty { width: 100%; height: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
.tile-text { font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.15); line-height: 1; letter-spacing: -0.5px; pointer-events: none; }

/* SVG selection connector */
.selection-svg { position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; pointer-events: none; z-index: 5; overflow: visible; }

 .selection-glow-layer {
  stroke: rgba(255, 180, 50, 0.35);
  stroke-width: 9;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: url(#lineGlow);
  animation: glowPulse 0.9s ease-in-out infinite alternate;
}

.selection-path {
  stroke: url(#lineGrad);
  stroke-width: 4;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 3px rgba(255, 200, 50, 0.35));
}

.selection-flow {
  stroke: rgba(255, 255, 255, 0.45);
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 6 10;
  animation: flowMove 0.6s linear infinite;
}
.selection-tail {
  stroke: rgba(255, 224, 126, 0.9);
  stroke-width: 5;
  fill: none;
  stroke-linecap: round;
  filter: drop-shadow(0 0 5px rgba(255, 193, 61, 0.35));
  animation: tailPulse .55s ease-in-out infinite alternate;
}
.selection-drag-head {
  fill: rgba(255, 255, 255, 0.9);
  r: 4;
  filter: drop-shadow(0 0 6px rgba(255, 208, 98, .55));
}

.selection-node {
  fill: #ffd700;
  filter: url(#nodeGlow);
  animation: nodePulse 0.8s ease-in-out infinite alternate;
}
.selection-node:nth-child(odd) { animation-delay: -0.4s; }

@keyframes flowMove {
  to { stroke-dashoffset: -16; }
}

@keyframes glowPulse {
  from { opacity: 0.6; }
  to { opacity: 1; }
}

@keyframes nodePulse {
  from { r: 3; opacity: 0.5; }
  to { r: 5.5; opacity: 1; }
}
@keyframes tailPulse {
  from { opacity: .65; stroke-width: 7; }
  to { opacity: 1; stroke-width: 10; }
}

/* Tile value colors */
.tile-val-2  .tile-inner { background: linear-gradient(135deg, #ece4d9 0%, #d9cdbc 100%); box-shadow: 0 2px 4px rgba(101,90,77,0.2), inset 0 1px 0 rgba(255,255,255,0.6); }
.tile-val-2  .tile-text { color: #776e65; text-shadow: none; }
.tile-val-4  .tile-inner { background: linear-gradient(135deg, #f5d6a8 0%, #e8c488 100%); box-shadow: 0 2px 4px rgba(130,100,60,0.25), inset 0 1px 0 rgba(255,255,255,0.5); }
.tile-val-4  .tile-text { color: #776e65; text-shadow: none; }
.tile-val-8  .tile-inner { background: linear-gradient(135deg, #f2a65a 0%, #e8893f 100%); box-shadow: 0 2px 6px rgba(170,110,60,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }
.tile-val-8  .tile-text { color: #fff; }
.tile-val-16 .tile-inner { background: linear-gradient(135deg, #f09060 0%, #d87848 100%); box-shadow: 0 2px 6px rgba(170,90,50,0.35), inset 0 1px 0 rgba(255,255,255,0.25); }
.tile-val-16 .tile-text { color: #fff; }
.tile-val-32 .tile-inner { background: linear-gradient(135deg, #f07050 0%, #d05840 100%); box-shadow: 0 2px 8px rgba(160,70,50,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
.tile-val-32 .tile-text { color: #fff; }
.tile-val-64 .tile-inner { background: linear-gradient(135deg, #e84535 0%, #c83025 100%); box-shadow: 0 2px 8px rgba(150,40,30,0.45), inset 0 1px 0 rgba(255,255,255,0.15); }
.tile-val-64 .tile-text { color: #fff; }
.tile-val-128 .tile-inner { background: linear-gradient(135deg, #f0d060 0%, #e0c040 100%); box-shadow: 0 2px 8px rgba(190,160,40,0.4), inset 0 1px 0 rgba(255,255,255,0.3); }
.tile-val-128 .tile-text { color: #fff; }
.tile-val-256 .tile-inner { background: linear-gradient(135deg, #f0c830 0%, #e0b820 100%); box-shadow: 0 2px 10px rgba(190,160,20,0.45), inset 0 1px 0 rgba(255,255,255,0.3); }
.tile-val-256 .tile-text { color: #fff; }
.tile-val-512 .tile-inner { background: linear-gradient(135deg, #c080f0 0%, #a860e0 100%); box-shadow: 0 2px 10px rgba(130,70,180,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
.tile-val-512 .tile-text { color: #fff; }
.tile-val-1024 .tile-inner { background: linear-gradient(135deg, #60b0f0 0%, #4090d0 100%); box-shadow: 0 2px 10px rgba(40,120,190,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
.tile-val-1024 .tile-text { color: #fff; }
.tile-val-2048 .tile-inner { background: linear-gradient(135deg, #ffd700 0%, #e8c000 100%); box-shadow: 0 2px 12px rgba(200,170,0,0.5), 0 0 20px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3); }
.tile-val-2048 .tile-text { color: #fff; }
.tile-val-4096 .tile-inner, .tile-val-8192 .tile-inner, .tile-val-16384 .tile-inner { background: linear-gradient(135deg, #ff6b9d 0%, #e85080 100%); box-shadow: 0 2px 14px rgba(230,60,120,0.5), 0 0 30px rgba(255,107,157,0.3), inset 0 1px 0 rgba(255,255,255,0.2); }
.tile-val-4096 .tile-text, .tile-val-8192 .tile-text, .tile-val-16384 .tile-text { color: #fff; }

/* Selection — subtle and clear */
.tile-selected { z-index: 10; }
.tile-selected .tile-inner {
  animation: tileGlow 0.45s ease-in-out infinite alternate;
  box-shadow:
    0 0 8px rgba(255, 200, 50, 0.22),
    0 0 14px rgba(255, 200, 50, 0.1) !important;
  transform: scale(1.035);
  border: 2px solid rgba(255, 215, 0, 0.35);
  position: relative;
}

.tile-fall .tile-inner { animation: tileDrop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
.tile-new .tile-inner { animation: tileAppear 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
.tile-merge .tile-inner { animation: tileMerge 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
.tile-deselect .tile-inner { animation: tileDeselect 0.2s ease forwards; }
.tile-invalid .tile-inner { animation: tileShake 0.35s ease; box-shadow: 0 0 10px rgba(255,50,50,0.35) !important; }

@keyframes tileGlow {
  from { transform: scale(1.02); box-shadow: 0 0 6px rgba(255,200,50,0.2); }
  to { transform: scale(1.04); box-shadow: 0 0 12px rgba(255,200,50,0.3); }
}
@keyframes tileDrop { from { transform: translateY(-60px); opacity: 0.4; } 70% { opacity: 1; } to { transform: translateY(0); opacity: 1; } }
@keyframes tileAppear { from { transform: scale(0) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.15) rotate(2deg); opacity: 1; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes tileMerge { 0% { transform: scale(1); } 45% { transform: scale(1.13); box-shadow: 0 0 16px rgba(255,215,0,0.35); } 100% { transform: scale(1); } }
@keyframes tileDeselect { from { transform: scale(1.03); opacity: 1; } to { transform: scale(0.9); opacity: 0.6; } }
@keyframes tileShake { 0%,100% { transform: translateX(0); } 15% { transform: translateX(-4px); } 30% { transform: translateX(4px); } 45% { transform: translateX(-3px); } 60% { transform: translateX(3px); } 75% { transform: translateX(-2px); } 90% { transform: translateX(2px); } }

/* Popup */
.popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: popupFadeIn 0.3s ease; padding: 20px; }
.popup-card { background: linear-gradient(135deg, #1a1a3e 0%, #2a1a4e 100%); border: 1px solid rgba(255,215,0,0.2); border-radius: 20px; padding: 32px 28px; max-width: 340px; width: 100%; text-align: center; position: relative; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,215,0,0.05); animation: popupSlide 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.popup-star { font-size: 48px; margin-bottom: 8px; }
.popup-title { font-size: 26px; font-weight: 800; color: #ffd700; margin: 0 0 4px 0; text-shadow: 0 0 20px rgba(255,215,0,0.3); }
.popup-sub { font-size: 15px; color: rgba(255,255,255,0.8); margin: 0 0 16px 0; } .popup-sub strong { color: #ffd700; }
.popup-divider { width: 40px; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent); margin: 0 auto 16px; }
.popup-text { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin: 0 0 20px 0; }
.popup-buttons { display: flex; flex-direction: column; gap: 8px; }
.popup-btn { background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1)); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; color: #ffd700; font-size: 15px; font-weight: 700; padding: 12px 24px; cursor: pointer; transition: all 0.2s ease; width: 100%; }
.popup-btn:hover { background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.15)); transform: scale(1.03); }
.popup-btn-support { background: linear-gradient(135deg, rgba(255,100,100,0.2), rgba(200,50,50,0.1)); border-color: rgba(255,100,100,0.3); color: #ff8888; }
.popup-btn-support:hover { background: linear-gradient(135deg, rgba(255,100,100,0.3), rgba(200,50,50,0.15)); color: #ff6b6b; }
@keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popupSlide { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

.floating-score-layer { position: fixed; inset: 0; pointer-events: none; z-index: 20; }
.floating-score {
  position: absolute;
  transform: translate(-50%, -50%);
  color: #eaf5ff;
  font-size: clamp(16px, 3.8vw, 24px);
  font-weight: 900;
  text-shadow: 0 2px 6px rgba(9,14,35,0.8), 0 0 18px rgba(255,218,98,0.6);
  animation: floatScore .45s ease-out forwards;
}
@keyframes floatScore {
  from { opacity: 0; transform: translate(-50%, -20%) scale(0.6); }
  20% { opacity: 1; transform: translate(-50%, -55%) scale(1.04); }
  to { opacity: 0; transform: translate(-50%, -120%) scale(1); }
}
/* Responsive */
@media (max-width: 400px) { .game-container { padding: 4px; gap: 3px; } .board { padding: 6px; } .hud-item { padding: 4px 8px; } .hud-value { font-size: 14px; } .restart-btn, .sound-btn, .game-back-btn { width: 34px; height: 34px; } .board-row { gap: 7px; margin-bottom: 7px; } .selection-svg { top: 6px; left: 6px; right: 6px; bottom: 6px; }  .selection-glow-layer { stroke-width: 6; } .selection-path { stroke-width: 3; } .hud-topbar { gap: 4px; } .objective-label{font-size:11px;} }
@media (min-width: 600px) { .game-container { max-width: 440px; gap: 8px; padding: 10px; } .board { padding: 10px; } .hud-value { font-size: 22px; } .restart-btn, .sound-btn, .game-back-btn { width: 48px; height: 48px; } .board-row { gap: 10px; margin-bottom: 10px; } .selection-svg { top: 10px; left: 10px; right: 10px; bottom: 10px; }  .selection-glow-layer { stroke-width: 8; } .selection-path { stroke-width: 4; } .hud-topbar { gap: 6px; } }
</style>
