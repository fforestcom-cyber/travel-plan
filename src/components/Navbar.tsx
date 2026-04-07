import { NavLink } from 'react-router-dom';

// ── 頂部導覽（桌面） ──────────────────────────────────
const TOP_LINKS = [
  { to: '/', label: '首頁', end: true },
  { to: '/trip', label: '行程' },
  { to: '/tools', label: '工具' },
];

// ── 底部 Tab Bar（行動端） ────────────────────────────
const TAB_LINKS = [
  { to: '/', label: '首頁', icon: '🏠', end: true },
  { to: '/trip', label: '行程', icon: '✈️' },
  { to: '/tools', label: '記帳', icon: '💰' },
  { to: '/notes', label: '筆記', icon: '📝' },
];

const Navbar = () => (
  <>
    {/* ── 頂部 Bar ─────────────────────────────────── */}
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-xl">🇰🇷</span>
          <span className="font-bold text-[17px] text-gray-900 tracking-tight">
            韓國旅遊
          </span>
        </NavLink>

        {/* 桌面連結 */}
        <nav className="hidden sm:flex items-center gap-1">
          {TOP_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-coral-50 text-coral-500'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>

    {/* ── 底部 Tab Bar（行動端） ───────────────────── */}
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {TAB_LINKS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-coral-500' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>

    {/* 行動端底部佔位（避免內容被 Tab Bar 遮住） */}
    <div className="sm:hidden h-16" aria-hidden="true" />
  </>
);

export default Navbar;
