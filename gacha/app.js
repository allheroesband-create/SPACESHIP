import { CARDS } from "./cards.js";

const STORAGE_KEY = "usa_freedom_colosseum_collection_v1";
const $ = (sel) => document.querySelector(sel);

const introEl = $("#intro");
const gunBtn = $("#gunBtn");
const gunVideo = $("#gunVideo");

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
   1) 均等抽選（全カード同確率）
   重複あり・確率は毎回同じ
----------------------------- */
function pickUniform(cards) {
  const i = Math.floor(Math.random() * cards.length);
  return cards[i];
}

/* -----------------------------
   2) 銃：最初は停止フレーム
----------------------------- */
function initGunStoppedFrame() {
  if (!gunVideo) return;
  gunVideo.pause();
  gunVideo.currentTime = 0;

  gunVideo.addEventListener(
    "loadedmetadata",
    () => {
      gunVideo.currentTime = 0;
      gunVideo.pause();
    },
    { once: true }
  );
}
initGunStoppedFrame();

/* -----------------------------
   3) タップ：銃動画再生（演出開始）
----------------------------- */
gunBtn?.addEventListener("click", async () => {
  if (locked) return;
  locked = true;

  // 前回のカードは消して、ボタンも隠す
  cardRevealEl.innerHTML = "";
  afterControlsEl.hidden = true;

  gunVideo.currentTime = 0;
  try {
    await gunVideo.play();
  } catch (e) {
    console.log("play blocked:", e);
    locked = false;
  }
});

/* -----------------------------
   4) 動画終了：フェード→カード
----------------------------- */
gunVideo?.addEventListener("ended", async () => {
  introEl.classList.add("fadeout");

  await wait(120);
  revealPullWithFlip(); // ←ここで毎回ランダム（同確率）

  // イントロを隠す
  setTimeout(() => {
    introEl.style.display = "none";
    locked = false;
  }, 560);
});

/* -----------------------------
   5) もう一度引く：B) 開始画面へ戻す
----------------------------- */
function resetToIntro() {
  // カードを消して、ボタンも消す
  cardRevealEl.innerHTML = "";
  afterControlsEl.hidden = true;

  // イントロ復帰
  introEl.style.display = "grid";
  introEl.classList.remove("fadeout");

  // 銃動画停止＆巻き戻し
  gunVideo.pause();
  gunVideo.currentTime = 0;

  locked = false;
}

againBtn?.addEventListener("click", resetToIntro);

/* -----------------------------
   6) コレクション保存（当てたものだけ表示）
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

  // 当てたものだけ表示（未入手は出さない）
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
   7) 裏→表フリップ表示（毎回同確率）
----------------------------- */
function revealPullWithFlip() {
  const card = pickUniform(CARDS); // ←均等確率
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
    afterControlsEl.hidden = false; // ←カード出た後だけボタン出す
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
   ホロカード（poke-holo風）
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
