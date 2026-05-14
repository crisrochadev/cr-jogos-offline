<template>
  <q-page class="game-page">
    <div class="game-container">

      <!-- HUD -->
      <div class="hud">

        <div class="hud-topline">
          <div class="top-chip">
            <span>💎</span>
            <strong>{{ economy.coins }}</strong>
            <button
              class="mini-add"
              @click="showCoinsModal = true"
            >
              +
            </button>
          </div>

          <div class="top-chip top-chip-level">
            👑 Level {{ playerLevel }}
          </div>
        </div>

        <div class="hud-score">
          {{ score.toLocaleString() }}
        </div>

        <div class="hud-actions">
          <button
            class="hud-mini-btn"
            @click="goBack"
          >
            Voltar
          </button>

          <button
            class="hud-mini-btn"
            @click="showResetModal = true"
          >
            Reset
          </button>

          <button
            class="hud-mini-btn hud-convert-btn"
            @click="openConvertModal"
          >
            <span>✨ Converter score</span>

            <small>
              1000 pts = 1 💎
              (disp: {{ convertibleCoins }})
            </small>
          </button>
        </div>

        <div class="objective-row">
          <span class="objective-label">
            Atual:
            {{ mountNumber(highestTile).val }}
          </span>

          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: objectivePercent + '%' }"
            />
          </div>

          <span class="objective-label">
            Objetivo:
            {{ mountNumber(nextObjective).val }}
          </span>
        </div>

      </div>

      <!-- BOARD -->
      <div
        ref="boardRef"
        class="board"
        :style="{ '--ts': `${tileSize}px` }"
        @pointerdown.prevent="onPointerDown"
        @pointermove="onPointerMove"
        @pointercancel="onPointerCancel"
      >

        <!-- SVG -->
        <svg
          v-if="selectionIdsReactive.length >= 2 || dragPoint.visible"
          class="selection-svg"
          :viewBox="svgViewBox"
        >
          <defs>

            <linearGradient
              id="lineGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#ffd700" />
              <stop offset="50%" stop-color="#ff8c00" />
              <stop offset="100%" stop-color="#ffaa00" />
            </linearGradient>

          </defs>

          <path
            :d="svgPath"
            class="selection-glow-layer"
          />

          <path
            :d="svgPath"
            class="selection-path"
          />

          <path
            :d="svgPath"
            class="selection-flow"
          />

          <path
            v-if="dragTailPath"
            :d="dragTailPath"
            class="selection-tail"
          />

          <circle
            v-if="dragPoint.visible"
            :cx="dragPoint.x"
            :cy="dragPoint.y"
            class="selection-drag-head"
          />

          <circle
            v-for="(pt, idx) in svgPoints"
            :key="idx"
            :cx="pt.x"
            :cy="pt.y"
            class="selection-node"
          />

        </svg>

        <!-- ROWS -->
        <div
          v-for="row in tiles"
          :key="row.id"
          class="board-row"
        >

          <div
            v-for="tile in row.tiles"
            :key="tile.id"
            :data-id="tile.id"
            class="tile"
            :class="[
              tileClass(tile.value),

              tile.active
                ? 'tile-selected'
                : '',

              tile.animState
                ? `tile-${tile.animState}`
                : '',

              invalidTiles.has(tile.id)
                ? 'tile-invalid'
                : ''
            ]"
          >

            <div
              v-if="tile.value > 0"
              class="tile-inner"
              :style="{
                fontSize: mountNumber(tile.value).size
              }"
            >
              <span class="tile-text">
                {{ mountNumber(tile.value).val }}
              </span>
            </div>

          </div>

        </div>

      </div>

      <!-- FLOATING SCORES -->
      <div
        class="floating-score-layer"
        aria-hidden="true"
      >

        <div
          v-for="pop in floatingScores"
          :key="pop.id"
          class="floating-score"
          :style="{
            left: `${pop.x}px`,
            top: `${pop.y}px`
          }"
        >
          +{{ mountNumber(pop.value).val }}
        </div>

      </div>

      <!-- POPUPS -->
      <Teleport to="body">

        <!-- MILESTONE -->
        <div
          v-if="showPopup"
          class="popup-overlay"
          @click.self="closePopup"
        >
          <div class="popup-card">

            <div class="popup-star">
              ✨
            </div>

            <h2 class="popup-title">
              Novo marco desbloqueado!
            </h2>

            <p class="popup-sub">
              Você alcançou
              <strong>
                {{ mountNumber(popupTarget).val }}
              </strong>
            </p>

            <div class="popup-divider" />

            <p class="popup-text">
              Obrigado por jogar ❤️
            </p>

            <div class="popup-buttons">

              <button
                class="popup-btn"
                @click="closePopup"
              >
                Continuar
              </button>

              <button
                class="popup-btn popup-btn-support"
                @click="supportProject"
              >
                Apoiar projeto
              </button>

            </div>

          </div>
        </div>

        <!-- RESET -->
        <div
          v-if="showResetModal"
          class="popup-overlay"
          @click.self="showResetModal = false"
        >
          <div class="popup-card">

            <h2 class="popup-title">
              Reiniciar partida?
            </h2>

            <div class="popup-buttons">

              <button
                class="popup-btn"
                @click="showResetModal = false"
              >
                Cancelar
              </button>

              <button
                class="popup-btn popup-btn-support"
                @click="confirmReset"
              >
                Reiniciar
              </button>

            </div>

          </div>
        </div>

        <!-- CONVERT -->
        <div
          v-if="showConvertModal"
          class="popup-overlay"
          @click.self="showConvertModal = false"
        >
          <div class="popup-card">

            <h2 class="popup-title">
              Converter score
            </h2>

            <p class="popup-sub">
              Escolha quantas moedas deseja gerar
            </p>

            <input
              v-model.number="convertAmount"
              class="convert-input"
              type="range"
              min="1"
              :max="Math.max(1, convertibleCoins)"
            />

            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${convertProgressPct}%` }"
              />
            </div>

            <p class="popup-sub">

              Score gasto:
              <strong>
                {{
                  (
                    convertAmount * 1000
                  ).toLocaleString()
                }}
              </strong>

            </p>

            <div class="popup-buttons">

              <button
                class="popup-btn"
                @click="showConvertModal = false"
              >
                Cancelar
              </button>

              <button
                class="popup-btn popup-btn-support"
                @click="confirmConvertScore"
              >
                Confirmar
              </button>

            </div>

          </div>
        </div>

      </Teleport>

    </div>
  </q-page>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import { useRouter } from 'vue-router'

import {
  useStorage,
  useWindowSize
} from '@vueuse/core'

/* =========================================================
   ROUTER
========================================================= */

const router = useRouter()

function goBack() {
  router.push('/jogos/2048')
}

/* =========================================================
   CONSTANTS
========================================================= */

const ROWS = 9
const COLS = 5

const GAP_SMALL = 7
const GAP_NORMAL = 9

const PAD_SMALL = 6
const PAD_NORMAL = 8

/* =========================================================
   STORAGE
========================================================= */

const savedGame = useStorage(
  '2048connect-save',
  null
)

const economy = useStorage(
  '2048connect-economy',
  {
    coins: 73,
    totalScore: 0,
    spentCoins: 0
  }
)

const settings = useStorage(
  '2048connect-settings',
  {
    soundEnabled: true,
    soundVolume: 0.5
  }
)

const unlockedMilestones = useStorage(
  '2048connect-milestones',
  []
)

/* =========================================================
   STATE
========================================================= */

const tiles = ref([])

const boardRef = ref(null)

const score = ref(0)

const bestTile = ref(0)

const hudHeight = ref(140)

const invalidTiles = ref(new Set())

const floatingScores = ref([])

const showPopup = ref(false)
const showResetModal = ref(false)
const showConvertModal = ref(false)

const popupTarget = ref(0)

const convertAmount = ref(1)

const svgPath = ref('')
const svgPoints = ref([])
const svgViewBox = ref('0 0 1 1')
const dragTailPath = ref('')

const dragPoint = ref({
  x: 0,
  y: 0,
  visible: false
})

const selectionIdsReactive = ref([])

let selectionIds = []
let isDragging = false
let tileMap = {}

let floatingId = 0
let saveTimer = null

/* =========================================================
   WINDOW
========================================================= */

const {
  width: winW,
  height: winH
} = useWindowSize()

/* =========================================================
   COMPUTEDS
========================================================= */

const highestTile = computed(() =>
  bestTile.value || 2
)

const nextObjective = computed(() => {
  let v = 2048

  while (v <= highestTile.value) {
    v *= 2
  }

  return v
})

const objectivePercent = computed(() => {

  const current = highestTile.value || 2

  const next = nextObjective.value

  const prev = next / 2

  const progress =
    (
      (current - prev) /
      (next - prev)
    ) * 100

  return Math.max(
    0,
    Math.min(100, Math.round(progress))
  )

})

const convertibleCoins = computed(() =>
  Math.floor(score.value / 1000)
)

const convertProgressPct = computed(() => {

  if (score.value <= 0) {
    return 0
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((convertAmount.value * 1000) /
          score.value) * 100
      )
    )
  )

})

const playerLevel = computed(() =>
  Math.max(
    1,
    Math.floor(Math.log2(bestTile.value || 2))
  )
)

const tileSize = computed(() => {

  const vh =
    window.visualViewport?.height ||
    winH.value

  const maxWidth =
    Math.min(winW.value - 16, 430)

  const isSmall = maxWidth < 400

  const gap = isSmall
    ? GAP_SMALL
    : GAP_NORMAL

  const boardPadding = isSmall
    ? PAD_SMALL
    : PAD_NORMAL

  const hudH = hudHeight.value || 140

  const totalVertical =
    hudH +
    boardPadding * 2 +
    gap * (ROWS - 1) +
    24

  const availableHeight =
    vh - totalVertical

  const availableWidth =
    maxWidth -
    boardPadding * 2 -
    gap * (COLS - 1)

  const byWidth =
    availableWidth / COLS

  const byHeight =
    availableHeight / ROWS

  return Math.floor(
    Math.max(
      18,
      Math.min(byWidth, byHeight)
    )
  )

})

/* =========================================================
   HELPERS
========================================================= */

function mountNumber(val) {

  const len = val.toString().length

  if (len <= 2) {
    return {
      val,
      size: '24px'
    }
  }

  if (len === 3) {
    return {
      val,
      size: '18px'
    }
  }

  if (len === 4) {
    return {
      val,
      size: '15px'
    }
  }

  if (len <= 6) {
    return {
      val: `${Math.floor(val / 1000)}K`,
      size: '16px'
    }
  }

  if (len <= 9) {
    return {
      val: `${Math.floor(val / 1000000)}M`,
      size: '16px'
    }
  }

  return {
    val,
    size: '14px'
  }

}

function tileClass(value) {

  if (value === 0) {
    return 'tile-empty'
  }

  return `tile-val-${value}`

}

/* =========================================================
   BOARD
========================================================= */

function createBoard() {

  const board = []

  for (let r = 0; r < ROWS; r++) {

    const row = {
      id: r,
      tiles: []
    }

    for (let c = 0; c < COLS; c++) {

      row.tiles.push({
        id: `r${r}c${c}`,
        value: 0,
        active: false,
        animState: ''
      })

    }

    board.push(row)

  }

  return board

}

function rebuildTileMap() {

  const map = {}

  for (const row of tiles.value) {

    for (const tile of row.tiles) {
      map[tile.id] = tile
    }

  }

  tileMap = map

}

function getTile(id) {
  return tileMap[id]
}

function generateTileValue() {

  const pool = [
    2,
    2,
    2,
    4,
    4,
    8,
    16
  ]

  return pool[
    Math.floor(Math.random() * pool.length)
  ]

}

function initBoard() {

  for (const row of tiles.value) {

    for (const tile of row.tiles) {

      tile.value = generateTileValue()

    }

  }

  rebuildTileMap()

}

function hasEmptyTiles() {

  return tiles.value.some((row) =>
    row.tiles.some((t) => t.value === 0)
  )

}

function fillEmptyTiles() {

  for (const row of tiles.value) {

    for (const tile of row.tiles) {

      if (tile.value === 0) {
        tile.value = generateTileValue()
      }

    }

  }

}

/* =========================================================
   POSITION
========================================================= */

function getBoardRect() {

  return boardRef.value?.getBoundingClientRect()

}

function getGap() {

  return winW.value < 400
    ? GAP_SMALL
    : GAP_NORMAL

}

function getPad() {

  return winW.value < 400
    ? PAD_SMALL
    : PAD_NORMAL

}

function getTileRowCol(id) {

  for (let r = 0; r < ROWS; r++) {

    for (let c = 0; c < COLS; c++) {

      if (
        tiles.value[r].tiles[c].id === id
      ) {
        return {
          row: r,
          col: c
        }
      }

    }

  }

  return null

}

function getTileGeometry(row, col) {

  const rect = getBoardRect()

  if (!rect) return null

  const gap = getGap()
  const pad = getPad()

  return {

    left:
      rect.left +
      pad +
      col * (tileSize.value + gap),

    top:
      rect.top +
      pad +
      row * (tileSize.value + gap),

    cx:
      rect.left +
      pad +
      col * (tileSize.value + gap) +
      tileSize.value / 2,

    cy:
      rect.top +
      pad +
      row * (tileSize.value + gap) +
      tileSize.value / 2

  }

}

function getTileFromPosition(x, y) {

  const rect = getBoardRect()

  if (!rect) return null

  if (
    x < rect.left ||
    x > rect.right ||
    y < rect.top ||
    y > rect.bottom
  ) {
    return null
  }

  const gap = getGap()
  const pad = getPad()

  const localX =
    x - rect.left - pad

  const localY =
    y - rect.top - pad

  const step =
    tileSize.value + gap

  const col =
    Math.floor(localX / step)

  const row =
    Math.floor(localY / step)

  if (
    row < 0 ||
    row >= ROWS ||
    col < 0 ||
    col >= COLS
  ) {
    return null
  }

  const insideX = localX % step
  const insideY = localY % step

  if (
    insideX > tileSize.value ||
    insideY > tileSize.value
  ) {
    return null
  }

  const tile =
    tiles.value[row]?.tiles?.[col]

  if (!tile) return null

  return {
    row,
    col,
    id: tile.id,
    value: tile.value
  }

}

/* =========================================================
   SVG
========================================================= */

function buildSvgPath() {

  if (selectionIds.length < 2) {

    svgPath.value = ''
    svgPoints.value = []

    return

  }

  const rect = getBoardRect()

  if (!rect) return

  const gap = getGap()
  const pad = getPad()

  const pts = []

  for (const id of selectionIds) {

    const pos = getTileRowCol(id)

    if (!pos) continue

    pts.push({

      x:
        pad +
        pos.col * (tileSize.value + gap) +
        tileSize.value / 2,

      y:
        pad +
        pos.row * (tileSize.value + gap) +
        tileSize.value / 2

    })

  }

  svgPoints.value = pts

  svgViewBox.value =
    `0 0 ${rect.width} ${rect.height}`

  let d =
    `M ${pts[0].x},${pts[0].y}`

  for (let i = 1; i < pts.length; i++) {

    const prev = pts[i - 1]
    const curr = pts[i]

    const mx =
      (prev.x + curr.x) / 2

    const my =
      (prev.y + curr.y) / 2

    d +=
      ` Q ${mx},${my} ${curr.x},${curr.y}`

  }

  svgPath.value = d

}

/* =========================================================
   SELECTION
========================================================= */

function isAdjacent(r1, c1, r2, c2) {

  const dr = Math.abs(r1 - r2)
  const dc = Math.abs(c1 - c2)

  return (
    dr <= 1 &&
    dc <= 1 &&
    (dr + dc > 0)
  )

}

function clearSelectionState() {

  for (const row of tiles.value) {

    for (const tile of row.tiles) {
      tile.active = false
    }

  }

  invalidTiles.value = new Set()

  selectionIds = []

  selectionIdsReactive.value = []

  isDragging = false

  svgPath.value = ''
  svgPoints.value = []
  dragTailPath.value = ''

  dragPoint.value = {
    x: 0,
    y: 0,
    visible: false
  }

}

function startSelection(id) {

  clearSelectionState()

  selectionIds = [id]

  selectionIdsReactive.value = [...selectionIds]

  isDragging = true

  const tile = getTile(id)

  if (tile) {
    tile.active = true
  }

}

function showInvalid(id) {

  invalidTiles.value = new Set([
    ...invalidTiles.value,
    id
  ])

  setTimeout(() => {

    const next =
      new Set(invalidTiles.value)

    next.delete(id)

    invalidTiles.value = next

  }, 350)

}

function calculateProgressiveMerge(values) {

  const arr = [...values]
    .sort((a, b) => a - b)

  let changed = true

  while (changed) {

    changed = false

    for (
      let i = 0;
      i < arr.length - 1;
      i++
    ) {

      if (arr[i] === arr[i + 1]) {

        arr.splice(
          i,
          2,
          arr[i] * 2
        )

        changed = true

        break

      }

    }

    arr.sort((a, b) => a - b)

  }

  return arr[arr.length - 1] || 0

}

function tryExtendSelection(id) {

  if (!isDragging) return false

  if (selectionIds.includes(id)) {
    return false
  }

  const tile = getTile(id)

  if (!tile || tile.value <= 0) {
    return false
  }

  const lastId =
    selectionIds[selectionIds.length - 1]

  const lastPos =
    getTileRowCol(lastId)

  const currPos =
    getTileRowCol(id)

  if (!lastPos || !currPos) {
    return false
  }

  if (
    !isAdjacent(
      lastPos.row,
      lastPos.col,
      currPos.row,
      currPos.col
    )
  ) {

    showInvalid(id)

    return false

  }

  const values =
    selectionIds
      .map(
        (sid) =>
          getTile(sid)?.value || 0
      )
      .filter(Boolean)

  values.push(tile.value)

  const merged =
    calculateProgressiveMerge(values)

  if (merged <= 0) {

    showInvalid(id)

    return false

  }

  const freq = {}

  for (const v of values) {
    freq[v] = (freq[v] || 0) + 1
  }

  const validPair =
    Object.values(freq)
      .some((v) => v >= 2)

  if (!validPair) {

    showInvalid(id)

    return false

  }

  selectionIds.push(id)

  selectionIdsReactive.value = [...selectionIds]

  tile.active = true

  buildSvgPath()

  return true

}

function applyGravity(col) {

  const vals = []

  for (let r = 0; r < ROWS; r++) {

    const v =
      tiles.value[r].tiles[col].value

    if (v > 0) {
      vals.push(v)
    }

  }

  for (
    let r = ROWS - 1;
    r >= 0;
    r--
  ) {

    tiles.value[r].tiles[col].value =
      vals.pop() || 0

  }

}

function spawnFloatingScore(id, value) {

  const pos = getTileRowCol(id)

  if (!pos) return

  const g =
    getTileGeometry(pos.row, pos.col)

  if (!g) return

  const item = {
    id: ++floatingId,
    value,
    x: g.cx,
    y: g.top + 8
  }

  floatingScores.value.push(item)

  setTimeout(() => {

    floatingScores.value =
      floatingScores.value.filter(
        (f) => f.id !== item.id
      )

  }, 700)

}

function endSelection() {

  if (!isDragging) return

  isDragging = false

  if (selectionIds.length >= 2) {

    const values =
      selectionIds
        .map(
          (id) =>
            getTile(id)?.value || 0
        )
        .filter(Boolean)

    const result =
      calculateProgressiveMerge(values)

    const lastId =
      selectionIds[
        selectionIds.length - 1
      ]

    const cols = new Set()

    for (
      let i = 0;
      i < selectionIds.length - 1;
      i++
    ) {

      const id = selectionIds[i]

      const tile = getTile(id)

      if (!tile) continue

      tile.value = 0
      tile.active = false

      const pos = getTileRowCol(id)

      if (pos) {
        cols.add(pos.col)
      }

    }

    for (const c of cols) {
      applyGravity(c)
    }

    const finalTile =
      getTile(lastId)

    if (finalTile) {

      finalTile.value = result
      finalTile.active = false
      finalTile.animState = 'merge'

      setTimeout(() => {
        finalTile.animState = ''
      }, 350)

      spawnFloatingScore(lastId, result)

    }

    score.value += result

    if (result > bestTile.value) {

      bestTile.value = result

      checkObjective(result)

    }

    fillEmptyTiles()

    scheduleSave()

  }

  clearSelectionState()

}

/* =========================================================
   VALID MOVES
========================================================= */

function hasAnyValidMove() {

  for (let r = 0; r < ROWS; r++) {

    for (let c = 0; c < COLS; c++) {

      const current =
        tiles.value[r].tiles[c]

      if (
        !current ||
        current.value <= 0
      ) {
        continue
      }

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1]
      ]

      for (const [dr, dc] of dirs) {

        const next =
          tiles.value[r + dr]
            ?.tiles?.[c + dc]

        if (
          !next ||
          next.value <= 0
        ) {
          continue
        }

        if (
          next.value === current.value
        ) {
          return true
        }

      }

    }

  }

  return false

}

/* =========================================================
   MILESTONES
========================================================= */

function checkObjective(value) {

  if (!value) return

  if (
    unlockedMilestones.value.includes(
      value
    )
  ) {
    return
  }

  if (value >= 2048) {
    handleMilestone(value)
  }

}

function handleMilestone(value) {

  if (
    unlockedMilestones.value.includes(
      value
    )
  ) {
    return
  }

  unlockedMilestones.value = [
    ...unlockedMilestones.value,
    value
  ]

  const reward = Math.max(
    5,
    Math.floor(Math.log2(value) * 1.5)
  )

  economy.value.coins += reward

  popupTarget.value = value

  showPopup.value = true

  saveGame()

}

/* =========================================================
   POINTER
========================================================= */

function updateDragVisual(x, y) {

  const rect = getBoardRect()

  if (!rect) return

  const pad = getPad()

  const localX =
    x - rect.left - pad

  const localY =
    y - rect.top - pad

  dragPoint.value = {
    x: localX,
    y: localY,
    visible: true
  }

  const last =
    svgPoints.value[
      svgPoints.value.length - 1
    ]

  if (!last) {
    dragTailPath.value = ''
    return
  }

  const ctrlX =
    last.x + (localX - last.x) * 0.55

  const ctrlY =
    last.y + (localY - last.y) * 0.55

  dragTailPath.value =
    `M ${last.x},${last.y}
     Q ${ctrlX},${ctrlY}
     ${localX},${localY}`

}

function onPointerDown(e) {

  const tile =
    getTileFromPosition(
      e.clientX,
      e.clientY
    )

  if (!tile || tile.value <= 0) {
    return
  }

  startSelection(tile.id)

}

function onPointerMove(e) {

  if (!isDragging) return

  updateDragVisual(
    e.clientX,
    e.clientY
  )

  const tile =
    getTileFromPosition(
      e.clientX,
      e.clientY
    )

  if (!tile) return

  tryExtendSelection(tile.id)

}

function onPointerUp() {

  endSelection()

}

function onPointerCancel() {

  clearSelectionState()

}

/* =========================================================
   SAVE
========================================================= */

function serializeGame() {

  return {

    score: score.value,

    bestTile: bestTile.value,

    board:
      tiles.value.map((r) =>
        r.tiles.map((t) => t.value)
      )

  }

}

function saveGame() {

  savedGame.value =
    serializeGame()

}

function scheduleSave() {

  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  saveTimer = setTimeout(
    saveGame,
    300
  )

}

function loadGame() {

  if (
    !savedGame.value ||
    !savedGame.value.board
  ) {

    initBoard()

    return

  }

  score.value =
    savedGame.value.score || 0

  bestTile.value =
    savedGame.value.bestTile || 0

  for (let r = 0; r < ROWS; r++) {

    for (let c = 0; c < COLS; c++) {

      tiles.value[r].tiles[c].value =
        savedGame.value.board?.[r]?.[c] || 0

    }

  }

  rebuildTileMap()

}

/* =========================================================
   POPUPS
========================================================= */

function closePopup() {

  showPopup.value = false

}

function supportProject() {

  closePopup()

}

function confirmReset() {

  restartGame()

}

function restartGame() {

  score.value = 0

  bestTile.value = 0

  tiles.value = createBoard()

  rebuildTileMap()

  initBoard()

  saveGame()

  showResetModal.value = false

}

function openConvertModal() {

  convertAmount.value = Math.max(
    1,
    convertibleCoins.value
  )

  showConvertModal.value = true

}

function confirmConvertScore() {

  if (
    convertAmount.value <= 0 ||
    convertAmount.value >
      convertibleCoins.value
  ) {
    return
  }

  score.value -=
    convertAmount.value * 1000

  economy.value.coins +=
    convertAmount.value

  showConvertModal.value = false

  saveGame()

}

/* =========================================================
   RESIZE
========================================================= */

function handleResize() {

  rebuildTileMap()

  buildSvgPath()

  requestAnimationFrame(() => {

    const hud =
      document.querySelector('.hud')

    if (hud) {

      hudHeight.value =
        hud.getBoundingClientRect().height

    }

  })

}

/* =========================================================
   INIT
========================================================= */

tiles.value = createBoard()

rebuildTileMap()

loadGame()

onMounted(() => {

  document.addEventListener(
    'pointerup',
    onPointerUp
  )

  document.addEventListener(
    'pointercancel',
    onPointerCancel
  )

  window.addEventListener(
    'resize',
    handleResize
  )

  if (window.visualViewport) {

    window.visualViewport.addEventListener(
      'resize',
      handleResize
    )

  }

  requestAnimationFrame(() => {

    const hud =
      document.querySelector('.hud')

    if (hud) {

      hudHeight.value =
        hud.getBoundingClientRect().height

    }

  })

})

onBeforeUnmount(() => {

  document.removeEventListener(
    'pointerup',
    onPointerUp
  )

  document.removeEventListener(
    'pointercancel',
    onPointerCancel
  )

  window.removeEventListener(
    'resize',
    handleResize
  )

  if (window.visualViewport) {

    window.visualViewport.removeEventListener(
      'resize',
      handleResize
    )

  }

})

watch(
  () =>
    tiles.value.map((r) =>
      r.tiles.map((t) => t.value)
    ),
  () => {

    requestAnimationFrame(() => {

      if (!hasAnyValidMove()) {
        showPopup.value = true
      }

    })

    scheduleSave()

  },
  {
    deep: true
  }
)
</script>

<style>
.game-page {
  background:
    linear-gradient(
      135deg,
      #0f0c29 0%,
      #1a0a2e 30%,
      #16213e 70%,
      #0f0c29 100%
    );

  height: 100dvh;

  overflow: hidden;

  display: flex;

  align-items: center;
  justify-content: center;

  padding-top: env(safe-area-inset-top);

  padding-bottom:
    env(safe-area-inset-bottom);

  font-family:
    'Segoe UI',
    system-ui,
    sans-serif;
}

.game-container {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: flex-start;

  width: 100%;

  max-width: 430px;

  height: 100dvh;

  overflow: hidden;

  padding: 6px;

  gap: 6px;

}

/* HUD */

.hud {
  width: 100%;

  display: flex;

  flex-direction: column;

  gap: 5px;

  flex-shrink: 0;
}

.hud-topline {

  display: flex;

  justify-content: space-between;

  gap: 8px;

}

.top-chip {

  min-width: 124px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 8px;

  padding: 6px 10px;

  border-radius: 12px;

  background:
    linear-gradient(
      180deg,
      rgba(38,74,173,.95),
      rgba(29,55,131,.95)
    );

  border:
    1px solid rgba(255,255,255,.2);

  color: #fff;

  font-weight: 700;
}

.top-chip-level {

  justify-content: center;

  min-width: 160px;

}

.mini-add {

  width: 26px;
  height: 26px;

  border: 0;

  border-radius: 8px;

  background: #6ed21f;

  color: #fff;

  font-weight: 800;

}

.hud-score {

  text-align: center;

  font-size:
    clamp(28px, 7vw, 52px);

  font-weight: 800;

  color: #fff;

  line-height: 1;

}

.hud-actions {

  display: flex;

  gap: 6px;

}

.hud-mini-btn {

  flex: 1;

  min-height: 32px;

  border-radius: 10px;

  border:
    1px solid rgba(255,255,255,.22);

  background:
    rgba(19,35,105,.55);

  color: #fff;

  font-size: 12px;

  font-weight: 700;

}

.hud-convert-btn {

  display: flex;

  flex-direction: column;

  align-items: flex-start;

}

.objective-row {

  display: flex;

  align-items: center;

  gap: 8px;

}

.objective-label {

  font-size: 12px;

  color: rgba(255,255,255,.95);

  font-weight: 700;

}

.progress-track {

  flex: 1;

  height: 10px;

  background:
    rgba(44,77,177,0.65);

  border-radius: 999px;

  overflow: hidden;

}

.progress-fill {

  height: 100%;

  background:
    linear-gradient(
      90deg,
      #ffd700,
      #ff8c00
    );

}

/* BOARD */

.board {

  position: relative;

  background:
    rgba(22, 38, 109, 0.38);

  border:
    1px solid rgba(167,200,255,0.2);

  border-radius: 18px;

  padding: 8px;

  overflow: hidden;

  touch-action: none;

  user-select: none;

  width: fit-content;

  height: fit-content;

}

.board-row {

  display: flex;

  gap: 9px;

  margin-bottom: 9px;

}

.board-row:last-child {
  margin-bottom: 0;
}

.tile {

  width: var(--ts);
  height: var(--ts);

  min-width: var(--ts);
  min-height: var(--ts);

  flex-shrink: 0;

}

.tile-inner {

  width: 100%;
  height: 100%;

  border-radius: 14px;

  display: flex;

  align-items: center;
  justify-content: center;

}

.tile-empty {

  width: 100%;
  height: 100%;

  background:
    rgba(255,255,255,0.06);

  border-radius: 14px;

}

.tile-text {

  font-weight: 900;

  line-height: 1;

}

/* COLORS */

.tile-val-2 .tile-inner {
  background:
    linear-gradient(
      135deg,
      #ece4d9,
      #d9cdbc
    );
}

.tile-val-4 .tile-inner {
  background:
    linear-gradient(
      135deg,
      #f5d6a8,
      #e8c488
    );
}

.tile-val-8 .tile-inner {
  background:
    linear-gradient(
      135deg,
      #f2a65a,
      #e8893f
    );

  color: #fff;
}

.tile-val-16 .tile-inner {
  background:
    linear-gradient(
      135deg,
      #f09060,
      #d87848
    );

  color: #fff;
}

.tile-val-32 .tile-inner {
  background:
    linear-gradient(
      135deg,
      #f07050,
      #d05840
    );

  color: #fff;
}

.tile-val-64 .tile-inner {
  background:
    linear-gradient(
      135deg,
      #e84535,
      #c83025
    );

  color: #fff;
}

.tile-val-128 .tile-inner,
.tile-val-256 .tile-inner,
.tile-val-512 .tile-inner,
.tile-val-1024 .tile-inner,
.tile-val-2048 .tile-inner {

  background:
    linear-gradient(
      135deg,
      #ffd700,
      #e8c000
    );

  color: #fff;

}

/* SELECTION */

.tile-selected .tile-inner {

  transform: scale(1.04);

  border:
    2px solid rgba(255,215,0,.5);

  box-shadow:
    0 0 14px rgba(255,215,0,.4);

}

/* SVG */

.selection-svg {

  position: absolute;

  inset: 0;

  pointer-events: none;

}

.selection-path {

  stroke: url(#lineGrad);

  stroke-width: 4;

  fill: none;

  stroke-linecap: round;

  stroke-linejoin: round;

}

.selection-glow-layer {

  stroke:
    rgba(255,180,50,.35);

  stroke-width: 9;

  fill: none;

}

.selection-flow {

  stroke:
    rgba(255,255,255,.45);

  stroke-width: 2;

  fill: none;

  stroke-dasharray: 6 10;

}

.selection-tail {

  stroke:
    rgba(255,224,126,.9);

  stroke-width: 5;

  fill: none;

}

.selection-drag-head {

  fill: rgba(255,255,255,.9);

}

.selection-node {

  fill: #ffd700;

}

/* POPUP */

.popup-overlay {

  position: fixed;

  inset: 0;

  background: rgba(0,0,0,.6);

  backdrop-filter: blur(8px);

  display: flex;

  align-items: center;
  justify-content: center;

  z-index: 9999;

  padding: 20px;

}

.popup-card {

  width: 100%;

  max-width: 340px;

  padding: 28px;

  border-radius: 20px;

  background:
    linear-gradient(
      135deg,
      #1a1a3e,
      #2a1a4e
    );

  border:
    1px solid rgba(255,215,0,.2);

  text-align: center;

}

.popup-title {

  font-size: 24px;

  font-weight: 800;

  color: #ffd700;

}

.popup-sub {

  color:
    rgba(255,255,255,.8);

}

.popup-buttons {

  display: flex;

  flex-direction: column;

  gap: 8px;

}

.popup-btn {

  min-height: 46px;

  border-radius: 12px;

  border:
    1px solid rgba(255,215,0,.3);

  background:
    rgba(255,215,0,.12);

  color: #ffd700;

  font-weight: 700;

}

.popup-btn-support {

  border-color:
    rgba(255,100,100,.3);

  color: #ff8d8d;

}

/* FLOATING SCORE */

.floating-score-layer {

  position: fixed;

  inset: 0;

  pointer-events: none;

}

.floating-score {

  position: absolute;

  transform:
    translate(-50%, -50%);

  font-weight: 900;

  color: #fff;

  animation:
    floatScore .5s ease-out forwards;

}

@keyframes floatScore {

  from {
    opacity: 0;
    transform:
      translate(-50%, -20%);
  }

  to {
    opacity: 0;
    transform:
      translate(-50%, -120%);
  }

}

/* RESPONSIVE */

@media (max-height: 760px) {

  .hud-score {
    font-size: 30px;
  }

}

@media (max-width: 400px) {

  .board-row {
    gap: 7px;
    margin-bottom: 7px;
  }

  .board {
    padding: 6px;
  }

}
</style>
