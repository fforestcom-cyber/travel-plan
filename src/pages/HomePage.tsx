import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  TRIP_INFO, EXCHANGE,
  FLIGHTS as DEFAULT_FLIGHTS,
  TODO_ITEMS as DEFAULT_TODO,
  PREP_ITEMS as DEFAULT_PREP,
} from '../data/mockData';

/* ── Types ─────────────────────────────────────────────── */
interface Airport { iata: string; city: string; time: string; }
interface Flight {
  id: string; direction: 'dep' | 'arr'; directionLabel: string;
  flightNo: string; from: Airport; to: Airport;
  duration: string; flip: boolean; order: number;
}
interface CheckItem {
  id: string; text: string; sub: string;
  done: boolean; type: 'todo' | 'prep'; order: number;
}
interface Accom {
  id: string; name: string; checkIn: string; checkOut: string;
  breakfast: string; naverQuery: string; googleQuery: string; order: number;
}

const FLIGHTS_COL   = collection(db, 'homeFlights');
const CHECKLIST_COL = collection(db, 'homeChecklist');
const ACCOM_COL     = collection(db, 'homeAccommodation');

/* ── 共用 ─────────────────────────────────────────────── */
const iStyle: React.CSSProperties = {
  border: '1px solid #ece8e3', borderRadius: 6, padding: '6px 10px',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff',
};
const FL = ({ text }: { text: string }) => (
  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.03em' }}>{text}</span>
);
const EditBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 20, background: 'none', border: '1px solid #ece8e3', color: '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    編輯
  </button>
);
const MAP_ICON = <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;

const NaverLink = ({ query }: { query: string }) => (
  <a href={`https://map.naver.com/p/search/${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer"
    style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 20, background: '#e8f5e9', color: '#1a7340', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
    {MAP_ICON}
    Naver
  </a>
);
const GoogleLink = ({ query }: { query: string }) => (
  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer"
    style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 20, background: '#e8f0fe', color: '#1a56db', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
    {MAP_ICON}
    Google
  </a>
);
const CheckBox = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{ flexShrink: 0, cursor: 'pointer', padding: 0 }}
    className={`checklist-box${checked ? ' checklist-box--checked' : ''}`}>
    {checked && <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
  </button>
);

/* ── 匯率換算 ─────────────────────────────────────────── */
const QUICK_AMOUNTS = [500, 1000, 3000, 5000, 10000];
const ExchangeCard = () => {
  const [twd, setTwd] = useState(1000);
  const krw = Math.round(twd * EXCHANGE.rate).toLocaleString();
  return (
    <>
      <div className="flight-section-title">
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: 'var(--color-primary)' }}>
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
        </svg>
        匯率換算
      </div>
      <div className="exchange-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex' }}>
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-main)' }}>{EXCHANGE.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-light)' }}>參考匯率</span>
        </div>
        <div className="exchange-card__inner">
          <div className="exchange-row"><span className="exchange-label">台幣 (TWD)</span><input type="number" className="exchange-input" value={twd} onChange={e => setTwd(Number(e.target.value) || 0)} /></div>
          <div className="exchange-divider" />
          <div className="exchange-row"><span className="exchange-label">韓元 (KRW)</span><span className="exchange-value">₩ {krw}</span></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', padding: 6, borderRadius: '50%', border: '1px solid var(--color-border)' }}>
            <div style={{ background: 'var(--color-text-main)', color: 'white', padding: 6, borderRadius: '50%', display: 'flex' }}>
              <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </div>
          </div>
        </div>
        <div className="exchange-quick">
          {QUICK_AMOUNTS.map(amt => (
            <button key={amt} className={`exchange-quick__btn${twd === amt ? ' is-active' : ''}`} onClick={() => setTwd(amt)}>
              {amt >= 1000 ? `${amt / 1000}K` : amt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

/* ── AirplaneIcon ──────────────────────────────────────── */
const AirplaneIcon = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: 'var(--color-primary)', fill: 'none', stroke: 'currentColor', strokeWidth: 2, transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5A3.54 3.54 0 0 0 15 3.5L11.5 7 3.2 5.2a.5.5 0 0 0-.5.3l-.9 1.7a.5.5 0 0 0 .1.6L9 12 6 15H3l-1 3 3-1v-3l3-3 3.6 6.1a.5.5 0 0 0 .6.1l1.7-.9a.5.5 0 0 0 .3-.5z" />
  </svg>
);

/* ── 機票合併編輯 Modal ─────────────────────────────────── */
type FlightEditFields = {
  directionLabel: string; flightNo: string;
  fromIata: string; fromCity: string; fromTime: string;
  toIata: string;   toCity: string;   toTime: string;
  duration: string;
};
const toEditFields = (f: Flight): FlightEditFields => ({
  directionLabel: f.directionLabel, flightNo: f.flightNo,
  fromIata: f.from.iata, fromCity: f.from.city, fromTime: f.from.time,
  toIata: f.to.iata, toCity: f.to.city, toTime: f.to.time,
  duration: f.duration,
});

const FlightsCombinedModal = ({
  flights, onSave, onClose,
}: { flights: Flight[]; onSave: (id: string, f: FlightEditFields) => Promise<void>; onClose: () => void; }) => {
  const [all, setAll] = useState<Record<string, FlightEditFields>>(
    Object.fromEntries(flights.map(f => [f.id, toEditFields(f)]))
  );
  const [saving, setSaving] = useState(false);
  const set = (id: string, k: keyof FlightEditFields, v: string) =>
    setAll(prev => ({ ...prev, [id]: { ...prev[id], [k]: v } }));
  const save = async () => {
    setSaving(true);
    try { await Promise.all(flights.map(f => onSave(f.id, all[f.id]))); onClose(); }
    catch(e) { console.error(e); setSaving(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0ebe5', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>編輯機票</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>
          {flights.map((f, idx) => {
            const fd = all[f.id] ?? toEditFields(f);
            return (
              <div key={f.id} style={{ padding: '14px 0', borderBottom: idx < flights.length - 1 ? '1px solid #f0ebe5' : 'none' }}>
                <span className={`flight-card__direction flight-card__direction--${f.direction}`} style={{ display: 'inline-flex', marginBottom: 12 }}>{f.directionLabel}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="航班編號・日期" /><input value={fd.flightNo} onChange={e => set(f.id, 'flightNo', e.target.value)} style={iStyle} /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="出發 IATA" /><input value={fd.fromIata} onChange={e => set(f.id, 'fromIata', e.target.value)} style={iStyle} /></div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="出發城市" /><input value={fd.fromCity} onChange={e => set(f.id, 'fromCity', e.target.value)} style={iStyle} /></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="起飛時間" /><input value={fd.fromTime} onChange={e => set(f.id, 'fromTime', e.target.value)} style={iStyle} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="抵達 IATA" /><input value={fd.toIata} onChange={e => set(f.id, 'toIata', e.target.value)} style={iStyle} /></div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="抵達城市" /><input value={fd.toCity} onChange={e => set(f.id, 'toCity', e.target.value)} style={iStyle} /></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="抵達時間" /><input value={fd.toTime} onChange={e => set(f.id, 'toTime', e.target.value)} style={iStyle} /></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="飛行時間" /><input value={fd.duration} onChange={e => set(f.id, 'duration', e.target.value)} style={iStyle} /></div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '12px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0ebe5', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 22px', borderRadius: 999, border: '1px solid #ece8e3', background: 'none', fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>取消</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 22px', borderRadius: 999, border: 'none', background: '#7d9baa', fontSize: 13, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '儲存中…' : '儲存'}</button>
        </div>
      </div>
    </div>
  );
};

/* ── 機票卡片 ──────────────────────────────────────────── */
const FlightCards = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [managing, setManaging] = useState(false);
  const seeded = useRef(false);
  useEffect(() => {
    return onSnapshot(FLIGHTS_COL, snap => {
      if (snap.empty && !seeded.current) {
        seeded.current = true;
        DEFAULT_FLIGHTS.forEach((f, i) => addDoc(FLIGHTS_COL, { ...f, order: i }));
        return;
      }
      setFlights(snap.docs.map(d => ({ id: d.id, ...d.data() } as Flight)).sort((a, b) => a.order - b.order));
    });
  }, []);
  const handleSave = async (id: string, f: FlightEditFields) => {
    await setDoc(doc(db, 'homeFlights', id), {
      flightNo: f.flightNo, directionLabel: f.directionLabel,
      from: { iata: f.fromIata, city: f.fromCity, time: f.fromTime },
      to:   { iata: f.toIata,   city: f.toCity,   time: f.toTime   },
      duration: f.duration, updatedAt: serverTimestamp(),
    }, { merge: true });
  };
  const display = flights.length > 0 ? flights : DEFAULT_FLIGHTS.map((f, i) => ({ ...f, id: String(i), order: i }));
  return (
    <>
      <div className="flight-section-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AirplaneIcon />機票資訊</div>
        <EditBtn onClick={() => setManaging(true)} />
      </div>
      {display.map((f, i) => (
        <div className="flight-card" key={f.id} style={i === display.length - 1 ? { marginBottom: '1.25rem' } : {}}>
          <div className="flight-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`flight-card__direction flight-card__direction--${f.direction}`}>{f.directionLabel}</span>
              <span className="flight-card__flight-no">{f.flightNo}</span>
            </div>
          </div>
          <div className="flight-card__route">
            <div className="flight-card__airport">
              <div className="flight-card__iata">{f.from.iata}</div>
              <div className="flight-card__city">{f.from.city}</div>
              <div className="flight-card__time">{f.from.time}</div>
            </div>
            <div className="flight-card__middle">
              <div className="flight-card__duration">{f.duration}</div>
              <div className="flight-card__line"><div className="flight-card__line-bar" /><AirplaneIcon flip={f.flip} /><div className="flight-card__line-bar" /></div>
            </div>
            <div className="flight-card__airport flight-card__airport--right">
              <div className="flight-card__iata">{f.to.iata}</div>
              <div className="flight-card__city">{f.to.city}</div>
              <div className="flight-card__time">{f.to.time}</div>
            </div>
          </div>
        </div>
      ))}
      {managing && flights.length > 0 && (
        <FlightsCombinedModal flights={flights} onSave={handleSave} onClose={() => setManaging(false)} />
      )}
    </>
  );
};

/* ── 住宿資訊卡片 ──────────────────────────────────────── */
type AccomFields = Omit<Accom, 'id' | 'order'>;

const EMPTY_ACCOM: AccomFields = { name: '', checkIn: '', checkOut: '', breakfast: '', naverQuery: '', googleQuery: '' };

/* ── 住宿管理 Modal ─────────────────────────────────────── */
type AccomEntry = AccomFields & { key: string; isNew: boolean };

const AccomManagerModal = ({ items, onClose }: { items: Accom[]; onClose: () => void; }) => {
  /* 把 existing items 直接展開成可編輯表單；新增的項目 append 在後面 */
  const initEntries = (): AccomEntry[] => {
    const existing = items.map(d => ({ key: d.id, isNew: false, name: d.name, checkIn: d.checkIn, checkOut: d.checkOut, breakfast: d.breakfast, naverQuery: d.naverQuery, googleQuery: d.googleQuery }));
    return existing.length > 0 ? existing : [{ key: 'new-0', isNew: true, ...EMPTY_ACCOM }];
  };

  const [entries, setEntries] = useState<AccomEntry[]>(initEntries);
  const [saving,  setSaving]  = useState<string | null>(null);
  const nextKey = useRef(0);

  const setF = (key: string, k: keyof AccomFields, v: string) =>
    setEntries(prev => prev.map(e => e.key === key ? { ...e, [k]: v } : e));

  const saveEntry = async (e: AccomEntry) => {
    setSaving(e.key);
    try {
      if (e.isNew) {
        await addDoc(ACCOM_COL, { name: e.name, checkIn: e.checkIn, checkOut: e.checkOut, breakfast: e.breakfast, naverQuery: e.naverQuery, googleQuery: e.googleQuery, order: items.length, updatedAt: serverTimestamp() });
        setEntries(prev => prev.filter(x => x.key !== e.key));
      } else {
        await setDoc(doc(db, 'homeAccommodation', e.key), { name: e.name, checkIn: e.checkIn, checkOut: e.checkOut, breakfast: e.breakfast, naverQuery: e.naverQuery, googleQuery: e.googleQuery, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch(err) { console.error(err); }
    setSaving(null);
  };

  const deleteEntry = async (e: AccomEntry) => {
    if (e.isNew) { setEntries(prev => prev.filter(x => x.key !== e.key)); return; }
    await deleteDoc(doc(db, 'homeAccommodation', e.key));
    setEntries(prev => prev.filter(x => x.key !== e.key));
  };

  const addNew = () => {
    const key = `new-${nextKey.current++}`;
    setEntries(prev => [...prev, { key, isNew: true, ...EMPTY_ACCOM }]);
  };

  const btnStyle: React.CSSProperties = { padding: '7px 20px', borderRadius: 999, border: 'none', background: '#7d9baa', fontSize: 12, color: '#fff', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0ebe5', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>住宿資訊</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px 16px' }}>
          {entries.map((e, idx) => (
            <div key={e.key} style={{ padding: '14px 0', borderBottom: idx < entries.length - 1 ? '1px solid #f0ebe5' : 'none' }}>
              {/* 每筆直接顯示表單 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FL text="住宿名稱" />
                  <input value={e.name} onChange={ev => setF(e.key, 'name', ev.target.value)} style={iStyle} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="入住日期" /><input value={e.checkIn} onChange={ev => setF(e.key, 'checkIn', ev.target.value)} style={iStyle} placeholder="2026/06/10" /></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="退房日期" /><input value={e.checkOut} onChange={ev => setF(e.key, 'checkOut', ev.target.value)} style={iStyle} placeholder="2026/06/14" /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="早餐" /><input value={e.breakfast} onChange={ev => setF(e.key, 'breakfast', ev.target.value)} style={iStyle} placeholder="無 / 有 / 需確認" /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="Naver 搜尋" /><input value={e.naverQuery} onChange={ev => setF(e.key, 'naverQuery', ev.target.value)} style={iStyle} placeholder="韓文或地址" /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><FL text="Google 搜尋" /><input value={e.googleQuery} onChange={ev => setF(e.key, 'googleQuery', ev.target.value)} style={iStyle} placeholder="英文名稱" /></div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <button onClick={() => deleteEntry(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4a882', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: 0 }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    刪除
                  </button>
                  <button onClick={() => saveEntry(e)} disabled={saving === e.key} style={{ ...btnStyle, opacity: saving === e.key ? 0.7 : 1 }}>
                    {saving === e.key ? '儲存中…' : (e.isNew ? '新增' : '儲存')}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addNew} style={{ width: '100%', padding: '10px 0', margin: '14px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '1px dashed #c4a882', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: '#c4a882', fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增住宿
          </button>
        </div>
      </div>
    </div>
  );
};

const AccommodationCard = () => {
  const [items, setItems] = useState<Accom[]>([]);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    return onSnapshot(ACCOM_COL, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Accom)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    });
  }, []);

  return (
    <>
      <div className="flight-section-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: 'var(--color-primary)', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          住宿資訊
        </div>
        <EditBtn onClick={() => setManaging(true)} />
      </div>
      {items.length === 0 && (
        <div className="card" style={{ marginBottom: 8, color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '18px 0' }}>
          尚無住宿資料，點右上角「編輯」新增
        </div>
      )}
      {items.map(d => (
        <div className="card" key={d.id} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 8 }}>{d.name}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280', marginBottom: 5 }}>
            <span>入住&nbsp;&nbsp;{d.checkIn}</span>
            <span>退房&nbsp;&nbsp;{d.checkOut}</span>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>早餐&nbsp;&nbsp;{d.breakfast}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {d.naverQuery  && <NaverLink  query={d.naverQuery}  />}
            {d.googleQuery && <GoogleLink query={d.googleQuery} />}
          </div>
        </div>
      ))}
      <div style={{ marginBottom: '1.25rem' }} />
      {managing && <AccomManagerModal items={items} onClose={() => setManaging(false)} />}
    </>
  );
};

/* ── 清單統一編輯器 ────────────────────────────────────── */
type EditItem = { id: string; text: string; sub: string; done: boolean; order: number; };

const ChecklistBulkEditor = ({ type, items, onClose }: { type: 'todo' | 'prep'; items: CheckItem[]; onClose: () => void; }) => {
  const [local,  setLocal]  = useState<EditItem[]>(items.map(i => ({ ...i })));
  const [saving, setSaving] = useState<string | null>(null); // id or 'new-{idx}' being saved

  const update = (idx: number, field: keyof EditItem, val: string) =>
    setLocal(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const addRow = () => {
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) + 1 : local.length;
    setLocal(prev => [...prev, { id: '', text: '', sub: '', done: false, order: maxOrder }]);
  };

  const saveRow = async (idx: number) => {
    const it = local[idx];
    if (!it.text.trim() || saving !== null) return;
    const key = it.id || `new-${idx}`;
    setSaving(key);
    try {
      const data = { text: it.text.trim(), sub: (it.sub ?? '').trim(), done: it.done, type, order: it.order };
      if (it.id) {
        await setDoc(doc(db, 'homeChecklist', it.id), data, { merge: true });
      } else {
        await addDoc(CHECKLIST_COL, data);
        setLocal(prev => prev.filter((_, i) => i !== idx));
      }
    } catch (e) { console.error(e); }
    finally { setSaving(null); }
  };

  const deleteRow = async (idx: number) => {
    const it = local[idx];
    if (it.id) await deleteDoc(doc(db, 'homeChecklist', it.id));
    setLocal(prev => prev.filter((_, i) => i !== idx));
  };

  const title = type === 'todo' ? '待辦事項' : '事前準備';
  const btnStyle = (active: boolean): React.CSSProperties => ({
    flexShrink: 0, padding: '5px 12px', marginTop: 2,
    borderRadius: 6, border: 'none',
    background: '#7d9baa', color: '#fff',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    opacity: active ? 0.5 : 1,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0ebe5', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>編輯{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px 16px' }}>
          {local.map((it, idx) => {
            const key = it.id || `new-${idx}`;
            const isSaving = saving === key;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 0', borderBottom: '1px solid #f5f3f0' }}>
                <button onClick={() => deleteRow(idx)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#d1c4b8', padding: 2, marginTop: 4, lineHeight: 0 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    value={it.text} onChange={e => update(idx, 'text', e.target.value)}
                    placeholder="項目名稱" autoFocus={idx === local.length - 1 && !it.id}
                    onKeyDown={e => e.key === 'Enter' && saveRow(idx)}
                    style={{ ...iStyle, padding: '6px 8px' }}
                  />
                  <input
                    value={it.sub ?? ''} onChange={e => update(idx, 'sub', e.target.value)}
                    placeholder="細項說明（可留空）"
                    style={{ ...iStyle, padding: '4px 8px', fontSize: 12, color: '#9ca3af' }}
                  />
                </div>
                <button
                  onClick={() => saveRow(idx)}
                  disabled={isSaving || !it.text.trim()}
                  style={{ ...btnStyle(isSaving || !it.text.trim()), marginTop: 2 }}
                >
                  {isSaving ? '…' : it.id ? '儲存' : '新增'}
                </button>
              </div>
            );
          })}
          <button onClick={addRow} style={{ width: '100%', padding: '10px 0', margin: '10px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '1px dashed #c4a882', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: '#c4a882', fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增項目
          </button>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #f0ebe5', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '9px 0', borderRadius: 999, border: '1px solid #ece8e3', background: 'none', fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>關閉</button>
        </div>
      </div>
    </div>
  );
};

/* ── 清單 Section ─────────────────────────────────────── */
const ChecklistSection = ({ type, naked }: { type: 'todo' | 'prep'; naked?: boolean }) => {
  const [items,   setItems]   = useState<CheckItem[]>([]);
  const [editing, setEditing] = useState(false);
  const seeded = useRef(false);
  const defaults = type === 'todo' ? DEFAULT_TODO : DEFAULT_PREP;

  useEffect(() => {
    const q = query(CHECKLIST_COL, where('type', '==', type));
    return onSnapshot(q, snap => {
      if (snap.empty && !seeded.current) {
        seeded.current = true;
        defaults.forEach((item, i) =>
          addDoc(CHECKLIST_COL, { text: item.text, sub: item.sub ?? '', done: item.done, type, order: i })
        );
        return;
      }
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckItem)).sort((a, b) => a.order - b.order));
    });
  }, [type]); // eslint-disable-line

  const toggle = (item: CheckItem) =>
    setDoc(doc(db, 'homeChecklist', item.id), { done: !item.done }, { merge: true });

  const isTemp = (id: string) => id.startsWith('__');
  const display = items.length > 0
    ? items
    : defaults.map((d, i) => ({ id: `__${i}`, text: d.text, sub: d.sub ?? '', done: d.done, type, order: i }));

  const inner = (
    <>
      {display.map(item => (
        <div key={item.id} className={`checklist-item${item.done ? ' checklist-item--done' : ''}`}>
          <CheckBox checked={item.done} onClick={() => !isTemp(item.id) && toggle(item as CheckItem)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="checklist-item__text">{item.text}</div>
            {item.sub && <div className="checklist-item__sub">{item.sub}</div>}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
        <EditBtn onClick={() => setEditing(true)} />
      </div>
    </>
  );

  return (
    <>
      {naked
        ? <div style={{ padding: '0 1.25rem 1.25rem' }}>{inner}</div>
        : <div className="card">{inner}</div>
      }
      {editing && <ChecklistBulkEditor type={type} items={items} onClose={() => setEditing(false)} />}
    </>
  );
};

/* ── ChecklistCard ─────────────────────────────────────── */
const ChecklistCard = () => {
  const [tab, setTab] = useState<'todo' | 'prep'>('todo');
  return (
    <div className="checklist-merged-card">
      <div className="checklist-tabs">
        <button
          className={`checklist-tab${tab === 'todo' ? ' is-active' : ''}`}
          onClick={() => setTab('todo')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          待辦事項
        </button>
        <button
          className={`checklist-tab${tab === 'prep' ? ' is-active' : ''}`}
          onClick={() => setTab('prep')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          事前準備
        </button>
      </div>
      <div style={{ display: tab === 'todo' ? 'block' : 'none' }}>
        <ChecklistSection type="todo" naked />
      </div>
      <div style={{ display: tab === 'prep' ? 'block' : 'none' }}>
        <ChecklistSection type="prep" naked />
      </div>
    </div>
  );
};

/* ── 首頁 ─────────────────────────────────────────────── */
const HomePage = () => (
  <>
    <div className="page-trip-header">
      <div className="page-trip-header__title">{TRIP_INFO.title}</div>
      <div className="page-trip-header__date">
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {TRIP_INFO.dateRange}
      </div>
    </div>
    <div className="section-px">
      <ExchangeCard />
      <FlightCards />
      <AccommodationCard />
      <ChecklistCard />

    </div>
  </>
);

export default HomePage;
