import { useState, useEffect } from 'react';
import {
  collection, addDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import WeatherCard from '../components/home/WeatherCard';
import DayPlanView from '../components/layout/DayPlanView';
import { TRIP_INFO } from '../data/mockData';
import day1Plan from '../data/scheduleDay1';
import day2Plan from '../data/scheduleDay2';
import day3Plan from '../data/scheduleDay3';
import day4Plan from '../data/scheduleDay4';
import day5Plan from '../data/scheduleDay5';

/* ── Types ───────────────────────────────────────────────── */
interface ChecklistItem {
  id: string;
  dayNum: number;
  label: string;
  desc: string;
  order: number;
}

/* ── Firebase ────────────────────────────────────────────── */
const CHECKLIST_COL = collection(db, 'checklistItems');

/* ── ChecklistPanel（Firebase 驅動，含編輯） ─────────────── */
const ChecklistPanel = ({ dayNum }: { dayNum: number }) => {
  const [items,   setItems]   = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState(false);

  // 新增表單
  const [newLabel, setNewLabel] = useState('');
  const [newDesc,  setNewDesc]  = useState('');
  const [adding,   setAdding]   = useState(false);

  // 行內編輯
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editLabel,    setEditLabel]    = useState('');
  const [editDesc,     setEditDesc]     = useState('');

  const title = `Day ${dayNum} 行前 Checklist`;

  useEffect(() => {
    const q = query(CHECKLIST_COL, where('dayNum', '==', dayNum));
    return onSnapshot(q, snap => {
      setItems(
        snap.docs
          .map(d => ({
            id:     d.id,
            dayNum: d.data().dayNum ?? dayNum,
            label:  d.data().label  ?? '',
            desc:   d.data().desc   ?? '',
            order:  d.data().order  ?? (d.data().createdAt as Timestamp)?.toMillis() ?? 0,
          }))
          .sort((a, b) => a.order - b.order)
      );
    }, err => console.error(err));
  }, [dayNum]);

  const toggle = (id: string) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const doneCount = items.filter(it => checked[it.id]).length;

  const addItem = async () => {
    if (!newDesc.trim() || adding) return;
    setAdding(true);
    try {
      await addDoc(CHECKLIST_COL, {
        dayNum,
        label: newLabel.trim(),
        desc:  newDesc.trim(),
        order: Date.now(),
        createdAt: serverTimestamp(),
      });
      setNewLabel('');
      setNewDesc('');
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  const deleteItem = (id: string) =>
    deleteDoc(doc(db, 'checklistItems', id));

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditDesc(item.desc);
  };

  const saveEdit = async (id: string) => {
    await setDoc(doc(db, 'checklistItems', id), {
      dayNum,
      label: editLabel.trim(),
      desc:  editDesc.trim(),
      order: items.find(it => it.id === id)?.order ?? Date.now(),
    }, { merge: true });
    setEditingId(null);
  };

  const iStyle: React.CSSProperties = {
    border: '1px solid #ece8e3', borderRadius: 6,
    padding: '6px 10px', fontSize: 13, outline: 'none',
    background: '#fff', boxSizing: 'border-box',
  };

  return (
    <div style={{
      marginBottom: 16,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      background: 'var(--color-bg-card)',
      overflow: 'hidden',
    }}>
      {/* ── 標題列 ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, color: 'var(--color-primary)', flexShrink: 0 }}
          fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--color-text-main)' }}>{title}</span>
        {items.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, marginRight: 6,
            color: doneCount === items.length ? 'var(--color-primary)' : 'var(--color-text-light)',
          }}>
            {doneCount}/{items.length}
          </span>
        )}
        <svg viewBox="0 0 24 24" style={{
          width: 14, height: 14, color: 'var(--color-text-light)', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }} fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── 進度條 ── */}
      {items.length > 0 && (
        <div style={{ height: 3, background: 'var(--color-bg-chip, #f0f0f0)', margin: '0 16px 0 39px' }}>
          <div style={{
            height: '100%',
            width: `${(doneCount / items.length) * 100}%`,
            background: 'var(--color-primary)',
            borderRadius: 4, transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* ── Action bar（編輯按鈕） ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '6px 12px',
        borderTop: '1px solid #f0ebe5',
        background: '#fdfaf7',
      }}>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setEditing(!editing); if (!open) setOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20,
            background: editing ? 'rgba(125,155,170,0.15)' : 'none',
            border: editing ? '1px solid rgba(125,155,170,0.3)' : '1px solid #ece8e3',
            color: editing ? '#4a7a8a' : '#9ca3af',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          編輯
        </button>
      </div>

      {/* ── 編輯面板 ── */}
      {editing && (
        <div style={{
          padding: '12px 16px 14px',
          borderTop: '1px solid #e8e0d8',
          background: '#faf8f4',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>

          {/* 現有項目列表（可編輯/刪除） */}
          {items.map(item => (
            <div key={item.id}>
              {editingId === item.id ? (
                // 行內編輯
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      placeholder="標籤（選填）"
                      style={{ ...iStyle, width: 100, flexShrink: 0 }}
                    />
                    <input
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="內容"
                      style={{ ...iStyle, flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingId(null)}
                      style={{ ...iStyle, padding: '4px 12px', cursor: 'pointer', color: '#9ca3af' }}>
                      取消
                    </button>
                    <button onClick={() => saveEdit(item.id)}
                      style={{ ...iStyle, padding: '4px 12px', cursor: 'pointer', background: '#7d9baa', color: '#fff', border: 'none' }}>
                      儲存
                    </button>
                  </div>
                </div>
              ) : (
                // 顯示模式（帶刪除/編輯按鈕）
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                    {item.label && <span style={{ fontWeight: 600 }}>{item.label}　</span>}
                    {item.desc}
                  </div>
                  <button onClick={() => startEdit(item)}
                    style={{ padding: '2px 6px', fontSize: 11, color: '#9ca3af', background: 'none', border: '1px solid #ece8e3', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
                    改
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    style={{ padding: '2px 6px', fontSize: 12, color: '#c4a882', background: 'none', border: '1px solid #ece8e3', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              )}
              <div style={{ height: 1, background: '#ece8e3', marginTop: 8 }} />
            </div>
          ))}

          {/* 新增一筆 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>新增項目</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="標籤（選填）"
                style={{ ...iStyle, width: 100, flexShrink: 0 }}
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="內容說明"
                style={{ ...iStyle, flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <button
                onClick={addItem}
                disabled={adding || !newDesc.trim()}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 6,
                  border: 'none', background: '#9eab96',
                  fontSize: 12, color: '#fff', cursor: 'pointer',
                  opacity: (adding || !newDesc.trim()) ? 0.6 : 1,
                }}
              >{adding ? '…' : '新增'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checklist 項目（展開） ── */}
      {open && (
        <div style={{ padding: '10px 16px 14px' }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 12, color: '#c0b8b0', textAlign: 'center', padding: '8px 0', margin: 0 }}>
              尚無項目，點「編輯」新增
            </p>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  width: '100%', padding: '7px 0', textAlign: 'left',
                  cursor: 'pointer', background: 'none', border: 'none',
                }}
              >
                <span style={{
                  width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: checked[item.id] ? '2px solid var(--color-primary)' : '2px solid var(--color-border, #d1d5db)',
                  background: checked[item.id] ? 'var(--color-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {checked[item.id] && (
                    <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, color: 'white' }}
                      fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <div style={{
                  flex: 1, fontSize: 12, lineHeight: 1.7,
                  color: checked[item.id] ? 'var(--color-text-light)' : 'var(--color-text-main)',
                }}>
                  {item.label && <span style={{ fontWeight: 600 }}>{item.label}　</span>}
                  {item.desc}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ── Day Plans 資料 ───────────────────────────────────────── */
const DAY_PLANS = [day1Plan, day2Plan, day3Plan, day4Plan, day5Plan];

/* ── 行程頁 ───────────────────────────────────────────────── */
const SchedulePage = () => {
  const [activeDay, setActiveDay] = useState(0);
  const currentPlan = DAY_PLANS[activeDay];

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
        <div className="mb-6">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>2026年 6月</div>
          <WeatherCard activeIdx={activeDay} onDayChange={setActiveDay} />
        </div>

        <ChecklistPanel dayNum={activeDay + 1} />

        <DayPlanView plan={currentPlan} />
      </div>
    </>
  );
};

export default SchedulePage;
