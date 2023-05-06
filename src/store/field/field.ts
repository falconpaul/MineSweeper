import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";

export type CellType =
  | "unknown"
  | "flag"
  | "qm"
  | "qma"
  | "mine"
  | "bang"
  | "wrong"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8";

export enum SmileType {
  default,
  pressed,
  shoked,
  win,
  lose,
}

export type Difficulty = {
  width: number;
  height: number;
  minesCount: number;
};

const genFrontMatrix = (
  width: number,
  height: number,
  fill: CellType = "unknown"
) => {
  const matrix = Array(height);
  for (let i = 0; i < height; i++) {
    matrix[i] = Array(width).fill(fill);
  }
  return matrix;
};

const shuffleArray = (a: any[]) => {
  for (let i = a.length - 1; i >= 1; i--) {
    const random = Math.floor(Math.random() * i);
    [a[i], a[random]] = [a[random], a[i]];
  }
  return a;
};

const aroundOffsets = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const genBackMatrix = (
  width: number,
  height: number,
  minesCount: number,
  [excludeY, excludeX]: number[]
) => {
  const list = Array(width * height - 1);
  list.fill("mine", 0, minesCount);
  list.fill("0", minesCount);
  shuffleArray(list);
  list.splice(excludeY * width + excludeX, 0, "0");
  const matrix = Array(height);
  for (let i = 0; i < height; i++) {
    matrix[i] = list.slice(i * width, (i + 1) * width);
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix[y][x] === "mine") continue;
      let minesAround = 0;
      for (const [dy, dx] of aroundOffsets) {
        const ay = y + dy;
        const ax = x + dx;
        if (
          ay >= 0 &&
          ay < height &&
          ax >= 0 &&
          ax < width &&
          matrix[ay][ax] === "mine"
        ) {
          minesAround++;
        }
      }
      matrix[y][x] = `${minesAround}`;
    }
  }
  return matrix as CellType[][];
};

const openFieldCell = (state: FieldState, y: number, x: number) => {
  if (!["unknown", "qm"].includes(state.frontField[y][x])) return;
  state.frontField[y][x] = state.backField[y][x];
  state.closedCellCount--;
  if (state.backField[y][x] === "0") {
    for (const [dy, dx] of aroundOffsets) {
      const ay = y + dy;
      const ax = x + dx;
      if (
        ay >= 0 &&
        ay < state.difficulty.height &&
        ax >= 0 &&
        ax < state.difficulty.width &&
        ["unknown", "qm"].includes(state.frontField[ay][ax])
      ) {
        openFieldCell(state, ay, ax);
      }
    }
  }
};

interface FieldState {
  frontField: CellType[][];
  backField: CellType[][];
  smileType: SmileType;
  isSmileClicked: boolean;
  isLost: boolean;
  isWin: boolean;
  timerStartedAt: number;
  currentTime: number;
  closedCellCount: number;
  difficulty: {
    width: number;
    height: number;
    minesCount: number;
  };
}

const initialState: FieldState = {
  smileType: SmileType.default,
  isSmileClicked: false,
  frontField: genFrontMatrix(16, 16),
  backField: [],
  isLost: false,
  isWin: false,
  timerStartedAt: 0,
  currentTime: 0,
  closedCellCount: 8 * 8,
  difficulty: {
    width: 16,
    height: 16,
    minesCount: 40,
  },
};

const fieldSlice = createSlice({
  name: "field",
  initialState,
  reducers: {
    setSmileType: (state, action: PayloadAction<SmileType>) => {
      let newSmileType = action.payload;
      if (state.isLost) {
        if (newSmileType === SmileType.default) {
          newSmileType = SmileType.lose;
        } else if (newSmileType !== SmileType.pressed) {
          newSmileType = SmileType.lose;
        }
      } else if (state.isWin) {
        if (newSmileType === SmileType.default) {
          newSmileType = SmileType.win;
        } else if (newSmileType !== SmileType.pressed) {
          newSmileType = SmileType.win;
        }
      }
      state.smileType = newSmileType;
    },
    setIsSmileClicked: (state, action: PayloadAction<boolean>) => {
      state.isSmileClicked = action.payload;
    },
    onSmileClick: (state) => {
      if (state.isSmileClicked) {
        state.frontField = genFrontMatrix(
          state.difficulty.width,
          state.difficulty.height
        );
        state.backField = [];
        state.isLost = false;
        state.isWin = false;
        state.smileType = SmileType.default;
        state.difficulty.minesCount = state.difficulty.minesCount;
        state.timerStartedAt = 0;
        state.currentTime = 0;
      }
    },
    markCell: (state, action: PayloadAction<number[]>) => {
      if (state.isLost) return;
      const [y, x] = action.payload;
      const row = state.frontField[y];
      if (row[x] === "unknown" && state.difficulty.minesCount > 0) {
        state.difficulty.minesCount--
        row[x] = "flag";
      } else if (row[x] === "flag") {
        row[x] = "qm";
        state.difficulty.minesCount++
      } else if (row[x] === "qm") {
        row[x] = "unknown";
      }
    },
    openCell: (state, action: PayloadAction<number[]>) => {
      const { width, height, minesCount } = state.difficulty;
      if (state.isLost || state.isWin) return;
      const [y, x] = action.payload;
      if (state.frontField[y][x] === "flag") return;
      if (state.backField.length === 0) {
        state.backField = genBackMatrix(width, height, minesCount, [y, x]);
        state.timerStartedAt = state.currentTime = +new Date();
      }
      if (state.backField[y][x] === "mine") {
        state.isLost = true;
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (state.backField[i][j] === "mine") {
              if (state.frontField[i][j] !== "flag") {
                state.frontField[i][j] = "mine";
              }
            } else if (state.frontField[i][j] === "flag") {
              state.frontField[i][j] = "wrong";
            }
          }
        }
        state.smileType = SmileType.lose;
        state.frontField[y][x] = "bang";
      } else {
        openFieldCell(state, y, x);
      }
      if (state.closedCellCount === minesCount) {
        state.isWin = true;
        state.smileType = SmileType.win;
      }
    },
    updateTimer: (state) => {
      state.currentTime = +new Date();
    },
    changeDifficulty: (state, action: PayloadAction<Difficulty>) => {
      state.difficulty = action.payload
      state.frontField = genFrontMatrix(
        action.payload.width,
        action.payload.height
      );
      state.backField = [];
      state.isLost = false;
      state.isWin = false;
      state.smileType = SmileType.default;
      state.difficulty.minesCount = action.payload.minesCount;
      state.timerStartedAt = 0;
      state.currentTime = 0;
    },
  },
});

export const selectSmileType = (state: RootState) => state.field.smileType;

export const selectIsSmileClicked = (state: RootState) =>
  state.field.isSmileClicked;

export const selectFrontField = (state: RootState) => state.field.frontField;

export const selectTimerStarted = (state: RootState) =>
  state.field.timerStartedAt > 0;

export const selectIsGameOver = (state: RootState) =>
  state.field.isLost || state.field.isWin;

export const selectMinesCount = (state: RootState) =>
  state.field.difficulty.minesCount;

export const selectTimerSeconds = (state: RootState) =>
  Math.floor((state.field.currentTime - state.field.timerStartedAt) / 1000);

export const {
  setSmileType,
  setIsSmileClicked,
  onSmileClick,
  openCell,
  markCell,
  updateTimer,
  changeDifficulty,
} = fieldSlice.actions;

export default fieldSlice.reducer;
