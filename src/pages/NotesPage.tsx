import { useState } from 'react';
import { INIT_NOTES, NoteItem, DotColor, TRIP_INFO } from '../data/mockData';

const formatDate = () => {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${m}月${d}日 ${hh}:${mm}`;
};

const NotesPage = () => {
  const [notes, setNotes] = useState<NoteItem[]>(INIT_NOTES);
  const [draft, setDraft] = useState('');

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    const colors: DotColor[] = ['blue', 'green', 'yellow', 'red'];
    const color = colors[notes.length % colors.length];
    setNotes([{ id: Date.now(), text, date: formatDate(), color }, ...notes]);
    setDraft('');
  };

  const deleteNote = (id: number) => setNotes(notes.filter((n) => n.id !== id));

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
          <div className="note-compose__actions">
            <button className="btn btn--primary-light">
              <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              上傳圖片
            </button>
            <button className="btn btn--dark" onClick={addNote}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增
            </button>
          </div>
        </div>

        {/* 備註列表 */}
        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <div className="note-card__body">
              {/* dot 在 date 行內 */}
              <p className="note-card__date">
                <span className={`note-dot note-dot--${note.color}`} />
                {note.date}
              </p>
              <p className="note-card__text">{note.text}</p>
              {note.img && (
                <img src={note.img} alt="備註附圖" className="note-card__img" />
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
