import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadImage } from '../lib/storage';
import { TRIP_INFO } from '../data/mockData';

/* ── Types ─────────────────────────────────────────────── */
type DotColor = 'yellow' | 'green' | 'blue';

interface Note {
  id: string;
  text: string;
  imageUrl: string;
  dotColor: DotColor;
  createdAt: Timestamp | null;
}

/* ── Helpers ────────────────────────────────────────────── */
const DOT_COLORS: DotColor[] = ['yellow', 'green', 'blue'];

const formatTs = (ts: Timestamp | null): string => {
  if (!ts) return '';
  const d = ts.toDate();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}月${day}日 ${hh}:${mm}`;
};

const NOTES_COL = collection(db, 'notes');

/* ── NotesPage ──────────────────────────────────────────── */
const NotesPage = () => {
  const [notes, setNotes]         = useState<Note[]>([]);
  const [loading, setLoading]     = useState(true);
  const [draft, setDraft]         = useState('');
  const [pendingImg, setPendingImg] = useState<string>('');   // preview URL
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding]       = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const colorIdx                  = useRef(0);

  /* ── 即時監聽 Firestore ── */
  useEffect(() => {
    const q = query(NOTES_COL, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotes(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id:        d.id,
              text:      data.text      ?? '',
              imageUrl:  data.imageUrl  ?? '',
              dotColor:  data.dotColor  ?? 'blue',
              createdAt: data.createdAt ?? null,
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('notes onSnapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /* ── 選擇圖片（暫存，不立即上傳） ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingImg(URL.createObjectURL(file));
  };

  /* ── 新增 note ── */
  const addNote = async () => {
    const text = draft.trim();
    if (!text || adding) return;

    setAdding(true);
    try {
      let imageUrl = '';

      // 若有待上傳圖片，先上傳 Cloudinary
      if (pendingFile) {
        setUploading(true);
        const result = await uploadImage(pendingFile, 'korea-travel/notes');
        imageUrl = result.url;
        setUploading(false);
      }

      const dotColor = DOT_COLORS[colorIdx.current % DOT_COLORS.length];
      colorIdx.current += 1;

      await addDoc(NOTES_COL, {
        text,
        imageUrl,
        dotColor,
        createdAt: serverTimestamp(),
      });

      setDraft('');
      setPendingImg('');
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('addNote error:', err);
      setUploading(false);
    } finally {
      setAdding(false);
    }
  };

  /* ── 刪除 note ── */
  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      console.error('deleteNote error:', err);
    }
  };

  /* ── 清除待上傳圖片 ── */
  const clearPendingImg = () => {
    setPendingImg('');
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Render ── */
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

        {/* 新增表單 */}
        <div className="note-compose mb-6">
          <textarea
            placeholder="有什麼想記下來的嗎？行前提醒、購物清單、突發事項…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          {/* 圖片預覽 */}
          {pendingImg && (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <img
                src={pendingImg}
                alt="預覽"
                style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 140, objectFit: 'cover' }}
              />
              <button
                onClick={clearPendingImg}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(0,0,0,.5)', color: 'white',
                  border: 'none', borderRadius: '50%',
                  width: 24, height: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, lineHeight: 1,
                }}
                aria-label="移除圖片"
              >×</button>
            </div>
          )}

          <div className="note-compose__actions">
            {/* 隱藏的 file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              className="btn btn--primary-light"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {pendingImg ? '已選擇' : '上傳圖片'}
            </button>
            <button
              className="btn btn--dark"
              onClick={addNote}
              disabled={adding || !draft.trim()}
            >
              {adding ? (
                uploading ? '上傳中…' : '新增中…'
              ) : (
                <>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  新增
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            讀取中…
          </div>
        )}

        {/* 備註列表 */}
        {!loading && notes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            還沒有備註，新增第一筆吧！
          </div>
        )}

        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <div className="note-card__body">
              <p className="note-card__date">
                <span className={`note-dot note-dot--${note.dotColor}`} />
                {formatTs(note.createdAt)}
              </p>
              <p className="note-card__text">{note.text}</p>
              {note.imageUrl && (
                <img src={note.imageUrl} alt="備註附圖" className="note-card__img" />
              )}
            </div>
            <button
              className="note-card__delete"
              onClick={() => deleteNote(note.id)}
              aria-label="刪除備註"
            >
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        ))}

      </div>
    </>
  );
};

export default NotesPage;
