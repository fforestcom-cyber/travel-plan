import { useState, useEffect } from 'react';
import {
  collection, addDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRIP_INFO, EXCHANGE } from '../data/mockData';

/* ── Types ─────────────────────────────────────────────── */
type Category      = '餐飲' | '購物' | '交通' | '景點' | '住宿' | '其他';
type PaymentMethod = '現金' | '刷卡';

interface Expense {
  id:            string;
  title:         string;
  amount:        number;
  category:      Category;
  paymentMethod: PaymentMethod;
  date:          string;       // YYYY-MM-DD
  createdAt:     Timestamp | null;
}

/* ── Constants ──────────────────────────────────────────── */
const CATS: Category[]             = ['餐飲', '購物', '交通', '景點', '住宿', '其他'];
const PAY_METHODS: PaymentMethod[] = ['現金', '刷卡'];

const CAT_COLOR: Record<Category, string> = {
  餐飲: '#7D9BAA',
  購物: '#B09080',
  交通: '#849E88',
  景點: '#9888AA',
  住宿: '#ADB5AB',
  其他: '#C9D3D5',
};


const EXPENSES_COL = collection(db, 'expenses');

/* ── 日期格式 YYYY-MM-DD → MM/DD ──────────────────────── */
const fmtDate = (d: string) => {
  const parts = d.split('-');
  if (parts.length < 3) return d;
  return `${parts[1]}/${parts[2]}`;
};

/* ── 今日 YYYY-MM-DD ───────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);

/* ── ExpensePage ────────────────────────────────────────── */
const ExpensePage = () => {
  const [items, setItems]       = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding]     = useState(false);

  /* form fields */
  const [fTitle,  setFTitle]  = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fCat,    setFCat]    = useState<Category>('餐飲');
  const [fPay,    setFPay]    = useState<PaymentMethod>('現金');
  const [fDate,   setFDate]   = useState(today());

  /* edit state */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eTitle,  setETitle]  = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eCat,    setECat]    = useState<Category>('餐飲');
  const [ePay,    setEPay]    = useState<PaymentMethod>('現金');
  const [eDate,   setEDate]   = useState('');
  const [saving,  setSaving]  = useState(false);

  /* ── 即時監聽 ── */
  useEffect(() => {
    const q = query(EXPENSES_COL, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id:            d.id,
              title:         data.title         ?? '',
              amount:        data.amount        ?? 0,
              category:      data.category      ?? '其他',
              paymentMethod: data.paymentMethod ?? '現金',
              date:          data.date          ?? '',
              createdAt:     data.createdAt     ?? null,
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('expenses onSnapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /* ── 計算統計 ── */
  const totalKrw = items.reduce((s, i) => s + i.amount, 0);
  const totalTwd = Math.round(totalKrw / EXCHANGE.rate);

  const catStats = CATS
    .map((cat) => {
      const sum = items.filter((i) => i.category === cat).reduce((s, i) => s + i.amount, 0);
      return { cat, sum, pct: totalKrw > 0 ? Math.round((sum / totalKrw) * 100) : 0 };
    })
    .filter((c) => c.sum > 0);

  /* ── 新增 ── */
  const addItem = async () => {
    const title = fTitle.trim();
    const amount = Number(fAmount);
    if (!title || !amount || adding) return;

    setAdding(true);
    try {
      await addDoc(EXPENSES_COL, {
        title,
        amount,
        category:      fCat,
        paymentMethod: fPay,
        date:          fDate,
        createdAt:     serverTimestamp(),
      });
      setFTitle(''); setFAmount(''); setFCat('餐飲'); setFPay('現金'); setFDate(today());
      setShowForm(false);
    } catch (err) {
      console.error('addExpense error:', err);
    } finally {
      setAdding(false);
    }
  };

  /* ── 開始編輯 ── */
  const startEdit = (item: Expense) => {
    setEditingId(item.id);
    setETitle(item.title);
    setEAmount(String(item.amount));
    setECat(item.category);
    setEPay(item.paymentMethod);
    setEDate(item.date);
  };

  /* ── 儲存編輯 ── */
  const saveEdit = async (id: string) => {
    const title = eTitle.trim();
    const amount = Number(eAmount);
    if (!title || !amount || saving) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'expenses', id), {
        title,
        amount,
        category:      eCat,
        paymentMethod: ePay,
        date:          eDate,
      });
      setEditingId(null);
    } catch (err) {
      console.error('updateExpense error:', err);
    } finally {
      setSaving(false);
    }
  };

  /* ── 刪除 ── */
  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.error('deleteExpense error:', err);
    }
  };

  /* ── Render ── */
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

      {/* 總花費卡片 */}
      <div className="expense-total">
        <p className="expense-total__label">總花費</p>
        <h1 className="expense-total__amount">
          {loading ? '—' : `₩ ${totalKrw.toLocaleString()}`}
        </h1>
        <p className="expense-total__sub">
          {loading ? '' : `~ TWD ${totalTwd.toLocaleString()}`}
        </p>
      </div>

      {/* 分類統計 */}
      {!loading && catStats.length > 0 && (
        <div className="expense-cats">
          <p className="expense-cat-hint">── 花費分類 ──</p>
          {catStats.map(({ cat, sum, pct }) => (
            <div key={cat} className="expense-cat-item">
              <div className="expense-cat-header">
                <span className="expense-cat-dot" style={{ background: CAT_COLOR[cat] }} />
                <span className="expense-cat-name">{cat}</span>
                <span className="expense-cat-amt">₩{sum.toLocaleString()}</span>
                <span className="expense-cat-pct">{pct}%</span>
              </div>
              <div className="expense-cat-track">
                <div
                  className="expense-cat-fill"
                  style={{ width: `${pct}%`, ['--bar-color' as string]: CAT_COLOR[cat] } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-px">

        {/* 標題列 + 新增按鈕 */}
        <div className="section-title-row">
          <h2>記帳明細</h2>
          <button
            className="btn--icon"
            onClick={() => setShowForm(!showForm)}
            style={{
              background:   showForm ? 'var(--color-text-main)' : 'var(--color-primary-light)',
              color:        showForm ? 'white'                   : 'var(--color-primary)',
              padding:      10,
              borderRadius: 'var(--radius-md)',
              display:      'flex',
              border:       'none',
              cursor:       'pointer',
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

            <input
              className="expense-form-input"
              placeholder="品項名稱"
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
            />
            <input
              className="expense-form-input"
              placeholder="金額（₩）"
              type="number"
              value={fAmount}
              onChange={(e) => setFAmount(e.target.value)}
            />
            <input
              className="expense-form-input"
              type="date"
              value={fDate}
              onChange={(e) => setFDate(e.target.value)}
            />

            {/* 分類 */}
            <div className="expense-form-row" style={{ flexWrap: 'wrap' }}>
              {CATS.map((c) => (
                <button
                  key={c}
                  className={`expense-form-btn${fCat === c ? ' is-active' : ''}`}
                  onClick={() => setFCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* 付款方式 */}
            <div className="expense-form-row">
              {PAY_METHODS.map((m) => {
                const variant = m === '現金' ? 'cash' : 'card';
                return (
                  <button
                    key={m}
                    className={`expense-form-btn expense-form-btn--${variant}${fPay === m ? ' is-active' : ''}`}
                    onClick={() => setFPay(m)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <div className="expense-form-actions">
              <button
                className="expense-form-cancel"
                onClick={() => setShowForm(false)}
              >
                取消
              </button>
              <button
                className="expense-form-submit"
                onClick={addItem}
                disabled={adding}
              >
                {!adding && (
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                {adding ? '新增中…' : '新增'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            讀取中…
          </div>
        )}

        {/* 空狀態 */}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            還沒有記帳紀錄，點 ＋ 新增第一筆！
          </div>
        )}

        {/* 明細列表 */}
        {items.map((item) => (
          <div key={item.id}>
            <div className="expense-row">
              {/* 第一行：品項名稱 + 金額 */}
              <div className="expense-row__top">
                <h4 className="expense-row__title">{item.title}</h4>
                <div className="expense-row__price">₩ {item.amount.toLocaleString()}</div>
              </div>
              {/* 第二行：badge + 日期 + 圓點 + 分類 + icons */}
              <div className="expense-row__bottom">
                <span className={`expense-badge expense-badge--${item.paymentMethod === '現金' ? 'cash' : 'card'}`}>
                  {item.paymentMethod}
                </span>
                <span>{fmtDate(item.date)}</span>
                <span>·</span>
                <span style={{
                  display: 'inline-block',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: CAT_COLOR[item.category],
                  flexShrink: 0,
                }} />
                <span>{item.category}</span>
                <div className="expense-row__bottom-actions">
                  <button
                    onClick={() => editingId === item.id ? setEditingId(null) : startEdit(item)}
                    style={{ color: editingId === item.id ? 'var(--color-primary)' : undefined }}
                    aria-label="編輯"
                  >
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={() => deleteItem(item.id)} aria-label="刪除">
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 內嵌編輯表單 */}
            {editingId === item.id && (
              <div className="expense-edit-form">
                <input
                  className="expense-form-input"
                  placeholder="品項名稱"
                  value={eTitle}
                  onChange={(e) => setETitle(e.target.value)}
                />
                <input
                  className="expense-form-input"
                  placeholder="金額（₩）"
                  type="number"
                  value={eAmount}
                  onChange={(e) => setEAmount(e.target.value)}
                />
                <input
                  className="expense-form-input"
                  type="date"
                  value={eDate}
                  onChange={(e) => setEDate(e.target.value)}
                />

                {/* 分類 */}
                <div className="expense-form-row" style={{ flexWrap: 'wrap' }}>
                  {CATS.map((c) => (
                    <button
                      key={c}
                      className={`expense-form-btn${eCat === c ? ' is-active' : ''}`}
                      onClick={() => setECat(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* 付款方式 */}
                <div className="expense-form-row">
                  {PAY_METHODS.map((m) => {
                    const variant = m === '現金' ? 'cash' : 'card';
                    return (
                      <button
                        key={m}
                        className={`expense-form-btn expense-form-btn--${variant}${ePay === m ? ' is-active' : ''}`}
                        onClick={() => setEPay(m)}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>

                <div className="expense-form-actions">
                  <button
                    className="expense-form-cancel"
                    onClick={() => setEditingId(null)}
                  >
                    取消
                  </button>
                  <button
                    className="expense-form-submit"
                    onClick={() => saveEdit(item.id)}
                    disabled={saving}
                  >
                    {saving ? '儲存中…' : '儲存'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>
    </>
  );
};

export default ExpensePage;
