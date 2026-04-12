import { useState } from 'react';
import { TRIP_INFO } from '../data/mockData';

/* ── Day 1 行前 Checklist（section 10） ──────────────────────────────── */
interface CheckItem {
  key: string;
  label: string;
  desc: string;
}

const DAY1_CHECKLIST: CheckItem[] = [
  {
    key:   'arrival-card',
    label: '出發前',
    desc:  '填寫韓國電子入境卡（e-Arrival Card），提前 3 天線上填。',
  },
  {
    key:   'transit-card',
    label: '交通卡',
    desc:  'T-money、WOWpass 或 Visit Busan Pass 實體卡均可，到機場輕軌站儲值使用。',
  },
  {
    key:   'busan-pass',
    label: 'Visit Busan Pass',
    desc:  'Gate 2 旁旅遊諮詢處領取（10:00–17:00，午休 12:00–13:00）。班機 15:30 落地時間剛好，不要拖太久。若過了 17:00 則第二天補領。',
  },
  {
    key:   'exchange',
    label: '換錢',
    desc:  '機場輕軌站內 Money Box（黃色招牌），人工窗口 06:00–21:00，門口有 24h 自助機。換 ₩5–8 萬韓幣即可。',
  },
  {
    key:   'transfer',
    label: '沙上換乘',
    desc:  '輕軌出站後步行 6–7 分鐘到地鐵站，行李多請多留時間，跟著綠色指標走，找電梯再進站。',
  },
  {
    key:   'hotel',
    label: '飯店確認',
    desc:  '抵達後確認 Urbanstay Seomyeon 在 ZIM CARRY 合作名單，於 KKday 預訂 Day 3 行李宅配至海雲台飯店。',
  },
  {
    key:   'cash',
    label: '宵夜現金',
    desc:  '布帳馬車多為現金，帶 ₩20,000–30,000 出門。',
  },
  {
    key:   'naver',
    label: 'Naver Map',
    desc:  '出地鐵站後用 Naver Map 導航飯店，比 Google Map 在釜山更精準。',
  },
];

/* ── NotesPage（備註） ──────────────────────────────────────────────── */
const NotesPage = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const doneCount = DAY1_CHECKLIST.filter(item => checked[item.key]).length;

  return (
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

        {/* 標題列 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: 'var(--color-primary)' }}
              fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-main)' }}>
              Day 1 行前 Checklist
            </span>
          </div>
          <span style={{
            fontSize: 11,
            color: doneCount === DAY1_CHECKLIST.length ? 'var(--color-primary)' : 'var(--color-text-light)',
            fontWeight: 600,
          }}>
            {doneCount} / {DAY1_CHECKLIST.length}
          </span>
        </div>

        {/* 進度條 */}
        <div style={{
          height: 4,
          background: 'var(--color-bg-chip, #f0f0f0)',
          borderRadius: 4,
          marginBottom: 20,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(doneCount / DAY1_CHECKLIST.length) * 100}%`,
            background: 'var(--color-primary)',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DAY1_CHECKLIST.map(item => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '12px 14px',
                background: checked[item.key]
                  ? 'var(--color-primary-pale, #fff5f5)'
                  : 'var(--color-bg-card, #fff)',
                border: '1px solid',
                borderColor: checked[item.key]
                  ? 'var(--color-primary-light, #fecaca)'
                  : 'var(--color-border, #e5e7eb)',
                borderRadius: 12,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {/* checkbox 圓圈 */}
              <span style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: checked[item.key]
                  ? '2px solid var(--color-primary)'
                  : '2px solid var(--color-border, #d1d5db)',
                background: checked[item.key] ? 'var(--color-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
                transition: 'all 0.15s',
              }}>
                {checked[item.key] && (
                  <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, color: 'white' }}
                    fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>

              {/* 文字 */}
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: checked[item.key] ? 'var(--color-text-light)' : 'var(--color-text-main)',
                  textDecoration: checked[item.key] ? 'line-through' : 'none',
                  marginRight: 6,
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 12,
                  color: 'var(--color-text-light)',
                  lineHeight: 1.6,
                }}>
                  {item.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </>
  );
};

export default NotesPage;
