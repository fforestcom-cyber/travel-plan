import React, { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, deleteDoc, doc, setDoc, updateDoc,
  onSnapshot, query, serverTimestamp, Timestamp, where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadImage } from '../../lib/storage';
import type { DayPlan, ContentBlock, Step } from '../../types/dayPlan';

// ── 莫蘭迪色系 ───────────────────────────────────────────────────────
const MORANDI_DOTS = ['#7d9baa', '#9eab96', '#c4a882', '#b09898', '#8c9daa', '#a89c8c'];
const MORANDI_LINE = '#e8e0d8';

const ALERT_BORDER: Record<string, string> = {
  warn: '#c4a882',
  tip:  '#9eab96',
  note: '#7d9baa',
};
const ALERT_BG: Record<string, string> = {
  warn: 'rgba(196,168,130,0.12)',
  tip:  'rgba(158,171,150,0.12)',
  note: 'rgba(125,155,170,0.12)',
};

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  景點: { bg: 'rgba(125,155,170,0.15)', color: '#4a7a8a' },
  美食: { bg: 'rgba(196,168,130,0.18)', color: '#7a5a2a' },
  住宿: { bg: 'rgba(158,171,150,0.18)', color: '#3a6a4a' },
  購物: { bg: 'rgba(176,152,152,0.18)', color: '#6a3a3a' },
  航班: { bg: 'rgba(140,157,170,0.18)', color: '#3a4a6a' },
  路程: { bg: 'rgba(168,156,140,0.18)', color: '#5a4a3a' },
};


const detectDistrict = (query: string): string => {
  const MAP: [string, string][] = [
    ['서면', '西面'], ['西面', '西面'],
    ['해운대', '海雲台'], ['海雲台', '海雲台'],
    ['남포동', '南浦洞'], ['남포', '南浦洞'], ['南浦', '南浦洞'],
    ['광안리', '廣安里'], ['廣安里', '廣安里'], ['광안', '廣安里'],
    ['부평시장', '富平市場'], ['부평', '富平'], ['富平', '富平'],
    ['중구', '中區'], ['中區', '中區'],
    ['동래', '東萊'], ['東萊', '東萊'],
    ['사상', '沙上'], ['沙上', '沙上'],
    ['김해', '金海'], ['金海', '金海'],
    ['수영', '水營'], ['水營', '水營'],
    ['부산역', '釜山站'], ['釜山站', '釜山站'],
    ['센텀', '仙台市'], ['기장', '機張'], ['연산', '蓮山'],
  ];
  for (const [key, val] of MAP) {
    if (query.includes(key)) return val;
  }
  return '';
};

const markBold = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <span key={i} style={{ color: '#374151', fontWeight: 700 }}>{part.slice(2, -2)}</span>
      : part
  );
};

// ── 號碼標籤 ──────────────────────────────────────────────────────────

// ── 步驟圓點 ──────────────────────────────────────────────────────────
const StepItem = ({ step, idx }: { step: Step; idx: number }) => {
  const dotColor = MORANDI_DOTS[idx % MORANDI_DOTS.length];
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: dotColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>{idx + 1}</div>
        <div style={{ width: 1, flex: 1, background: MORANDI_LINE, marginTop: 4 }} />
      </div>
      <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>
          {step.title}
        </p>
        {step.body && (
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
            {step.body.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: 2 }}>{markBold(line)}</p>
            ))}
          </div>
        )}
        {step.alerts.map((a, i) => (
          <div key={i} style={{
            borderLeft: `2px solid ${ALERT_BORDER[a.variant] ?? '#7d9baa'}`,
            background: ALERT_BG[a.variant] ?? ALERT_BG.note,
            borderRadius: '0 6px 6px 0',
            padding: '5px 8px', marginTop: 8, fontSize: 13, color: '#6b7280', lineHeight: 1.6,
          }}>{markBold(a.text)}</div>
        ))}
        {step.tickets.map((t, i) => (
          <div key={i} style={{
            borderLeft: `2px solid ${MORANDI_DOTS[2]}`,
            background: 'rgba(196,168,130,0.08)',
            borderRadius: '0 6px 6px 0',
            padding: '5px 8px', marginTop: 8, fontSize: 13, color: '#6b7280',
            lineHeight: 1.6, fontFamily: 'monospace',
          }}>{markBold(t.text)}</div>
        ))}
      </div>
    </div>
  );
};

// ── renderBlock ────────────────────────────────────────────────────────
const renderBlock = (block: ContentBlock, idx: number, stepOffset = 0) => {
  switch (block.kind) {
    case 'info-card':
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          {block.rows.map((row, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: MORANDI_LINE, margin: '10px 0' }} />}
              <div>
                <span className="badge badge--primary" style={{ display: 'inline-block', marginBottom: 5 }}>{row.label}</span>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{markBold(row.value)}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case 'steps':
      return (
        <div key={idx} style={{ marginBottom: 4 }}>
          {block.items.map((step, i) => <StepItem key={i} step={step} idx={stepOffset + i} />)}
        </div>
      );
    case 'alert':
      return (
        <div key={idx} style={{
          borderLeft: `2px solid ${ALERT_BORDER[block.variant] ?? '#7d9baa'}`,
          background: ALERT_BG[block.variant] ?? ALERT_BG.note,
          borderRadius: '0 6px 6px 0',
          padding: '5px 8px', marginTop: 8, marginBottom: 10, fontSize: 13, color: '#6b7280', lineHeight: 1.6,
        }}>{markBold(block.text)}</div>
      );
    case 'ticket':
      return (
        <div key={idx} style={{
          borderLeft: `2px solid ${MORANDI_DOTS[2]}`,
          background: 'rgba(196,168,130,0.08)',
          borderRadius: '0 6px 6px 0',
          padding: '5px 8px', marginTop: 8, marginBottom: 10, fontSize: 13,
          color: '#6b7280', lineHeight: 1.6, fontFamily: 'monospace',
        }}>{markBold(block.text)}</div>
      );
    case 'menu':
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#7d9baa', letterSpacing: '0.04em', marginBottom: 8 }}>
            {block.header}
          </div>
          {block.items.map((item, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: MORANDI_LINE, margin: '5px 0' }} />}
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                {item.name}
                {item.note && <span style={{ color: '#9ca3af', fontSize: 13 }}>　{item.note}</span>}
              </div>
            </div>
          ))}
        </div>
      );
    case 'checklist':
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          {block.items.map((item, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: MORANDI_LINE, margin: '5px 0' }} />}
              <div style={{ display: 'flex', gap: 8, fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}>☐</span>
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      );
    case 'facility-grid':
      return (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {block.items.map((item, i) => (
            <div key={i} style={{ background: '#faf8f4', border: '1px solid #ece8e3', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5, lineHeight: 1.4 }}>{item.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {item.tags.map((tag, j) => (
                  <span key={j} style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, display: 'inline-block',
                    ...(tag.type === 'thrill' ? { background: '#fde8e0', color: '#8b2010' }
                      : tag.type === 'relax'  ? { background: '#e0f2ea', color: '#0a4a30' }
                      :                         { background: '#fff0cc', color: '#7a4a00' }),
                  }}>{tag.label}</span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>{item.note}</p>
            </div>
          ))}
        </div>
      );
    case 'highlight':
      return (
        <div key={idx} style={{
          background: 'rgba(158,171,150,0.12)', border: '1px solid rgba(158,171,150,0.3)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#7d9baa', letterSpacing: '0.04em', marginBottom: 5 }}>{block.title}</div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65 }}>{block.body}</div>
        </div>
      );
    case 'photo-ref':
    default:
      return null;
  }
};

// ── Firebase collections ──────────────────────────────────────────────
interface SectionPhoto { id: string; imageUrl: string; createdAt: Timestamp | null; }
const PHOTOS_COL         = collection(db, 'sectionPhotos');
const CARD_OVERRIDES_COL  = collection(db, 'cardOverrides');
const CUSTOM_CARDS_COL    = collection(db, 'customCards');
const SECTION_CARDS_COL   = collection(db, 'sectionCards');

interface RefLink { text: string; href: string; }
interface CardOverride {
  category?: string;
  name?: string;
  location?: string;
  timeRange?: string;
  openHours?: string;
  transportTime?: string;
  cost?: string;
  address?: string;       // legacy
  naverQuery?: string;
  googleQuery?: string;
  content?: string;
  notes?: string;
  links?: RefLink[];
  dayNum?: number;
  deleted?: boolean;
}
interface CustomCard {
  id: string; dayNum: number; title: string; timeRange: string;
  notes: string; order: number; category?: string; location?: string;
  naverQuery?: string; googleQuery?: string;
  openHours?: string; transportTime?: string; cost?: string; supplement?: string; links?: RefLink[];
}
interface FirestoreSection {
  id: string; dayNum: number; order: number;
  num: string; title: string; timeRange: string; mapQuery?: string;
  blocks: ContentBlock[];
}

// ── 照片上傳 ──────────────────────────────────────────────────────────
const SectionPhotoGallery = ({ sectionId }: { sectionId: string }) => {
  const [photos, setPhotos]       = useState<SectionPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(PHOTOS_COL, where('sectionId', '==', sectionId));
    return onSnapshot(q, snap => {
      setPhotos(
        snap.docs
          .map(d => ({
            id: d.id, imageUrl: d.data().imageUrl ?? '', createdAt: d.data().createdAt ?? null,
          }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis() ?? 0;
            const tb = b.createdAt?.toMillis() ?? 0;
            return tb - ta;
          })
      );
    }, err => console.error(err));
  }, [sectionId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file, `korea-travel/sections/${sectionId}`);
      await addDoc(PHOTOS_COL, { sectionId, imageUrl: url, createdAt: serverTimestamp() });
    } catch (err) { console.error(err); }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MORANDI_LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>我的照片</span>
        <button
          onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: '#7d9baa', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', opacity: uploading ? 0.5 : 1,
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          {uploading ? '上傳中…' : '加入照片'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      {photos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#f3f0ec' }}>
              <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => deleteDoc(doc(db, 'sectionPhotos', p.id))}
                style={{
                  position: 'absolute', top: 4, right: 4, width: 18, height: 18,
                  borderRadius: '50%', background: 'rgba(0,0,0,.45)', color: 'white',
                  fontSize: 11, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: '#c0b8b0', textAlign: 'center', padding: '6px 0' }}>
          點擊「加入照片」上傳參考圖片
        </p>
      )}
    </div>
  );
};

// ── 從靜態資料轉換為初始 fields ─────────────────────────────────────
interface EditFields {
  category: string; name: string; location: string; timeRange: string;
  openHours: string; transportTime: string; cost: string;
  naverQuery: string; googleQuery: string;
  content: string; notes: string; links: RefLink[];
}

type SectionLike = { title: string; timeRange?: string; mapQuery?: string; blocks: ContentBlock[] };

const sectionToInitFields = (section: SectionLike): EditFields => {
  const contentParts: string[] = [];
  const noteParts:   string[] = [];
  const links:       RefLink[] = [];
  let counter = 1;

  for (const block of section.blocks) {
    if (block.kind === 'info-card') {
      for (const row of block.rows) {
        contentParts.push(`${counter}. ${row.label}：${row.value}`);
        counter++;
      }
    } else if (block.kind === 'steps') {
      for (const step of block.items) {
        let line = `${counter}. ${step.title}`;
        if (step.body) line += '\n' + step.body.split('\n').map(l => '   ' + l).join('\n');
        contentParts.push(line);
        counter++;
        step.alerts.forEach(a  => noteParts.push(a.text));
        step.tickets.forEach(t => noteParts.push(t.text));
      }
    } else if (block.kind === 'alert') {
      noteParts.push(block.text);
    } else if (block.kind === 'ticket') {
      noteParts.push(block.text);
    } else if (block.kind === 'menu') {
      contentParts.push(`${counter}. ${block.header}`);
      counter++;
      for (const item of block.items) contentParts.push(`   • ${item.name}${item.note ? '　' + item.note : ''}`);
    } else if (block.kind === 'checklist') {
      for (const item of block.items) contentParts.push(item);
    } else if (block.kind === 'photo-ref') {
      block.links.forEach(l => links.push({ text: l.text.replace(/^→ /, ''), href: l.href }));
    }
  }

  const rawTime = section.timeRange ?? '';
  const [timePart, transportPart] = rawTime.includes('｜') ? rawTime.split('｜') : [rawTime, ''];

  return {
    category: '',
    name: section.title,
    location: '',
    timeRange: timePart.trim(),
    openHours: '',
    transportTime: transportPart.trim(),
    cost: '',
    naverQuery: section.mapQuery ?? '',
    googleQuery: '',
    content: contentParts.join('\n'),
    notes: noteParts.join('\n'),
    links,
  };
};

const overrideToFields = (ov: CardOverride, section?: SectionLike): EditFields => {
  const base = section ? sectionToInitFields(section) : {
    category: '', name: '', location: '', timeRange: '', openHours: '',
    transportTime: '', cost: '', naverQuery: '', googleQuery: '', content: '', notes: '', links: [] as RefLink[],
  };
  return {
    category:      ov.category      ?? base.category,
    name:          ov.name          ?? base.name,
    location:      ov.location      ?? base.location,
    timeRange:     ov.timeRange     ?? base.timeRange,
    openHours:     ov.openHours     ?? base.openHours,
    transportTime: ov.transportTime ?? base.transportTime,
    cost:          ov.cost          ?? base.cost,
    naverQuery:    ov.naverQuery    ?? ov.address ?? base.naverQuery,
    googleQuery:   ov.googleQuery   ?? base.googleQuery,
    content:       ov.content       ?? base.content,
    notes:         ov.notes         ?? base.notes,
    links:         ov.links         ?? base.links,
  };
};

// ── 編輯面板（Inline）────────────────────────────────────────────────
const EditPanel = ({
  initFields,
  onSave,
  onClose,
}: {
  initFields: EditFields;
  onSave: (fields: EditFields) => Promise<void>;
  onClose: () => void;
}) => {
  const [fields,  setFields]  = useState<EditFields>(initFields);
  const [saving,  setSaving]  = useState(false);
  const [newLink, setNewLink] = useState<RefLink>({ text: '', href: '' });
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof EditFields>(k: K, v: EditFields[K]) =>
    setFields(f => ({ ...f, [k]: v }));

  const insertNumberTag = (n: number) => {
    const el = contentRef.current;
    const insert = `${n}. `;
    if (!el) { set('content', fields.content + insert); return; }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const next  = fields.content.slice(0, start) + insert + fields.content.slice(end);
    set('content', next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + insert.length, start + insert.length);
    });
  };

  const addLink = () => {
    if (!newLink.text.trim() && !newLink.href.trim()) return;
    setFields(f => ({ ...f, links: [...f.links, newLink] }));
    setNewLink({ text: '', href: '' });
  };
  const removeLink = (i: number) =>
    setFields(f => ({ ...f, links: f.links.filter((_, j) => j !== i) }));
  const updateLink = (i: number, k: keyof RefLink, v: string) =>
    setFields(f => ({ ...f, links: f.links.map((l, j) => j === i ? { ...l, [k]: v } : l) }));

  const save = async () => {
    setSaving(true);
    try { await onSave(fields); onClose(); }
    catch (e) { console.error(e); setSaving(false); }
  };

  const iStyle: React.CSSProperties = {
    border: '1px solid #ece8e3', borderRadius: 6,
    padding: '6px 10px', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box', background: '#fff',
  };
  const label = (text: string) => (
    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.03em' }}>{text}</span>
  );

  return (
    <div style={{
      padding: '14px 18px 16px',
      background: '#fff',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>

      {/* 分類 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {label('分類')}
        <select
          value={fields.category}
          onChange={e => set('category', e.target.value)}
          style={{ ...iStyle, color: fields.category ? '#374151' : '#9ca3af' }}
        >
          <option value="">未分類</option>
          {['景點', '美食', '住宿', '購物', '航班', '路程'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 名稱 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {label('名稱')}
        <input value={fields.name} onChange={e => set('name', e.target.value)} style={iStyle} />
      </div>

      {/* 位置 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {label('位置')}
        <input value={fields.location} onChange={e => set('location', e.target.value)}
          placeholder="西面、海雲台、金海…" style={iStyle} />
      </div>

      {/* 時間 + 營業時間 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {label('時間')}
          <input value={fields.timeRange} onChange={e => set('timeRange', e.target.value)}
            placeholder="17:00–18:30" style={iStyle} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {label('營業時間')}
          <input value={fields.openHours} onChange={e => set('openHours', e.target.value)}
            placeholder="09:00–22:00" style={iStyle} />
        </div>
      </div>

      {/* 交通時間 + 費用 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {label('交通時間')}
          <input value={fields.transportTime} onChange={e => set('transportTime', e.target.value)}
            placeholder="車程 7 分鐘" style={iStyle} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {label('費用')}
          <input value={fields.cost} onChange={e => set('cost', e.target.value)}
            placeholder="₩1,700" style={iStyle} />
        </div>
      </div>

      {/* Naver Map 搜尋 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {label('Naver Map 搜尋')}
        <input value={fields.naverQuery} onChange={e => set('naverQuery', e.target.value)}
          placeholder="Naver 地名或地址" style={iStyle} />
        {fields.naverQuery.trim() && (
          <a href={`https://map.naver.com/p/search/${encodeURIComponent(fields.naverQuery)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              borderRadius: 20, background: '#e8f5e9', color: '#1a7340',
              fontSize: 11, fontWeight: 600, textDecoration: 'none', alignSelf: 'flex-start' }}>
            Naver Map ↗
          </a>
        )}
      </div>

      {/* Google Map 搜尋 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {label('Google Map 搜尋')}
        <input value={fields.googleQuery} onChange={e => set('googleQuery', e.target.value)}
          placeholder="Google 地名或地址" style={iStyle} />
        {fields.googleQuery.trim() && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fields.googleQuery)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              borderRadius: 20, background: '#e8f0fe', color: '#1a56db',
              fontSize: 11, fontWeight: 600, textDecoration: 'none', alignSelf: 'flex-start' }}>
            Google Map ↗
          </a>
        )}
      </div>

      {/* 內容 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {label('內容')}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[1, 2, 3, 4].map((n, idx) => (
              <React.Fragment key={n}>
                {idx > 0 && <div style={{ width: 10, height: 1.5, background: MORANDI_LINE, flexShrink: 0 }} />}
                <button
                  type="button"
                  onClick={() => insertNumberTag(n)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: MORANDI_DOTS[(n - 1) % MORANDI_DOTS.length],
                    color: '#fff', border: 'none', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >{n}</button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <textarea
          ref={contentRef}
          value={fields.content}
          onChange={e => set('content', e.target.value)}
          rows={6}
          placeholder={'1. 第一項說明\n2. 第二項說明\n   （縮排為補充說明）\n\n若為 Checklist：每行一項目即可'}
          style={{ ...iStyle, resize: 'vertical' }}
        />
      </div>

      {/* 補充（border-left） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {label('補充')}
        <textarea
          value={fields.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder="注意事項、小提醒…"
          style={{
            ...iStyle, resize: 'vertical',
            borderLeft: `3px solid ${ALERT_BORDER.note}`,
            background: ALERT_BG.note,
            borderRadius: '0 6px 6px 0',
          }}
        />
      </div>

      {/* 參考連結 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label('參考連結')}
        {fields.links.map((lk, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input
              value={lk.text} onChange={e => updateLink(i, 'text', e.target.value)}
              placeholder="連結文字"
              style={{ ...iStyle, flex: 1 }}
            />
            <input
              value={lk.href} onChange={e => updateLink(i, 'href', e.target.value)}
              placeholder="https://…"
              style={{ ...iStyle, flex: 2 }}
            />
            <button
              onClick={() => removeLink(i)}
              style={{
                flexShrink: 0, width: 28, height: 32, borderRadius: 6,
                border: '1px solid #ece8e3', background: '#fff',
                color: '#c4a882', cursor: 'pointer', fontSize: 14,
              }}
            >×</button>
          </div>
        ))}
        {/* 新增一筆連結 */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={newLink.text} onChange={e => setNewLink(l => ({ ...l, text: e.target.value }))}
            placeholder="連結文字"
            style={{ ...iStyle, flex: 1 }}
          />
          <input
            value={newLink.href} onChange={e => setNewLink(l => ({ ...l, href: e.target.value }))}
            placeholder="https://…"
            style={{ ...iStyle, flex: 2 }}
          />
          <button
            onClick={addLink}
            style={{
              flexShrink: 0, width: 28, height: 32, borderRadius: 6,
              border: '1px solid #9eab96', background: 'rgba(158,171,150,0.1)',
              color: '#5a7a5a', cursor: 'pointer', fontSize: 16, fontWeight: 700,
            }}
          >+</button>
        </div>
      </div>

      {/* 按鈕 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={onClose}
          style={{
            padding: '7px 20px', borderRadius: 999,
            border: '1px solid #ece8e3', background: 'none',
            fontSize: 13, color: '#6b7280', cursor: 'pointer',
          }}
        >取消</button>
        <button
          onClick={save} disabled={saving}
          style={{
            padding: '7px 20px', borderRadius: 999,
            border: 'none', background: '#7d9baa',
            fontSize: 13, color: '#fff', cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >{saving ? '儲存中…' : '儲存'}</button>
      </div>
    </div>
  );
};

// ── 覆蓋資料顯示 ──────────────────────────────────────────────────────
const OverrideDisplay = ({ ov, isChecklist = false }: { ov: CardOverride; isChecklist?: boolean }) => (
  <div>
    {(ov.transportTime || ov.cost) && (
      <div style={{ marginBottom: 14 }}>
        {(ov.transportTime || ov.cost) && (
          <div style={{ display: 'flex', gap: 24 }}>
            {ov.transportTime && (
              <div>
                <span className="badge badge--primary" style={{ display: 'inline-block', marginBottom: 4 }}>交通時間</span>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{ov.transportTime}</p>
              </div>
            )}
            {ov.cost && (
              <div>
                <span className="badge badge--primary" style={{ display: 'inline-block', marginBottom: 4 }}>費用</span>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{ov.cost}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )}

    {ov.content && (
      <div style={{ marginBottom: 12 }}>
        {(() => {
          // 彩色圓點時間軸格式（1. xxx 開頭 → numbered；其餘 → plain text）
          const NUMBERED_RE = /^(\d+)\.\s*(.+)/;
          type Group =
            | { type: 'numbered'; num: number; text: string; tails: string[]; key: number }
            | { type: 'other';   text: string; key: number };
          const groups: Group[] = [];
          let cur: Extract<Group, { type: 'numbered' }> | null = null;
          ov.content!.split('\n').forEach((line, i) => {
            const m = NUMBERED_RE.exec(line);
            if (m) {
              if (cur) groups.push(cur);
              cur = { type: 'numbered', num: parseInt(m[1]), text: m[2].trim(), tails: [], key: i };
            } else if (cur) {
              cur.tails.push(line);
            } else {
              groups.push({ type: 'other', text: line, key: i });
            }
          });
          if (cur) groups.push(cur);
          const lastNumIdx = groups.reduce((last, g, i) => g.type === 'numbered' ? i : last, -1);

          return groups.map((g, gi) => {
            if (g.type === 'other') {
              return g.text.trim()
                ? <p key={g.key} style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginLeft: 32, marginBottom: 3 }}>{markBold(g.text)}</p>
                : <div key={g.key} style={{ height: 4 }} />;
            }
            const hasNext = gi < lastNumIdx;
            return (
              <div key={g.key} style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: MORANDI_DOTS[(g.num - 1) % MORANDI_DOTS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 600,
                  }}>{g.num}</div>
                  <div style={{ width: 1, flex: 1, minHeight: 14, background: MORANDI_LINE, marginTop: 4 }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 12, paddingTop: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', lineHeight: 1.6, margin: 0 }}>{markBold(g.text)}</p>
                  {g.tails.map((t, j) =>
                    t.trim()
                      ? <p key={j} style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 3 }}>{markBold(t)}</p>
                      : <div key={j} style={{ height: 4 }} />
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    )}

    {ov.notes && (
      <div style={{
        borderLeft: `2px solid ${ALERT_BORDER.note}`,
        background: ALERT_BG.note,
        borderRadius: '0 6px 6px 0',
        padding: '7px 10px',
        marginTop: 8, marginBottom: 10,
        fontSize: 13, color: '#6b7280', lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
      }}>
        {markBold(ov.notes)}
      </div>
    )}

    {ov.links && ov.links.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 6 }}>
          參考連結
        </div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
          {ov.links.map((lk, i) => (
            <li key={i} style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#c0b8b0', flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
              <a href={lk.href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#7d9baa', textDecoration: 'underline', textUnderlineOffset: 2, lineHeight: 1.5 }}>
                {lk.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// ── 新增卡片 Modal ────────────────────────────────────────────────────
const AddCardModal = ({ dayNum, nextOrder, onClose }: { dayNum: number; nextOrder: number; onClose: () => void; }) => {
  const initFields: EditFields = {
    category: '', name: '', location: '', timeRange: '',
    openHours: '', transportTime: '', cost: '',
    naverQuery: '', googleQuery: '',
    content: '', notes: '', links: [],
  };

  const handleSave = async (fields: EditFields) => {
    await addDoc(CUSTOM_CARDS_COL, {
      dayNum,
      title:         fields.name,
      location:      fields.location,
      timeRange:     fields.timeRange,
      category:      fields.category,
      naverQuery:    fields.naverQuery,
      googleQuery:   fields.googleQuery,
      notes:         fields.content,
      openHours:     fields.openHours,
      transportTime: fields.transportTime,
      cost:          fields.cost,
      supplement:    fields.notes,
      links:         fields.links,
      order:         nextOrder,
      createdAt:     serverTimestamp(),
    });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0ebe5', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>新增行程卡片</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <EditPanel initFields={initFields} onSave={handleSave} onClose={onClose} />
      </div>
    </div>
  );
};

// ── 統一行程卡片 ──────────────────────────────────────────────────────────
const PlanCard = ({
  sectionId, title, category, location, timeRange, naverQuery, googleQuery, openHours,
  section, override, initFields, onSave, onDelete, onMoveUp, onMoveDown, onEdit,
}: {
  sectionId: string;
  title: string; category: string; location: string; timeRange: string;
  naverQuery: string; googleQuery: string; openHours: string;
  section?: FirestoreSection;
  override?: CardOverride;
  initFields: EditFields;
  onSave: (fields: EditFields) => Promise<void>;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit: (ctx: { initFields: EditFields; onSave: (f: EditFields) => Promise<void> }) => void;
}) => {
  const [open, setOpen]           = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  const catStyle = category ? CATEGORY_STYLE[category] : null;
  const district = location || detectDistrict(naverQuery);

  // section with no override → render native blocks; otherwise use OverrideDisplay
  const showNativeBlocks = !!section && !override;
  const contentBlocks = section ? section.blocks.filter(b => b.kind !== 'photo-ref') : [];
  const photoRefBlocks = (section ? section.blocks.filter(b => b.kind === 'photo-ref') : []) as
    Extract<ContentBlock, { kind: 'photo-ref' }>[];
  const staticLinks = photoRefBlocks.flatMap(ref => ref.links);

  return (
    <div style={{ border: '1px solid #ece8e3', borderRadius: 'var(--radius-md)', background: '#fff', marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 10px' }}>
        {/* badge 左欄 + 名稱/位置 右欄 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          {catStyle && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: catStyle.bg, color: catStyle.color, flexShrink: 0, marginTop: 2 }}>
              {category}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <button onClick={() => setOpen(!open)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, color: '#374151', fontSize: 14, lineHeight: 1.4 }}>
                {title}
              </button>
              <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af', flexShrink: 0, lineHeight: 0 }}>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, display: 'block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
            {(district || openHours || timeRange) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {district && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#9eab96', fontWeight: 600 }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {district}
                  </span>
                )}
                {(openHours || timeRange) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#9ca3af' }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {openHours || timeRange}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {/* 第三排：地圖連結 + 操作按鈕，不縮排 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {naverQuery && (
            <a href={`https://map.naver.com/p/search/${encodeURIComponent(naverQuery)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 20, background: '#e8f5e9', color: '#1a7340', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
              Naver
            </a>
          )}
          {googleQuery && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleQuery)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 12px', borderRadius: 20, background: '#e8f0fe', color: '#1a56db', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
              Google
            </a>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {onMoveUp && (
              <button onClick={onMoveUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="18 15 12 9 6 15"/></svg>
              </button>
            )}
            {onMoveDown && (
              <button onClick={onMoveDown} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'none', color: '#c4a882', cursor: 'pointer', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            )}
            <button onClick={() => onEdit({ initFields, onSave })}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 20, flexShrink: 0, background: 'none', border: '1px solid #ece8e3', color: '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              編輯
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ borderTop: `1px solid ${MORANDI_LINE}`, paddingTop: 14 }}>
            {showNativeBlocks ? (
              <>
                {contentBlocks.map((block, i) => renderBlock(block, i))}
                {staticLinks.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MORANDI_LINE}` }}>
                    <button
                      onClick={() => setLinksOpen(!linksOpen)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                    >
                      <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      參考連結
                      <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, marginLeft: 'auto', transform: linksOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {linksOpen && (
                      <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {staticLinks.map((link, i) => {
                          let site = '';
                          try { site = new URL(link.href).hostname.replace('www.', ''); } catch {}
                          return (
                            <li key={i} style={{ display: 'flex', gap: 6 }}>
                              <span style={{ fontSize: 10, color: '#c0b8b0', flexShrink: 0, marginTop: 1, minWidth: 16 }}>{i + 1}.</span>
                              <div>
                                <a href={link.href} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 12, color: '#7d9baa', textDecoration: 'underline', textUnderlineOffset: 2, lineHeight: 1.5 }}>
                                  {link.text}
                                </a>
                                {site && <span style={{ marginLeft: 4, fontSize: 10, color: '#c0b8b0' }}>{site}</span>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </>
            ) : override ? (
              <OverrideDisplay ov={override} />
            ) : (
              <p style={{ fontSize: 13, color: '#c0b8b0', margin: 0 }}>（尚無內容）</p>
            )}
          </div>
          <SectionPhotoGallery sectionId={sectionId} />
        </div>
      )}
    </div>
  );
};

// ── DayPlanView ────────────────────────────────────────────────────────
const DayPlanView = ({ plan }: { plan: DayPlan }) => {
  const [overrides,   setOverrides]   = useState<Record<string, CardOverride>>({});
  const [customCards, setCustomCards] = useState<CustomCard[]>([]);
  const [fsections,   setFsections]   = useState<FirestoreSection[] | null>(null);
  const [seeding,     setSeeding]     = useState(false);
  const [addingCard,  setAddingCard]  = useState(false);
  const [editCtx,     setEditCtx]     = useState<{
    initFields: EditFields;
    onSave: (fields: EditFields) => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const q = query(CARD_OVERRIDES_COL, where('dayNum', '==', plan.day));
    return onSnapshot(q, snap => {
      const map: Record<string, CardOverride> = {};
      snap.docs.forEach(d => { map[d.id] = d.data() as CardOverride; });
      setOverrides(map);
    }, err => console.error(err));
  }, [plan.day]);

  useEffect(() => {
    const q = query(CUSTOM_CARDS_COL, where('dayNum', '==', plan.day));
    return onSnapshot(q, snap => {
      setCustomCards(
        snap.docs
          .map(d => ({
            id:            d.id,
            dayNum:        d.data().dayNum        ?? plan.day,
            title:         d.data().title         ?? '',
            location:      d.data().location      ?? '',
            timeRange:     d.data().timeRange     ?? '',
            notes:         d.data().notes         ?? '',
            order:         d.data().order         ?? 0,
            category:      d.data().category      ?? '',
            naverQuery:    d.data().naverQuery     ?? '',
            googleQuery:   d.data().googleQuery   ?? '',
            openHours:     d.data().openHours     ?? '',
            transportTime: d.data().transportTime ?? '',
            cost:          d.data().cost          ?? '',
            supplement:    d.data().supplement    ?? '',
            links:         d.data().links         ?? [],
          }))
          .sort((a, b) => a.order - b.order)
      );
    }, err => console.error(err));
  }, [plan.day]);

  useEffect(() => {
    const q = query(SECTION_CARDS_COL, where('dayNum', '==', plan.day));
    return onSnapshot(q, snap => {
      setFsections(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as FirestoreSection))
          .sort((a, b) => a.order - b.order)
      );
    }, err => console.error(err));
  }, [plan.day]);

  const seedSections = async () => {
    if (!plan.sections.length || seeding) return;
    setSeeding(true);
    try {
      for (let i = 0; i < plan.sections.length; i++) {
        const s = plan.sections[i];
        await setDoc(doc(db, 'sectionCards', `day${plan.day}-s${s.num}`), {
          dayNum: plan.day, order: i,
          num: s.num, title: s.title, timeRange: s.timeRange,
          mapQuery: s.mapQuery ?? '',
          blocks: s.blocks,
        });
      }
    } finally {
      setSeeding(false);
    }
  };

  // ── 合併兩個集合，按 order 排序 ──
  type CardEntry = {
    key: string; id: string; source: 'section' | 'custom'; order: number;
    sectionId: string; title: string; category: string; location: string; timeRange: string;
    naverQuery: string; googleQuery: string; openHours: string;
    section?: FirestoreSection; override?: CardOverride;
    initFields: EditFields;
    onSave: (fields: EditFields) => Promise<void>;
    onDelete?: () => void;
  };

  const allCards: CardEntry[] = [];

  if (fsections) {
    for (const section of fsections) {
      const sectionId = `day${plan.day}-s${section.num}`;
      const ov = overrides[sectionId];
      if (ov?.deleted) continue;
      allCards.push({
        key: section.id, id: section.id, source: 'section', order: section.order,
        sectionId,
        title:       ov?.name      || section.title,
        category:    ov?.category  || '',
        location:    ov?.location  || '',
        timeRange:   (ov?.timeRange || (section.timeRange ?? '')).split('｜')[0],
        naverQuery:  ov?.naverQuery || ov?.address || section.mapQuery || '',
        googleQuery: ov?.googleQuery || '',
        openHours:   ov?.openHours  || '',
        section,
        override: ov,
        initFields: ov ? overrideToFields(ov, section) : sectionToInitFields(section),
        onSave: async (fields: EditFields) => {
          await setDoc(doc(db, 'cardOverrides', sectionId), { ...fields, dayNum: plan.day, updatedAt: serverTimestamp() });
        },
        onDelete: async () => {
          if (!window.confirm(`確定刪除「${ov?.name || section.title}」？`)) return;
          await deleteDoc(doc(db, 'sectionCards', section.id));
        },
      });
    }
  }

  for (const card of customCards) {
    allCards.push({
      key: card.id, id: card.id, source: 'custom', order: card.order,
      sectionId:   `customCard-${card.id}`,
      title:       card.title,
      category:    card.category      || '',
      location:    card.location      || '',
      timeRange:   card.timeRange,
      naverQuery:  card.naverQuery    || '',
      googleQuery: card.googleQuery   || '',
      openHours:   card.openHours     || '',
      override: {
        content:       card.notes,
        openHours:     card.openHours,
        transportTime: card.transportTime,
        cost:          card.cost,
        notes:         card.supplement,
        links:         card.links,
      },
      initFields: {
        category:      card.category      || '',
        name:          card.title,
        location:      card.location      || '',
        timeRange:     card.timeRange,
        openHours:     card.openHours     || '',
        transportTime: card.transportTime || '',
        cost:          card.cost          || '',
        naverQuery:    card.naverQuery    || '',
        googleQuery:   card.googleQuery   || '',
        content:       card.notes,
        notes:         card.supplement    || '',
        links:         card.links         || [],
      },
      onSave: async (fields: EditFields) => {
        await setDoc(doc(db, 'customCards', card.id), {
          dayNum: card.dayNum, order: card.order,
          title: fields.name, location: fields.location,
          timeRange: fields.timeRange,
          category: fields.category, naverQuery: fields.naverQuery,
          googleQuery: fields.googleQuery, notes: fields.content,
          openHours: fields.openHours, transportTime: fields.transportTime,
          cost: fields.cost, supplement: fields.notes, links: fields.links,
          updatedAt: serverTimestamp(),
        });
      },
      onDelete: async () => {
        if (window.confirm(`確定刪除「${card.title}」？`))
          await deleteDoc(doc(db, 'customCards', card.id));
      },
    });
  }

  allCards.sort((a, b) => a.order - b.order);

  const moveCard = async (idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= allCards.length) return;
    const a = allCards[idx], b = allCards[swapIdx];
    const colA = a.source === 'section' ? 'sectionCards' : 'customCards';
    const colB = b.source === 'section' ? 'sectionCards' : 'customCards';
    await Promise.all([
      updateDoc(doc(db, colA, a.id), { order: b.order }),
      updateDoc(doc(db, colB, b.id), { order: a.order }),
    ]);
  };

  const nextOrder = allCards.length > 0 ? Math.max(...allCards.map(c => c.order)) + 1 : 100;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #ece8e3' }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: '#7d9baa', flexShrink: 0 }} />
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0 }}>今日行程</h3>
      </div>

      {fsections !== null && fsections.length === 0 && plan.sections.length > 0 && (
        <button
          onClick={seedSections}
          disabled={seeding}
          style={{
            width: '100%', padding: '10px 0', marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            border: '1px dashed #9eab96', borderRadius: 'var(--radius-md)',
            background: 'rgba(158,171,150,0.08)', cursor: seeding ? 'not-allowed' : 'pointer',
            fontSize: 13, color: '#9eab96', fontWeight: 500,
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.75"/>
          </svg>
          {seeding ? '初始化中...' : '將行程資料移入 Firestore'}
        </button>
      )}

      {allCards.map(({ key, sectionId, title, category, location, timeRange, naverQuery, googleQuery, openHours, section, override, initFields, onSave, onDelete }, idx, arr) => (
        <PlanCard
          key={key}
          sectionId={sectionId}
          title={title}
          category={category}
          location={location}
          timeRange={timeRange}
          naverQuery={naverQuery}
          googleQuery={googleQuery}
          openHours={openHours}
          section={section}
          override={override}
          initFields={initFields}
          onSave={onSave}
          onDelete={onDelete}
          onEdit={setEditCtx}
          onMoveUp={idx > 0 ? () => moveCard(idx, -1) : undefined}
          onMoveDown={idx < arr.length - 1 ? () => moveCard(idx, 1) : undefined}
        />
      ))}

      {editCtx && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
          onClick={() => setEditCtx(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0ebe5', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>編輯卡片</span>
              <button onClick={() => setEditCtx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <EditPanel initFields={editCtx.initFields} onSave={editCtx.onSave} onClose={() => setEditCtx(null)} />
          </div>
        </div>
      )}

      <button
        onClick={() => setAddingCard(true)}
        style={{
          width: '100%', padding: '10px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          border: '1px dashed #c4a882', borderRadius: 'var(--radius-md)',
          background: 'none', cursor: 'pointer',
          fontSize: 13, color: '#c4a882', fontWeight: 500, marginTop: 4,
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        新增行程卡片
      </button>

      {addingCard && (
        <AddCardModal dayNum={plan.day} nextOrder={nextOrder} onClose={() => setAddingCard(false)} />
      )}
    </div>
  );
};

export default DayPlanView;
