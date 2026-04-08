interface Stat {
  num: string | number;
  label: string;
}

interface Props {
  greeting?: string;
  title?: string;
  stats?: Stat[];
}

const HomeSummary = ({
  greeting,
  title = '韓國釜山自由行',
  stats = [
    { num: 5,  label: '天數' },
    { num: 3,  label: '景點' },
    { num: 2,  label: '餐廳' },
  ],
}: Props) => (
  <div className="home-summary">
    {greeting && <p className="home-summary__greeting">{greeting}</p>}
    <h1 className="home-summary__title">
      {title}<span>。</span>
    </h1>
    <div className="home-summary__stats">
      {stats.map((s) => (
        <div key={s.label} className="home-stat">
          <div className="home-stat__num">{s.num}</div>
          <div className="home-stat__label">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default HomeSummary;
