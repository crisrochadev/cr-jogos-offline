const MAX_NUMBERS = 50;
const INITIAL_NUMBER = 1;
const COLORS_MAP = [
  "pink",
  "red",
  "blue",
  "green",
  "orange",
  "brown",
  "grey",
  "teal",
  "lime",
  "indigo",
];
export const NUMBERS_COLORS = mountColor();
export const POSSIBLE_NUMBERS = mountPossiblesNumbers([], INITIAL_NUMBER, 0);
export const INITIALS_VALUES = mountInitialValues();

export function removeReference(val) {
  return JSON.parse(JSON.stringify(val));
}
function mountColor() {
  let colors = [];
  for (let i = 2; i <= 6; i++) {
    COLORS_MAP.forEach((color, j) => {
      colors.push(`bg-${color}-${i}`);
    });
  }
  return colors;
}

function getFormatNumber(n) {
  if (n.toString().length >= 4 && n.toString().length < 5)
    return n.toString().substring(0, 1) + "K";
  if (n.toString().length >= 5 && n.toString().length < 6)
    return n.toString().substring(0, 2) + "K";
  if (n.toString().length >= 6 && n.toString().length < 7)
    return n.toString().substring(0, 3) + "K";

  if (n.toString().length >= 7 && n.toString().length < 8)
    return n.toString().substring(0, 1) + "M";
  if (n.toString().length >= 8 && n.toString().length < 9)
    return n.toString().substring(0, 2) + "M";
  if (n.toString().length >= 9 && n.toString().length < 10)
    return n.toString().substring(0, 3) + "M";

  if (n.toString().length >= 10 && n.toString().length < 11)
    return n.toString().substring(0, 1) + "B";
  if (n.toString().length >= 11 && n.toString().length < 12)
    return n.toString().substring(0, 2) + "B";
  if (n.toString().length >= 12 && n.toString().length < 13)
    return n.toString().substring(0, 3) + "B";

  if (n.toString().length >= 13 && n.toString().length < 14)
    return n.toString().substring(0, 1) + "T";
  if (n.toString().length >= 14 && n.toString().length < 15)
    return n.toString().substring(0, 2) + "T";
  if (n.toString().length >= 15 && n.toString().length < 16)
    return n.toString().substring(0, 3) + "T";

  if (n.toString().length >= 16 && n.toString().length < 17)
    return n.toString().substring(0, 1) + "Q";
  else return n.toString();
}
function mountPossiblesNumbers(nums, n, i) {
  let numbers = [...nums];
  let nextNum = n * 2;
  numbers.push({
    color: NUMBERS_COLORS[i],
    value: nextNum,
    abv: getFormatNumber(nextNum),
  });
  i++;
  if (numbers.length < MAX_NUMBERS) {
    numbers = mountPossiblesNumbers(numbers, nextNum, i);
  }
  return numbers;
}
function roundVal(min, max) {
  const index = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(index);
  return POSSIBLE_NUMBERS[index];
}
function mountInitialValues() {
  const board = [];

  for (let r = 0; r < 9; r++) {
    board.push([]);
    for (let c = 0; c < 5; c++) {
      const tile = roundVal(0, 5);
      board[r].push({
        id: `row-${r}-col-${c}`,
        ...tile,
      });
    }
  }

  return board;
}
