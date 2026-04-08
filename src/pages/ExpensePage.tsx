import { useState } from 'react';
import {
  EXPENSE_CATS, EXPENSE_ITEMS, ExpenseItem,
  PayType, Category, TRIP_INFO,
} from '../data/mockData';

/* ── category icon map ─────────────────────────────────── */
const CAT_ICONS: Record<Category, React.ReactNode> = {
  餐飲: (
    <svg viewBox="0 0 24 24">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  購物: (
    <svg viewBox="0 0 24 24">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  交通: (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="3" width="16" height="16" rx="2" />
      <path d="M4 11h16" /><path d="M12 3v8" />
      <path d="M8 19l-2 3" /><path d="M16 19l2 3" />
    </svg>
  ),
  景點: (
    <svg viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

const CATS: Category[] = ['餐飲', '購物', '交通', '景點'];

/* ── 記帳頁 ───────────────────────────────────────────── */
const ExpensePage = () => {
  const [items, setItems]         = useState<ExpenseItem[]>(EXPENSE_ITEMS);
  const [showForm, setShowForm]   = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCat, setNewCat]       = useState<Category>('餐飲');
  const [newType, setNewType]     = useState<PayType>('cash');

  const addItem = () => {
    const title = newTitle.trim();
    const amount = newAmount.trim();
    if (!title || !amount) return;
    const now = new Date();
    setItems([{
      id: Date.now(),
      iconType: newCat,
      title,
      date: `${String(now.getMonth() + 1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`,
      category: newCat,
      type: newType,
      price: `₩ ${Number(amount).toLocaleString()}`,
    }, ...items]);
    setNewTitle(''); setNewAmount(''); setShowForm(false);
  };

  return (
    <>
      {/* 頁首 */}
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

      {/* 總花費卡片（template .expense-total） */}
      <div className="expense-total">
        <p className="expense-total__label">總花費</p>
        <h1 className="expense-total__amount">₩ 64,000</h1>
        <p className="expense-total__sub">~ TWD 1,542</p>
      </div>

      {/* 分類血條（template .expense-cats） */}
      <div className="expense-cats">
        <p className="expense-cat-hint">── 花費分類 ──</p>
        {EXPENSE_CATS.map((c) => (
          <div key={c.name} className="expense-cat-item">
            <div className="expense-cat-header">
              <span className="expense-cat-dot" style={{ background: c.color }} />
              <span className="expense-cat-name">{c.name}</span>
              <span className="expense-cat-amt">{c.amt}</span>
              <span className="expense-cat-pct">{c.pct}%</span>
            </div>
            <div className="expense-cat-track">
              <div
                className="expense-cat-fill"
                style={{ width: `${c.pct}%`, ['--bar-color' as string]: c.color } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="section-px">
        {/* 標題列 + 新增按鈕（template icon button） */}
        <div className="section-title-row">
          <h2>記帳明細</h2>
          <button
            className="btn--icon"
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? 'var(--color-text-main)' : 'var(--color-primary-light)',
              color:      showForm ? 'white'                   : 'var(--color-primary)',
              padding: 10,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              {showForm
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>
              }
            </svg>
          </button>
        </div>

        {/* 新增表單 */}
        {showForm && (
          <div className="expense-form-card">
            <h3 className="expense-form-card__title">新增記帳</h3>
            <input className="expense-form-input" placeholder="品項名稱" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <input className="expense-form-input" placeholder="金額（₩）" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            <div className="expense-form-row">
              {CATS.map(c => (
                <button key={c} className={`expense-form-btn${newCat === c ? ' is-active' : ''}`} onClick={() => setNewCat(c)}>{c}</button>
              ))}
            </div>
            <div className="expense-form-row">
              {(['cash', 'card'] as PayType[]).map(t => (
                <button key={t} className={`expense-form-btn${newType === t ? ' is-active' : ''}`} onClick={() => setNewType(t)}>
                  {t === 'cash' ? '現金' : '刷卡'}
                </button>
              ))}
            </div>
            <div className="expense-form-actions">
              <button className="btn btn--primary-light" style={{ flex: 1 }} onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn--dark" style={{ flex: 1 }} onClick={addItem}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                新增
              </button>
            </div>
          </div>
        )}

        {/* 明細列表（template .expense-row） */}
        {items.map((item) => (
          <div key={item.id} className="expense-row">
            <div className="expense-row__left">
              <div className="expense-row__icon">{CAT_ICONS[item.iconType]}</div>
              <div>
                <h4 className="expense-row__title">{item.title}</h4>
                <p className="expense-row__date">
                  <span className={`expense-badge expense-badge--${item.type}`}>
                    {item.type === 'cash' ? '現金' : '刷卡'}
                  </span>
                  {item.date} · {item.category}
                </p>
              </div>
            </div>
            <div className="expense-row__price">{item.price}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ExpensePage;
