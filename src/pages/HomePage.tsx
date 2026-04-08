import { Trip } from '../types';
import HomeSummary from '../components/home/HomeSummary';
import WeatherCard from '../components/home/WeatherCard';
import TripCard from '../components/TripCard';

const TRIPS: Trip[] = [
  {
    id: '1',
    title: '韓國釜山自由行 5天4夜',
    city: '釜山',
    region: '부산광역시',
    startDate: '2026-06-10',
    endDate: '2026-06-14',
    status: 'planned',
    currency: 'KRW',
  },
  {
    id: '2',
    title: '首爾初體驗',
    city: '首爾',
    region: '서울특별시',
    startDate: '2025-03-10',
    endDate: '2025-03-15',
    status: 'completed',
    currency: 'KRW',
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
  },
];

const HomePage = () => (
  <>
    <HomeSummary
      greeting="나의 한국 여행"
      title="我的韓國旅遊"
      stats={[
        { num: TRIPS.length, label: '行程' },
        { num: TRIPS.filter((t) => t.status === 'completed').length, label: '已完成' },
        { num: TRIPS.filter((t) => t.status === 'planned').length, label: '計畫中' },
      ]}
    />

    <div className="section-px">
      {/* 天氣卡 */}
      <WeatherCard />

      {/* 行程列表 */}
      <div className="section-title-row mt-6">
        <h2>所有行程</h2>
        <span className="section-title-row__link">查看全部</span>
      </div>

      {TRIPS.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  </>
);

export default HomePage;
