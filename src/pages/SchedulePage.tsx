import WeatherCard from '../components/home/WeatherCard';

const EVENTS = [
  { time: '15:30', title: '金海國際機場 (PUS)', location: 'Busan, South Korea', badge: '航班' },
  { time: '17:30', title: '入住飯店 Urbanstay Seomyeon', location: '서면, 부산', badge: '住宿' },
  { time: '19:00', title: '西面美食街晚餐', location: '서면로데오거리', badge: '美食' },
];

const SchedulePage = () => (
  <>
    {/* 頁首 */}
    <div className="page-trip-header">
      <div className="page-trip-header__title">韓國釜山自由行 5天4夜</div>
      <div className="page-trip-header__date">
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        2026/06/10 - 2026/06/14
      </div>
    </div>

    <div className="section-px">
      {/* 日期 + 天氣 */}
      <WeatherCard />

      {/* 今日行程標題 */}
      <div className="section-title-row">
        <h2>今日行程</h2>
      </div>

      {/* 景點卡列表 */}
      {EVENTS.map((ev) => (
        <details key={ev.title} className="event-card">
          <summary className="event-card__summary">
            <div className="event-card__thumbnail">
              <div className="event-card__thumb-icon">
                <svg viewBox="0 0 24 24" style={{ width: 28, height: 28 }}>
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
                <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {ev.location}
              </div>
              <div className="event-card__tags">
                <span className="badge">{ev.badge}</span>
              </div>
            </div>
          </summary>
          <div className="event-card__details">
            <p className="event-card__desc">點擊展開查看詳細資訊與注意事項。</p>
          </div>
        </details>
      ))}
    </div>
  </>
);

export default SchedulePage;
