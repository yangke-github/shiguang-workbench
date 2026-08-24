/* ===== 工作台 App · 数据 + 渲染 ===== */
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const pad = n => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const fmtCNY = n => "¥" + Number(n).toFixed(1).replace(/\.0$/, "");

/* ---------- 健身常量（部位 / 有氧类型 / 动作库，见《健身记录模块·产品逻辑说明》） ---------- */
const PARTS = ["胸", "肩", "背", "腿", "腹", "手臂"];
const CARDIO_TYPES = ["跑步", "骑行", "游泳", "跳绳", "椭圆机", "爬楼", "快走"];
const EX_PRESETS = {
  "胸":  ["杠铃卧推", "上斜哑铃推", "绳索夹胸", "双杠臂屈伸", "俯卧撑"],
  "肩":  ["哑铃推举", "侧平举", "前平举", "反向飞鸟", "杠铃推举"],
  "背":  ["引体向上", "杠铃划船", "高位下拉", "坐姿划船", "直臂下压"],
  "腿":  ["深蹲", "腿举", "罗马尼亚硬拉", "腿弯举", "腿屈伸", "提踵"],
  "腹":  ["卷腹", "悬垂举腿", "平板支撑", "俄罗斯转体"],
  "手臂": ["二头弯举", "锤式弯举", "绳索下压", "仰卧臂屈伸"]
};
/* 演示数据的基准重量 kg（自重动作 = 0，不计容量） */
const EX_BASE_W = {
  "杠铃卧推": 60, "上斜哑铃推": 24, "绳索夹胸": 25, "双杠臂屈伸": 0, "俯卧撑": 0,
  "哑铃推举": 20, "侧平举": 8, "前平举": 10, "反向飞鸟": 7, "杠铃推举": 40,
  "引体向上": 0, "杠铃划船": 60, "高位下拉": 55, "坐姿划船": 50, "直臂下压": 30,
  "深蹲": 90, "腿举": 140, "罗马尼亚硬拉": 80, "腿弯举": 35, "腿屈伸": 45, "提踵": 60,
  "卷腹": 0, "悬垂举腿": 0, "平板支撑": 0, "俄罗斯转体": 0,
  "二头弯举": 12, "锤式弯举": 12, "绳索下压": 25, "仰卧臂屈伸": 15
};
/* 生成近半年训练历史（演示用，progress 越接近 1 越靠近现在，重量渐进上升） */
function genWorkoutHistory() {
  const logs = {};
  const t = new Date();
  for (let i = 175; i >= 1; i--) {
    if (Math.random() < 0.58) continue;
    const d = new Date(t); d.setDate(t.getDate() - i);
    const date = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const progress = 1 - i / 175;
    const day = { strength: [], cardio: [] };
    const nParts = 1 + (Math.random() < 0.35 ? 1 : 0);
    [...PARTS].sort(() => Math.random() - 0.5).slice(0, nParts).forEach(part => {
      const pool = EX_PRESETS[part];
      const nEx = 1 + (Math.random() < 0.4 ? 1 : 0);
      [...pool].sort(() => Math.random() - 0.5).slice(0, nEx).forEach(name => {
        const base = EX_BASE_W[name] || 0;
        const w = base ? Math.round(base * (0.82 + 0.18 * progress)) : 0;
        const nSets = 3 + Math.floor(Math.random() * 3);
        const reps = 8 + Math.floor(Math.random() * 6);
        day.strength.push({ part, name, sets: Array.from({ length: nSets }, () => ({ weight: w, reps })) });
      });
    });
    if (Math.random() < 0.42) {
      const nCardio = Math.random() < 0.2 ? 2 : 1;
      for (let c = 0; c < nCardio; c++)
        day.cardio.push({ type: CARDIO_TYPES[Math.floor(Math.random() * CARDIO_TYPES.length)], minutes: 20 + Math.floor(Math.random() * 30) });
    }
    logs[date] = day;
  }
  /* 近三天固定示例，保证演示效果 */
  const td = todayStr();
  logs[shiftDate(td, -3)] = {
    strength: [
      { part: "胸", name: "杠铃卧推",   sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 62.5, reps: 10 }, { weight: 62.5, reps: 8 }] },
      { part: "胸", name: "上斜哑铃推", sets: [{ weight: 24, reps: 12 }, { weight: 24, reps: 12 }, { weight: 26, reps: 10 }] }
    ],
    cardio: [{ type: "跳绳", minutes: 15 }]
  };
  logs[shiftDate(td, -2)] = { strength: [], cardio: [{ type: "椭圆机", minutes: 40 }] };
  logs[shiftDate(td, -1)] = {
    strength: [
      { part: "腿", name: "深蹲",   sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }, { weight: 95, reps: 8 }, { weight: 95, reps: 8 }, { weight: 100, reps: 6 }] },
      { part: "腿", name: "腿屈伸", sets: [{ weight: 45, reps: 15 }, { weight: 45, reps: 15 }] }
    ],
    cardio: []
  };
  return logs;
}

/* ---------- 种子数据（结构 = 方案 v2 的 JSON 设计） ---------- */
const SEED = {
  english: {
    date: todayStr(),
    words: [
      { word: "abandon",   phonetic: "/əˈbændən/",  meaning: "v. 放弃，抛弃" },
      { word: "ambitious", phonetic: "/æmˈbɪʃəs/",  meaning: "adj. 有雄心的" },
      { word: "candid",    phonetic: "/ˈkændɪd/",   meaning: "adj. 坦率的" },
      { word: "delicate",  phonetic: "/ˈdelɪkət/",  meaning: "adj. 精致的；微妙的" },
      { word: "endeavor",  phonetic: "/ɪnˈdevər/",  meaning: "n./v. 努力，尝试" },
      { word: "frugal",    phonetic: "/ˈfruːɡl/",   meaning: "adj. 节俭的" },
      { word: "genuine",   phonetic: "/ˈdʒenjuɪn/", meaning: "adj. 真诚的；真正的" },
      { word: "humble",    phonetic: "/ˈhʌmbl/",    meaning: "adj. 谦虚的；朴素的" },
      { word: "intact",    phonetic: "/ɪnˈtækt/",   meaning: "adj. 完好无损的" },
      { word: "journey",   phonetic: "/ˈdʒɜːrni/",  meaning: "n. 旅程，历程" }
    ],
    article: {
      title: "A Morning Habit",
      en: "I used to check my phone the moment I woke up. It felt productive, but it left me tired before the day began. Last month I replaced that habit with something simpler: ten minutes of stretching and a glass of water. Now the morning feels like it belongs to me, not to my messages. Small changes are humble, but they compound quietly into a different life.",
      zh: "我过去一醒来就看手机。感觉挺高效，但一天还没开始人就累了。上个月我换成了一个更简单的习惯：十分钟拉伸和一杯水。现在早晨感觉是属于我自己的，而不是属于那些消息的。微小的改变虽然不起眼，却会悄悄累积成另一种人生。",
      keywords: ["productive 高效的", "replace 替换", "compound 累积"]
    }
  },
  /* 健身：按天的 WorkoutLog（力量=部位→动作→组[{weight,reps}]；有氧=[{type,minutes}]） */
  workouts: genWorkoutHistory(),
  customEx: {},          // 自定义动作 { 部位: [动作名] }
  customCardio: [],      // 自定义有氧类型
  expense: { records: [
    { date: "2026-08-18", category: "饮食", amount: 35.5, note: "午餐" },
    { date: "2026-08-19", category: "交通", amount: 22.0, note: "打车" },
    { date: "2026-08-20", category: "饮食", amount: 42.0, note: "" },
    { date: "2026-08-20", category: "购物", amount: 299.0, note: "运动短裤" },
    { date: "2026-08-21", category: "饮食", amount: 38.0, note: "" },
    { date: "2026-08-21", category: "娱乐", amount: 68.0, note: "电影" },
    { date: "2026-08-22", category: "饮食", amount: 26.5, note: "早餐+咖啡" },
    { date: "2026-08-22", category: "居住", amount: 1200.0, note: "房租" }
  ]},
  todo: { tasks: [
    { id: 1, title: "整理周报并发送", due: "2026-08-22", done: true,  priority: "high",   postponeDays: 0, createdAt: "2026-08-20" },
    { id: 2, title: "预约体检",       due: "2026-08-21", done: false, priority: "medium", postponeDays: 1, createdAt: "2026-08-19" },
    { id: 3, title: "给爸妈买礼物",   due: "2026-08-25", done: false, priority: "high",   postponeDays: 0, createdAt: "2026-08-21" },
    { id: 4, title: "读完《置身事内》第三章", due: "2026-08-28", done: false, priority: "low", postponeDays: 0, createdAt: "2026-08-22" },
    { id: 5, title: "续订域名",       due: "2026-08-15", done: true,  priority: "medium", postponeDays: 3, createdAt: "2026-08-10" }
  ]},
  recipes: { recipes: [
    { id: 1, name: "番茄牛腩",   ingredients: ["牛腩 500g", "番茄 3 个", "洋葱 1 个"], steps: ["牛腩焯水", "番茄炒出汁", "小火炖 90 分钟"] },
    { id: 2, name: "香煎三文鱼", ingredients: ["三文鱼 1 块", "芦笋", "柠檬"], steps: ["鱼身擦干撒盐", "皮朝下中火煎 4 分钟", "翻面 1 分钟"] },
    { id: 3, name: "凉拌鸡丝",   ingredients: ["鸡胸肉 1 块", "黄瓜", "花生碎"], steps: ["鸡胸煮熟撕丝", "黄瓜拍丝", "加料汁拌匀"] },
    { id: 4, name: "菌菇豆腐汤", ingredients: ["嫩豆腐", "混合菌菇", "葱花"], steps: ["菌菇炒香", "加水煮开", "下豆腐煮 5 分钟"] }
  ]},
  weeklyMenu: { weekStart: "2026-08-24", days: [
    { date: "2026-08-24", recipeIds: [1, 4] },
    { date: "2026-08-25", recipeIds: [2] },
    { date: "2026-08-26", recipeIds: [4, 3] },
    { date: "2026-08-27", recipeIds: [] },
    { date: "2026-08-28", recipeIds: [3] },
    { date: "2026-08-29", recipeIds: [] },
    { date: "2026-08-30", recipeIds: [2, 1] }
  ]},
  menuHistory: genHistory(),
  anniversaries: { items: [
    { id: 1, name: "结婚纪念日", month: 9,  day: 20, repeat: "yearly" },
    { id: 2, name: "妈妈生日",   month: 10, day: 8,  repeat: "yearly" },
    { id: 3, name: "领证纪念日", month: 4,  day: 12, repeat: "yearly" }
  ]}
};

/* 生成近五周的做饭历史（演示用，相对当前日期） */
function genHistory() {
  const pool = [1, 2, 3, 4];
  const records = [];
  const t = new Date();
  for (let i = 35; i >= 2; i--) {
    if (Math.random() < 0.32) continue;
    const d = new Date(t); d.setDate(t.getDate() - i);
    const n = Math.random() < 0.3 ? 2 : 1;
    const ids = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    records.push({ date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, recipeIds: ids });
  }
  return { records };
}

/* ---------- 本地存储 ---------- */
const KEY = "workbench.v2.3";
let store;
try { store = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { store = null; }
if (!store) { store = JSON.parse(JSON.stringify(SEED)); save(); }
function save() { localStorage.setItem(KEY, JSON.stringify(store)); }

/* ---------- GitHub 同步配置 ---------- */
const GH_CONFIG_KEY = "workbench.ghConfig";
let ghConfig;
try { ghConfig = JSON.parse(localStorage.getItem(GH_CONFIG_KEY)) || {}; } catch (e) { ghConfig = {}; }
if (!ghConfig.branch) ghConfig = { owner: "", repo: "", token: "", branch: "main", path: "data/workbench.json", autoSync: false, ...(ghConfig || {}) };
// URL 参数一键预填设置（?gh_owner=&gh_repo=&gh_token=&gh_branch=&gh_path=&gh_auto=1）
try {
  const q = new URLSearchParams(location.search);
  const owner = q.get("gh_owner"), repo = q.get("gh_repo"), token = q.get("gh_token");
  if (owner && repo && token) {
    ghConfig = Object.assign({}, ghConfig, {
      owner, repo, token,
      branch: q.get("gh_branch") || ghConfig.branch || "main",
      path: q.get("gh_path") || ghConfig.path || "data/workbench.json",
      autoSync: q.get("gh_auto") === "1" ? true : ghConfig.autoSync
    });
    saveGhConfig();
  }
} catch (e) {}
function saveGhConfig() { localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(ghConfig)); }
function normalizeStore() { const s = JSON.parse(JSON.stringify(store)); delete s._sync; return s; }
function ensureSyncBase() { if (!store._sync || !store._sync.base) { store._sync = { ...(store._sync || {}), base: normalizeStore() }; save(); } }
ensureSyncBase();

function ghHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${ghConfig.token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}
async function ghGetFile() {
  const url = `https://api.github.com/repos/${encodeURIComponent(ghConfig.owner)}/${encodeURIComponent(ghConfig.repo)}/contents/${encodeURIComponent(ghConfig.path)}?ref=${encodeURIComponent(ghConfig.branch)}`;
  const res = await fetch(url, { headers: ghHeaders() });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function base64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}
async function syncFromGitHub() {
  if (!ghConfig.owner || !ghConfig.repo || !ghConfig.token) throw new Error("请先在设置里填写 GitHub 信息");
  ensureSyncBase();
  const remoteFile = await ghGetFile();
  if (!remoteFile) return await ghCreateInitial();

  const remote = JSON.parse(base64ToUtf8(remoteFile.content));
  const base = store._sync.base;
  const local = normalizeStore();
  const merged = {};
  const allKeys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  const conflicts = [];
  for (const k of allKeys) {
    if (k === "_sync") continue;
    const b = base[k], l = local[k], r = remote[k];
    const lCh = JSON.stringify(b) !== JSON.stringify(l);
    const rCh = JSON.stringify(b) !== JSON.stringify(r);
    if (!lCh && !rCh) merged[k] = l;
    else if (lCh && !rCh) merged[k] = l;
    else if (!lCh && rCh) merged[k] = r;
    else { merged[k] = l; conflicts.push(k); }
  }
  Object.assign(store, merged);
  await ghPush(remoteFile.sha, conflicts.length ? `sync: keep local on ${conflicts.join(",")}` : "sync from PWA");
  if (conflicts.length) toast(`已同步（${conflicts.join("、")} 保留本地）`);
  else toast("同步成功");
  render(currentPage);
}
async function ghCreateInitial() {
  const content = utf8ToBase64(JSON.stringify(normalizeStore(), null, 2));
  const url = `https://api.github.com/repos/${encodeURIComponent(ghConfig.owner)}/${encodeURIComponent(ghConfig.repo)}/contents/${encodeURIComponent(ghConfig.path)}`;
  const res = await fetch(url, { method: "PUT", headers: ghHeaders(), body: JSON.stringify({ message: "init: 拾光工作台数据", content, branch: ghConfig.branch }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  store._sync.base = normalizeStore();
  store._sync.lastSyncedAt = new Date().toISOString();
  store._sync.remoteSha = data.content.sha;
  save();
  toast("已在仓库创建数据文件");
  render(currentPage);
}
async function ghPush(sha, message) {
  const content = utf8ToBase64(JSON.stringify(normalizeStore(), null, 2));
  const url = `https://api.github.com/repos/${encodeURIComponent(ghConfig.owner)}/${encodeURIComponent(ghConfig.repo)}/contents/${encodeURIComponent(ghConfig.path)}`;
  const res = await fetch(url, { method: "PUT", headers: ghHeaders(), body: JSON.stringify({ message, content, sha, branch: ghConfig.branch }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  store._sync.base = normalizeStore();
  store._sync.lastSyncedAt = new Date().toISOString();
  store._sync.remoteSha = data.content.sha;
  save();
}
async function pushToGitHub(message) {
  if (!ghConfig.owner || !ghConfig.repo || !ghConfig.token) throw new Error("请先在设置里填写 GitHub 信息");
  ensureSyncBase();
  const remoteFile = await ghGetFile();
  const sha = remoteFile ? remoteFile.sha : undefined;
  await (sha ? ghPush(sha, message || "update from PWA") : ghCreateInitial());
}

/* ---------- 导出 / 导入 ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(normalizeStore(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `拾光工作台_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function importData(text) {
  const data = JSON.parse(text);
  const required = ["english", "workouts", "expense", "todo", "recipes", "weeklyMenu", "menuHistory", "anniversaries"];
  const missing = required.filter(k => !(k in data));
  if (missing.length) throw new Error("缺少关键字段：" + missing.join(", "));
  if (!confirm(`确认导入？这会覆盖当前本地 ${KEY} 数据。`)) return;
  store = data;
  ensureSyncBase();
  save();
  render(currentPage);
  toast("导入成功");
}
function resetData() {
  if (!confirm("确定清空所有本地数据并恢复演示数据？此操作不可撤销。")) return;
  store = JSON.parse(JSON.stringify(SEED));
  ensureSyncBase();
  save();
  render(currentPage);
  toast("已恢复演示数据");
}

/* ---------- 导航 ---------- */
const PAGE_TITLES = {
  home:        "首页",
  english:     "每日英语",
  fitness:     "健身",
  expense:     "消费",
  todo:        "每日待办",
  recipe:      "一周食谱",
  anniversary: "纪念日",
  settings:    "设置"
};
let currentPage = "home";

const drawer = $("#drawer"), overlay = $("#overlay");
$("#menuBtn").addEventListener("click", () => { drawer.classList.add("open"); overlay.classList.add("show"); });
$("#closeDrawerBtn").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
function closeDrawer() { drawer.classList.remove("open"); overlay.classList.remove("show"); }

$("#navList").addEventListener("click", e => {
  const li = e.target.closest("li"); if (!li) return;
  go(li.dataset.page); closeDrawer();
});
function go(page) {
  currentPage = page;
  $$("#navList li").forEach(li => li.classList.toggle("active", li.dataset.page === page));
  $("#pageTitle").textContent = PAGE_TITLES[page];
  render(page);
}

const WD = ["日", "一", "二", "三", "四", "五", "六"];
const now = new Date();
$("#topDate").textContent = `${now.getMonth()+1} 月 ${now.getDate()} 日 · 周${WD[now.getDay()]}`;

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
}

/* ---------- 发音（英音优先） ---------- */
let cachedVoices = [];
function loadVoices() { try { cachedVoices = speechSynthesis.getVoices() || []; } catch (e) {} }
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
function pickVoice() {
  const vs = cachedVoices.length ? cachedVoices : (() => { try { return speechSynthesis.getVoices() || []; } catch (e) { return []; } })();
  // 英音优先：Daniel(苹果经典英音) / Arthur / Sonia / Kate / Oliver / Google UK / Microsoft UK
  const uk = vs.filter(v => (v.lang || "").toLowerCase().startsWith("en-gb"));
  const named = uk.find(v => /daniel|arthur|sonia|kate|oliver|uk english|google uk|microsoft (libby|sonia|ryan|george)/i.test(v.name));
  return named || uk[0] || vs.find(v => /daniel|uk english|en-gb/i.test(v.name + (v.lang || ""))) || null;
}
function speak(text) {
  if (!("speechSynthesis" in window)) { toast("当前浏览器不支持朗读"); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; }
  else { u.lang = "en-GB"; }
  u.rate = 0.85; u.pitch = 1.0;   // 慢一点、自然一点
  speechSynthesis.speak(u);
}
/* 智能朗读：优先播 Edge 神经语音 mp3（英音），失败/离线退回本地朗读 */
function speakSmart(text, url) {
  if (url) {
    const a = new Audio(url);
    a.onerror = () => speak(text);
    a.onplay = () => { try { speechSynthesis.cancel(); } catch (e) {} };
    a.play().catch(() => speak(text));
    return;
  }
  speak(text);
}

/* ---------- 图表实例管理 ---------- */
const charts = [];
function killCharts() { charts.forEach(c => { try { c.destroy(); } catch(e){} }); charts.length = 0; }

/* ================================================================
   页面：每日英语
================================================================ */
function renderEnglish() {
  const d = store.english;
  const ttsBase = `https://cdn.jsdelivr.net/gh/yangke-github/shiguang-workbench@main/tts/${d.date || "0000-00-00"}`;
  const wordsHtml = d.words.map((w, i) => `
    <div class="word-row">
      <span class="w">${w.word}</span>
      <span class="p">${w.phonetic}</span>
      <span class="m">${w.meaning}</span>
      <button class="speak-btn" data-say="${w.word}" data-say-url="${ttsBase}/word-${i}.mp3" title="朗读">▷</button>
    </div>`).join("");

  const kw = d.article.keywords.map(k => `<span class="tag">${k}</span>`).join("");

  $("#content").innerHTML = `
    <div class="page-date">TODAY · ${d.date}</div>
    <div class="page-headline">今日十词</div>
    <div class="page-sub">四六级 · 由 Hermes 每天清晨推送</div>
    ${wordsHtml}

    <div class="section-title">每日一篇 <small>${d.article.title}</small></div>
    <div class="article-block">
      <div class="article-title">${d.article.title}</div>
      <div class="article-en">${d.article.en}</div>
      <div class="article-zh">${d.article.zh}</div>
      <div class="kw-row">${kw}</div>
      <div style="margin-top:18px"><button class="btn ghost" data-say-article="1" data-say-url="${ttsBase}/article.mp3">▷ 朗读全文</button></div>
    </div>`;

  $$("#content [data-say]").forEach(b => b.addEventListener("click", () => speakSmart(b.dataset.say, b.dataset.sayUrl)));
  const ab = $("#content [data-say-article]");
  if (ab) ab.addEventListener("click", () => speakSmart(d.article.en, ab.dataset.sayUrl));
}

/* ================================================================
   页面：健身（日 = 唯一录入入口；周/月/年 = 只读统计）
================================================================ */
let fitScope = "日";             // 日 | 周 | 月 | 年
let fitDay = todayStr();         // 日视图定位日期
let fitAnchor = todayStr();      // 周/月/年视图定位锚点
let trendEx = "";                // 趋势图当前动作

const workoutOf = date => store.workouts[date] || { strength: [], cardio: [] };
const exNamesOfPart = part => [...EX_PRESETS[part], ...(store.customEx[part] || [])];
const allCardioTypes = () => [...CARDIO_TYPES, ...(store.customCardio || [])];
/* 组容量：Σ 重量×次数（重量 0 或空 = 自重，不计入） */
const volOfSets = sets => sets.reduce((s, x) => s + ((+x.weight || 0) > 0 ? (+x.weight) * (+x.reps || 0) : 0), 0);

function renderFitness() {
  let label;
  if (fitScope === "日") label = `${fitDay.slice(5)} · 周${wdOf(fitDay)}`;
  else if (fitScope === "周") { const f = mondayOf(fitAnchor); label = `${f.slice(5)} — ${shiftDate(f, 6).slice(5)}`; }
  else if (fitScope === "月") label = `${fitAnchor.slice(0,4)} 年 ${+fitAnchor.slice(5,7)} 月`;
  else label = `${fitAnchor.slice(0,4)} 年`;

  $("#content").innerHTML = `
    <div class="page-date">FITNESS</div>
    <div class="page-headline">健身</div>
    <div class="page-sub">坚持本身就是意义</div>

    <div class="seg" id="fitSeg">
      ${["日","周","月","年"].map(s => `<button data-s="${s}" class="${s===fitScope?"on":""}">${s}</button>`).join("")}
    </div>
    <div class="hist-nav">
      <button id="fitPrev">‹</button>
      <div class="hist-label">${label}</div>
      <button id="fitNext">›</button>
    </div>
    <div id="fitBody"></div>`;

  $("#fitSeg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (fitScope === "日" && b.dataset.s !== "日") fitAnchor = fitDay;
    fitScope = b.dataset.s;
    renderFitness();
  });
  $("#fitPrev").addEventListener("click", () => shiftFit(-1));
  $("#fitNext").addEventListener("click", () => shiftFit(1));

  if (fitScope === "日") renderDayEditor();
  else renderStatView();
}

/* 顶部 ‹ › 按当前维度步进：日 ±1 天 / 周 ±1 周 / 月 ±1 月 / 年 ±1 年 */
function shiftFit(dir) {
  if (fitScope === "日") fitDay = shiftDate(fitDay, dir);
  else if (fitScope === "周") fitAnchor = shiftDate(fitAnchor, dir * 7);
  else if (fitScope === "月") fitAnchor = shiftMonth(fitAnchor, dir);
  else fitAnchor = `${+fitAnchor.slice(0,4) + dir}-01-01`;
  renderFitness();
}

/* ---------- 日视图：唯一的录入入口 ---------- */
function renderDayEditor() {
  const day = workoutOf(fitDay);
  const totalSets = day.strength.reduce((s, e) => s + e.sets.length, 0);
  const volume = day.strength.reduce((s, e) => s + volOfSets(e.sets), 0);
  const cardioMin = day.cardio.reduce((s, c) => s + (+c.minutes || 0), 0);

  /* 六个部位各一行：部位名 + ［＋］添加动作，下挂该部位的动作卡片 */
  const partBlocks = PARTS.map(part => {
    const cards = day.strength.map((e, ei) => ({ e, ei }))
      .filter(x => x.e.part === part)
      .map(x => exCardHtml(x.e, x.ei)).join("");
    return `
      <div class="part-bar">
        <span class="part-name">${part}</span>
        <button class="part-plus" data-add-ex="${part}" title="给${part}添加动作">＋</button>
      </div>
      ${cards}`;
  }).join("");

  $("#fitBody").innerHTML = `
    <div class="section-title">力 量 <small>部位 → 动作 → 逐组（重量 × 次数）</small></div>
    ${partBlocks}

    <div class="section-title">有 氧 <small>类型 + 时长（分钟）</small></div>
    <div class="day-dishes" style="margin-bottom:4px">
      ${day.cardio.map((c, i) => `<span class="dish-chip">${c.type} ${c.minutes}分<button class="chip-x" data-del-cardio="${i}">×</button></span>`).join("")}
      <button class="add-dish" id="addCardioBtn" title="添加有氧">＋</button>
    </div>

    <div class="stat-row" style="margin-top:20px">
      <div class="stat"><div class="stat-num">${totalSets}<em>组</em></div><div class="stat-label">力量组数</div></div>
      <div class="stat"><div class="stat-num">${Math.round(volume).toLocaleString()}<em>kg</em></div><div class="stat-label">当日容量</div></div>
      <div class="stat"><div class="stat-num">${cardioMin}<em>分</em></div><div class="stat-label">有氧时长</div></div>
    </div>`;

  $$("#fitBody [data-add-ex]").forEach(b => b.addEventListener("click", () => openExercisePicker(b.dataset.addEx)));

  /* ＋ 添加一组：自动复制上一组的重量和次数 */
  $$("#fitBody [data-add-set]").forEach(b => b.addEventListener("click", () => {
    const ex = day.strength[+b.dataset.addSet];
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push(last ? { ...last } : { weight: "", reps: "" });
    save(); renderFitness();
  }));

  /* 删除某组 */
  $$("#fitBody [data-del-set]").forEach(b => b.addEventListener("click", () => {
    const [ei, si] = b.dataset.delSet.split("|").map(Number);
    day.strength[ei].sets.splice(si, 1);
    if (!day.strength[ei].sets.length) day.strength.splice(ei, 1);
    save(); renderFitness();
  }));

  /* 删除整张动作卡片 */
  $$("#fitBody [data-del-ex]").forEach(b => b.addEventListener("click", () => {
    day.strength.splice(+b.dataset.delEx, 1);
    save(); renderFitness();
  }));

  /* 重量 / 次数行内直接修改 */
  $$("#fitBody .set-line input").forEach(inp => inp.addEventListener("change", () => {
    const key = inp.dataset.w !== undefined ? "w" : "r";
    const [ei, si] = inp.dataset[key].split("|").map(Number);
    if (key === "w") day.strength[ei].sets[si].weight = inp.value === "" ? "" : +inp.value;
    else             day.strength[ei].sets[si].reps   = inp.value === "" ? "" : +inp.value;
    save();
  }));

  /* 有氧 */
  $("#addCardioBtn").addEventListener("click", openCardioEditor);
  $$("#fitBody [data-del-cardio]").forEach(b => b.addEventListener("click", () => {
    day.cardio.splice(+b.dataset.delCardio, 1);
    save(); renderFitness();
  }));
}

/* 动作卡片：头部（动作名 + 部位标签 + 删除）+ 组行 + 添加一组 */
function exCardHtml(e, ei) {
  return `
    <div class="ex-card">
      <div class="ex-head">
        <span class="ex-title">${e.name}</span>
        <span class="tag">${e.part}</span>
        <button class="ex-del" data-del-ex="${ei}">删除</button>
      </div>
      <div class="set-lines">
        ${e.sets.map((s, si) => `
          <div class="set-line">
            <span class="set-no">组${si + 1}</span>
            <span class="set-input"><input type="number" step="0.5" min="0" inputmode="decimal" value="${s.weight}" placeholder="重量" data-w="${ei}|${si}"><em>kg</em></span>
            <span class="set-input"><input type="number" min="0" inputmode="numeric" value="${s.reps}" placeholder="次数" data-r="${ei}|${si}"><em>次</em></span>
            <button class="set-del" data-del-set="${ei}|${si}" title="删除该组">×</button>
          </div>`).join("")}
        <button class="set-add" data-add-set="${ei}">＋ 添加一组</button>
      </div>
    </div>`;
}

/* 动作选择弹窗：该部位内置动作宫格 + 自定义创建 */
function openExercisePicker(part) {
  openModal(`
    <div class="modal-kicker">${fitDay.slice(5)} · ${part} · 选择动作</div>
    <div class="pick-grid">
      ${exNamesOfPart(part).map(n => `<button class="pick-cell" data-pick-ex="${n}">${n}</button>`).join("")}
    </div>
    <div class="form-row" style="margin-top:14px;align-items:flex-end">
      <div><label class="f-label">自定义动作</label><input type="text" id="customEx" placeholder="动作名"></div>
      <button class="btn" id="customExAdd" style="flex:none">创 建</button>
    </div>`);

  $$("#modalBox [data-pick-ex]").forEach(el =>
    el.addEventListener("click", () => addExercise(el.dataset.pickEx, part)));
  $("#customExAdd").addEventListener("click", () => {
    const name = $("#customEx").value.trim();
    if (!name) { toast("请输入动作名"); return; }
    if (!exNamesOfPart(part).includes(name)) {
      store.customEx[part] = store.customEx[part] || [];
      store.customEx[part].push(name);
    }
    addExercise(name, part);
  });
}

/* 添加动作：自动带入最近一次做该动作时的全部组数据（重量×次数） */
function addExercise(name, part) {
  const day = workoutOf(fitDay);
  if (!store.workouts[fitDay]) store.workouts[fitDay] = day;
  if (day.strength.some(e => e.name === name)) { toast("该动作今天已添加"); return; }

  let sets = null;
  Object.keys(store.workouts).sort().reverse().some(d => {
    if (d >= fitDay) return false;
    const hit = (store.workouts[d].strength || []).find(e => e.name === name);
    if (hit && hit.sets.length) { sets = hit.sets.map(s => ({ ...s })); return true; }
    return false;
  });
  day.strength.push({ part, name, sets: sets || [{ weight: "", reps: "" }] });
  save(); closeModal(); renderFitness();
  toast(sets ? `已添加「${name}」，带入上次 ${sets.length} 组` : `已添加「${name}」`);
}

/* 有氧录入弹窗：类型宫格 + 分钟数 + 自定义类型 */
function openCardioEditor() {
  const types = allCardioTypes();
  let picked = types[0];
  openModal(`
    <div class="modal-kicker">${fitDay.slice(5)} · 有氧</div>
    <div class="pick-grid" id="cdTypes">
      ${types.map((t, i) => `<button class="pick-cell ${i===0?"sel":""}" data-cd-type="${t}">${t}</button>`).join("")}
    </div>
    <div class="form-row" style="margin-top:14px;align-items:flex-end">
      <div><label class="f-label">时长（分钟）</label><input type="number" id="cdMin" placeholder="30" min="1"></div>
      <button class="btn" id="cdSave" style="flex:none">添 加</button>
    </div>
    <div class="form-row" style="margin-top:10px;align-items:flex-end">
      <div><label class="f-label">自定义类型</label><input type="text" id="cdCustom" placeholder="如：划船机"></div>
      <button class="btn ghost" id="cdCustomAdd" style="flex:none">创 建</button>
    </div>`);

  $("#cdTypes").addEventListener("click", e => {
    const b = e.target.closest("[data-cd-type]"); if (!b) return;
    picked = b.dataset.cdType;
    $$("#cdTypes .pick-cell").forEach(x => x.classList.toggle("sel", x === b));
  });
  $("#cdSave").addEventListener("click", () => {
    const min = +$("#cdMin").value;
    if (!min) { toast("请输入时长"); return; }
    const day = workoutOf(fitDay);
    if (!store.workouts[fitDay]) store.workouts[fitDay] = day;
    day.cardio.push({ type: picked, minutes: min });
    save(); closeModal(); renderFitness(); toast("已记录");
  });
  $("#cdCustomAdd").addEventListener("click", () => {
    const name = $("#cdCustom").value.trim();
    if (!name) { toast("请输入类型名"); return; }
    if (!store.customCardio.includes(name)) store.customCardio.push(name);
    save(); closeModal(); openCardioEditor();
  });
}

/* ---------- 周 / 月 / 年视图：只读统计（由日记录实时聚合，不单独建表） ---------- */
function renderStatView() {
  const anchor = fitAnchor;
  let from, to;
  if (fitScope === "周") { from = mondayOf(anchor); to = shiftDate(from, 6); }
  else if (fitScope === "月") { from = anchor.slice(0, 7) + "-01"; to = shiftDate(shiftMonth(anchor, 1), -1); }
  else { from = anchor.slice(0, 4) + "-01-01"; to = anchor.slice(0, 4) + "-12-31"; }

  const dates = Object.keys(store.workouts).filter(d => d >= from && d <= to).sort();
  let trainDays = 0, volume = 0, cardioMin = 0;
  const partSets = {}; PARTS.forEach(p => partSets[p] = 0);
  const exMax = {};   // 动作名 -> [{date, max}] 单次训练最大重量
  dates.forEach(d => {
    const w = store.workouts[d];
    const hasS = (w.strength || []).length > 0, hasC = (w.cardio || []).length > 0;
    if (hasS || hasC) trainDays++;
    (w.strength || []).forEach(e => {
      partSets[e.part] += e.sets.length;
      volume += volOfSets(e.sets);
      const mx = e.sets.reduce((m, s) => Math.max(m, +s.weight || 0), 0);
      if (mx > 0) (exMax[e.name] = exMax[e.name] || []).push({ date: d, max: mx });
    });
    (w.cardio || []).forEach(c => cardioMin += +c.minutes || 0);
  });

  const exNames = Object.keys(exMax).sort();
  if (!exNames.includes(trendEx)) trendEx = exNames.includes("杠铃卧推") ? "杠铃卧推" : (exNames[0] || "");
  let sessions = trendEx ? exMax[trendEx] : [];
  if (fitScope === "年" && sessions.length > 12) sessions = sessions.slice(-12);

  $("#fitBody").innerHTML = `
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${trainDays}<em>天</em></div><div class="stat-label">训练次数</div></div>
      <div class="stat"><div class="stat-num">${Math.round(volume).toLocaleString()}<em>kg</em></div><div class="stat-label">力量总容量</div></div>
      <div class="stat"><div class="stat-num">${cardioMin}<em>分</em></div><div class="stat-label">有氧总时长</div></div>
    </div>

    <div class="section-title">部位分布 <small>训练组数</small></div>
    <div class="chart-box"><canvas id="fitBar" height="170"></canvas></div>

    ${exNames.length ? `
    <div class="section-title">动作重量趋势 <small>单次最大重量</small></div>
    <div class="form-row" style="align-items:center;margin-bottom:10px">
      <select id="trendSel" style="flex:none">${exNames.map(n => `<option ${n === trendEx ? "selected" : ""}>${n}</option>`).join("")}</select>
      <span class="li-sub" id="trendSummary" style="flex:1;text-align:right"></span>
    </div>
    <div class="chart-box"><canvas id="trendChart" height="170"></canvas></div>` : ""}

    ${fitScope === "月" ? monthCalendarHtml(anchor) : ""}

    <div class="section-title">记录明细 <small>${dates.length} 天</small></div>
    ${dates.slice().reverse().slice(0, 12).map(d => {
      const w = store.workouts[d];
      const sets = (w.strength || []).reduce((s, e) => s + e.sets.length, 0);
      const cm = (w.cardio || []).reduce((s, c) => s + (+c.minutes || 0), 0);
      return `<div class="list-item">
        <span class="tag ${sets ? "" : "gray"}">${sets && cm ? "综合" : sets ? "力量" : "有氧"}</span>
        <div class="li-main"><div class="li-title">${(w.strength || []).map(e => e.name).join("，") || "纯有氧"}</div>
        <div class="li-sub">${d}${sets ? ` · ${sets} 组` : ""}${cm ? ` · 有氧 ${cm} 分` : ""}</div></div>
        <button class="todo-act" data-jump="fit|${d}" title="去编辑">✎</button>
        <button class="todo-act act-del" data-del="fitday|${d}" title="删除当天">🗑</button>
      </div>`;
    }).join("") || `<div class="empty">该时段暂无记录</div>`}`;

  /* 部位分布柱状图（六部位对比） */
  charts.push(new Chart($("#fitBar"), {
    type: "bar",
    data: { labels: PARTS, datasets: [{ data: PARTS.map(p => partSets[p]), backgroundColor: "#5A9FE8", borderRadius: 2, barThickness: 18 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#93A0AD", font: { size: 10 } } },
        y: { grid: { color: "#E7EFF7" }, ticks: { color: "#93A0AD", font: { size: 10 }, precision: 0 } }
      }
    }
  }));

  /* 动作重量趋势折线：数据点 = 该动作单次训练最大重量 */
  if (trendEx && sessions.length) {
    const first = sessions[0].max, last = sessions[sessions.length - 1].max;
    const pct = first ? Math.round((last - first) / first * 100) : 0;
    $("#trendSummary").innerHTML = `${first}kg → ${last}kg <b style="color:${pct >= 0 ? "#5A9FE8" : "#5C6B7A"}">（${pct >= 0 ? "+" : ""}${pct}%）</b>`;
    charts.push(new Chart($("#trendChart"), {
      type: "line",
      data: {
        labels: sessions.map(s => s.date.slice(5)),
        datasets: [{
          data: sessions.map(s => s.max),
          borderColor: "#5A9FE8", borderWidth: 1.5, pointRadius: 2.5,
          pointBackgroundColor: "#5A9FE8", tension: 0.35, fill: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { title: items => "日期 " + items[0].label, label: item => `最大重量 ${item.parsed.y} kg` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#93A0AD", font: { size: 10 }, maxTicksLimit: 8 } },
          y: { grid: { color: "#E7EFF7" }, ticks: { color: "#93A0AD", font: { size: 10 } } }
        }
      }
    }));
    $("#trendSel").addEventListener("change", e => { trendEx = e.target.value; renderFitness(); });
  }
}

/* 月视图：打卡日历（力量 / 力量+有氧 / 仅有氧 / 休息，今天高亮） */
function monthCalendarHtml(anchor) {
  const y = +anchor.slice(0, 4), m = +anchor.slice(5, 7);
  const startBlank = (new Date(y, m - 1, 1).getDay() + 6) % 7;   // 周一开头
  const days = new Date(y, m, 0).getDate();
  const today = todayStr();
  let cells = "";
  for (let i = 0; i < startBlank; i++) cells += `<span class="cal-cell blank"></span>`;
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${pad(m)}-${pad(d)}`;
    const w = store.workouts[ds];
    const hasS = w && (w.strength || []).length > 0;
    const hasC = w && (w.cardio || []).length > 0;
    const cls = !hasS && !hasC ? "rest" : hasS && hasC ? "both" : hasS ? "s" : "c";
    cells += `<span class="cal-cell ${cls}${ds === today ? " today" : ""}" data-jump="fit|${ds}" style="cursor:pointer">${d}</span>`;
  }
  return `
    <div class="section-title">打卡日历</div>
    <div class="cal-grid">
      <div class="cal-wd">${["一","二","三","四","五","六","日"].map(x => `<span>${x}</span>`).join("")}</div>
      <div class="cal-days">${cells}</div>
    </div>
    <div class="heat-legend">
      <span>休息</span><i style="background:#E7EFF7"></i>
      <span>力量</span><i style="background:#A8CFF0"></i>
      <span>力量+有氧</span><i style="background:#5A9FE8"></i>
      <span>仅有氧</span><i style="background:#7BC4B8"></i>
    </div>`;
}

/* ================================================================
   页面：消费
================================================================ */
const EXP_CATS = ["饮食", "交通", "购物", "居住", "娱乐", "医疗", "其他"];
let expScope = "月";

function renderExpense() {
  const now = todayStr();
  const inScope = r => {
    if (expScope === "日") return r.date === now;
    if (expScope === "周") {
      const t = new Date(), dd = new Date(r.date);
      const monday = new Date(t); monday.setDate(t.getDate() - ((t.getDay() + 6) % 7));
      return dd >= monday && dd <= t;
    }
    return r.date.slice(0, 7) === now.slice(0, 7);
  };
  const recs = store.expense.records.filter(inScope);
  const total = recs.reduce((s, r) => s + r.amount, 0);
  const max = recs.reduce((m, r) => r.amount > (m?.amount ?? -1) ? r : m, null);

  const byCat = {};
  recs.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.amount; });

  $("#content").innerHTML = `
    <div class="page-date">EXPENSE</div>
    <div class="page-headline">消费</div>
    <div class="page-sub">钱花在哪，生活就在哪</div>

    <div class="seg" id="expSeg">
      ${["日","周","月"].map(s => `<button data-s="${s}" class="${s===expScope?"on":""}">${s}</button>`).join("")}
    </div>

    <div class="stat-row">
      <div class="stat"><div class="stat-num">${fmtCNY(total)}</div><div class="stat-label">${expScope}合计</div></div>
      <div class="stat"><div class="stat-num">${max ? fmtCNY(max.amount) : "—"}</div><div class="stat-label">最大单笔${max ? " · " + max.note : ""}</div></div>
    </div>

    <div class="section-title">分类占比 <small>${expScope}</small></div>
    <div class="chart-box"><canvas id="expChart" height="180"></canvas></div>

    <div class="section-title">记一笔</div>
    <div class="form">
      <div class="form-row">
        <div><label class="f-label">类型</label>
          <select id="expCat">${EXP_CATS.map(c=>`<option>${c}</option>`).join("")}</select></div>
        <div><label class="f-label">金额</label>
          <input type="number" id="expAmt" placeholder="0.0" step="0.1"></div>
      </div>
      <div><label class="f-label">备注</label><input type="text" id="expNote" placeholder="午餐（可选）"></div>
      <button class="btn" id="expSubmit">记 入</button>
    </div>

    <div class="section-title">明细 <small>${recs.length} 笔</small></div>
    <div id="expList"></div>`;

  const ctx = $("#expChart");
  if (recs.length) {
    charts.push(new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(byCat),
        datasets: [{ data: Object.values(byCat), backgroundColor: "#5A9FE8", borderRadius: 2, barThickness: 22 }]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "#E7EFF7" }, ticks: { color: "#93A0AD", font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { color: "#5C6B7A", font: { size: 11 } } }
        }
      }
    }));
  }

  $("#expList").innerHTML = recs.length ? [...recs].reverse().map(r => {
    const ri = store.expense.records.indexOf(r);
    return `<div class="list-item">
      <span class="tag gray">${r.category}</span>
      <div class="li-main"><div class="li-title">${r.note || r.category}</div><div class="li-sub">${r.date}</div></div>
      <span class="li-amount">${fmtCNY(r.amount)}</span>
      <button class="todo-act" data-edit="exp|${ri}" title="修改">✎</button>
      <button class="todo-act act-del" data-del="exp|${ri}" title="删除">🗑</button>
    </div>`;
  }).join("") : `<div class="empty">这个${expScope}还没有消费记录</div>`;

  $("#expSeg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    expScope = b.dataset.s; renderExpense();
  });
  $("#expSubmit").addEventListener("click", () => {
    const amt = +$("#expAmt").value;
    if (!amt) { toast("请输入金额"); return; }
    const cat = $("#expCat").value, note = $("#expNote").value.trim();
    if (expEditIdx !== null && store.expense.records[expEditIdx]) {
      Object.assign(store.expense.records[expEditIdx], { category: cat, amount: amt, note });
      expEditIdx = null;
    } else {
      store.expense.records.push({ date: todayStr(), category: cat, amount: amt, note });
    }
    save(); renderExpense(); toast("已保存");
  });
}

/* ================================================================
   页面：每日待办
================================================================ */
function renderTodo() {
  const tasks = store.todo.tasks;
  const undone = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  const PRIO = { high: "高", medium: "中", low: "低" };

  const item = t => `
    <div class="todo-item ${t.done ? "done-t" : ""}" data-id="${t.id}">
      <button class="todo-check ${t.done ? "done" : ""}" data-check="${t.id}">${t.done ? "✓" : ""}</button>
      <div class="li-main">
        <div class="li-title">${t.title}</div>
        <div class="li-sub">
          截止 ${t.due}
          ${t.priority !== "low" ? ` · <span class="tag">${PRIO[t.priority]}</span>` : ""}
          ${t.postponeDays > 0 ? ` · <span class="tag">延期 ${t.postponeDays} 天</span>` : ""}
        </div>
      </div>
      <button class="todo-act" data-edit="${t.id}">编辑</button>
      <button class="todo-act act-del" data-del="todo|${t.id}">删除</button>
    </div>`;

  $("#content").innerHTML = `
    <div class="page-date">TODO</div>
    <div class="page-headline">每日待办</div>
    <div class="page-sub">每晚 23:55，Hermes 检查未完成项并顺延</div>

    <div class="stat-row" style="margin-bottom:20px">
      <div class="stat"><div class="stat-num">${undone.length}</div><div class="stat-label">待完成</div></div>
      <div class="stat"><div class="stat-num">${done.length}</div><div class="stat-label">已完成</div></div>
    </div>

    <div class="section-title">新增 / 编辑 <small id="todoEditHint"></small></div>
    <div class="form">
      <div><label class="f-label">事项</label><input type="text" id="tdTitle" placeholder="要做什么"></div>
      <div class="form-row">
        <div><label class="f-label">截止日期</label><input type="date" id="tdDue" value="${todayStr()}"></div>
        <div><label class="f-label">优先级</label>
          <select id="tdPrio"><option value="high">高</option><option value="medium" selected>中</option><option value="low">低</option></select></div>
      </div>
      <button class="btn" id="tdSubmit">保 存</button>
    </div>

    <div class="section-title">未完成 <small>${undone.length} 项</small></div>
    ${undone.length ? undone.map(item).join("") : `<div class="empty">全部完成，很棒</div>`}

    <div class="section-title">已完成 <small>${done.length} 项</small></div>
    ${done.length ? done.map(item).join("") : `<div class="empty">暂无</div>`}`;

  let editId = null;
  $$("#content [data-check]").forEach(b => b.addEventListener("click", () => {
    const t = store.todo.tasks.find(x => x.id == b.dataset.check);
    t.done = !t.done; save(); renderTodo();
  }));
  $$("#content [data-edit]").forEach(b => b.addEventListener("click", () => {
    const t = store.todo.tasks.find(x => x.id == b.dataset.edit);
    editId = t.id;
    $("#tdTitle").value = t.title; $("#tdDue").value = t.due; $("#tdPrio").value = t.priority;
    $("#todoEditHint").textContent = `正在编辑 #${t.id}`;
    $("#tdSubmit").textContent = "更新";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  $("#tdSubmit").addEventListener("click", () => {
    const title = $("#tdTitle").value.trim();
    if (!title) { toast("请输入事项"); return; }
    if (editId) {
      const t = store.todo.tasks.find(x => x.id === editId);
      Object.assign(t, { title, due: $("#tdDue").value, priority: $("#tdPrio").value });
    } else {
      store.todo.tasks.push({
        id: Date.now(), title, due: $("#tdDue").value,
        done: false, priority: $("#tdPrio").value, postponeDays: 0, createdAt: todayStr()
      });
    }
    save(); renderTodo(); toast("已保存");
  });
}

/* ================================================================
   页面：一周食谱
================================================================ */
let recipeTab = "menu";        // menu 周食谱 | history 历史食谱 | lib 食谱库
let histScope = "周";          // 天 | 周 | 月
let histDate = (() => {        // 定位到最近一条有记录的日期
  const rs = (store.menuHistory && store.menuHistory.records) || [];
  return rs.length ? rs[rs.length - 1].date : todayStr();
})();

const DAYS_CN = ["一","二","三","四","五","六","日"];
const recipeById = id => store.recipes.recipes.find(r => String(r.id) === String(id));
const dishChips = (ids, ctx, date) => (ids || []).map(id => {
  const r = recipeById(id);
  if (!r) return "";
  const x = ctx === "hist" && date
    ? `<button class="chip-x" data-del="histdish|${date}|${id}" title="移除这道菜">×</button>`
    : "";
  return `<span class="dish-chip-g"><button class="dish-chip" data-detail="${id}" data-ctx="${ctx}">${r.name}</button>${x}</span>`;
}).join("");

/* ---------- 日期工具 ---------- */
function shiftDate(ds, delta) {
  const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function mondayOf(ds) {
  const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function shiftMonth(ds, delta) {
  const d = new Date(ds + "T00:00:00"); d.setDate(1); d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
const wdOf = ds => DAYS_CN[(new Date(ds + "T00:00:00").getDay() + 6) % 7];
const histRecord = date => store.menuHistory.records.find(r => r.date === date);

/* ---------- 弹窗 ---------- */
const modalOverlay = $("#modalOverlay"), modalBox = $("#modalBox");
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
function openModal(html) {
  modalBox.innerHTML = html;
  modalOverlay.classList.add("show");
}
function closeModal() { modalOverlay.classList.remove("show"); }

/* 菜品详情弹窗：关联食谱库 */
function openRecipeDetail(id) {
  const r = recipeById(id); if (!r) return;
  openModal(`
    <div class="modal-kicker">食谱详情</div>
    <div class="modal-title">${r.name}</div>
    <div class="modal-sec">食 材</div>
    <div class="modal-ing">${r.ingredients.join("　·　")}</div>
    <div class="modal-sec">做 法</div>
    <div class="modal-steps">${r.steps.map((s, i) => `<div>${i + 1}　${s}</div>`).join("")}</div>
    <button class="modal-close" onclick="closeModal()">收 起</button>`);
}

/* 多选菜品弹窗 */
function openDishPicker(dayIdx) {
  const day = store.weeklyMenu.days[dayIdx];
  openModal(`
    <div class="modal-kicker">${day.date} · 周${wdOf(day.date)} · 选择菜品（可多选）</div>
    <div class="pick-list">
      ${store.recipes.recipes.map(r => `
        <label class="pick-item">
          <input type="checkbox" value="${r.id}" ${day.recipeIds.map(String).includes(String(r.id)) ? "checked" : ""}>
          <span class="pick-check"></span>
          <span class="pick-name">${r.name}</span>
          <span class="pick-sub">${r.ingredients.slice(0, 2).join(" · ")}</span>
        </label>`).join("")}
    </div>
    <button class="btn" id="pickConfirm" style="width:100%">确 定</button>`);
  $("#pickConfirm").addEventListener("click", () => {
    const ids = [...modalBox.querySelectorAll("input:checked")].map(i => +i.value);
    day.recipeIds = ids; save(); closeModal(); renderRecipe(); toast("已更新");
  });
}

/* 统一处理详情 chip 点击（事件委托） */
document.addEventListener("click", e => {
  // 编辑/删除/跳转按钮优先，避免误触详情
  if (e.target.closest("[data-del],[data-edit],[data-jump]")) return;
  const chip = e.target.closest("[data-detail]");
  if (chip) openRecipeDetail(chip.dataset.detail);
});
window.closeModal = closeModal;

function renderRecipe() {
  $("#content").innerHTML = `
    <div class="page-date">MENU</div>
    <div class="page-headline">一周食谱</div>
    <div class="page-sub">好好吃饭，是认真生活的证据</div>
    <div class="seg" id="rcTabSeg">
      <button data-t="menu"    class="${recipeTab==="menu"?"on":""}">周食谱</button>
      <button data-t="history" class="${recipeTab==="history"?"on":""}">历史食谱</button>
      <button data-t="lib"     class="${recipeTab==="lib"?"on":""}">食谱库</button>
    </div>
    <div id="rcBody"></div>`;

  $("#rcTabSeg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    recipeTab = b.dataset.t; renderRecipe();
  });

  if (recipeTab === "menu") renderWeekMenu();
  else if (recipeTab === "history") renderHistory();
  else renderLibrary();
}

/* ----- 周食谱（固定周一到周日 + 多选 + 详情） ----- */
function ensureWeekMenu() {
  const menu = store.weeklyMenu;
  const mon = mondayOf(todayStr());
  const needRebuild = !menu || menu.weekStart !== mon || !Array.isArray(menu.days) || menu.days.length !== 7;
  if (needRebuild) {
    menu.weekStart = mon;
    menu.days = Array.from({ length: 7 }, (_, i) => ({ date: shiftDate(mon, i), recipeIds: [] }));
    save();
  }
  return menu;
}
function renderWeekMenu() {
  const menu = ensureWeekMenu();
  const WD = ["一", "二", "三", "四", "五", "六", "日"];
  $("#rcBody").innerHTML = `
    <div class="page-sub" style="margin-bottom:14px">本周 ${menu.weekStart.slice(5)} 起 · 点菜名看做法，点 + 安排菜品</div>
    ${menu.days.map((d, i) => `
      <div class="week-row">
        <div class="week-day"><b>周${WD[i]}</b><small>${d.date.slice(5)}</small></div>
        <div class="day-dishes">${dishChips(d.recipeIds, "week") || `<span class="li-sub" style="align-self:center">未安排</span>`}</div>
        <button class="add-dish" data-picker="${i}" title="选择菜品">+</button>
      </div>`).join("")}`;

  $$("#rcBody [data-picker]").forEach(b =>
    b.addEventListener("click", () => openDishPicker(+b.dataset.picker)));
}

/* ----- 历史食谱（天 / 周 / 月） ----- */
function renderHistory() {
  const recs = store.menuHistory.records;
  if (!recs.length) {
    $("#rcBody").innerHTML = `<div class="empty">还没有历史记录</div>`;
    return;
  }

  let body = "";
  if (histScope === "天") {
    const rec = histRecord(histDate);
    body = `
      <div class="hist-nav">
        <button data-shift="-1">‹</button>
        <input type="date" id="histDateInput" value="${histDate}">
        <button data-shift="1">›</button>
      </div>
      ${rec
        ? `<div class="hist-row">
             <div class="hist-date"><b>${histDate.slice(5)}</b><small>周${wdOf(histDate)}</small></div>
             <div class="day-dishes">${dishChips(rec.recipeIds, "hist", histDate)}</div>
             <button class="todo-act act-del" data-del="histday|${histDate}" title="删除当天记录">🗑</button>
           </div>
           <div class="li-sub" style="margin-top:14px">当天共 ${rec.recipeIds.length} 道</div>`
        : `<div class="empty">这天没有做饭记录</div>`}`;
  } else if (histScope === "周") {
    const mon = mondayOf(histDate);
    const days = Array.from({ length: 7 }, (_, i) => shiftDate(mon, i));
    const rows = days.map(d => {
      const rec = histRecord(d);
      if (!rec) return "";
      return `<div class="hist-row">
        <div class="hist-date"><b>${d.slice(5)}</b><small>周${wdOf(d)}</small></div>
        <div class="day-dishes">${dishChips(rec.recipeIds, "hist", d)}</div>
        <button class="todo-act act-del" data-del="histday|${d}" title="删除当天记录">🗑</button>
      </div>`;
    }).join("");
    const total = days.reduce((s, d) => s + (histRecord(d)?.recipeIds.length || 0), 0);
    body = `
      <div class="hist-nav">
        <button data-shift="-7">‹</button>
        <div class="hist-label">${mon.slice(5)} — ${days[6].slice(5)}</div>
        <button data-shift="7">›</button>
      </div>
      ${rows || `<div class="empty">这一周没有做饭记录</div>`}
      <div class="li-sub" style="margin-top:14px">本周共 ${total} 道</div>`;
  } else {
    const prefix = histDate.slice(0, 7);
    const monthRecs = recs.filter(r => r.date.slice(0, 7) === prefix).sort((a, b) => b.date.localeCompare(a.date));
    const dishCount = {};
    monthRecs.forEach(r => r.recipeIds.forEach(id => {
      const name = recipeById(id)?.name; if (name) dishCount[name] = (dishCount[name] || 0) + 1;
    }));
    const top = Object.entries(dishCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const totalDishes = monthRecs.reduce((s, r) => s + r.recipeIds.length, 0);
    const ym = `${prefix.slice(0, 4)} 年 ${+prefix.slice(5, 7)} 月`;
    body = `
      <div class="hist-nav">
        <button data-mshift="-1">‹</button>
        <div class="hist-label">${ym}</div>
        <button data-mshift="1">›</button>
      </div>
      <div class="stat-row" style="margin-bottom:18px">
        <div class="stat"><div class="stat-num">${monthRecs.length}<em>天</em></div><div class="stat-label">做饭天数</div></div>
        <div class="stat"><div class="stat-num">${totalDishes}<em>道</em></div><div class="stat-label">合计菜品</div></div>
      </div>
      ${top.length ? `<div class="li-sub" style="margin-bottom:16px">最常做：${top.map(([n, c]) => `${n} ×${c}`).join("　·　")}</div>` : ""}
      ${monthRecs.map(r => `
        <div class="hist-row">
          <div class="hist-date"><b>${r.date.slice(5)}</b><small>周${wdOf(r.date)}</small></div>
          <div class="day-dishes">${dishChips(r.recipeIds, "hist", r.date)}</div>
          <button class="todo-act act-del" data-del="histday|${r.date}" title="删除当天记录">🗑</button>
        </div>`).join("") || `<div class="empty">这个月没有记录</div>`}`;
  }

  $("#rcBody").innerHTML = `
    <div class="seg" id="histSeg">
      ${["天","周","月"].map(s => `<button data-s="${s}" class="${s===histScope?"on":""}">${s}</button>`).join("")}
    </div>
    ${body}`;

  $("#histSeg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    histScope = b.dataset.s; renderHistory();
  });
  const di = $("#histDateInput");
  if (di) di.addEventListener("change", () => { histDate = di.value; renderHistory(); });
  $$("#rcBody [data-shift]").forEach(b => b.addEventListener("click", () => {
    histDate = shiftDate(histDate, +b.dataset.shift); renderHistory();
  }));
  $$("#rcBody [data-mshift]").forEach(b => b.addEventListener("click", () => {
    histDate = shiftMonth(histDate, +b.dataset.mshift); renderHistory();
  }));
}

/* ----- 食谱库 ----- */
function renderLibrary() {
  const recipes = store.recipes.recipes;
  $("#rcBody").innerHTML = `
    <div class="section-title">新增食谱</div>
    <div class="form">
      <div><label class="f-label">名称</label><input type="text" id="rcName" placeholder="番茄牛腩"></div>
      <div><label class="f-label">食材</label><input type="text" id="rcIng" placeholder="牛腩 500g，番茄 3 个，洋葱 1 个"></div>
      <div><label class="f-label">做法</label><textarea id="rcSteps" rows="2" placeholder="每步一行：&#10;牛腩焯水&#10;小火炖 90 分钟"></textarea></div>
      <button class="btn" id="rcSubmit">保 存</button>
    </div>
    <div class="section-title">食谱库 <small>${recipes.length} 道 · 点击查看做法</small></div>
    ${recipes.map(r => `
      <div class="recipe-item" data-detail="${r.id}" style="cursor:pointer">
        <div class="recipe-name">${r.name}</div>
        <div class="recipe-ing">${r.ingredients.join(" · ")}</div>
        <div class="recipe-steps">${r.steps.map((s,i)=>`${i+1}. ${s}`).join("　")}</div>
        <button class="todo-act act-del" data-del="recipe|${r.id}" title="删除食谱">🗑</button>
      </div>`).join("") || `<div class="empty">食谱库还是空的</div>`}`;

  $("#rcSubmit").addEventListener("click", () => {
    const name = $("#rcName").value.trim();
    if (!name) { toast("请输入食谱名称"); return; }
    store.recipes.recipes.push({
      id: Date.now(), name,
      ingredients: $("#rcIng").value.split(/[,，]/).map(s=>s.trim()).filter(Boolean),
      steps: $("#rcSteps").value.split("\n").map(s=>s.trim()).filter(Boolean)
    });
    save(); renderRecipe(); toast("已保存");
  });
}

/* ================================================================
   页面：纪念日
================================================================ */
/* ---------- 纪念日工具：支持 yearly 与 once ---------- */
/* ---------- 农历支持（1900-2100 查表法） ---------- */
const LUNAR_INFO = [
0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b8,0x0b4b0,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
0x0d520];
function lunarLeapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
function lunarLeapDays(y) { return lunarLeapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
function lunarMonthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
function lunarYearDays(y) {
  let s = 348, i = 0x8000;
  while (i > 0x8) { if (LUNAR_INFO[y - 1900] & i) s++; i >>= 1; }
  return s + lunarLeapDays(y);
}
function lunarToSolar(y, m, d) {
  let offset = 0;
  for (let i = 1900; i < y; i++) offset += lunarYearDays(i);
  const lm = lunarLeapMonth(y);
  for (let i = 1; i < m; i++) {
    offset += lunarMonthDays(y, i);
    if (i === lm) offset += lunarLeapDays(y);
  }
  offset += d - 1;
  const t = new Date(1900, 0, 31);
  t.setHours(0, 0, 0, 0);
  return new Date(t.getTime() + offset * 864e5);
}
function lunarAnniversaryDate(year, m, d) {
  const t = lunarToSolar(year, m, d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function daysUntilAnni(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (item.repeat === "once" && item.date) {
    const tg = new Date(item.date);
    tg.setHours(0, 0, 0, 0);
    return Math.round((tg - today) / 864e5);
  }
  if (item.calendar === "lunar" && item.month && item.day) {
    let tg = lunarAnniversaryDate(today.getFullYear(), item.month, item.day);
    if (tg < today) tg = lunarAnniversaryDate(today.getFullYear() + 1, item.month, item.day);
    return Math.round((tg - today) / 864e5);
  }
  const tg = new Date(today.getFullYear(), item.month - 1, item.day);
  tg.setHours(0, 0, 0, 0);
  if (tg < today) tg.setFullYear(tg.getFullYear() + 1);
  return Math.round((tg - today) / 864e5);
}

function renderAnniversary() {
  const items = store.anniversaries.items
    .map(a => ({ ...a, days: daysUntilAnni(a) }))
    .sort((x, y) => x.days - y.days);

  $("#content").innerHTML = `
    <div class="page-date">ANNIVERSARY</div>
    <div class="page-headline">纪念日</div>
    <div class="page-sub">提前一个月、半个月、一周，Hermes 都会提醒你</div>

    <div class="section-title">新增纪念日</div>
    <div class="form">
      <div><label class="f-label">名称</label><input type="text" id="anName" placeholder="结婚纪念日"></div>
      <div class="form-row">
        <div style="flex:2"><label class="f-label">重复方式</label>
          <select id="anRepeat">
            <option value="yearly">每年</option>
            <option value="once">仅一次</option>
          </select></div>
        <div><label class="f-label">日期</label><input type="date" id="anDate"></div>
      </div>
      <div class="form-row" id="anMdRow">
        <div><label class="f-label">月份</label><input type="number" id="anMonth" min="1" max="12" placeholder="9"></div>
        <div><label class="f-label">日期</label><input type="number" id="anDay" min="1" max="31" placeholder="20"></div>
      </div>
      <div class="form-row" id="anLunarRow" style="align-items:center;margin-top:6px">
        <input type="checkbox" id="anLunar" style="width:auto">
        <label for="anLunar" style="margin:0;font-size:13px;color:var(--ink-2)">阴历（农历）日期 · 默认阳历</label>
      </div>
      <button class="btn" id="anSubmit">保 存</button>
    </div>

    <div class="section-title">重要日子 <small>${items.length} 个</small></div>
    ${items.map(a => {
      const soon = a.days <= 30;
      const dateLabel = a.repeat === "once" && a.date
        ? a.date
        : `${pad(a.month)} 月 ${pad(a.day)} 日 · 每年${a.calendar === "lunar" ? " · 阴历" : ""}`;
      return `<div class="anni-item">
        <div class="li-main">
          <div class="li-title">${a.name}</div>
          <div class="li-sub">${dateLabel}</div>
        </div>
        <div class="anni-countdown" style="${soon ? "" : "color:var(--ink-2)"}">${a.days}<em> 天后</em></div>
        <button class="todo-act" data-edit="anni|${a.id}" title="修改">✎</button>
        <button class="todo-act act-del" data-del="anni|${a.id}" title="删除">🗑</button>
      </div>`;
    }).join("") || `<div class="empty">还没有记录</div>`}`;

  const repeatSel = $("#anRepeat"), mdRow = $("#anMdRow"), dateInput = $("#anDate");
  function updateForm() {
    const once = repeatSel.value === "once";
    mdRow.style.display = once ? "none" : "flex";
    dateInput.closest("div").style.display = once ? "block" : "none";
    $("#anLunarRow").style.display = once ? "none" : "flex";   // 阴历仅适用于每年重复
  }
  updateForm();
  repeatSel.addEventListener("change", updateForm);

  $("#anSubmit").addEventListener("click", () => {
    const name = $("#anName").value.trim();
    if (!name) { toast("请填写名称"); return; }
    const repeat = repeatSel.value;
    if (anEditId) {
      const t = store.anniversaries.items.find(x => x.id === anEditId);
      if (t) {
        t.name = name; t.repeat = repeat;
        delete t.date; delete t.month; delete t.day;
        if (repeat === "once") {
          const date = $("#anDate").value;
          if (!date) { toast("请选择日期"); return; }
          t.date = date;
        } else {
          const m = +$("#anMonth").value, d = +$("#anDay").value;
          if (!m || !d) { toast("请填写月/日"); return; }
          t.month = m; t.day = d;
          t.calendar = $("#anLunar").checked ? "lunar" : "solar";
        }
        anEditId = null;
      }
    } else if (repeat === "once") {
      const date = $("#anDate").value;
      if (!date) { toast("请选择日期"); return; }
      store.anniversaries.items.push({ id: Date.now(), name, repeat: "once", date, calendar: "solar" });
    } else {
      const m = +$("#anMonth").value, d = +$("#anDay").value;
      if (!m || !d) { toast("请填写月/日"); return; }
      store.anniversaries.items.push({ id: Date.now(), name, month: m, day: d, repeat: "yearly", calendar: $("#anLunar").checked ? "lunar" : "solar" });
    }
    save(); renderAnniversary(); toast("已保存");
  });
}

/* ---------- 渲染入口 ---------- */
function render(page) {
  killCharts();
  $("#content").scrollTop = 0;
  const f = {
    home:        renderHome,
    english:     renderEnglish,
    fitness:     renderFitness,
    expense:     renderExpense,
    todo:        renderTodo,
    recipe:      renderRecipe,
    anniversary: renderAnniversary,
    settings:    renderSettings
  }[page];
  (f || renderHome)();
}
go("home");

/* ================================================================
   页面：首页仪表盘（汇总六大模块的关键数据）
================================================================ */
function renderHome() {
  // 待办
  const todoAll = store.todo.tasks || [];
  const todoOpen = todoAll.filter(t => !t.done).length;
  const todoOverdue = todoAll.filter(t => !t.done && t.due && t.due < todayStr()).length;

  // 训练
  const hasTrainToday = !!(store.workouts && store.workouts[todayStr()]);

  // 食谱
  const todayMenu = (() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // 周一=0
    const d = store.weeklyMenu.days[dow];
    return d ? d.recipeIds : [];
  })();
  const todayDishes = todayMenu.map(id => store.recipes.recipes.find(r => r.id === id)?.name).filter(Boolean);

  // 消费
  const monthKey = todayStr().slice(0, 7);
  const monthExpense = store.expense.records.filter(r => r.date.startsWith(monthKey))
                                            .reduce((s, r) => s + r.amount, 0);

  // 纪念日
  const nextAnni = (store.anniversaries.items || [])
    .map(a => ({ ...a, days: daysUntilAnni(a) }))
    .sort((x, y) => x.days - y.days)[0];

  // 英语打卡（近 30 天）
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const d30key = `${d30.getFullYear()}-${pad(d30.getMonth()+1)}-${pad(d30.getDate())}`;
  const englishStreak = (store.english.readDates || []).filter(d => d >= d30key).length || 0;

  // Hermes 洞察
  const insights = store.insights || {};
  const todayInsights = insights[todayStr()];

  $("#content").innerHTML = `
    <div class="page-date">DASHBOARD</div>
    <div class="page-headline">${(new Date().getHours() < 11 ? "上午好" : new Date().getHours() < 18 ? "下午好" : "晚上好")}, ${"今天也要好好过"}</div>
    <div class="page-sub">${new Date().getMonth()+1} 月 ${new Date().getDate()} 日 · 周${"日一二三四五六"[new Date().getDay()]}</div>

    ${todayInsights ? `
    <div class="insight-card">
      <div class="insight-title">✨ Hermes 今日建议</div>
      <div class="insight-body">${todayInsights.replace(/\n/g, "<br>")}</div>
    </div>` : ""}

    <div class="dash-grid">
      <div class="dash-card" data-go="todo">
        <div class="dash-ico">📝</div>
        <div class="dash-num">${todoOpen}<em>项待办</em></div>
        ${todoOverdue ? `<div class="dash-warn">${todoOverdue} 项已逾期</div>` : `<div class="dash-tip">点我去处理</div>`}
      </div>
      <div class="dash-card" data-go="fitness">
        <div class="dash-ico">🏃</div>
        <div class="dash-num">${hasTrainToday ? "已完成" : "今日未练"}</div>
        <div class="dash-tip">${hasTrainToday ? "今天的汗水已留下" : "半小时也值得开始"}</div>
      </div>
      <div class="dash-card" data-go="recipe">
        <div class="dash-ico">🍱</div>
        <div class="dash-num">${todayDishes.length ? todayDishes.length + " 道" : "未安排"}</div>
        <div class="dash-tip">${todayDishes.join(" · ") || "记得好好吃饭"}</div>
      </div>
      <div class="dash-card" data-go="expense">
        <div class="dash-ico">💰</div>
        <div class="dash-num">${fmtCNY(monthExpense || 0)}<em>本月</em></div>
        <div class="dash-tip">查看消费明细</div>
      </div>
      <div class="dash-card" data-go="english">
        <div class="dash-ico">📚</div>
        <div class="dash-num">${englishStreak}<em>词已读</em></div>
        <div class="dash-tip">${englishStreak ? "坚持得不错" : "从今天开始"}</div>
      </div>
      <div class="dash-card" data-go="anniversary">
        <div class="dash-ico">🎂</div>
        <div class="dash-num">${nextAnni ? nextAnni.days : "--"}<em>天</em></div>
        <div class="dash-tip">${nextAnni ? "距离「" + nextAnni.name + "」" : "纪念日模块待添加"}</div>
      </div>
    </div>

    <div class="section-title">快捷入口</div>
    <div class="quick-grid">
      <button data-go="english">📚<br>每日英语</button>
      <button data-go="fitness">🏃<br>健身</button>
      <button data-go="expense">💰<br>消费</button>
      <button data-go="todo">✅<br>每日待办</button>
      <button data-go="recipe">🍱<br>一周食谱</button>
      <button data-go="anniversary">🎂<br>纪念日</button>
    </div>

    <div class="footer-tip">拾光工作台 · 让每一天都被看见</div>`;

  $$(".dash-card, .quick-grid button").forEach(el =>
    el.addEventListener("click", () => go(el.dataset.go)));
}

/* ================================================================
   页面：设置（GitHub 同步 + 导出导入 + 重置）
================================================================ */
function renderSettings() {
  const last = store._sync?.lastSyncedAt ? new Date(store._sync.lastSyncedAt).toLocaleString("zh-CN") : "尚未同步";
  $("#content").innerHTML = `
    <div class="page-date">SETTINGS</div>
    <div class="page-headline">设置</div>
    <div class="page-sub">GitHub 数据中枢 · 多端同步</div>

    <div class="section-title">GitHub 配置</div>
    <div class="form">
      <div><label class="f-label">仓库所有者（用户名）</label>
        <input type="text" id="ghOwner" value="${ghConfig.owner || ""}" placeholder="yourname"></div>
      <div><label class="f-label">仓库名</label>
        <input type="text" id="ghRepo" value="${ghConfig.repo || ""}" placeholder="workbench-data"></div>
      <div><label class="f-label">分支</label>
        <input type="text" id="ghBranch" value="${ghConfig.branch || "main"}" placeholder="main"></div>
      <div><label class="f-label">文件路径</label>
        <input type="text" id="ghPath" value="${ghConfig.path || "data/workbench.json"}" placeholder="data/workbench.json"></div>
      <div><label class="f-label">Personal Access Token</label>
        <input type="password" id="ghToken" value="${ghConfig.token || ""}" placeholder="ghp_... 仅保存在本机"></div>
      <div class="form-row" style="align-items:center; margin-top:4px">
        <input type="checkbox" id="ghAuto" ${ghConfig.autoSync ? "checked" : ""}>
        <label for="ghAuto" style="margin:0; font-size:13px; color:var(--ink-2)">打开 App 时自动从 GitHub 拉取一次</label>
      </div>
      <button class="btn" id="ghSave">保存配置</button>
    </div>

    <div class="section-title">数据同步</div>
    <div class="sync-status">上次同步：${last}</div>
    <div class="form-row">
      <button class="btn" id="ghSync">立即同步</button>
      <button class="btn ghost" id="ghPush">仅推送本地</button>
    </div>
    <div class="sync-hint">同步采用“三方合并”：本地和远端各改各的字段能自动合并；同一字段都改了会以本地为准。</div>

    <div class="section-title">数据管理</div>
    <div class="form-row">
      <button class="btn" id="exportBtn">导出 JSON</button>
      <button class="btn ghost" id="importBtn">导入 JSON</button>
    </div>
    <input type="file" id="importFile" accept="application/json" style="display:none">
    <button class="btn danger" id="resetBtn" style="margin-top:12px">清空并恢复演示数据</button>
    <button class="btn danger" id="clearBtn" style="margin-top:8px">清空全部数据（空白开始，删测试数据用）</button>`;

  $("#ghSave").addEventListener("click", () => {
    ghConfig.owner = $("#ghOwner").value.trim();
    ghConfig.repo  = $("#ghRepo").value.trim();
    ghConfig.branch= $("#ghBranch").value.trim() || "main";
    ghConfig.path  = $("#ghPath").value.trim() || "data/workbench.json";
    ghConfig.token = $("#ghToken").value.trim();
    ghConfig.autoSync = $("#ghAuto").checked;
    saveGhConfig();
    toast("配置已保存");
  });

  const doSync = async (fn, ok) => {
    try { await fn(); toast(ok); }
    catch (e) { toast(e.message || "同步失败"); console.error(e); }
  };
  $("#ghSync").addEventListener("click", () => doSync(syncFromGitHub, "同步完成"));
  $("#ghPush").addEventListener("click", () => doSync(() => pushToGitHub("push from PWA"), "推送完成"));

  $("#exportBtn").addEventListener("click", exportData);
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { importData(reader.result); } catch (err) { toast(err.message); } $("#importFile").value = ""; };
    reader.readAsText(file);
  });
  $("#resetBtn").addEventListener("click", resetData);
  $("#clearBtn").addEventListener("click", clearAllData);
}

/* ================================================================
   页面占位（参考图 11 项菜单的旧占位函数，未启用）
================================================================ */
function renderReading() { return renderPlaceholder("每日阅读", "📖", "把每天一篇的好文章归档在这里。点开做下笔记，慢慢就有了自己的小书房。"); }
function renderMedia()   { return renderPlaceholder("自媒体计划", "📱", "想做的话题、平台、节奏，写下来才不会忘。一张表就够了。"); }
function renderVideo()   { return renderPlaceholder("爆款视频", "🔥", "刷到心动的就收藏下来，分析它的标题、封面、前 3 秒。"); }
function renderNews()    { return renderPlaceholder("新闻热点", "📰", "每天 5 分钟，看完记一句‘我想到了什么’。复利很大。"); }
function renderDrama()   { return renderPlaceholder("新剧分享", "🎬", "看过的、想看的、加追的，留个小清单，周末不用纠结。"); }
function renderFinance() { return renderPlaceholder("理财知识", "💹", "读到的常识、踩过的坑、复盘下来。认知才是复利。"); }
function renderReview() {
  // 每日复盘 = 之前的待办 + 一个简短的反思
  const open = store.todo.items.filter(t => !t.done);
  const done = store.todo.items.filter(t => t.done);
  const todayKey = todayStr();
  const review = (store.reviews && store.reviews[todayKey]) || "";

  $("#content").innerHTML = `
    <div class="page-date">REVIEW</div>
    <div class="page-headline">每日复盘</div>
    <div class="page-sub">今早想做、今天做了、今天没做、明天想先做</div>

    <div class="section-title">今日复盘 <small>只写给自己</small></div>
    <textarea id="rvText" rows="6" placeholder="想说点什么？">${review}</textarea>
    <button class="btn" id="rvSave" style="margin-top:12px">保 存</button>

    <div class="section-title">已完成 <small>${done.length} 项</small></div>
    ${done.length ? done.map(t => `<div class="list-item">
      <span class="tag">完成</span>
      <div class="li-main"><div class="li-title">${t.title}</div></div>
    </div>`).join("") : `<div class="empty">今天还没完成什么</div>`}

    <div class="section-title">待办 <small>${open.length} 项</small></div>
    ${open.length ? open.map(t => `<div class="list-item">
      <span class="tag gray">待办</span>
      <div class="li-main"><div class="li-title">${t.title}</div><div class="li-sub">${t.due || "无截止"}${t.postponeDays > 0 ? ` · <span class="tag">延期 ${t.postponeDays} 天</span>` : ""}</div></div>
    </div>`).join("") : `<div class="empty">清空的一天 :)</div>`}`;

  $("#rvSave").addEventListener("click", () => {
    store.reviews = store.reviews || {};
    store.reviews[todayKey] = $("#rvText").value;
    save(); toast("已保存");
  });
}

function renderPlaceholder(title, ico, desc) {
  $("#content").innerHTML = `
    <div class="page-date">${title.toUpperCase().replace(/\s/g, "")}</div>
    <div class="page-headline">${title}</div>
    <div class="page-sub">${desc}</div>

    <div class="section-title">添加一条</div>
    <div class="form">
      <div><label class="f-label">标题</label><input type="text" placeholder="一句话记下来"></div>
      <div><label class="f-label">备注</label><textarea rows="3" placeholder="可以写几句想法"></textarea></div>
      <button class="btn" onclick="toast('这是个示例按钮，功能可在此扩展')">保 存</button>
    </div>

    <div class="section-title">往期记录</div>
    <div class="empty">还没有记录，开始第一条吧。</div>`;
}

/* ---------- 全局委托：历史数据 编辑 / 删除 / 跳转 ---------- */
let expEditIdx = null, anEditId = null;

function clearAllData() {
  if (!confirm("确定清空本地全部数据（空白开始，不含演示数据）？此操作不可撤销，请先同步到 GitHub 备份。")) return;
  store = {
    english: { date: "", words: [], article: { title: "", en: "", zh: "", keywords: [] }, readDates: [] },
    todo: { tasks: [] }, anniversaries: { items: [] }, insights: {},
    workouts: {}, expense: { records: [] }, recipes: { recipes: [] },
    weeklyMenu: { days: [] }, menuHistory: { records: [] }, customEx: [], customCardio: []
  };
  delete store._sync; save(); renderSettings(); toast("已清空，空白开始");
}

document.addEventListener("click", e => {
  const del = e.target.closest("[data-del]");
  if (del) {
    const [kind, a, b] = (del.dataset.del || "").split("|");
    if (kind === "exp") {
      const r = store.expense.records[+a];
      if (r && confirm(`删除这笔消费（${r.note || r.category} ¥${r.amount}）？`)) {
        store.expense.records.splice(+a, 1); save(); renderExpense(); toast("已删除");
      }
    } else if (kind === "todo") {
      const i = store.todo.tasks.findIndex(t => String(t.id) === a);
      if (i >= 0 && confirm("删除这条待办？")) { store.todo.tasks.splice(i, 1); save(); renderTodo(); toast("已删除"); }
    } else if (kind === "anni") {
      const i = store.anniversaries.items.findIndex(x => String(x.id) === a);
      if (i >= 0 && confirm("删除这个纪念日？")) { store.anniversaries.items.splice(i, 1); save(); renderAnniversary(); toast("已删除"); }
    } else if (kind === "histday") {
      const recs = store.menuHistory.records;
      const i = recs.findIndex(r => r.date === a);
      if (i >= 0 && confirm(`删除 ${a} 的做饭记录？`)) { recs.splice(i, 1); save(); renderRecipe(); toast("已删除"); }
    } else if (kind === "histdish") {
      const rec = (store.menuHistory.records || []).find(r => r.date === a);
      if (rec) {
        rec.recipeIds = rec.recipeIds.filter(id => String(id) !== b);
        if (!rec.recipeIds.length) store.menuHistory.records = store.menuHistory.records.filter(r => r.date !== a);
        save(); renderRecipe(); toast("已移除");
      }
    } else if (kind === "recipe") {
      const i = store.recipes.recipes.findIndex(x => String(x.id) === a);
      if (i >= 0 && confirm(`删除食谱「${store.recipes.recipes[i].name}」？`)) {
        store.recipes.recipes.splice(i, 1); save(); renderRecipe(); toast("已删除");
      }
    } else if (kind === "fitday") {
      if (store.workouts[a] && confirm(`删除 ${a} 的训练记录？`)) { delete store.workouts[a]; save(); renderFitness(); toast("已删除"); }
    }
    return;
  }
  const edit = e.target.closest("[data-edit]");
  if (edit) {
    const [kind, a] = (edit.dataset.edit || "").split("|");
    if (kind === "exp") {
      const r = store.expense.records[+a];
      if (!r) return;
      expEditIdx = +a;
      $("#expCat").value = r.category; $("#expAmt").value = r.amount; $("#expNote").value = r.note || "";
      $("#expSubmit").textContent = "更 新";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (kind === "anni") {
      const it = store.anniversaries.items.find(x => String(x.id) === a);
      if (!it) return;
      anEditId = it.id;
      $("#anName").value = it.name;
      const rs = $("#anRepeat");
      if (it.repeat === "once") { rs.value = "once"; $("#anDate").value = it.date || ""; }
      else { rs.value = "yearly"; $("#anMonth").value = it.month; $("#anDay").value = it.day; }
      $("#anLunar").checked = it.calendar === "lunar";
      rs.dispatchEvent(new Event("change"));
      $("#anSubmit").textContent = "更 新";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }
  const jump = e.target.closest("[data-jump]");
  if (jump) {
    const [kind, date] = (jump.dataset.jump || "").split("|");
    if (kind === "fit" && date) { fitScope = "日"; fitAnchor = date; renderFitness(); }
  }
});

/* ---------- 自动同步：打开时拉取一次 ---------- */
if (ghConfig.autoSync && ghConfig.owner && ghConfig.repo && ghConfig.token) {
  syncFromGitHub().catch(e => console.log("auto sync failed", e));
}

