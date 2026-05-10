/**
 * 一次性遷移腳本：將韓國購物清單.html 的商品（文字 + 圖片）
 * 上傳到 Cloudinary 並寫入 Firestore shoppingItems collection。
 *
 * 執行：node scripts/import-shopping.js
 */

const fs  = require('fs');
const vm  = require('vm');
const path = require('path');

// ── 設定 ────────────────────────────────────────────────────
const HTML_PATH     = 'C:/Users/20250429/Downloads/韓國購物清單/韓國購物清單.html';
const CLOUD_NAME    = 'dzflsgpjq';
const UPLOAD_PRESET = 'korea-travel';
const API_KEY       = 'AIzaSyDZPeu339bQtgtBQWv1e06OCop1hm62JEM';
const PROJECT_ID    = 'korea-travel-751da';
const FIRESTORE_BASE =
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const LOC_LABEL = {
  olive:    'Olive Young',
  pharmacy: '藥局',
  daiso:    '大創 Daiso',
  market:   '超市',
  cvs:      '便利商店',
  busan:    '釜山伴手禮',
};

// ── Cloudinary 上傳（base64 data URL → 實際圖片 URL）──────────
async function uploadImage(dataUrl) {
  const commaIdx = dataUrl.indexOf(',');
  const header   = dataUrl.slice(0, commaIdx);
  const b64data  = dataUrl.slice(commaIdx + 1);
  const mime     = header.match(/:(.*?);/)[1];

  const bytes = Buffer.from(b64data, 'base64');
  const blob  = new Blob([bytes], { type: mime });

  const form = new FormData();
  form.append('file',           blob, 'item.png');
  form.append('upload_preset',  UPLOAD_PRESET);
  form.append('folder',         'korea-travel/shopping');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Cloudinary ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.secure_url;
}

// ── Firestore REST 寫入 ──────────────────────────────────────
async function createDoc(fields) {
  const url = `${FIRESTORE_BASE}/shoppingItems?key=${API_KEY}`;

  const firestoreFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string')  firestoreFields[k] = { stringValue: v };
    if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
  }
  firestoreFields.createdAt = { timestampValue: new Date().toISOString() };

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore ${res.status}: ${txt.slice(0, 200)}`);
  }
  return await res.json();
}

// ── 從 HTML 擷取 SEED 陣列 ────────────────────────────────────
function extractSeed(html) {
  const lines   = html.split('\n');
  const seedLines = [];
  let inSeed    = false;

  for (const line of lines) {
    if (line.trim() === 'var SEED = [') {
      inSeed = true;
      seedLines.push('var SEED = [');
      continue;
    }
    if (inSeed) {
      seedLines.push(line);
      if (line.trim() === '];') break;
    }
  }

  if (!seedLines.length) throw new Error('找不到 SEED 陣列');

  const ctx = Object.create(null);
  vm.createContext(ctx);
  vm.runInContext(seedLines.join('\n'), ctx);
  return ctx.SEED;
}

// ── 主流程 ────────────────────────────────────────────────────
async function main() {
  console.log('📖 讀取 HTML 檔案…');
  const html  = fs.readFileSync(HTML_PATH, 'utf8');
  const items = extractSeed(html);
  console.log(`✅ 找到 ${items.length} 件商品\n`);

  let ok = 0, fail = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = `[${String(i + 1).padStart(2, '0')}/${items.length}] ${item.text}`;
    process.stdout.write(label + '\n');

    try {
      let imageUrl = '';
      if (item.img) {
        process.stdout.write('  ↑ 上傳圖片…\n');
        imageUrl = await uploadImage(item.img);
        process.stdout.write(`  → ${imageUrl}\n`);
      }

      await createDoc({
        name:     item.text,
        store:    LOC_LABEL[item.loc] ?? item.loc ?? '其他',
        imageUrl,
        bought:   false,
        sourceId: item.id,
      });

      console.log('  ✓ 已存入 Firestore\n');
      ok++;
    } catch (err) {
      console.error(`  ✗ 失敗：${err.message}\n`);
      fail++;
    }

    // 每筆間隔 300ms，避免觸發速率限制
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n完成：成功 ${ok} 筆，失敗 ${fail} 筆`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
