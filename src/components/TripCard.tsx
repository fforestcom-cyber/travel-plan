import { Trip } from '../types';

const STATUS_LABEL: Record<Trip['status'], string> = {
  planned: '計畫中',
  ongoing: '進行中',
  completed: '已完成',
};

const STATUS_STYLE: Record<Trip['status'], string> = {
  planned:   'bg-amber-50  text-amber-600',
  ongoing:   'bg-green-50  text-green-600',
  completed: 'bg-coral-50  text-coral-500',
};

const CITY_BG: Record<string, string> = {
  首爾: 'bg-gradient-to-br from-violet-100 to-blue-100',
  釜山: 'bg-gradient-to-br from-cyan-100  to-teal-100',
  濟州: 'bg-gradient-to-br from-green-100 to-emerald-100',
  慶州: 'bg-gradient-to-br from-amber-100 to-orange-100',
  仁川: 'bg-gradient-to-br from-sky-100   to-indigo-100',
};

const CITY_EMOJI: Record<string, string> = {
  首爾: '🏙️', 釜山: '🌊', 濟州: '🌿', 慶州: '🏯', 仁川: '✈️',
};

interface Props {
  trip: Trip;
}

const TripCard = ({ trip }: Props) => {
  const emoji   = CITY_EMOJI[trip.city] ?? '📍';
  const bgClass = CITY_BG[trip.city]    ?? 'bg-gradient-to-br from-gray-100 to-gray-200';

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-TW', {
      month: 'long',
      day:   'numeric',
    });

  const year      = trip.startDate.slice(0, 4);
  const dateRange = `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;

  return (
    <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200 flex overflow-hidden">
      {/* 左側縮圖 */}
      <div className={`w-24 shrink-0 flex items-center justify-center ${bgClass}`}>
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">{emoji}</span>
        )}
      </div>

      {/* 右側資訊 */}
      <div className="flex flex-col justify-center gap-1.5 px-4 py-4 flex-1 min-w-0">
        {/* 標題列 */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-snug truncate">
            {trip.title}
          </h3>
          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[trip.status]}`}>
            {STATUS_LABEL[trip.status]}
          </span>
        </div>

        {/* 城市 */}
        <p className="text-xs text-gray-400 font-medium tracking-wide">
          {trip.city}・{year}
        </p>

        {/* 日期 */}
        <p className="text-xs text-gray-500">{dateRange}</p>

        {/* 備註 */}
        {trip.notes && (
          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
            {trip.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default TripCard;
