import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadImage } from '../lib/storage';
import { TRIP_INFO } from '../data/mockData';
import TaxiGuide from '../components/TaxiGuide';
import CatchTableGuide from '../components/CatchTableGuide';
import ToiletGuide from '../components/ToiletGuide';

/* ── Types ─────────────────────────────────────────────── */
type DotColor = 'yellow' | 'green' | 'blue';

interface Note {
  id: string;
  title: string;
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

const URL_RE = /(https?:\/\/[^\s]+)/g;

const renderWithLinks = (text: string) =>
  text.split(URL_RE).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="note-link">
        {part}
      </a>
    ) : (
      part
    )
  );

const NOTES_COL = collection(db, 'notes');

/* ── NotesPage ──────────────────────────────────────────────────── */
const NotesPage = () => {
  const [notes, setNotes]         = useState<Note[]>([]);
  const [loading, setLoading]     = useState(true);
  const [titleDraft, setTitleDraft] = useState('');
  const [draft, setDraft]         = useState('');
  const [pendingImg, setPendingImg] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding]       = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const colorIdx                  = useRef(0);

  const [editingId, setEditingId]             = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft]   = useState('');
  const [editDraft, setEditDraft]             = useState('');
  const [editPendingImg, setEditPendingImg]   = useState('');
  const [editPendingFile, setEditPendingFile] = useState<File | null>(null);
  const [editKeepImg, setEditKeepImg]         = useState(true);
  const [editUploading, setEditUploading]     = useState(false);
  const [editSaving, setEditSaving]           = useState(false);
  const editFileInputRef                      = useRef<HTMLInputElement>(null);

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
              title:     data.title     ?? '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingImg(URL.createObjectURL(file));
  };

  const addNote = async () => {
    const text = draft.trim();
    if (!text || adding) return;

    setAdding(true);
    try {
      let imageUrl = '';
      if (pendingFile) {
        setUploading(true);
        const result = await uploadImage(pendingFile, 'korea-travel/notes');
        imageUrl = result.url;
        setUploading(false);
      }

      const dotColor = DOT_COLORS[colorIdx.current % DOT_COLORS.length];
      colorIdx.current += 1;

      await addDoc(NOTES_COL, {
        title: titleDraft.trim(),
        text,
        imageUrl,
        dotColor,
        createdAt: serverTimestamp(),
      });

      setTitleDraft('');
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

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      console.error('deleteNote error:', err);
    }
  };

  const clearPendingImg = () => {
    setPendingImg('');
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitleDraft(note.title);
    setEditDraft(note.text);
    setEditPendingImg('');
    setEditPendingFile(null);
    setEditKeepImg(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitleDraft('');
    setEditDraft('');
    setEditPendingImg('');
    setEditPendingFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPendingFile(file);
    setEditPendingImg(URL.createObjectURL(file));
    setEditKeepImg(false);
  };

  const saveEdit = async (note: Note) => {
    const text = editDraft.trim();
    if (!text || editSaving) return;
    setEditSaving(true);
    try {
      let imageUrl = editKeepImg ? note.imageUrl : '';
      if (editPendingFile) {
        setEditUploading(true);
        const result = await uploadImage(editPendingFile, 'korea-travel/notes');
        imageUrl = result.url;
        setEditUploading(false);
      }
      await updateDoc(doc(db, 'notes', note.id), {
        title: editTitleDraft.trim(),
        text,
        imageUrl,
      });
      setEditingId(null);
      setEditTitleDraft('');
      setEditDraft('');
      setEditPendingImg('');
      setEditPendingFile(null);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } catch (err) {
      console.error('saveEdit error:', err);
      setEditUploading(false);
    } finally {
      setEditSaving(false);
    }
  };

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

        <TaxiGuide />

        <CatchTableGuide />

        <ToiletGuide />

        <div className="note-compose mb-6">
          <input
            type="text"
            className="note-compose__title-input"
            placeholder="標題（選填）"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
          />
          <textarea
            placeholder="有什麼想記下來的嗎？行前提醒、購物清單、突發事項…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

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

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            讀取中…
          </div>
        )}

        {!loading && notes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            還沒有清單項目，新增第一筆吧！
          </div>
        )}

        <input
          ref={editFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleEditFileChange}
        />

        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <div className="note-card__body">
              <p className="note-card__date">
                <span className={`note-dot note-dot--${note.dotColor}`} />
                {formatTs(note.createdAt)}
              </p>

              {editingId === note.id ? (
                <>
                  <input
                    type="text"
                    value={editTitleDraft}
                    onChange={(e) => setEditTitleDraft(e.target.value)}
                    placeholder="標題（選填）"
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-input)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      border: 'none',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                      outline: 'none',
                      marginBottom: 8,
                      fontFamily: 'inherit',
                    }}
                  />
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-input)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      border: 'none',
                      fontSize: 'var(--text-sm)',
                      resize: 'none',
                      minHeight: 72,
                      color: 'var(--color-text-main)',
                      outline: 'none',
                      marginBottom: 10,
                      fontFamily: 'inherit',
                      lineHeight: 1.6,
                    }}
                  />

                  {note.imageUrl && editKeepImg && !editPendingImg && (
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <img
                        src={note.imageUrl}
                        alt="目前圖片"
                        style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 120, objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => setEditKeepImg(false)}
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

                  {editPendingImg && (
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <img
                        src={editPendingImg}
                        alt="新圖預覽"
                        style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 120, objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => {
                          setEditPendingImg('');
                          setEditPendingFile(null);
                          setEditKeepImg(!!note.imageUrl);
                          if (editFileInputRef.current) editFileInputRef.current.value = '';
                        }}
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          background: 'rgba(0,0,0,.5)', color: 'white',
                          border: 'none', borderRadius: '50%',
                          width: 24, height: 24, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, lineHeight: 1,
                        }}
                        aria-label="移除新圖片"
                      >×</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="expense-form-btn"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={editUploading}
                      style={{ flex: 1 }}
                    >
                      換圖片
                    </button>
                    <button
                      className="expense-form-cancel"
                      onClick={cancelEdit}
                      style={{ flex: 1 }}
                    >
                      取消
                    </button>
                    <button
                      className="expense-form-submit"
                      onClick={() => saveEdit(note)}
                      disabled={!editDraft.trim() || editSaving}
                      style={{ flex: 1 }}
                    >
                      {editSaving ? (editUploading ? '上傳中…' : '儲存中…') : '儲存'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {note.title && <p className="note-card__title">{note.title}</p>}
                  <p className="note-card__text">{renderWithLinks(note.text)}</p>
                  {note.imageUrl && (
                    <img src={note.imageUrl} alt="清單附圖" className="note-card__img" />
                  )}
                </>
              )}
            </div>

            {editingId !== note.id && (
              <div className="note-card__actions">
                <button
                  className="note-card__edit"
                  onClick={() => startEdit(note)}
                  aria-label="編輯項目"
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="note-card__delete"
                  onClick={() => deleteNote(note.id)}
                  aria-label="刪除項目"
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

      </div>
    </>
  );
};

export default NotesPage;
