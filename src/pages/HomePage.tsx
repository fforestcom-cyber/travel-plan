import { Trip } from '../types';
import TripCard from '../components/TripCard';

const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    title: '首爾初體驗',
    city: '首爾',
    region: '서울특별시',
    startDate: '2025-03-10',
    endDate: '2025-03-15',
    status: 'completed',
    currency: 'KRW',
    notes: '景福宮、明洞、弘大夜市，第一次來韓國什麼都覺得新奇！炸雞配啤酒是真的香。',
  },
  {
    id: '2',
    title: '釜山海雲台之旅',
    city: '釜山',
    region: '부산광역시',
    startDate: '2025-07-20',
    endDate: '2025-07-24',
    status: 'planned',
    currency: 'KRW',
    notes: '海雲台海水浴場、甘川洞文化村、廣安大橋夜景，期待夏天的海邊！',
  },
  {
    id: '3',
    title: '濟州島慢旅行',
    city: '濟州',
    region: '제주특별자치도',
    startDate: '2025-10-05',
    endDate: '2025-10-09',
    status: 'planned',
    currency: 'KRW',
    notes: '租車環島、城山日出峰、漢拿山健行，秋天楓葉季應該很美。',
  },
];

const STATS = (trips: Trip[]) => [
  { label: '行程', value: trips.length },
  { label: '已完成', value: trips.filter((t) => t.status === 'completed').length },
  { label: '計畫中', value: trips.filter((t) => t.status === 'planned').length },
];

const HomePage = () => (
  <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
    {/* ── 頁首 ─────────────────────────────────────── */}
    <section className="bg-white rounded-card shadow-card px-6 py-6">
      <p className="text-xs text-gray-400 font-medium tracking-widest mb-1">
        나의 한국 여행
      </p>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        韓國旅遊記錄 🇰🇷
      </h1>

      {/* 統計列 */}
      <div className="flex gap-6">
        {STATS(MOCK_TRIPS).map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold text-coral-500">{value}</span>
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* ── 行程列表 ──────────────────────────────────── */}
    <section className="space-y-4">
      <h2 className="text-[13px] font-semibold text-gray-400 tracking-widest uppercase px-1">
        所有行程
      </h2>

      <div className="flex flex-col gap-3">
        {MOCK_TRIPS.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  </main>
);

export default HomePage;
