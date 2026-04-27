import { useState } from 'react';

const D: Record<string, string> = {
  d1: '#5E9977', d2: '#4E7A9E', d3: '#7B5E8E',
  d4: '#B87848', d5a: '#7D9BAA', d5b: '#9E6878',
};

type AppType = 'uber' | 'kride' | 'both';

interface Ride {
  num: string;
  ko: string;
  route: string;
  time: string;
  cost: string;
  app: AppType;
}

interface DayData {
  key: string;
  label: string;
  theme: string;
  color: string;
  rides: Ride[];
  noRide?: string;
  alert?: { type: 'warn' | 'note'; text: string };
}

const DAYS: DayData[] = [
  {
    key: 'd1', label: 'Day 1', theme: '抵達 · 西面落腳', color: D.d1,
    rides: [],
    noRide: '✅ Day 1 全程地鐵＋步行，零計程車。機場→西面輕軌轉地鐵（₩1,800）。',
  },
  {
    key: 'd2', label: 'Day 2', theme: '金海樂天水上樂園', color: D.d2,
    rides: [
      { num: '2-①', ko: '롯데워터파크\n부산 기장군 기장읍\n동부산관광6로 59',
        route: '西面飯店 → 金海樂天水上樂園', time: '09:00 出發', cost: '₩22,000–25,000', app: 'both' },
      { num: '2-②', ko: '서면역 어반스테이 부산서면\n（或輸入飯店韓文名稱）',
        route: '金海樂天水上樂園 → 西面飯店', time: '傍晚玩完後', cost: '₩22,000–25,000', app: 'both' },
    ],
    alert: { type: 'warn', text: '⚠ 水上樂園在機張，兩個 App 都可能等 5–10 分鐘。超過 10 分鐘，k.ride 開 SMART 呼叫（+₩1,000）。' },
  },
  {
    key: 'd3', label: 'Day 3', theme: '影島串聯西區 → 入住海雲台', color: D.d3,
    rides: [
      { num: '3-①', ko: '아르떼뮤지엄 부산\n부산 영도구 해양로247번길 29',
        route: '西面 → ARTE MUSEUM（影島）', time: '09:30', cost: '₩12,000–15,000', app: 'uber' },
      { num: '3-②', ko: '감천문화마을 안내센터\n부산 사하구 감내2로 203',
        route: 'ARTE MUSEUM → 甘川洞文化村', time: '12:00', cost: '₩5,000–7,000', app: 'kride' },
      { num: '3-③', ko: '송도해상케이블카\n부산 서구 송도해변로 171',
        route: '甘川洞文化村 → 松島海上纜車', time: '13:10', cost: '₩6,000–8,000', app: 'both' },
      { num: '3-④', ko: '남포동 BIFF광장\n또는 롯데마트 광복점',
        route: '松島 → 南浦洞（BIFF廣場 / 樂天超市光復店）', time: '14:20', cost: '₩4,000–6,000', app: 'both' },
      { num: '3-⑤', ko: '해운대（飯店韓文名稱）\n（Uber 可直接輸入中文地址）',
        route: '南浦洞樂天超市 → 海雲台飯店', time: '17:30（帶採買袋）', cost: '₩28,000–35,000', app: 'both' },
    ],
  },
  {
    key: 'd4', label: 'Day 4', theme: 'Skyline Luge × 膠囊列車 × Spa Land', color: D.d4,
    rides: [
      { num: '4-①', ko: '스카이라인루지 부산\n부산 기장군 기장읍\n기장해안로 205',
        route: '海雲台飯店 → Skyline Luge（機張）', time: '09:00（08:45 叫車）', cost: '₩20,000–25,000', app: 'both' },
      { num: '4-②', ko: '해운대블루라인파크 미포역\n부산 해운대구\n달맞이길62번길 13',
        route: 'Skyline Luge → 尾浦站（膠囊列車起點）', time: '11:00（時間緊）', cost: '₩15,000–20,000', app: 'both' },
      { num: '4-③', ko: '신세계백화점 센텀시티점\n부산 해운대구 센텀남대로 35',
        route: '青沙浦（午餐後）→ 新世界百貨 Spa Land', time: '14:00', cost: '₩9,000–12,000', app: 'uber' },
    ],
    alert: { type: 'note', text: 'ℹ Day 4 廣安里晚餐：Spa Land 搭地鐵 2 號線 2–3 站，或計程車約 ₩7,000–10,000 直達廣安里。' },
  },
  {
    key: 'd5a', label: 'Day 5A', theme: '海雲台放空收尾', color: D.d5a,
    rides: [
      { num: '5A-①', ko: '김해국제공항 국제선\n경남 김해시 공항로 108',
        route: '海雲台飯店 → 金海機場（國際線）', time: '15:00 出發', cost: '₩20,000–25,000', app: 'both' },
    ],
  },
  {
    key: 'd5b', label: 'Day 5B', theme: '田浦採買收尾', color: D.d5b,
    rides: [
      { num: '5B-①', ko: '전포 카페거리\n부산 부산진구 전포대로 209',
        route: '海雲台飯店 → 田浦商圈', time: '10:00 出發', cost: '₩12,000–16,000', app: 'uber' },
      { num: '5B-②', ko: '김해국제공항 국제선\n경남 김해시 공항로 108',
        route: '田浦商圈 → 金海機場（國際線）', time: '13:45（最晚出發）', cost: '₩20,000–25,000', app: 'both' },
    ],
  },
];

const TIPS = [
  { title: '出發前設定', body: '<b>Uber</b>：確認信用卡已綁，把常用目的地預存。<br><b>k.ride</b>：App Store 搜「k.ride」，台灣手機號驗證，綁 Visa/Master，<b>出發前完成，韓國設定容易卡關</b>。' },
  { title: '定位不準時', body: 'Uber 點「在地圖上設定地點」手動調整，避免定位到對面馬路。<br>上車後用 Naver Map 確認行駛方向。' },
  { title: '夜間加成', body: '<b>22:00–04:00</b> 夜間加成 <b>20–40%</b>，₩5,000 短程可能變 ₩7,000，正常現象。<br>深夜建議提前 5–10 分鐘叫好。' },
  { title: '司機拒載怎辦', body: '司機有時以「太近」或「太遠」拒接。<br><b>對策</b>：換另一個 App；或 k.ride 開 <b>SMART 呼叫（+₩1,000）</b>提高接單意願。' },
  { title: '行李多時', body: '<b>29 吋以上行李可能放不下</b>（後車廂部分有瓦斯桶）。<br>Day 5 去機場：k.ride 選「<b>대형（大型車）</b>」或叫廂型車。' },
  { title: '過橋費說明', body: '南浦洞往海雲台走<b>廣安大橋</b>加收 <b>₩1,000</b> 橋費（跳表加入，非私收），走橋比市區快約 10 分鐘。' },
];

/* ── Copy helper ─────────────────────────────────── */
const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
};

/* ── Destination card ────────────────────────────── */
const DestCard = ({
  ride, color, isCopied, onCopy,
}: {
  ride: Ride; color: string; isCopied: boolean; onCopy: () => void;
}) => {
  const appLabel: Record<AppType, string> = { uber: 'Uber', kride: 'k.ride', both: 'Uber / k.ride' };

  return (
    <div style={{ marginBottom: 10 }}>
      {/* ── Secondary info row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ background: color, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, flexShrink: 0 }}>{ride.num}</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{ride.route}</span>
      </div>

      {/* ── Korean destination block (tap to copy) ── */}
      <button
        onClick={onCopy}
        style={{
          width: '100%', textAlign: 'left' as const, cursor: 'pointer',
          background: isCopied ? color + '20' : 'white',
          border: `1.5px solid ${isCopied ? color : color + '55'}`,
          borderRadius: 10,
          padding: '12px 14px 10px',
          transition: 'all 0.15s',
          display: 'block',
          position: 'relative' as const,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, color: 'var(--color-text-main)', wordBreak: 'keep-all' as const, letterSpacing: '0.01em', paddingRight: 52 }}>
          {ride.ko.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
        <div style={{
          position: 'absolute' as const, bottom: 9, right: 11,
          fontSize: 10, fontWeight: 700,
          color: isCopied ? color : 'var(--color-text-light)',
          display: 'flex', alignItems: 'center', gap: 3,
          transition: 'color 0.15s',
        }}>
          {isCopied
            ? <><CheckIcon color={color} /> 已複製</>
            : <><CopyIcon /> 複製</>
          }
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-text-light)' }}>
          建議：{appLabel[ride.app]}
        </div>
      </button>
    </div>
  );
};

/* ── Tiny icon components ────────────────────────── */
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CheckIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke={color} strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: 'var(--color-text-light)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── App card (compare section) ──────────────────── */
const AppCard = ({ headerBg, headerText, name, badge, badgeBg, badgeColor, pros, notes }: {
  headerBg: string; headerText: string; name: string;
  badge: string; badgeBg: string; badgeColor: string;
  pros: string[]; notes: string[];
}) => (
  <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ background: headerBg, padding: '8px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: headerText, fontSize: 14, fontWeight: 700 }}>{name}</span>
      <span style={{ background: badgeBg, color: badgeColor, fontSize: 9, padding: '1px 6px', borderRadius: 10 }}>{badge}</span>
    </div>
    <div style={{ padding: '8px 11px', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.75 }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-light)', marginBottom: 2 }}>優點</div>
      {pros.map(p => <div key={p}>✓ {p}</div>)}
      <div style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-light)', margin: '5px 0 2px' }}>注意</div>
      {notes.map(n => <div key={n}>△ {n}</div>)}
    </div>
  </div>
);

const SectionLabel = ({ children }: { children: string }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{children}</div>
);

/* ── Main component ──────────────────────────────── */
const TaxiGuide = () => {
  const [open, setOpen]         = useState(false);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleDay = (key: string) =>
    setOpenDays(prev => ({ ...prev, [key]: !prev[key] }));

  const handleCopy = (id: string, ko: string) => {
    copyText(ko).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-card)', overflow: 'hidden', marginBottom: '1.25rem' }}>

      {/* ── Toggle header ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>🚖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-main)' }}>計程車 × 叫車備查指南</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>Day 1–5 · 目的地韓文 · 點按複製至 Naver Map</div>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>

          {/* ── App compare ── */}
          <div style={{ paddingTop: 14, marginBottom: 14 }}>
            <SectionLabel>叫車 App 比較</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <AppCard
                headerBg="#1E2D35" headerText="white" name="Uber" badge="中文介面" badgeBg="rgba(255,255,255,0.2)" badgeColor="white"
                pros={['可輸入中文目的地', '台灣帳號直接開用', '信用卡自動扣款']}
                notes={['偏遠區叫車較慢', '偶有繞路回報']}
              />
              <AppCard
                headerBg="#D4A84B" headerText="#6A4400" name="k.ride" badge="繁中介面" badgeBg="rgba(0,0,0,0.1)" badgeColor="#6A4400"
                pros={['Kakao T 外國人版，合作車最多', '釜山叫車成功率更高', '台灣手機號＋信用卡可綁']}
                notes={['台灣完成註冊再出發', '目的地需輸入英/韓文']}
              />
            </div>
          </div>

          {/* ── Strategy ── */}
          <div style={{ background: 'var(--color-text-main)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 9 }}>🎯 最佳叫車策略</div>
            {[
              { tag: 'Uber',   ts: { background: 'white', color: '#1E2D35' },               text: '先用 Uber 輸入中文確認目的地 + 看預估費用，合理就直接叫' },
              { tag: 'k.ride', ts: { background: '#D4A84B', color: '#6A4400' },              text: '偏遠地區（水上樂園、Skyline Luge）同時開 k.ride，哪個先有司機就確認' },
              { tag: '雙開',   ts: { background: 'rgba(255,255,255,0.15)', color: 'white' }, text: '超過 8 分鐘叫不到：切換另一個 App，或 k.ride 開 SMART 呼叫（+₩1,000）' },
            ].map(s => (
              <div key={s.tag} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ ...s.ts, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3, flexShrink: 0, marginTop: 1 }}>{s.tag}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55 }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* ── Day sections ── */}
          <SectionLabel>各日目的地</SectionLabel>
          {DAYS.map(day => (
            <div key={day.key} style={{ marginBottom: 10 }}>
              <button
                onClick={() => toggleDay(day.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '7px 0', borderBottom: `2px solid ${day.color}`, marginBottom: openDays[day.key] ? 8 : 0 }}
              >
                <span style={{ background: day.color, color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 3, flexShrink: 0 }}>{day.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', flex: 1, textAlign: 'left' as const }}>{day.theme}</span>
                <ChevronIcon open={!!openDays[day.key]} />
              </button>

              {openDays[day.key] && (
                <div>
                  {day.noRide && (
                    <div style={{ background: 'var(--color-bg-input)', border: '1px dashed var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' as const, marginBottom: 4 }}>
                      {day.noRide}
                    </div>
                  )}
                  {day.rides.map(ride => (
                    <DestCard
                      key={ride.num}
                      ride={ride}
                      color={day.color}
                      isCopied={copiedId === `${day.key}-${ride.num}`}
                      onCopy={() => handleCopy(`${day.key}-${ride.num}`, ride.ko)}
                    />
                  ))}
                  {day.alert && (
                    <div style={{
                      borderRadius: 8, padding: '8px 11px', fontSize: 11, lineHeight: 1.6, marginTop: 2,
                      background: day.alert.type === 'warn' ? '#FAF0D0' : '#EAF2F8',
                      color:      day.alert.type === 'warn' ? '#7A5800' : '#1A3A5A',
                    }}>
                      {day.alert.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />

          {/* ── Tips ── */}
          <SectionLabel>叫車實用技巧</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TIPS.map((tip, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 9, padding: '10px 11px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--color-text-light)', marginBottom: 5 }}>{tip.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: tip.body }} />
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default TaxiGuide;
