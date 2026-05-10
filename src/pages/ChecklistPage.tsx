import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, deleteDoc, doc, updateDoc, getDocs,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadImage } from '../lib/storage';
import { TRIP_INFO } from '../data/mockData';

/* ── Types ─────────────────────────────────────────────── */
interface ShoppingItem {
  id: string;
  name: string;
  store: string;
  imageUrl: string;
  bought: boolean;
  createdAt: Timestamp | null;
}

/* ── Constants ──────────────────────────────────────────── */
const STORES = ['Olive Young', '藥局', '大創 Daiso', '超市', '便利商店', '釜山伴手禮', '其他'];

const STORE_COLOR: Record<string, { color: string; bg: string }> = {
  'Olive Young': { color: '#A87060', bg: '#F5EDEA' },
  '藥局':        { color: '#5E9977', bg: '#EBF5EF' },
  '大創 Daiso':  { color: '#4E7A9E', bg: '#EAF2F8' },
  '超市':        { color: '#B87848', bg: '#FAF0E6' },
  '便利商店':    { color: '#7D9BAA', bg: '#EAF1F5' },
  '釜山伴手禮':  { color: '#8B75A0', bg: '#EEE9F5' },
  '其他':        { color: '#96A8B4', bg: '#EFF3F5' },
};

const SHOPPING_COL = collection(db, 'shoppingItems');

/* ── 一次性匯入資料（圖片已上傳至 Cloudinary）──────────── */
const IMPORT_SEED = [
  { name: 'ongredients Skin Barrier Calming Duo Set',          store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427748/korea-travel/shopping/td2ayrfodzhxrxlvhqsg.png' },
  { name: 'ongredients 滋潤肌膚屏障光澤精華液',                store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427750/korea-travel/shopping/vrcmx7xceomn4utywws8.png' },
  { name: 'Ongredients 屏障鎮靜水光噴霧',                       store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427751/korea-travel/shopping/vlsxyosbfemymzkpzhkr.png' },
  { name: '生髮神器LABO-H髮際線安瓶',                            store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427752/korea-travel/shopping/s3xzfknw0bnqp140gujk.png' },
  { name: 'CAREPLUS 穀胱甘肽美白微點貼片 24P',                  store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427753/korea-travel/shopping/o3ioupo2eim95kqjvwf4.png' },
  { name: 'CAREPLUS 痕跡修復淡印隱形貼',                         store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427754/korea-travel/shopping/dzdoprwa5vkm90ra36sm.png' },
  { name: 'CAREPLUS 舒緩淨痘隱形貼',                             store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427756/korea-travel/shopping/gmk880kpxxee7m2plnzj.png' },
  { name: 'CAREPLUS 國民隱形水膠體痘痘防禦貼',                   store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427757/korea-travel/shopping/rzgd8xqpfrhg3rzuxurv.png' },
  { name: 'CAREPLUS 疤痕修護隱形痘痘貼',                         store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427758/korea-travel/shopping/lr1ti10vhaplbcrguhtb.png' },
  { name: 'LATIB 橄欖檸檬排毒能量飲',                            store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427760/korea-travel/shopping/mz2ygknczbge7jhhncm3.png' },
  { name: 'LATIB 穀胱甘肽白番茄煥白飲',                          store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427761/korea-travel/shopping/grl31tnewejotvrjyruw.png' },
  { name: 'TFIT 三色遮瑕膏',                                     store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427762/korea-travel/shopping/d2krgk04xl06vbuhbuge.png' },
  { name: 'ILLIYOON 積雪草祛痘淨膚身體噴霧',                     store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427764/korea-travel/shopping/ppbnfpo7leygd2mrabzq.png' },
  { name: 'LACTO-FIT 鍾根堂新款腸胃健康益生菌+乳酸菌 60條裝',  store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427765/korea-travel/shopping/tyo6p9iojztel8sug6br.png' },
  { name: 'LACTO-FIT 鍾根堂升級版金裝乳酸益生菌',               store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427766/korea-travel/shopping/oa2iaadki8lvqzkwb85l.png' },
  { name: 'Nutseline 香氛精油緊緻刮痧按摩精華 60ml',             store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427767/korea-travel/shopping/icw7f5onlhsoeun6u7ft.png' },
  { name: 'S.NATURE 天然角鯊烷保濕面霜 60ml',                   store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427769/korea-travel/shopping/la6k5ohta8o2piun7ap8.png' },
  { name: 'Maell Cream 爽膚水 /  精華液',                        store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427770/korea-travel/shopping/ufls1kv3krmgof9kazqv.png' },
  { name: 'Mediheal PDRN 緊緻提拉棉片',                          store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427771/korea-travel/shopping/dd4kcmlx9x4ivnisndmk.png' },
  { name: 'Ariul The Perfect Yulmu Enzyme Scrub Powder Cleanser', store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427772/korea-travel/shopping/t5ruc6njwtcol0osxv0i.png' },
  { name: 'CRUNTIN 抹茶爆米花蛋白棒',                             store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427773/korea-travel/shopping/csw4ut4r1uvct4n8blwj.png' },
  { name: 'CRUNTIN 巧克力爆米花蛋白棒',                           store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427774/korea-travel/shopping/x45kwgqj4fwlzxufgbug.png' },
  { name: 'THE TOOL LAB All Day Fitting Du',                     store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427775/korea-travel/shopping/ozz08ergaozuof9vcg5w.png' },
  { name: 'PDRN 全效消腫緊緻膠原蛋白飲品',                       store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427777/korea-travel/shopping/zsyqp5hzptqe72bygr18.png' },
  { name: 'lilyeve GROW:TURN 髮量升級系列',                       store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427778/korea-travel/shopping/ordi4b6mfy1pwwlw5vqp.png' },
  { name: 'primera 溫和完美去角質凝膠',                           store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427779/korea-travel/shopping/y2vv9m07hruur5bphvdz.png' },
  { name: 'tfit 妝前乳',                                          store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427780/korea-travel/shopping/zrdig6k1xabgs0ai20ef.png' },
  { name: 'osstem超美白牙膏',                                     store: 'Olive Young', imageUrl: 'https://res.cloudinary.com/dzflsgpjq/image/upload/v1778427781/korea-travel/shopping/bhjfxesdjcfjhmsgxoik.png' },
  // ── 藥局 ──
  { name: '애크논 Acnon 痘痘霜',                                  store: '藥局', imageUrl: '' },
  { name: '노스카나 Noscarna 疤痕凝膠',                            store: '藥局', imageUrl: '' },
  { name: '애크린 Aclean 水楊酸凝膠',                              store: '藥局', imageUrl: '' },
  { name: 'Clear Teen 클리어틴 祛痘水',                            store: '藥局', imageUrl: '' },
  { name: '黑頭粉刺導出液',                                         store: '藥局', imageUrl: '' },
  { name: '안티푸라민 Antiphlamine 酸痛滾輪乳液',                   store: '藥局', imageUrl: '' },
  { name: 'Reju de Vie Repair Cream 粉盒再生霜',                  store: '藥局', imageUrl: '' },
  { name: 'Rejuvuster PDRN再生霜 10000ppm',                      store: '藥局', imageUrl: '' },
  { name: '리안 PDRN人工淚液',                                      store: '藥局', imageUrl: '' },
  // ── 大創 Daiso ──
  { name: 'Spot Care Patch 痘痘貼',                               store: '大創 Daiso', imageUrl: '' },
  { name: '眼妝刷5件套組',                                          store: '大創 Daiso', imageUrl: '' },
  { name: '多用途保濕棒 Multi Balm',                               store: '大創 Daiso', imageUrl: '' },
  { name: '싹스틱 Ssak Stick 衣物去污棒',                           store: '大創 Daiso', imageUrl: '' },
  // ── 超市 ──
  { name: '양반 마늘 김부각 大蒜海苔片',                              store: '超市', imageUrl: '' },
  { name: '冷凍乾燥藍莓優格方塊',                                    store: '超市', imageUrl: '' },
  { name: '巧克力香蕉可麗餅',                                        store: '超市', imageUrl: '' },
  { name: '馬達加斯加香草布丁',                                      store: '超市', imageUrl: '' },
  { name: 'Zero 無糖水蜜桃奇異果果凍',                              store: '超市', imageUrl: '' },
  { name: '예감 非油炸洋芋片',                                       store: '超市', imageUrl: '' },
  { name: '포카칩 生薑洋芋片 생강자',                                 store: '超市', imageUrl: '' },
  { name: '蜂蜜奶油洋芋片 허니버터칩',                               store: '超市', imageUrl: '' },
  // ── 便利商店 ──
  { name: '鹽味奶油麵包脆 Salt Butter Rusk',                       store: '便利商店', imageUrl: '' },
  { name: '奶油麵包脆 Butter Rusk',                               store: '便利商店', imageUrl: '' },
  { name: '焦糖麵包脆 Caramel Rusk',                              store: '便利商店', imageUrl: '' },
  { name: '초코렛타 Chocolatta 花形巧克力米果',                      store: '便利商店', imageUrl: '' },
  { name: '피크닉 Picnic 野餐果汁',                                 store: '便利商店', imageUrl: '' },
  { name: '濟州橘子汁 감귤사랑 500ml',                               store: '便利商店', imageUrl: '' },
  { name: '그릭요거트 to go 希臘優格飲',                             store: '便利商店', imageUrl: '' },
  { name: '低糖焦糖爆米花 Caramel Popcorn',                        store: '便利商店', imageUrl: '' },
];

/* ── ChecklistPage ──────────────────────────────────────── */
const ChecklistPage = () => {
  const [items, setItems]         = useState<ShoppingItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [importing, setImporting]     = useState(false);
  const [importDone, setImportDone]   = useState(false);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [boughtFilter, setBoughtFilter] = useState<'all' | 'unbought' | 'bought'>('all');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const imgInputRef    = useRef<HTMLInputElement>(null);
  const pendingItemId  = useRef<string | null>(null);

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
              imageUrl:  data.imageUrl  ?? '',
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

  const toggleBought = async (item: ShoppingItem) => {
    try {
      await updateDoc(doc(db, 'shoppingItems', item.id), { bought: !item.bought });
    } catch (err) {
      console.error('toggleBought error:', err);
    }
  };

  const clearAndImport = async () => {
    if (importing) return;
    setImporting(true);
    try {
      // 刪除所有現有資料
      const snap = await getDocs(SHOPPING_COL);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'shoppingItems', d.id))));

      // 寫入 28 筆乾淨資料
      for (const seed of IMPORT_SEED) {
        await addDoc(SHOPPING_COL, {
          name:      seed.name,
          store:     seed.store,
          imageUrl:  seed.imageUrl,
          bought:    false,
          createdAt: serverTimestamp(),
        });
      }
      setImportDone(true);
    } catch (err) {
      console.error('clearAndImport error:', err);
    } finally {
      setImporting(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shoppingItems', id));
    } catch (err) {
      console.error('deleteItem error:', err);
    }
  };

  const triggerImgUpload = (itemId: string) => {
    pendingItemId.current = itemId;
    imgInputRef.current?.click();
  };

  const handleImgInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = pendingItemId.current;
    e.target.value = '';
    if (!file || !itemId) return;

    setUploadingId(itemId);
    try {
      const { url } = await uploadImage(file, 'korea-travel/shopping');
      await updateDoc(doc(db, 'shoppingItems', itemId), { imageUrl: url });
    } catch (err) {
      console.error('uploadCardImage error:', err);
    } finally {
      setUploadingId(null);
      pendingItemId.current = null;
    }
  };

  const boughtCount   = items.filter(i => i.bought).length;
  const unboughtCount = items.length - boughtCount;

  // 篩選 + 排序（未買在前）
  const filtered = [...items]
    .filter(i => !activeStore || i.store === activeStore)
    .filter(i => boughtFilter === 'unbought' ? !i.bought : boughtFilter === 'bought' ? i.bought : true)
    .sort((a, b) => {
      if (a.bought !== b.bought) return a.bought ? 1 : -1;
      return 0;
    });

  // 有哪些地點有商品
  const storesInUse = STORES.filter(s => items.some(i => i.store === s));

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

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--sl-ink-faint)', fontSize: 'var(--text-sm)' }}>
            讀取中…
          </div>
        )}

        {!loading && !importDone && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--sl-ink-faint)', marginBottom: 16 }}>
              還沒有購物清單
            </p>
            <button
              className="btn btn--primary-light"
              onClick={clearAndImport}
              disabled={importing}
              style={{ fontSize: 'var(--text-xs)', padding: '8px 16px' }}
            >
              {importing ? '處理中…' : `匯入 ${IMPORT_SEED.length} 件購物清單`}
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            {/* 地點血條統計 */}
            <div className="sl-cats">
              {storesInUse.map(s => {
                const c = STORE_COLOR[s] ?? { color: '#96A8B4', bg: '#EFF3F5' };
                const total  = items.filter(i => i.store === s).length;
                const bought = items.filter(i => i.store === s && i.bought).length;
                const pct = total > 0 ? Math.round(bought / total * 100) : 0;
                return (
                  <div
                    key={s}
                    className="sl-cat-item"
                    onClick={() => setActiveStore(prev => prev === s ? null : s)}
                  >
                    <div className="sl-cat-header">
                      <span className="sl-cat-dot" style={{ background: c.color }} />
                      <span className={`sl-cat-name${activeStore === s ? ' sl-cat-name--active' : ''}`}>{s}</span>
                      <span className="sl-cat-count">{bought}/{total}</span>
                      <span className="sl-cat-pct">{pct}%</span>
                    </div>
                    <div className="sl-cat-track">
                      <div className="sl-cat-fill" style={{ width: `${pct}%`, '--bar-color': c.color } as React.CSSProperties} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 篩選列 */}
            <div className="sl-toolbar">
              <div className="sl-filters">
                {(['all', 'unbought', 'bought'] as const).map(f => {
                  const label = f === 'all' ? '全部' : f === 'unbought' ? '未買' : '已買';
                  const num   = f === 'all' ? items.length : f === 'unbought' ? unboughtCount : boughtCount;
                  return (
                    <button
                      key={f}
                      className={boughtFilter === f ? 'sl-filters__on' : ''}
                      onClick={() => setBoughtFilter(f)}
                    >
                      {label}<span className="sl-num">{num}</span>
                    </button>
                  );
                })}
              </div>
              <span className="sl-count">
                {activeStore ? `${activeStore} ` : ''}{filtered.length} 件
              </span>
            </div>

            {/* 購物卡片格 */}
            <div className="sl-grid">
              {filtered.map((item) => {
                const c = STORE_COLOR[item.store] ?? { color: '#808080', bg: '#f0f0f0' };
                return (
                  <div
                    key={item.id}
                    className={`sl-card${item.bought ? ' sl-card--bought' : ''}`}
                  >
                    {/* 圖片區 */}
                    <div className="sl-img">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} />
                        : (
                          <div
                            className={`sl-img__placeholder${uploadingId === item.id ? ' sl-img__placeholder--uploading' : ''}`}
                            onClick={() => { if (uploadingId !== item.id) triggerImgUpload(item.id); }}
                          >
                            {uploadingId === item.id ? (
                              <div className="sl-img__spinner" />
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: 'none', strokeWidth: 1.5 }}>
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                  <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span className="sl-img__hint">上傳圖片</span>
                              </>
                            )}
                          </div>
                        )
                      }
                    </div>

                    {/* 刪除按鈕 */}
                    <button
                      className="sl-del"
                      onClick={() => deleteItem(item.id)}
                      aria-label="刪除"
                    >×</button>

                    {/* 文字區 */}
                    <div className="sl-body">
                      <div className="sl-body__row">
                        <button
                          className={`sl-check${item.bought ? ' sl-check--on' : ''}`}
                          onClick={() => toggleBought(item)}
                          aria-label={item.bought ? '取消已買' : '標記已買'}
                        >
                          {item.bought && (
                            <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, stroke: 'white', fill: 'none', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <span className="sl-card__name">{item.name}</span>
                      </div>
                      <div
                        className="sl-chip"
                        style={{ '--loc-color': c.color } as React.CSSProperties}
                      >
                        <span className="sl-dot" />
                        {item.store}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 重新匯入按鈕（隱藏區，資料已存在時顯示） */}
        {!loading && !importDone && items.length > 0 && (
          <div style={{ textAlign: 'center', paddingBottom: '1rem' }}>
            <button
              className="btn btn--primary-light"
              onClick={clearAndImport}
              disabled={importing}
              style={{ fontSize: 'var(--text-xs)', padding: '6px 14px', opacity: .6 }}
            >
              {importing ? '處理中…' : `清空並重新匯入 ${IMPORT_SEED.length} 件`}
            </button>
          </div>
        )}

      </div>

      {/* 隱藏的圖片選擇器（供購物卡片上傳圖片用）*/}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImgInputChange}
      />
    </>
  );
};

export default ChecklistPage;
