import { CARDS } from "./cards.js";

const STORAGE_KEY = "usa_freedom_colosseum_collection_v1";
const $ = (sel) => document.querySelector(sel);

/* -----------------------------
   スワイプ検出用変数
----------------------------- */
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 80; // スワイプと判定する最小距離(px)
const SWIPE_TIME_LIMIT = 500; // スワイプの最大時間(ms)

const introEl = $("#intro");
const gunContainer = $("#gunContainer");
const gunVideo = $("#gunVideo");
const gachaBtn = $("#gachaBtn");
const swipeHint = $(".swipeHint");

const cardRevealEl = $("#cardReveal");
const historyEl = $("#history");

const afterControlsEl = $("#afterControls");
const againBtn = $("#againBtn");
const collectionBtn = $("#collectionBtn");

const collectionModal = $("#collectionModal");
const closeCollectionBtn = $("#closeCollectionBtn");
const resetCollectionBtn = $("#resetCollectionBtn");
const collectionGrid = $("#collectionGrid");

let locked = false;
let videoReady = false;
let videoLoadAttempted = false;

/* -----------------------------
   ユーティリティ
----------------------------- */
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------------
   1) 均等抽選(全カード同確率)
   重複あり・確率は毎回同じ
----------------------------- */
function pickUniform(cards) {
  const i = Math.floor(Math.random() * cards.length);
  return cards[i];
}

/* -----------------------------
   2) 銃:初期化(プリロード)
----------------------------- */
function initGunVideo() {
  if (!gunVideo) return;
  
  console.log("🎬 Initializing gun video...");
  
  // 動画の準備完了を監視
  gunVideo.addEventListener("canplaythrough", () => {
    console.log("✅ Gun video is ready to play");
    videoReady = true;
  }, { once: true });
  
  // エラーハンドリング
  gunVideo.addEventListener("error", (e) => {
    console.error("❌ Gun video error:", e);
    console.log("Video src:", gunVideo.src);
    console.log("Video readyState:", gunVideo.readyState);
  });
  
  // 動画読み込み状態のログ
  gunVideo.addEventListener("loadstart", () => console.log("📥 Video loading started"));
  gunVideo.addEventListener("loadedmetadata", () => console.log("📊 Video metadata loaded"));
  gunVideo.addEventListener("loadeddata", () => console.log("📦 Video data loaded"));
  
  // 強制的にロード開始
  gunVideo.load();
  videoLoadAttempted = true;
}

// ページ読み込み後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGunVideo);
} else {
  initGunVideo();
}

/* -----------------------------
   3) ガチャを引くボタン:銃動画再生→カード表示
----------------------------- */
gachaBtn?.addEventListener("click", async () => {
  if (locked) return;
  console.log("🎰 Gacha button clicked!");
  triggerGacha();
});

/* -----------------------------
   3.6) スワイプでガチャを引く(スマホ用)
----------------------------- */
function handleTouchStart(e) {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
  touchStartTime = Date.now();
}

function handleTouchEnd(e) {
  if (locked) return;
  
  const touchEndY = e.changedTouches[0].clientY;
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndTime = Date.now();
  
  const deltaY = touchStartY - touchEndY;
  const deltaX = Math.abs(touchStartX - touchEndX);
  const deltaTime = touchEndTime - touchStartTime;
  
  // 上スワイプ判定: 上方向に十分な距離、横移動は少なく、時間内
  if (deltaY > SWIPE_THRESHOLD && deltaX < SWIPE_THRESHOLD && deltaTime < SWIPE_TIME_LIMIT) {
    e.preventDefault();
    console.log("👆 Swipe up detected!");
    showSwipeFeedback();
    triggerGacha();
  }
}

// スワイプフィードバック表示
function showSwipeFeedback() {
  const feedback = document.createElement("div");
  feedback.className = "swipeFeedback";
  feedback.innerHTML = "🎰 GACHA!";
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add("fadeOut");
    setTimeout(() => feedback.remove(), 300);
  }, 400);
}

// イントロ画面でのみスワイプ検出
introEl?.addEventListener("touchstart", handleTouchStart, { passive: true });
introEl?.addEventListener("touchend", handleTouchEnd, { passive: false });

/* -----------------------------
   ガチャ発動の共通処理
----------------------------- */
async function triggerGacha() {
  if (locked) return;
  locked = true;
  console.log("🔒 Gacha locked, starting sequence...");

  // 前回のカードは消して、ボタンも隠す
  cardRevealEl.innerHTML = "";
  afterControlsEl.hidden = true;

  // ガチャボタンとスワイプヒントを隠す
  if (gachaBtn) gachaBtn.style.display = "none";
  if (swipeHint) swipeHint.style.display = "none";

  // 動画の準備状況をチェック
  console.log("📹 Video ready:", videoReady, "| Load attempted:", videoLoadAttempted);
  
  // まだ動画をロードしていない場合は今すぐロード
  if (!videoLoadAttempted && gunVideo) {
    console.log("⚠️ Video not loaded yet, loading now...");
    gunVideo.load();
    videoLoadAttempted = true;
    await wait(300); // ロード時間を待つ
  }

  // 銃動画を表示
  gunContainer.classList.remove("isHidden");
  console.log("👁️ Gun container visible");
  
  // 動画を最初から再生
  gunVideo.currentTime = 0;
  gunVideo.muted = true; // ミュート必須(自動再生ポリシー対策)
  
  console.log("▶️ Attempting to play video...");
  console.log("Video src:", gunVideo.src);
  console.log("Video readyState:", gunVideo.readyState);
  
  // 動画再生を試行
  try {
    const playPromise = gunVideo.play();
    console.log("✅ Play initiated");
    
    await playPromise;
    console.log("✅ Video playing successfully");
  } catch (e) {
    console.warn("⚠️ First play attempt failed:", e);
    
    // リトライ: 少し待ってから再度試行
    await wait(200);
    try {
      console.log("🔄 Retrying play...");
      await gunVideo.play();
      console.log("✅ Video playing after retry");
    } catch (e2) {
      console.error("❌ Play blocked even after retry:", e2);
      // それでも失敗したら動画をスキップしてカード表示へ
      console.log("⏭️ Skipping video, going straight to card");
      await wait(300); // 少しだけ待つ
      onGunVideoEnded();
    }
  }
}

/* -----------------------------
   4) 動画終了:フェード→カード
----------------------------- */
async function onGunVideoEnded() {
  console.log("🎬 Video ended, transitioning to card...");
  introEl.classList.add("fadeout");

  await wait(120);
  revealPullWithFlip();

  // イントロを隠す
  setTimeout(() => {
    introEl.style.display = "none";
    locked = false;
    console.log("🔓 Gacha unlocked");
  }, 560);
}

gunVideo?.addEventListener("ended", onGunVideoEnded);

/* -----------------------------
   5) もう一度引く:開始画面へ戻す
----------------------------- */
function resetToIntro() {
  console.log("🔄 Resetting to intro...");
  
  // カードを消して、ボタンも消す
  cardRevealEl.innerHTML = "";
  afterControlsEl.hidden = true;

  // イントロ復帰
  introEl.style.display = "grid";
  introEl.classList.remove("fadeout");

  // 銃動画を隠して巻き戻し
  gunContainer.classList.add("isHidden");
  gunVideo.pause();
  gunVideo.currentTime = 0;

  // ガチャボタンとスワイプヒントを復活
  if (gachaBtn) gachaBtn.style.display = "";
  if (swipeHint) swipeHint.style.display = "";

  locked = false;
  console.log("✅ Reset complete");
}

againBtn?.addEventListener("click", resetToIntro);

/* -----------------------------
   6) コレクション保存(当てたものだけ表示)
----------------------------- */
function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCollection(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
function addToCollection(card) {
  const map = loadCollection();
  map[card.id] = (map[card.id] || 0) + 1;
  saveCollection(map);
}

function renderCollection() {
  const map = loadCollection();

  // 当てたものだけ表示(未入手は出さない)
  const owned = CARDS
    .map((c) => ({ card: c, count: map[c.id] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => (b.count - a.count) || a.card.name.localeCompare(b.card.name));

  collectionGrid.innerHTML = "";

  if (owned.length === 0) {
    collectionGrid.innerHTML = `
      <div style="opacity:.8; padding: 18px 6px; line-height:1.7;">
        まだカードがありません。<br>
        ガチャを引いて、コレクションを増やそう。
      </div>
    `;
    return;
  }

  for (const { card, count } of owned) {
    const el = document.createElement("div");
    el.className = "collectItem";
    el.innerHTML = `
      <img src="${card.image}" alt="${escapeHtml(card.name)}" />
      <div class="collectMeta">
        <div class="collectName">${escapeHtml(card.name)}</div>
        <div class="collectRow">
          <span>${escapeHtml(card.rarity)}</span>
          <span>x${count}</span>
        </div>
      </div>
    `;
    collectionGrid.appendChild(el);
  }
}

function openCollection() {
  renderCollection();
  collectionModal.hidden = false;
}
function closeCollection() {
  collectionModal.hidden = true;
}

collectionBtn?.addEventListener("click", openCollection);
closeCollectionBtn?.addEventListener("click", closeCollection);
collectionModal?.addEventListener("click", (e) => {
  if (e.target?.dataset?.close) closeCollection();
});
resetCollectionBtn?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderCollection();
});

/* -----------------------------
   7) 裏→表フリップ表示(毎回同確率)
----------------------------- */
function revealPullWithFlip() {
  const card = pickUniform(CARDS);
  console.log("🎴 Drew card:", card.name, `(${card.rarity})`);
  addToCollection(card);

  const frontCardNode = renderCard(card);

  const wrap = document.createElement("div");
  wrap.className = "flipWrap";
  wrap.innerHTML = `
    <div class="flip">
      <div class="face back">AMERICA</div>
      <div class="face front"></div>
    </div>
  `;

  wrap.querySelector(".face.front").appendChild(frontCardNode);

  cardRevealEl.innerHTML = "";
  cardRevealEl.appendChild(wrap);

  addHistory(card);

  requestAnimationFrame(() => {
    wrap.classList.add("reveal");
    afterControlsEl.hidden = false;
  });
}

/* -----------------------------
   履歴
----------------------------- */
function addHistory(card) {
  if (!historyEl) return;
  const line = document.createElement("div");
  line.className = "history__item";
  const t = new Date();
  line.textContent = `${t.toLocaleString()} / ${card.rarity} / ${card.name}`;
  historyEl.prepend(line);
}

/* -----------------------------
   ホロカード(poke-holo風)
----------------------------- */
function renderCard(card) {
  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.innerHTML = `
    <div class="card__translater">
      <button class="card__rotator" type="button" aria-label="${escapeHtml(card.name)}">
        <div class="card__front">
          <img class="card__image" src="${card.image}" alt="${escapeHtml(card.name)}" />
          <div class="card__shine"></div>
          <div class="card__glare"></div>
          <div class="card__meta">
            <span class="card__name">${escapeHtml(card.name)}</span>
            <span class="card__rarity">${escapeHtml(card.rarity)}</span>
          </div>
        </div>
      </button>
    </div>
  `;
  attachHoloPointer(wrap);
  return wrap;
}

function attachHoloPointer(cardRoot) {
  const rotator = cardRoot.querySelector(".card__rotator");
  if (!rotator) return;

  function setVarsFromEvent(e) {
    const rect = rotator.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const ry = (px - 0.5) * -18;
    const rx = (py - 0.5) * 18;

    rotator.style.setProperty("--posx", `${px * 100}%`);
    rotator.style.setProperty("--posy", `${py * 100}%`);
    rotator.style.setProperty("--mx", `${px * 100}%`);
    rotator.style.setProperty("--my", `${py * 100}%`);
    rotator.style.setProperty("--rx", `${ry}deg`);
    rotator.style.setProperty("--ry", `${rx}deg`);
    rotator.style.setProperty("--o", `1`);
  }

  function reset() {
    rotator.style.setProperty("--rx", `0deg`);
    rotator.style.setProperty("--ry", `0deg`);
    rotator.style.setProperty("--o", `0`);
  }

  rotator.addEventListener("pointermove", setVarsFromEvent);
  rotator.addEventListener("pointerenter", () => cardRoot.classList.add("active"));
  rotator.addEventListener("pointerleave", () => {
    cardRoot.classList.remove("active");
    reset();
  });
}

// 初期化完了ログ
console.log("✅ App initialized successfully");
console.log("📦 Total cards available:", CARDS.length);
