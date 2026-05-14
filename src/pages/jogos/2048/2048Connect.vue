<template>
  <q-page
    class="bg-purple-10 flex justify-center"
    style="width: 100%; height: 100vh"
  >
    <div
      class="full-width full-hright"
      style="max-width: 400px; margin: 0 auto"
    >
      <div
        class="flex full-width q-pt-sm q-px-sm"
        style="
          height: 50px;
          align-items: center;
          justify-content: space-between;
        "
      >
        <q-btn
          icon="arrow_back"
          dense
          size="md"
          color="purple-2"
          round
          style="width: 20px; height: 20px"
        />

        <div
          class="col-5 bg-purple-9 row q-ml-md"
          dense
          style="
            position: relative;
            justify-content: space-between;
            align-items: center;
            height: 30px;
          "
        >
          <q-icon
            name="diamond"
            color="purple-1"
            size="sm"
            style="position: absolute; left: -10px"
          />

          <div
            class="text-purple-3 q-mx-sm text-weight-bolder text-center"
            style="flex: 1"
          >
            1259852111
          </div>

          <q-btn icon="add" dense unelevated color="purple-3" size="xs" />
        </div>
        <div
          class="col-4 bg-purple-9 row q-ml-md"
          dense
          style="
            position: relative;
            justify-content: space-between;
            align-items: center;
            height: 30px;
          "
        >
          <q-icon
            name="score"
            color="purple-1"
            size="sm"
            style="position: absolute; left: -10px"
          />

          <div
            class="text-purple-3 q-mx-sm text-weight-bolder text-center"
            style="flex: 1"
          >
            1259852111
          </div>

          <q-btn
            icon="change_circle"
            dense
            unelevated
            color="purple-3"
            size="xs"
          />
        </div>
        <q-btn
          icon="autorenew"
          color="purple-8"
          round
          dense
          style="width: 20px; height: 20px"
        />
      </div>
      <div class="flex full-width items-center" style="height: 40px">
        <div
          class=" text-weight-bolder text-center q-py-xs text-h4 text-pink-6" style="width:50%"
        >
          {{ totalSum.value }}
          <!-- <div>888888</div> -->
        </div>
        <div
          class="flex justify-between q-mt-sm"
          style="gap: 10px; width:50%"
        >
          <div
            class="text-weight-bolder text-center text-orange-8"
            style="height: 15px; font-size: 18px"
          >
            {{ POSSIBLE_NUMBERS[0].abv }}
          </div>
          <q-linear-progress
            :value="winRate"
            class="bg-purple-7"
            :buffer="buffer"
            size="20px"
            style="flex: 1"
            rounded
          >
            <div
              class="absolute-center flex flex-center text-white bg-purple-9 q-px-sm q-py-sm"
              style="
                font-weight: 900;
                border-radius: 5px;
                text-shadow: 0 4px 4px 4px rgba(0, 0, 0, 0.25);
                width: auto;
              "
            >
              {{ currentWin }}
            </div>
          </q-linear-progress>
          <div
            class="text-weight-bolder text-center text-orange-8"
            style="height: 15px; font-size: 18px"
          >
            {{ POSSIBLE_NUMBERS[POSSIBLE_NUMBERS.length - 1].abv }}
          </div>
        </div>
      </div>
      <div
        style="
          height: calc(100vh - 300px) px;
          grid-template-rows: repeat(9, 1fr);
          display: grid;
          grid-template-rows: repeat(9, 1fr);
          grid-template-columns: 1fr;
        "
        @pointerdown="startTouch"
        @pointermove="moveTouch"
        @pointerup="endTouch"
        class="full-width justify-center q-py-md q-px-md game-board"
      >
        <div
          v-if="showScore"
          style="
            position: absolute;
            z-index: 9999;
            font-size: 30px;
            font-weight: 900;
            transition: all 0.5s;
          "
          :style="positionScore"
          class="text-white"
        >
          +{{ total && total.value }}
        </div>
        <div
          v-for="row in board"
          :key="row"
          style="
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
          "
          class="justify-center full-width"
        >
          <div
            v-for="col in row.filter(Boolean)"
            :key="col.id"
            :id="col.id"
            class="flex justify-center tile text-pink-9 text-weight-bolder"
            :class="col.color"
            :style="{
              borderStyle: 'solid',
              borderWidth: '5px',
              borderColor: active(col) ? 'white' : 'transparent',
            }"
          >
            {{ col.value }}
            <div
              class="line bg-white"
              v-if="col.merged"
              :style="col.mergeStyle"
            ></div>
          </div>
        </div>
      </div>
      <div
        class="flex full-width q-pb-lg q-px-sm"
        style="
          height: 50px;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
        "
      >
        <q-btn
          color="purple-7"
          icon="volunteer_activism"
          label="Contibuir"
          size="md"
        />
        <div class="flex items-center justify-center" style="gap: 10px">
          <q-btn icon="cleaning_services" color="cyan-8" />
          <q-btn icon="gavel" color="brown-8" />
          <q-btn icon="swap_horiz" color="green-8" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from "vue";
import {
  INITIALS_VALUES,
  POSSIBLE_NUMBERS,
  removeReference,
} from "./game-util";
import { useStorage } from "@vueuse/core";

const board = useStorage('board', INITIALS_VALUES);
let isMove = false;
const tileMoved = ref(null);
const positionScore = ref({});
const current = ref(null);
const old = ref(null);
const selectedes = ref([]);
const selectedesToSum = ref([]);
const total = ref(0);
const showScore = ref(false);
const buffer = ref(0.01);

const currentWin = computed(() => {
  const flatBoard = board.value.flat();
  return Math.max(...flatBoard.map((n) => n.value));
});
const nextWin = ref(
  POSSIBLE_NUMBERS.find((n) => n.value > currentWin.value)?.value,
);
const maxPossible = ref(Math.max(...POSSIBLE_NUMBERS.map((n) => n.value)));
const winRate = computed(() => {
  const positionMaxWin = POSSIBLE_NUMBERS.findIndex(
    (pn) => pn.value === currentWin.value,
  );
  const positionPossibleMax = POSSIBLE_NUMBERS.length - 1;

  const rate = positionMaxWin / positionPossibleMax;
  return parseFloat(rate.toFixed(2));
});

const totalSum = useStorage('totalSum', { value: 0 });
function startTouch(e) {
  // console.log("start");
  isMove = true;
  const element = document.elementFromPoint(e.clientX, e.clientY);

  if (!element?.classList.contains("tile")) return;

  const { tile } = getTile(element.id);
  selectedesToSum.value.push(removeReference(tile));
  old.value = removeReference(tile);
}

function getTile(id) {
  let row = null;
  let col = null;
  let tile = null;
  board.value.filter((line, r) => {
    // console.log(line);
    let index = line.findIndex((c) => c && c.id === id);
    if (index >= 0 && col === null) {
      row = r;
      col = index;
      tile = line[index];
    }
  });

  return { row, col, tile };
}
function getNeighbors(row, col) {
  const neigh = {};

  const positions = [
    { r: -1, c: 0, position: "top" },
    { r: -1, c: -1, position: "top-left" },
    { r: -1, c: 1, position: "top-right" },

    { r: 0, c: -1, position: "left" },
    { r: 0, c: 1, position: "right" },

    { r: 1, c: 0, position: "bottom" },
    { r: 1, c: -1, position: "bottom-left" },
    { r: 1, c: 1, position: "bottom-right" },
  ];

  for (const item of positions) {
    const tile = board.value[row + item.r]?.[col + item.c];

    if (tile) {
      neigh[tile.id] = {
        tile,
        position: item.position,
      };
    }
  }

  return neigh;
}

function getNextNumber(val) {
  return POSSIBLE_NUMBERS.find((pn) => pn.value > val);
}

function checkNeighborsValues() {
  let isValid = false;

  if (old.value) {
    const { row, col, tile } = getTile(old.value.id);
    let neighbors = getNeighbors(row, col);

    // //Verifica se é visinho
    const currentTile = neighbors[current.value.id]?.tile ?? null;
    if (currentTile) {
      console.log(getNextNumber(old.value.value));
      const allEquals = selectedesToSum.value.every(
        (s) => s.value === old.value.value,
      );
      const isEqualTile = currentTile.value === old.value.value;
      const isEqualNext =
        currentTile.value === getNextNumber(old.value.value)?.value;
      const currentIndex = selectedesToSum.value.findIndex(
        (s) => s.id === currentTile.id,
      );

      const haveMoreOne = selectedesToSum.value.length > 1;

      const oldIndex = selectedesToSum.value.findIndex(
        (s) => s.id === old.value.id,
      );
      const penultimate =
        oldIndex >= 1 ? selectedesToSum.value[oldIndex - 1] : null;
      const lastsIsEquals =
        penultimate && penultimate.value === old.value.value;
      // console.log("OLD INDEX : ", oldIndex)
      // console.log("PENULTIMO : ", penultimate)
      // console.log("OS ANTERIORES SAO IGUAIS : ", lastsIsEquals)
      // console.log("valor tile => ", currentTile ? currentTile.value : null);
      // console.log("valor Old => ", old.value ? old.value.value : null);
      // console.log("São iguais => ", isEqualTile);
      // console.log("É igual ao proximo => ", isEqualNext);
      // console.log("Tem mais que um => ", haveMoreOne);

      isValid =
        isEqualTile ||
        (currentTile &&
          haveMoreOne &&
          isEqualNext &&
          lastsIsEquals &&
          allEquals);
    }
  }
  return isValid;
}

function addOrRemoveToSum(isValid) {
  console.log(isValid);

  if (!current.value) return;
  const index = selectedesToSum.value.findIndex(
    (s) => s.id === current.value.id,
  );

  // não existe -> adiciona
  if (index === -1 && isValid) {
    selectedesToSum.value.push(current.value);
    changeLinesMerge();
    return;
  }

  const lastIndex = selectedesToSum.value.length - 1;

  const penultimateIndex = selectedesToSum.value.length - 2;

  // só remove se for o penúltimO

  if (index === penultimateIndex) {
    selectedesToSum.value.splice(lastIndex, 1);

    removeMerge(current.value);

    // atualiza old para o novo último
    old.value = selectedesToSum.value[selectedesToSum.value.length - 1]
      ? removeReference(selectedesToSum.value[selectedesToSum.value.length - 1])
      : null;

    return;
  }
}

function removeMerge(c) {
  if (!c) return;

  const result = getTile(c.id);

  if (!result?.tile) return;

  result.tile.merged = false;
  result.tile.mergeStyle = null;
}
function changeLinesMerge() {
  if (selectedesToSum.value.length > 0 && old.value) {
    const { row, col, tile } = getTile(old.value.id);
    let neighbors = getNeighbors(row, col);
    const currentTile = neighbors[current.value.id];
    tile["merged"] = true;
    if (currentTile && currentTile.position === "bottom") {
      tile["mergeStyle"] = {
        width: "5px",
        height: "10px",
        left: "calc(50% - 2.5px)",
        bottom: "-15px",
      };
    }
    if (currentTile && currentTile.position === "top") {
      tile["mergeStyle"] = {
        width: "5px",
        height: "10px",
        left: "calc(50% - 2.5px)",
        top: "-15px",
      };
    }
    if (currentTile && currentTile.position === "left") {
      tile["mergeStyle"] = {
        width: "10px",
        height: "5px",
        left: "-15px",
        top: "calc(50% - 2.5px)",
      };
    }
    if (currentTile && currentTile.position === "right") {
      tile["mergeStyle"] = {
        width: "10px",
        height: "5px",
        right: "-15px",
        top: "calc(50% - 2.5px)",
      };
    }
    if (currentTile && currentTile.position === "top-right") {
      tile["mergeStyle"] = {
        width: "20px",
        height: "5px",
        right: "-20px",
        top: "-12px",
        transform: "rotate(-45deg)",
      };
    }
    if (currentTile && currentTile.position === "top-left") {
      tile["mergeStyle"] = {
        width: "20px",
        height: "5px",
        left: "-20px",
        top: "-12px",
        transform: "rotate(45deg)",
      };
    }
    if (currentTile && currentTile.position === "bottom-left") {
      tile["mergeStyle"] = {
        width: "20px",
        height: "5px",
        left: "-20px",
        bottom: "-12px",
        transform: "rotate(-45deg)",
      };
    }
    if (currentTile && currentTile.position === "bottom-right") {
      tile["mergeStyle"] = {
        width: "20px",
        height: "5px",
        right: "-20px",
        bottom: "-12px",
        transform: "rotate(45deg)",
      };
    }
  }
}

function sumValues() {
  const total = selectedesToSum.value.reduce(
    (acc, item) => acc + item.value,
    0,
  );

  // tenta encontrar exato
  let result = POSSIBLE_NUMBERS.find((pn) => pn.value === total);

  // se não existir pega o próximo maior
  if (!result) {
    result = POSSIBLE_NUMBERS.find((pn) => pn.value > total);
  }

  return result;
}
function moveTouch(e) {
  if (!isMove) return;

  const element = document.elementFromPoint(e.clientX, e.clientY);

  if (!element?.classList.contains("tile")) return;

  const { tile } = getTile(element.id);

  if (!tile) return;

  // evita repetir mesmo tile
  if (current.value && current.value.id === tile.id) {
    return;
  }

  current.value = removeReference(tile);

  const isValid = checkNeighborsValues();

  addOrRemoveToSum(isValid, tile);
  if (isValid) {
    if (tile && (!old.value || old.value.id !== tile.id)) {
      old.value = removeReference(tile);
    }
  }

  total.value = sumValues();
}

function showScoreValue(e) {
  old.value = null;
  positionScore.value = {
    left: e.clientX + "px",
    top: e.clientY + "px",
  };
  showScore.value = true;
  setTimeout(() => {
    positionScore.value.top = "50px";
    positionScore.value.left = "50%";
    positionScore.value["transform"] = "translateX(-50%)";
    setTimeout(() => {
      showScore.value = false;
      totalSum.value.value += total.value.value;
      totalSum.value.color = total.value.color;
    }, 500);
  }, 100);
}
function endTouch(e) {
  isMove = false;

  mergeTiles();

  selectedesToSum.value.forEach((s) => {
    removeMerge(s);
  });

  selectedesToSum.value = [];

  current.value = null;
  if (total.value.value > 2) showScoreValue(e);
}
function createRandomTile(row, col) {
  const max = 5;

  const tile = POSSIBLE_NUMBERS[Math.floor(Math.random() * max)];

  return {
    id: `row-${row}-col-${col}-${Date.now()}-${Math.random()}`,
    ...removeReference(tile),
    merged: false,
    mergeStyle: null,
  };
}
function applyGravity() {
  const rows = board.value.length;
  const cols = board.value[0].length;

  for (let c = 0; c < cols; c++) {
    let column = [];

    // pega tiles válidos
    for (let r = 0; r < rows; r++) {
      const tile = board.value[r][c];

      if (tile) {
        column.push(removeReference(tile));
      }
    }

    // completa topo
    while (column.length < rows) {
      column.unshift(createRandomTile(0, c));
    }

    // recoloca coluna
    for (let r = 0; r < rows; r++) {
      board.value[r][c] = column[r]
        ? {
            ...removeReference(column[r]),
            id: `row-${r}-col-${c}`,
          }
        : null;
    }
  }
}
function mergeTiles() {
  const allSame = selectedesToSum.value.every(
    (s) => s.value === selectedesToSum.value[0].value,
  );
  if (selectedesToSum.value.length <= 1 || !allSame) {
    return;
  }

  const last = selectedesToSum.value[selectedesToSum.value.length - 1];

  // SALVA posição antes
  const { row: lastRow, col: lastCol } = getTile(last.id);

  if (lastRow === null || lastCol === null) {
    return;
  }

  const totalTile = sumValues();

  // remove todos
  selectedesToSum.value.forEach((s) => {
    const { row, col } = getTile(s.id);

    if (row !== null && col !== null) {
      board.value[row][col] = null;
    }
  });

  // coloca resultado
  board.value[lastRow][lastCol] = {
    id: last.id,
    ...removeReference(totalTile),
    merged: false,
    mergeStyle: null,
  };

  applyGravity();
}
function active(tile) {
  if (!tile) return false;

  return selectedesToSum.value.some((s) => s.id === tile.id);
}
</script>

<style scoped>
.game-board {
  touch-action: none;
  overscroll-behavior: none;
}
.tile {
  margin: 5px 0;
  border-radius: 5px;
  box-shadow: 0 4px 4px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  font-size: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.85;
  user-select: none;
  position: relative;
}
.tile:hover {
  opacity: 1;
}
.line {
  position: absolute;
}
</style>
