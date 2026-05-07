import { useState, useEffect } from 'react';
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRIP_INFO } from '../data/mockData';

/* ── Types ─────────────────────────────────────────────── */
interface ShoppingItem {
  id: string;
  name: string;
  store: string;
  bought: boolean;
  createdAt: Timestamp | null;
}

/* ── Constants ──────────────────────────────────────────── */
const STORES = ['Olive Young', '樂天超市', '免稅店', '便利商店', '傳統市場', '其他'];

const SHOPPING_COL = collection(db, 'shoppingItems');

/* ── ChecklistPage ──────────────────────────────────────── */
const ChecklistPage = () => {
  const [items, setItems]       = useState<ShoppingItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [shopName, setShopName] = useState('');
  const [shopStore, setShopStore] = useState('Olive Young');
  const [adding, setAdding]     = useState(false);

  useEffect(() => {
    const q = query(SHOPPING_COL, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id:        d.id,
              name:      data.name      ?? '',
              store:     data.store     ?? '',
              bought:    data.bought    ?? false,
              createdAt: data.createdAt ?? null,
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('shoppingItems onSnapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addItem = async () => {
    const name = shopName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await addDoc(SHOPPING_COL, { name, store: shopStore, bought: false, createdAt: serverTimestamp() });
      setShopName('');
    } catch (err) {
      console.error('addItem error:', err);
    } finally {
      setAdding(false);
    }
  };

  const toggleBought = async (item: ShoppingItem) => {
    try {
      await updateDoc(doc(db, 'shoppingItems', item.id), { bought: !item.bought });
    } catch (err) {
      console.error('toggleBought error:', err);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shoppingItems', id));
    } catch (err) {
      console.error('deleteItem error:', err);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.bought !== b.bought) return a.bought ? 1 : -1;
    return 0;
  });

  const boughtCount   = items.filter(i => i.bought).length;
  const unboughtCount = items.length - boughtCount;

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

      <div className="section-px" style={{ paddingTop: '1.25rem' }}>

        {/* 新增表單 */}
        <div className="note-compose mb-4">
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              className="expense-form-input"
              style={{ flex: 1 }}
              placeholder="商品名稱…"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <button
              className="btn btn--dark"
              onClick={addItem}
              disabled={adding || !shopName.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增
            </button>
          </div>

          {/* 哪裡買 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STORES.map((s) => (
              <button
                key={s}
                className={`expense-form-btn expense-form-btn--pill${shopStore === s ? ' is-active' : ''}`}
                onClick={() => setShopStore(s)}
                style={{ fontSize: 'var(--text-xs)', padding: '4px 12px' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 統計列 */}
        {items.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 12,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-light)',
          }}>
            <span>共 {items.length} 件</span>
            <span>{boughtCount} 件已買・{unboughtCount} 件未買</span>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            讀取中…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-light)', fontSize: 'var(--text-sm)' }}>
            還沒有購物清單，新增第一件吧！
          </div>
        )}

        {/* 購物項目 */}
        {sortedItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              marginBottom: 8,
              opacity: item.bought ? 0.55 : 1,
              transition: 'opacity .2s',
            }}
          >
            {/* 勾選 */}
            <button
              onClick={() => toggleBought(item)}
              aria-label={item.bought ? '標為未買' : '標為已買'}
              style={{
                flexShrink: 0,
                width: 26, height: 26,
                borderRadius: '50%',
                border: `2px solid ${item.bought ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: item.bought ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {item.bought && (
                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'white', fill: 'none', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* 名稱 + 地點 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-main)',
                textDecoration: item.bought ? 'line-through' : 'none',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {item.name}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)', marginTop: 2 }}>
                {item.store}
              </div>
            </div>

            {/* 刪除 */}
            <button
              onClick={() => deleteItem(item.id)}
              aria-label="刪除"
              style={{
                flexShrink: 0,
                color: 'var(--color-text-light)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, lineHeight: 1,
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
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

export default ChecklistPage;
