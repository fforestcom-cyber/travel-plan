// ── 行程 ──────────────────────────────────────────────
export interface Trip {
  id: string;
  title: string;
  city: string;
  region: string;
  startDate: string;   // ISO "YYYY-MM-DD"
  endDate: string;
  status: 'planned' | 'ongoing' | 'completed';
  coverImage?: string;
  notes?: string;
  currency: string;    // e.g. "KRW"
}

// ── 景點 ──────────────────────────────────────────────
export type SpotCategory =
  | 'food'
  | 'attraction'
  | 'shopping'
  | 'transport'
  | 'accommodation';

export interface Spot {
  id: string;
  tripId: string;
  name: string;
  category: SpotCategory;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;     // 1–5
  notes?: string;
  images?: string[];   // base64 或 URL
}

// ── 交通路線 ──────────────────────────────────────────
export type TransportType = 'metro' | 'taxi' | 'bus' | 'walk';

export interface TransportStep {
  order: number;
  type: TransportType | 'transfer';
  instruction: string;
  line?: string;       // e.g. "2號線"
  lineColor?: string;  // e.g. "#00A650"
  duration?: number;   // 分鐘
}

export interface TransportRoute {
  id: string;
  spotId: string;
  type: TransportType;
  from: string;
  to: string;
  steps: TransportStep[];
  duration: number;    // 總分鐘數
  fare?: string;       // e.g. "₩1,400"
}

// ── 匯率 ──────────────────────────────────────────────
export interface CurrencyRate {
  code: string;        // e.g. "KRW"
  name: string;        // e.g. "韓元"
  symbol: string;      // e.g. "₩"
  rate: number;        // relative to USD
}
