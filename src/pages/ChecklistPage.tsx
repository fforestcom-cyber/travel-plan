import { TRIP_INFO } from '../data/mockData';

const ChecklistPage = () => (
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
    <div className="section-px" style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
      備註內容待新增
    </div>
  </>
);

export default ChecklistPage;
