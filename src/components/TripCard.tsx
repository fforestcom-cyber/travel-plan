import { Trip } from '../types';

const STATUS_LABEL: Record<Trip['status'], string> = {
  planned:   '計畫中',
  ongoing:   '進行中',
  completed: '已完成',
};

interface Props {
  trip: Trip;
  onClick?: () => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });

const TripCard = ({ trip, onClick }: Props) => {
  const dateRange = `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;

  return (
    <div className="trip-card" onClick={onClick}>
      {/* 縮圖 */}
      <div className="trip-card__thumb">
        {trip.coverImage ? (
          <img src={trip.coverImage} alt={trip.title} />
        ) : (
          <div className="trip-card__thumb-placeholder">
            <svg viewBox="0 0 24 24" style={{ width: 28, height: 28 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* 內容 */}
      <div className="trip-card__body">
        {/* 標題 + badge 同行 */}
        <div className="trip-card__title-row">
          <div className="trip-card__title">{trip.title}</div>
          <span className="badge">{STATUS_LABEL[trip.status]}</span>
        </div>

        {/* 地點（只顯示中文城市・地區） */}
        <div className="trip-card__location">
          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {trip.city}・{trip.region}
        </div>

        {/* 日期 */}
        <div className="trip-card__date">{dateRange}</div>
      </div>

      {/* 箭頭 */}
      <div className="trip-card__chevron">
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
};

export default TripCard;
