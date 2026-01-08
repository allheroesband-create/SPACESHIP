import { CARDS } from "./cards.js";

const STORAGE_KEY = "usa_freedom_colosseum_collection_v1";
const $ = (sel) => document.querySelector(sel);

/* -----------------------------
   スワイプ検出用変数
----------------------------- */
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 80;
const SWIPE_TIME_LIMIT = 500;

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

/* -----------------------------
   デバッグ用: 要素の存在確認
----------------------------- */
console.log("=== ELEMENT CHECK ===");
console.log("introEl:", introEl ? "✅" : "❌");
console.log("gunContainer:", gunContainer ? "✅" : "❌");
console.log("gunVideo:", gunVideo ? "✅" : "❌");
console.log("gachaBtn:", gachaBtn ? "✅" : "❌");
console.log("cardRevealEl:", cardRevealEl ? "✅" : "❌");

if (gunVideo) {
  console.log("Video element details:");
  console.log("- src:", gunVideo.src);
  console.log("- readyState:", gunVideo.readyState);
  console.log("- networkState:", gunVideo.networkState);
}

if (gunContainer) {
  console.log("gunContainer computed style:");
  const style = window.getComputedStyle(gunContainer);
  console.log("- display:", style.display);
  console.log("- position:", style.position);
  console.log("- z-index:", style.zIndex);
}

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
----------------------------- */
function pickUniform(cards) {
  const i = Math.floor(Math.random() * cards.length);
  return cards[i];
}

/* -----------------------------
   2) 銃:初期化
----------------------------- */
function initGunVideo() {
  if (!gunVideo) {
    console.error("❌ gunVideo element not found!");
    return;
  }
  
  console.log("🎬 Initializing gun video...");
  
  // 動画イベントリスナー
  gunVideo.addEventListener("loadstart", () => {
    console.log("📥 Video: loadstart");
  });
  
  gunVideo.addEventListener("loadedmetadata", () => {
    console.log("📊 Video: loadedmetadata");
    console.log("  Duration:", gunVideo.duration, "seconds");
    console.log("  Video dimensions:", gunVideo.videoWidth, "x", gunVideo.videoHeight);
    
    // 動画が短すぎる、または長すぎる場合の警告
    if (gunVideo.duration < 0.5) {
      console.warn("⚠️ Video is very short (<0.5s). Ended event might not fire reliably.");
    }
    if (gunVideo.duration > 30) {
      console.warn("⚠️ Video is very long (>30s). Consider using a shorter video.");
    }
  });
  
  gunVideo.addEventListener("loadeddata", () => {
    console.log("📦 Video: loadeddata");
  });
  
  gunVideo.addEventListener("canplay", () => {
    console.log("▶️ Video: canplay");
  });
  
  gunVideo.addEventListener("canplaythrough", () => {
    console.log("✅ Video: canplaythrough (ready to play)");
  });
  
  gunVideo.addEventListener("error", (e) => {
    console.error("❌ Video error event:", e);
    if (gunVideo.error) {
      console.error("Error code:", gunVideo.error.code);
      console.error("Error message:", gunVideo.error.message);
      const errorMessages = {
        1: "MEDIA_ERR_ABORTED - The fetching process for the media resource was aborted",
        2: "MEDIA_ERR_NETWORK - A network error occurred while fetching the media resource",
        3: "MEDIA_ERR_DECODE - An error occurred while decoding the media resource",
        4: "MEDIA_ERR_SRC_NOT_SUPPORTED - The media resource is not supported"
      };
      console.error("Explanation:", errorMessages[gunVideo.error.code]);
    }
  });
  
  gunVideo.addEventListener("play", () => {
    console.log("▶️ Video: play event fired");
  });
  
  gunVideo.addEventListener("playing", () => {
    console.log("▶️ Video: playing (actually playing now)");
  });
  
  gunVideo.addEventListener("pause", () => {
    console.log("⏸️ Video: pause");
  });
  
  gunVideo.addEventListener("ended", () => {
    console.log("🏁 Video: ended");
  });
  
  // 強制ロード
  gunVideo.load();
  console.log("📥 Video load() called");
}

// ページ読み込み後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGunVideo);
} else {
  initGunVideo();
}

/* -----------------------------
   3) ガチャボタンクリック
----------------------------- */
gachaBtn?.addEventListener("click", async () => {
  console.log("🎰 === GACHA BUTTON CLICKED ===");
  if (locked) {
    console.log("⚠️ Gacha is locked, ignoring click");
    return;
  }
  triggerGacha();
});

/* -----------------------------
   3.6) スワイプでガチャ
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
  
  if (deltaY > SWIPE_THRESHOLD && deltaX < SWIPE_THRESHOLD && deltaTime < SWIPE_TIME_LIMIT) {
    e.preventDefault();
    console.log("👆 Swipe up detected!");
    showSwipeFeedback();
    triggerGacha();
  }
}

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

introEl?.addEventListener("touchstart", handleTouchStart, { passive: true });
introEl?.addEventListener("touchend", handleTouchEnd, { passive: false });

/* -----------------------------
   ガチャ発動の共通処理
----------------------------- */
async function triggerGacha() {
  if (locked) return;
  locked = true;
  
  console.log("🔒 === GACHA SEQUENCE START ===");
  console.log("Step 1: Clear previous card");
  cardRevealEl.innerHTML = "";
  afterControlsEl.hidden = true;

  console.log("Step 2: Hide gacha button and swipe hint");
  if (gachaBtn) gachaBtn.style.display = "none";
  if (swipeHint) swipeHint.style.display = "none";

  console.log("Step 3: Show gun container");
  console.log("Before removing isHidden:");
  console.log("- gunContainer.className:", gunContainer.className);
  console.log("- computed display:", window.getComputedStyle(gunContainer).display);
  
  gunContainer.classList.remove("isHidden");
  
  console.log("After removing isHidden:");
  console.log("- gunContainer.className:", gunContainer.className);
  console.log("- computed display:", window.getComputedStyle(gunContainer).display);
  console.log("- computed position:", window.getComputedStyle(gunContainer).position);
  console.log("- computed z-index:", window.getComputedStyle(gunContainer).zIndex);

  // 強制的にレイアウト再計算
  gunContainer.offsetHeight;

  console.log("Step 4: Prepare video for playback");
  gunVideo.currentTime = 0;
  gunVideo.muted = true;
  
  console.log("Video state before play:");
  console.log("- readyState:", gunVideo.readyState, "(4 = HAVE_ENOUGH_DATA)");
  console.log("- networkState:", gunVideo.networkState);
  console.log("- paused:", gunVideo.paused);
  console.log("- currentTime:", gunVideo.currentTime);
  console.log("- duration:", gunVideo.duration);

  console.log("Step 5: Attempt to play video");
  
  try {
    console.log("▶️ Calling video.play()...");
    const playPromise = gunVideo.play();
    
    console.log("Play promise created:", playPromise);
    
    await playPromise;
    
    console.log("✅ Video.play() succeeded!");
    console.log("Video is now playing:", !gunVideo.paused);
    
  } catch (e) {
    console.error("❌ First play attempt failed:", e);
    console.error("Error name:", e.name);
    console.error("Error message:", e.message);
    
    console.log("🔄 Waiting 300ms before retry...");
    await wait(300);
    
    try {
      console.log("▶️ Retrying play...");
      await gunVideo.play();
      console.log("✅ Video playing after retry!");
    } catch (e2) {
      console.error("❌ Second play attempt also failed:", e2);
      console.error("Error name:", e2.name);
      console.error("Error message:", e2.message);
      console.log("⏭️ Skipping video, showing card directly");
      
      // 動画をスキップしてカード表示
      await wait(500);
      onGunVideoEnded();
    }
  }
}

/* -----------------------------
   4) 動画終了→カード表示
----------------------------- */
async function onGunVideoEnded() {
  console.log("🎬 === VIDEO ENDED / TRANSITIONING TO CARD ===");
  
  console.log("Step 1: Hide gun container");
  gunContainer.classList.add("isHidden");
  
  console.log("Step 2: Fade out intro");
  introEl.classList.add("fadeout");

  await wait(120);
  
  console.log("Step 3: Reveal card with flip");
  revealPullWithFlip();

  setTimeout(() => {
    console.log("Step 4: Hide intro completely");
    introEl.style.display = "none";
    
    console.log("Step 5: Unlock gacha");
    locked = false;
    console.log("🔓 Gacha unlocked");
  }, 560);
}

// 動画終了イベントを確実に検出
if (gunVideo) {
  gunVideo.addEventListener("ended", () => {
    console.log("🎬 Video 'ended' event fired!");
    onGunVideoEnded();
  });
  
  // 予備: 動画の時間をチェック（endedイベントが発火しない場合の対策）
  gunVideo.addEventListener("timeupdate", () => {
    if (gunVideo.currentTime >= gunVideo.duration - 0.1 && !gunVideo.paused) {
      console.log("⚠️ Video almost finished (timeupdate fallback)");
      // endedイベントの代わりに発火させる
      gunVideo.pause();
      onGunVideoEnded();
    }
  });
}

/* -----------------------------
   5) もう一度引く：動画から再開
----------------------------- */
function resetAndGacha() {
  console.log("🔄 === AGAIN BUTTON: STARTING NEW GACHA ===");
  
  // カードとボタンを隠す
  cardRevealEl.innerHTML = "";
  afterControlsEl.hidden = true;

  // イントロを一瞬表示してから動画開始
  introEl.style.display = "grid";
  introEl.classList.remove("fadeout");
  
  // 動画コンテナをリセット
  gunContainer.classList.add("isHidden");
  gunVideo.pause();
  gunVideo.currentTime = 0;

  // 少し待ってからガチャ開始（スムーズな遷移のため）
  setTimeout(() => {
    triggerGacha();
  }, 100);
}

againBtn?.addEventListener("click", resetAndGacha);

/* -----------------------------
   6) コレクション保存
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
   7) 裏→表フリップ表示
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
   ホロカード（レアリティ別エフェクト）
----------------------------- */

// レアリティからCSSのdata-rarity属性へのマッピング
const RARITY_EFFECT_MAP = {
  "Special": "rare secret",           // ゴールドエフェクト
  "Colonel": "rare shiny vmax",       // シャイニーVMAXエフェクト（文字保護付き）
  "Lieutenant Colonel": "rare holo vstar"  // V-STARエフェクト（文字保護付き）
};

const RARITY_TEXTURE_INFO = {
  "Special": "Galaxy texture - フル動作",
  "Colonel": "VMAX pattern (25%) - 限定的な動き、文字部分保護",
  "Lieutenant Colonel": "Wave pattern (20%) - 限定的な動き、文字部分保護"
};

function renderCard(card) {
  const wrap = document.createElement("div");
  wrap.className = "card";
  
  // レアリティに応じたエフェクトを設定
  const effectRarity = RARITY_EFFECT_MAP[card.rarity] || "common";
  wrap.setAttribute("data-rarity", effectRarity);
  
  console.log(`🎴 Card: ${card.name}`);
  console.log(`   Rarity: ${card.rarity}`);
  console.log(`   Effect: ${effectRarity}`);
  console.log(`   Texture: ${RARITY_TEXTURE_INFO[card.rarity] || "None"}`);
  
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
    
    // 中心からの距離を計算
    const centerX = px - 0.5;
    const centerY = py - 0.5;
    const distanceFromCenter = Math.sqrt(centerX * centerX + centerY * centerY) * 1.414; // 0-1の範囲

    // すべての必要なCSS変数を設定
    cardRoot.style.setProperty("--pointer-x", `${px * 100}%`);
    cardRoot.style.setProperty("--pointer-y", `${py * 100}%`);
    cardRoot.style.setProperty("--pointer-from-left", px);
    cardRoot.style.setProperty("--pointer-from-top", py);
    cardRoot.style.setProperty("--pointer-from-center", distanceFromCenter);
    
    cardRoot.style.setProperty("--background-x", `${px * 100}%`);
    cardRoot.style.setProperty("--background-y", `${py * 100}%`);
    
    cardRoot.style.setProperty("--card-opacity", "1");
    
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
    cardRoot.style.setProperty("--card-opacity", "0.5");
  }

  rotator.addEventListener("pointermove", setVarsFromEvent);
  rotator.addEventListener("pointerenter", () => cardRoot.classList.add("active"));
  rotator.addEventListener("pointerleave", () => {
    cardRoot.classList.remove("active");
    reset();
  });
}

console.log("✅ === APP INITIALIZED ===");
console.log("📦 Total cards available:", CARDS.length);
console.log("🎬 Ready to gacha!");
console.log("");
console.log("💡 Debug tips:");
console.log("- Type 'showCard()' in console to manually show a card");

// デバッグ用のグローバル関数
window.showCard = () => {
  console.log("🎴 Manual card trigger");
  onGunVideoEnded();
};
