import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp, where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadImage } from '../../lib/storage';
import type { DayPlan, DaySection, ContentBlock, Step } from '../../types/dayPlan';

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

// Renders **bold** markers as semi-bold primary text (no red/pink)
const markBold = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <span key={i} style={{ color: '#374151', fontWeight: 700 }}>{part.slice(2, -2)}</span>
      : part
  );
};

// ── 01~05 唯一參考連結 ────────────────────────────────────────────────
const TRANSPORT_LINKS = [
  { href: 'https://debbiechien.com/busan-gimhae-airport-transportation/', label: '出機場路線・輕軌搭乘步驟圖解',                  site: 'Debbie Chien' },
  { href: 'https://13blog.tw/busan-tourism-240613/',                      label: '機場出口照片教學 + 儲值機中文介面操作圖解',      site: '13Blog' },
  { href: 'https://panpanlife.com/busan-arrival/',                        label: '2026 最新入境全程圖解 + 自助儲值完整流程',       site: 'PanPan Life' },
  { href: 'https://rowing2005.pixnet.net/blog/posts/9577267384',          label: 'Money Box 換錢所外觀・換匯步驟實拍',            site: '呆呆齡' },
  { href: 'https://lizzzstyle.tw/money-box-gimhae/',                     label: 'Money Box 換錢全攻略（人工窗口 + 自助機）',     site: 'Liz Style' },
  { href: 'https://rebeccafoodaily.com/gimhae-airport-money-box/',       label: 'Money Box 黃色招牌外觀實拍',                    site: 'Rebecca' },
  { href: 'https://judyer.com/lightrailno2/',                            label: '輕軌月台實拍 + 沙上站換乘走廊完整照片',         site: '小梨 Judyer' },
  { href: 'https://www.funliday.com/posts/korean-travel-busan-airport-to-downtown-lrt/', label: '輕軌搭乘步驟圖・換乘地板綠色指標照片', site: 'Funliday' },
  { href: 'https://nicklee.tw/2460/pus-airport-transportation/',          label: '換乘全程路線圖解・行李過閘方式・西面站出站說明', site: '小氣少年' },
  { href: 'https://www.funliday.com/posts/korea-travel-busan-subway-transfer-informaiton/', label: '沙上地鐵站電梯位置 + 行李友善閘口照片', site: 'Funliday' },
];

// ── 號碼標籤（純文字） ────────────────────────────────────────────────
const NumLabel = ({ num }: { num: string }) => (
  <span style={{
    fontSize: 15,
    fontWeight: 700,
    color: 'rgb(55,65,81)',
    fontFamily: 'monospace',
    flexShrink: 0,
    minWidth: 24,
  }}>
    {num}
  </span>
);

// ── 步驟圓點（莫蘭迪，全局 idx） ──────────────────────────────────────
const StepItem = ({ step, idx }: { step: Step; idx: number }) => {
  const dotColor = MORANDI_DOTS[idx % MORANDI_DOTS.length];
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* 圓點 + 連線 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 24, height: 24,
          borderRadius: '50%',
          background: dotColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 11, fontWeight: 600,
          flexShrink: 0,
        }}>
          {idx + 1}
        </div>
        <div style={{ width: 1, flex: 1, background: MORANDI_LINE, marginTop: 4 }} />
      </div>
      {/* 內容 */}
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
            padding: '5px 8px',
            marginTop: 8,
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.6,
          }}>
            {markBold(a.text)}
          </div>
        ))}
        {step.tickets.map((t, i) => (
          <div key={i} style={{
            borderLeft: `2px solid ${MORANDI_DOTS[2]}`,
            background: 'rgba(196,168,130,0.08)',
            borderRadius: '0 6px 6px 0',
            padding: '5px 8px',
            marginTop: 8,
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.6,
            fontFamily: 'monospace',
          }}>
            {markBold(t.text)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── renderBlock（stepOffset 用於全局連續編號） ─────────────────────────
const renderBlock = (block: ContentBlock, idx: number, stepOffset = 0) => {
  switch (block.kind) {

    case 'info-card':
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          {block.rows.map((row, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: MORANDI_LINE, margin: '10px 0' }} />}
              <div>
                <span className="badge badge--primary" style={{ display: 'inline-block', marginBottom: 5 }}>
                  {row.label}
                </span>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                  {markBold(row.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'steps':
      return (
        <div key={idx} style={{ marginBottom: 4 }}>
          {block.items.map((step, i) => (
            <StepItem key={i} step={step} idx={stepOffset + i} />
          ))}
        </div>
      );

    case 'alert':
      return (
        <div key={idx} style={{
          borderLeft: `2px solid ${ALERT_BORDER[block.variant] ?? '#7d9baa'}`,
          background: ALERT_BG[block.variant] ?? ALERT_BG.note,
          borderRadius: '0 6px 6px 0',
          padding: '5px 8px',
          marginTop: 8,
          marginBottom: 10,
          fontSize: 13,
          color: '#6b7280',
          lineHeight: 1.6,
        }}>
          {markBold(block.text)}
        </div>
      );

    case 'ticket':
      return (
        <div key={idx} style={{
          borderLeft: `2px solid ${MORANDI_DOTS[2]}`,
          background: 'rgba(196,168,130,0.08)',
          borderRadius: '0 6px 6px 0',
          padding: '5px 8px',
          marginTop: 8,
          marginBottom: 10,
          fontSize: 13,
          color: '#6b7280',
          lineHeight: 1.6,
          fontFamily: 'monospace',
        }}>
          {markBold(block.text)}
        </div>
      );

    case 'menu':
      return (
        <div key={idx} style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: '#7d9baa',
            letterSpacing: '0.04em',
            marginBottom: 8,
          }}>
            {block.header}
          </div>
          {block.items.map((item, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: MORANDI_LINE, margin: '5px 0' }} />}
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                {item.name}
                {item.note && (
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>　{item.note}</span>
                )}
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

    case 'photo-ref':
    default:
      return null;
  }
};

// ── 照片上傳 ──────────────────────────────────────────────────────────
interface SectionPhoto { id: string; imageUrl: string; createdAt: Timestamp | null; }
const PHOTOS_COL = collection(db, 'sectionPhotos');

const SectionPhotoGallery = ({ sectionId }: { sectionId: string }) => {
  const [photos, setPhotos]       = useState<SectionPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(PHOTOS_COL, where('sectionId', '==', sectionId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setPhotos(snap.docs.map(d => ({
        id: d.id,
        imageUrl:  d.data().imageUrl  ?? '',
        createdAt: d.data().createdAt ?? null,
      })));
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
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: '#7d9baa', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            opacity: uploading ? 0.5 : 1,
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
                  position: 'absolute', top: 4, right: 4,
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.45)',
                  color: 'white', fontSize: 11,
                  border: 'none', cursor: 'pointer',
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

// ── MergedTransportCard（01~05 合併，全局步驟序號） ──────────────────
const MergedTransportCard = ({ sections }: { sections: DaySection[] }) => {
  const [open, setOpen]           = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  // 帶 section 標記的 block 列表（排除 photo-ref）
  const blocksWithMeta = sections.flatMap(s =>
    s.blocks
      .filter(b => b.kind !== 'photo-ref')
      .map(b => ({ block: b, sectionNum: s.num, sectionTitle: s.title }))
  );

  // 預計算全局步驟偏移
  let runningSteps = 0;
  const processedItems = blocksWithMeta.map(item => {
    const stepOffset = runningSteps;
    if (item.block.kind === 'steps') {
      runningSteps += (item.block as Extract<ContentBlock, { kind: 'steps' }>).items.length;
    }
    return { ...item, stepOffset };
  });

  // 合併時間範圍
  const t1 = sections[0]?.timeRange?.split('–')[0]?.split('｜')[0]?.trim() ?? '';
  const t2 = sections[sections.length - 1]?.timeRange?.split('｜')[0]?.split('–').pop()?.trim() ?? '';
  const timeRange = t1 && t2 ? `${t1}–${t2}` : sections[0]?.timeRange ?? '';

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid #ece8e3',
      background: '#fff',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* 卡片 header */}
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <NumLabel num="01" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>
          機場出發・抵達西面飯店
        </span>
        {timeRange && (
          <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{timeRange}</span>
        )}
        <svg viewBox="0 0 24 24" style={{
          width: 15, height: 15, color: '#9ca3af', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }} fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${MORANDI_LINE}`, paddingTop: 14 }}>

          {processedItems.map((item, i) => {
            const prev = processedItems[i - 1];
            const sectionChanged = i > 0 && prev.sectionNum !== item.sectionNum;
            return (
              <div key={i}>
                {sectionChanged && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
                    <div style={{ flex: 1, height: 1, background: MORANDI_LINE }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#b09898', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                      {item.sectionTitle}
                    </span>
                    <div style={{ flex: 1, height: 1, background: MORANDI_LINE }} />
                  </div>
                )}
                {renderBlock(item.block, i, item.stepOffset)}
              </div>
            );
          })}

          {/* 參考連結 */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MORANDI_LINE}` }}>
            <button
              onClick={() => setLinksOpen(!linksOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, color: '#9ca3af',
                letterSpacing: '0.05em', background: 'none', border: 'none',
                cursor: 'pointer', width: '100%',
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              參考連結
              <svg viewBox="0 0 24 24" style={{
                width: 13, height: 13, marginLeft: 'auto',
                transform: linksOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
              }} fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {linksOpen && (
              <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TRANSPORT_LINKS.map((link, i) => (
                  <li key={i} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, color: '#c0b8b0', flexShrink: 0, marginTop: 1, minWidth: 16 }}>
                      {i + 1}.
                    </span>
                    <div>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#7d9baa', textDecoration: 'underline', textUnderlineOffset: 2, lineHeight: 1.5 }}
                      >
                        {link.label}
                      </a>
                      <span style={{ marginLeft: 4, fontSize: 10, color: '#c0b8b0' }}>{link.site}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 我的照片 */}
          <SectionPhotoGallery sectionId="day1-transport" />
        </div>
      )}
    </div>
  );
};

// ── SectionCard（06~09，顯示連續 02~05） ─────────────────────────────
const SectionCard = ({ section, displayNum }: { section: DaySection; displayNum: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid #ece8e3',
      background: '#fff',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <NumLabel num={displayNum} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>
          {section.title}
        </span>
        {section.timeRange && (
          <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>
            {section.timeRange.split('｜')[0]}
          </span>
        )}
        <svg viewBox="0 0 24 24" style={{
          width: 15, height: 15, color: '#9ca3af', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }} fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${MORANDI_LINE}`, paddingTop: 14 }}>
          {section.blocks.map((block, i) => renderBlock(block, i))}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${MORANDI_LINE}` }}>
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(section.title)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 0', borderRadius: 'var(--radius-md)',
                background: '#e8f5e9', color: '#1a7340',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Naver Map
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(section.title + ' 부산')}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 0', borderRadius: 'var(--radius-md)',
                background: '#e8f0fe', color: '#1a56db',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Google Map
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ── DayPlanView ────────────────────────────────────────────────────────
const TRANSPORT_NUMS = new Set(['01', '02', '03', '04', '05']);
const SKIP_NUMS      = new Set(['10']);

const DayPlanView = ({ plan }: { plan: DayPlan }) => {
  const transportSections = plan.sections.filter(s => TRANSPORT_NUMS.has(s.num));
  const regularSections   = plan.sections.filter(s => !TRANSPORT_NUMS.has(s.num) && !SKIP_NUMS.has(s.num));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, color: '#7d9baa', flexShrink: 0 }}
          fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: 0 }}>今日行程</h3>
      </div>

      {transportSections.length > 0 && (
        <MergedTransportCard sections={transportSections} />
      )}

      {regularSections.map((section, i) => (
        <SectionCard
          key={section.num}
          section={section}
          displayNum={String(i + 2).padStart(2, '0')}
        />
      ))}
    </div>
  );
};

export default DayPlanView;
