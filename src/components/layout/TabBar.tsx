import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  {
    path: '/',
    label: '首頁',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/schedule',
    label: '行程',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    path: '/expense',
    label: '記帳',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
  {
    path: '/notes',
    label: '備註',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

const TabBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="app-tab-bar">
      {TABS.map((tab) => {
        const isActive = tab.path === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            className={`tab-item${isActive ? ' tab-item--active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.icon}
            <span className="tab-item__label">{tab.label}</span>
            <span className="tab-item__indicator" />
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;
