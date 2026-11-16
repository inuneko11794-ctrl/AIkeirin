import { defaultModel } from "./engine";
import { emptyLedger, normalizeLedger, type Ledger } from "./points";
import type { AiModel, Race } from "./types";

const KEY = "keirin-quadrivium-v1";

export type SavedState = {
  races: Race[];
  model: AiModel;
  index: number;
  ledger: Ledger;
};

export function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { races: [], model: defaultModel(), index: 0, ledger: emptyLedger() };
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    return {
      races: Array.isArray(parsed.races) ? parsed.races : [],
      model: parsed.model?.weights?.length === 5 ? parsed.model : defaultModel(),
      index: Number.isFinite(parsed.index) ? parsed.index ?? 0 : 0,
      ledger: normalizeLedger(parsed.ledger),
    };
  } catch {
    return { races: [], model: defaultModel(), index: 0, ledger: emptyLedger() };
  }
}

export function saveState(state: SavedState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}