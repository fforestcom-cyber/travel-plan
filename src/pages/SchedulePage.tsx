import { useState } from 'react';
import WeatherCard from '../components/home/WeatherCard';
import {
  TRIP_INFO, SCHEDULE_EVENTS, ScheduleEvent,
  TagItem,
} from '../data/mockData';

/* ── 小元件 ───────────────────────────────────────────── */
const PinIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const InfoIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color, flexShrink: 0, marginTop: 2 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ForkIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const TagGroup = ({ tags }: { tags: TagItem[] }) => (
  <div className="tag-group">
    {tags.map((t, i) => {
      if (t.type === 'time') return (
        <span key={i} className="tag tag--time">
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {t.label}
        </span>
      );
      if (t.type === 'naver') return (
        <span key={i} className="tag tag--naver">
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          </svg>
          {t.label}
        </span>
      );
      return (
        <span key={i} className="tag tag--google">
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          {t.label}
        </span>
      );
    })}
  </div>
);

/* ── 交通切換 tab（useState 取代 CSS radio） ─────────────── */
const TransitTabs = ({ subway, taxi }: { subway: string; taxi: string }) => {
  const [active, setActive] = useState<'subway' | 'taxi'>('subway');
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div className="transit-tabs">
        <button
          className={`transit-label${active === 'subway' ? ' is-active' : ''}`}
          onClick={() => setActive('subway')}
        >
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <rect x="4" y="3" width="16" height="16" rx="2" />
            <path d="M4 11h16" /><path d="M12 3v8" />
            <path d="M8 19l-2 3" /><path d="M16 19l2 3" />
          </svg>
          大眾運輸
        </button>
        <button
          className={`transit-label${active === 'taxi' ? ' is-active' : ''}`}
          onClick={() => setActive('taxi')}
        >
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
          </svg>
          計程車
        </button>
      </div>
      <div className="transit-content">
        {active === 'subway' ? subway : taxi}
      </div>
    </div>
  );
};

/* ── EventCard（details/summary → useState） ─────────────── */
const EventCard = ({ ev }: { ev: ScheduleEvent }) => {
  const [open, setOpen] = useState(false);
  const { detail: d } = ev;

  return (
    <div className={`event-card${open ? ' is-open' : ''}`}>
      {/* summary 行 */}
      <div className="event-card__summary" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <div className="event-card__thumbnail">
          <div className="event-card__thumb-icon">
            <svg viewBox="0 0 24 24" style={{ width: 32, height: 32 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <span className="event-card__time-badge">{ev.time}</span>
        </div>
        <div className="event-card__content">
          <div className="event-card__title-row">
            <h3 className="event-card__title">{ev.title}</h3>
            <svg viewBox="0 0 24 24" className="chevron-icon" style={{ width: 18, height: 18 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="event-card__location">
            <PinIcon />{ev.location}
          </div>
          <div className="event-card__tags">
            <span className="badge">{ev.badge}</span>
          </div>
        </div>
      </div>

      {/* 展開詳情 */}
      {open && (
        <div className="event-card__details">
          <p className="event-card__desc">{d.desc}</p>

          {d.image && (
            <div className="info-image-box">
              <img src={d.image.url} alt={d.image.caption} />
              <div className="info-image-caption">
                <InfoIcon color="var(--color-primary)" />
                {d.image.caption}
              </div>
            </div>
          )}

          {d.rules?.map((r, i) => (
            <div key={i} className="rule-item">
              {r.color === 'primary'
                ? <ForkIcon />
                : <InfoIcon color="var(--color-info)" />
              }
              <span className="rule-item__text">{r.text}</span>
            </div>
          ))}

          {d.transit && (
            <TransitTabs subway={d.transit.subway} taxi={d.transit.taxi} />
          )}

          {d.shops && (
            <div className="shop-list">
              <h4 className="shop-list__title">
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: 'var(--color-primary)' }}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                口袋名單精選
              </h4>
              {d.shops.map((s, i) => (
                <div key={i} className="shop-item">
                  <div className="shop-item__header">
                    <span className="shop-item__name">{s.name}</span>
                    <span className="shop-item__kr">{s.kr}</span>
                  </div>
                  <p className="shop-item__desc">{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {d.tags && <TagGroup tags={d.tags} />}
        </div>
      )}
    </div>
  );
};

/* ── 行程頁 ───────────────────────────────────────────── */
const SchedulePage = () => (
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
      {/* 月份 + 日期選擇 + 天氣 */}
      <div className="mb-6">
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>2026年 6月</div>
        <WeatherCard />
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>今日行程</h2>

      {SCHEDULE_EVENTS.map((ev) => (
        <EventCard key={ev.title} ev={ev} />
      ))}
    </div>
  </>
);

export default SchedulePage;
