import { useState } from 'react';
import {
  TRIP_INFO, EXCHANGE, FLIGHTS,
  TODO_ITEMS, PREP_ITEMS, CheckItem,
} from '../data/mockData';

/* ── 匯率換算 ─────────────────────────────────────────── */
const QUICK_AMOUNTS = [500, 1000, 3000, 5000, 10000];

const ExchangeCard = () => {
  const [twd, setTwd] = useState(1000);
  const krw = Math.round(twd * EXCHANGE.rate).toLocaleString();

  return (
    <>
      <div className="flight-section-title">
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: 'var(--color-primary)' }}>
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        匯率換算
      </div>
      <div className="exchange-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex' }}>
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-main)' }}>{EXCHANGE.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-light)' }}>參考匯率</span>
        </div>
        <div className="exchange-card__inner">
          <div className="exchange-row">
            <span className="exchange-label">台幣 (TWD)</span>
            <input
              type="number"
              className="exchange-input"
              value={twd}
              onChange={e => setTwd(Number(e.target.value) || 0)}
            />
          </div>
          <div className="exchange-divider" />
          <div className="exchange-row">
            <span className="exchange-label">韓元 (KRW)</span>
            <span className="exchange-value">₩ {krw}</span>
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', padding: 6, borderRadius: '50%', border: '1px solid var(--color-border)' }}>
            <div style={{ background: 'var(--color-text-main)', color: 'white', padding: 6, borderRadius: '50%', display: 'flex' }}>
              <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
          </div>
        </div>

        {/* 快速換算按鍵 */}
        <div className="exchange-quick">
          {QUICK_AMOUNTS.map(amt => (
            <button
              key={amt}
              className={`exchange-quick__btn${twd === amt ? ' is-active' : ''}`}
              onClick={() => setTwd(amt)}
            >
              {amt >= 1000 ? `${amt / 1000}K` : amt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

/* ── 機票卡 ───────────────────────────────────────────── */
const AirplaneIcon = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: 'var(--color-primary)', fill: 'none', stroke: 'currentColor', strokeWidth: 2, transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5A3.54 3.54 0 0 0 15 3.5L11.5 7 3.2 5.2a.5.5 0 0 0-.5.3l-.9 1.7a.5.5 0 0 0 .1.6L9 12 6 15H3l-1 3 3-1v-3l3-3 3.6 6.1a.5.5 0 0 0 .6.1l1.7-.9a.5.5 0 0 0 .3-.5z" />
  </svg>
);

const FlightCards = () => (
  <>
    <div className="flight-section-title">
      <AirplaneIcon />
      機票資訊
    </div>
    {FLIGHTS.map((f, i) => (
      <div className="flight-card" key={f.flightNo} style={i === FLIGHTS.length - 1 ? { marginBottom: '1.25rem' } : {}}>
        <div className="flight-card__header">
          <span className={`flight-card__direction flight-card__direction--${f.direction}`}>{f.directionLabel}</span>
          <span className="flight-card__flight-no">{f.flightNo}</span>
        </div>
        <div className="flight-card__route">
          <div className="flight-card__airport">
            <div className="flight-card__iata">{f.from.iata}</div>
            <div className="flight-card__city">{f.from.city}</div>
            <div className="flight-card__time">{f.from.time}</div>
          </div>
          <div className="flight-card__middle">
            <div className="flight-card__duration">{f.duration}</div>
            <div className="flight-card__line">
              <div className="flight-card__line-bar" />
              <AirplaneIcon flip={f.flip} />
              <div className="flight-card__line-bar" />
            </div>
          </div>
          <div className="flight-card__airport flight-card__airport--right">
            <div className="flight-card__iata">{f.to.iata}</div>
            <div className="flight-card__city">{f.to.city}</div>
            <div className="flight-card__time">{f.to.time}</div>
          </div>
        </div>
      </div>
    ))}
  </>
);

/* ── 待辦 / 事前準備 ──────────────────────────────────── */
const ChecklistItem = ({ item }: { item: CheckItem }) => (
  <div className={`checklist-item${item.done ? ' checklist-item--done' : ''}`}>
    <div className={`checklist-box${item.done ? ' checklist-box--checked' : ''}`}>
      {item.done && (
        <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, color: 'white', strokeWidth: 3 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
    <div>
      <div className="checklist-item__text">{item.text}</div>
      {item.sub && <div className="checklist-item__sub">{item.sub}</div>}
    </div>
  </div>
);

const SubTabs = () => {
  const [tab, setTab] = useState<'todo' | 'prep'>('todo');
  return (
    <>
      <div className="home-subtabs">
        <button
          className={`home-subtab-label home-subtab-label--todo${tab === 'todo' ? ' is-active' : ''}`}
          onClick={() => setTab('todo')}
        >
          <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          待辦事項
        </button>
        <button
          className={`home-subtab-label home-subtab-label--prep${tab === 'prep' ? ' is-active' : ''}`}
          onClick={() => setTab('prep')}
        >
          <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          事前準備
        </button>
      </div>
      <div className="home-subviews">
        <div className="home-subview home-subview--todo" style={{ display: tab === 'todo' ? 'block' : 'none' }}>
          <div className="card">
            {TODO_ITEMS.map((item, i) => <ChecklistItem key={i} item={item} />)}
          </div>
        </div>
        <div className="home-subview home-subview--prep" style={{ display: tab === 'prep' ? 'block' : 'none' }}>
          <div className="card">
            {PREP_ITEMS.map((item, i) => <ChecklistItem key={i} item={item} />)}
          </div>
        </div>
      </div>
    </>
  );
};

/* ── 首頁 ─────────────────────────────────────────────── */
const HomePage = () => (
  <>
    <div className="page-trip-header">
      <div className="page-trip-header__title">{TRIP_INFO.title}</div>
      <div className="page-trip-header__date">
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {TRIP_INFO.dateRange}
      </div>
    </div>

    <div className="section-px">
      <ExchangeCard />
      <FlightCards />
      <SubTabs />
    </div>
  </>
);

export default HomePage;
