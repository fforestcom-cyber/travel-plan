const EXPENSE_ITEMS = [
  { icon: '✈️', title: '機票（去回程）', date: '06/10', price: 'NT$ 8,200', type: 'card' as const },
  { icon: '🏨', title: '住宿 4晚',       date: '06/10', price: 'NT$ 6,400', type: 'card' as const },
  { icon: '🍜', title: '豬肉湯飯早餐',    date: '06/11', price: '₩ 9,000',  type: 'cash' as const },
  { icon: '🚇', title: '地鐵車票',       date: '06/11', price: '₩ 2,800',  type: 'cash' as const },
];

const SUMMARY_CHIPS = [
  { label: '交通', amount: '₩ 42,000' },
  { label: '美食', amount: '₩ 85,000' },
  { label: '住宿', amount: 'NT$ 6,400' },
  { label: '購物', amount: '₩ 32,000' },
];

const ExpensePage = () => (
  <>
    {/* 總花費 */}
    <div className="expense-total">
      <div className="expense-total__label">總花費</div>
      <div className="expense-total__amount">NT$ 22,600</div>
      <div className="expense-total__sub">≈ ₩ 938,900</div>
    </div>

    <div className="section-px">
      {/* 分類統計 */}
      <div className="expense-summary-row no-scrollbar">
        {SUMMARY_CHIPS.map((c) => (
          <div key={c.label} className="expense-summary-chip">
            <div className="expense-summary-chip__label">{c.label}</div>
            <div className="expense-summary-chip__amount">{c.amount}</div>
          </div>
        ))}
      </div>

      {/* 明細列表 */}
      <div className="section-title-row">
        <h2>消費明細</h2>
        <button className="btn btn--primary-light" style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新增
        </button>
      </div>

      {EXPENSE_ITEMS.map((item) => (
        <div key={item.title} className="expense-row">
          <div className="expense-row__left">
            <div className="expense-row__icon">
              <span style={{ fontSize: 20 }}>{item.icon}</span>
            </div>
            <div>
              <div className="expense-row__title">{item.title}</div>
              <div className="expense-row__date">
                {item.date}
                <span className={`expense-badge expense-badge--${item.type}`}>
                  {item.type === 'cash' ? '現金' : '刷卡'}
                </span>
              </div>
            </div>
          </div>
          <div className="expense-row__price">{item.price}</div>
        </div>
      ))}
    </div>
  </>
);

export default ExpensePage;
