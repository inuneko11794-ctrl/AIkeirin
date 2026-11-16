export type Entry = {
  car: number;
  name: string;
  rawMark: string;
};

export type Race = {
  id: string;
  rawFormation: string;
  lines: string[][];
  resultOrder: string;
  payout: number | null;
  winPayout?: number | null;
  exactaPayout?: number | null;
  entries: Entry[];
  girls: boolean;
  heldOn?: string;
};

export type Member = {
  car: number;
  name: string;
  rawMark: string;
  convertedMark: string;
};

export type LineSummary = {
  label: string;
  isTanki: boolean;
  members: Member[];
};

export type Analysis = {
  entries: Array<Entry & { mark: string; lineLabel: string; isTanki: boolean; weight: number }>;
  lineSummaryList: LineSummary[];
  dissonance: number;
  chaosIndex: number;
  raceDna: string;
  coupScore: number;
  abandonScore: number;
  dramaDetails: string[];
  gravityBias: number;
  gravity: { x: number; y: number };
};

export type AiModel = { weights: number[]; bias: number };
