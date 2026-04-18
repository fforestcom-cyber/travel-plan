/* ═══════════════════════════════════════════════════════
   靜態假資料
   ═══════════════════════════════════════════════════════ */

// ── 行程基本資訊 ────────────────────────────────────────
export const TRIP_INFO = {
  title:     '韓國釜山自由行 5天4夜',
  dateRange: '2026/06/10 - 2026/06/14',
  start:     '2026-06-10',
  end:       '2026-06-14',
};

// ── 匯率 ────────────────────────────────────────────────
export const EXCHANGE = {
  label: '1 TWD ≈ 41.5 KRW',
  rate:  41.5,
};

// ── 機票 ────────────────────────────────────────────────
export const FLIGHTS = [
  {
    direction: 'dep' as const,
    directionLabel: '去程',
    flightNo: 'BR 159 · 2026/06/10',
    from: { iata: 'TPE', city: '台北桃園', time: '13:15' },
    to:   { iata: 'PUS', city: '釜山金海', time: '15:50' },
    duration: '2h 35m',
    flip: false,
  },
  {
    direction: 'arr' as const,
    directionLabel: '回程',
    flightNo: 'BR 160 · 2026/06/14',
    from: { iata: 'PUS', city: '釜山金海', time: '16:30' },
    to:   { iata: 'TPE', city: '台北桃園', time: '18:50' },
    duration: '2h 20m',
    flip: true,
  },
];

// ── 待辦事項 ─────────────────────────────────────────────
export interface CheckItem { text: string; sub?: string; done: boolean; }

export const TODO_ITEMS: CheckItem[] = [
  { text: '訂購來回機票',        sub: 'BR 159 / BR 160 · 已確認',    done: true  },
  { text: '預訂住宿',            sub: 'Urbanstay Seomyeon · 已確認', done: true  },
  { text: '申辦海外網路卡 / SIM', sub: '建議選擇韓國 10 日方案',       done: false },
  { text: '換匯韓元',            sub: '建議備妥 ₩200,000 現金',       done: false },
  { text: '填寫出入境 Q-Code',    sub: '出發前 48 小時內填寫',        done: false },
  { text: '下載 Naver Map 離線地圖', sub: '釜山市區範圍',             done: false },
];

export const PREP_ITEMS: CheckItem[] = [
  { text: '護照（效期 6 個月以上）',   done: true  },
  { text: '信用卡 / 金融卡',   sub: '建議帶 Visa 國際卡',            done: true  },
  { text: '220V 轉接頭（韓規雙圓孔）', done: false },
  { text: '行動電源',          sub: '不可托運，須放隨身行李',          done: false },
  { text: '防曬 / 雨傘',       sub: '6月釜山偶有陣雨',               done: false },
  { text: '常備藥品',          sub: '胃藥、感冒藥、OK 繃',           done: false },
];

// ── 天氣資料 ─────────────────────────────────────────────
export type WeatherType = 'sunny' | 'partlysunny' | 'cloudy' | 'rainy' | 'heavyrain';

export interface DayWeather {
  day: string; date: number; type: WeatherType;
  temp: string; range: string; desc: string; rain: string; outfit: string;
}

export const WEATHER_DAYS: DayWeather[] = [
  { day: '週三', date: 10, type: 'sunny',       temp: '32°', range: '/ 26°C', desc: '晴時多雲，部分地區有午後陣雨', rain: '降雨 15%', outfit: '短袖＋薄外套'   },
  { day: '週四', date: 11, type: 'partlysunny', temp: '29°', range: '/ 23°C', desc: '晴時多雲，午後偶有陣雨',       rain: '降雨 35%', outfit: '短袖＋薄外套'   },
  { day: '週五', date: 12, type: 'cloudy',      temp: '25°', range: '/ 20°C', desc: '多雲，偶有雲層遮蔽陽光',       rain: '降雨 20%', outfit: '長袖薄外套'     },
  { day: '週六', date: 13, type: 'rainy',       temp: '22°', range: '/ 18°C', desc: '有雨，出門記得帶傘',           rain: '降雨 80%', outfit: '雨衣＋防水鞋'   },
  { day: '週日', date: 14, type: 'heavyrain',   temp: '20°', range: '/ 16°C', desc: '大雨特報，避免戶外活動',       rain: '降雨 95%', outfit: '全套雨具必備'   },
];
