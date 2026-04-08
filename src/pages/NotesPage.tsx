import { useState } from 'react';

type DotColor = 'red' | 'yellow' | 'green' | 'blue';

interface Note {
  id: number;
  text: string;
  date: string;
  color: DotColor;
}

const INIT_NOTES: Note[] = [
  { id: 1, text: '西面地鐵站 2 號出口附近有家 24 小時便利商店，早餐可以在那解決。', date: '06/10', color: 'blue' },
  { id: 2, text: '廣安大橋夜景最佳拍攝點：廣安海水浴場西側堤岸，帶腳架效果更好！', date: '06/11', color: 'green' },
  { id: 3, text: '海雲台市場的炒年糕超好吃，記得多買一份！價格約 ₩3,000。', date: '06/12', color: 'yellow' },
];

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(INIT_NOTES);
  const [draft, setDraft] = useState('');

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    const colors: DotColor[] = ['blue', 'green', 'yellow', 'red'];
    const color = colors[notes.length % colors.length];
    setNotes([{ id: Date.now(), text, date: '今天', color }, ...notes]);
    setDraft('');
  };

  const deleteNote = (id: number) => setNotes(notes.filter((n) => n.id !== id));

  return (
    <>
      <div className="page-trip-header">
        <div className="page-trip-header__title">旅遊備註</div>
        <div className="page-trip-header__date">韓國釜山自由行 5天4夜</div>
      </div>

      <div className="section-px">
        {/* 新增表單 */}
        <div className="note-compose">
          <textarea
            placeholder="記錄旅途中的靈感、提醒或注意事項…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="note-compose__actions">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)' }}>
              {draft.length} 字
            </span>
            <button
              className="btn btn--dark"
              onClick={addNote}
            >
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增備註
            </button>
          </div>
        </div>

        {/* 備註列表 */}
        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <span className={`note-dot note-dot--${note.color}`} style={{ marginTop: 4 }} />
            <div className="note-card__body">
              <div className="note-card__date">
                <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {note.date}
              </div>
              <div className="note-card__text">{note.text}</div>
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
