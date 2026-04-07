import { useState } from 'react';

const TWD_TO_KRW = 43;
const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const fmt = (n: number, locale: string) =>
  n.toLocaleString(locale, { maximumFractionDigits: 0 });

const ToolsPage = () => {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'TWD_TO_KRW' | 'KRW_TO_TWD'>('TWD_TO_KRW');

  const isTWD = direction === 'TWD_TO_KRW';
  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;

  const converted = isTWD
    ? numericAmount * TWD_TO_KRW
    : numericAmount / TWD_TO_KRW;

  const fromLabel = isTWD ? '新台幣 TWD' : '韓元 KRW';
  const toLabel   = isTWD ? '韓元 KRW'   : '新台幣 TWD';
  const fromSymbol = isTWD ? 'NT$' : '₩';
  const toSymbol   = isTWD ? '₩'  : 'NT$';

  const handleSwap = () => {
    setDirection((d) => (d === 'TWD_TO_KRW' ? 'KRW_TO_TWD' : 'TWD_TO_KRW'));
    setAmount('');
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工具</h1>
        <p className="text-gray-500 text-sm mt-1">旅遊實用小工具</p>
      </div>

      {/* Converter card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4">
          <h2 className="text-white font-semibold text-lg">匯率換算</h2>
          <p className="text-rose-100 text-sm mt-0.5">
            固定匯率：1 TWD = {TWD_TO_KRW} KRW
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* From input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">{fromLabel}</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-400 transition">
              <span className="text-gray-400 font-medium w-8 shrink-0">{fromSymbol}</span>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="輸入金額"
                className="flex-1 text-lg font-semibold text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-rose-500 text-sm font-medium hover:bg-rose-100 transition"
            >
              <span className="text-base">⇅</span> 互換方向
            </button>
          </div>

          {/* Result */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">{toLabel}</label>
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              <span className="text-rose-400 font-medium w-8 shrink-0">{toSymbol}</span>
              <span className="text-2xl font-bold text-rose-600">
                {numericAmount > 0 ? fmt(converted, isTWD ? 'ko-KR' : 'zh-TW') : '—'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick reference table */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">常用金額對照</h3>
          <span className="text-xs text-gray-400">NT$ → ₩</span>
        </div>
        <div className="divide-y divide-gray-50">
          {QUICK_AMOUNTS.map((twd) => (
            <div
              key={twd}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-rose-50 transition-colors cursor-default"
              onClick={() => {
                setDirection('TWD_TO_KRW');
                setAmount(String(twd));
              }}
            >
              <span className="text-gray-700 font-medium">
                NT$ {fmt(twd, 'zh-TW')}
              </span>
              <div className="flex items-center gap-2 text-rose-600 font-semibold">
                <span className="text-gray-300 text-sm">→</span>
                ₩ {fmt(twd * TWD_TO_KRW, 'ko-KR')}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center py-3">
          點擊列表可直接帶入換算
        </p>
      </section>
    </main>
  );
};

export default ToolsPage;
