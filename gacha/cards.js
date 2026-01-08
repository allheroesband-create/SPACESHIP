// ========================================
// カードデータの定義
// ========================================
export const CARDS = [
  {
    id: "diddy",
    name: "DIDDY",
    rarity: "Special",
    image: "./assets/DIDDY.png"
  },
  {
    id: "elon_musk",
    name: "ELON MUSK",
    rarity: "Colonel",
    image: "./assets/ELON_MUSK2.png"
  },
  {
    id: "right_hand",
    name: "RIGHT HAND",
    rarity: "Colonel",
    image: "./assets/RIGHT_HAND.png"
  },
  {
    id: "mark_zuckerberg",
    name: "MARK ZUCKERBERG",
    rarity: "Lieutenant Colonel",
    image: "./assets/Mark_Zuckerberg.png"
  },
  {
    id: "power_of_friendship",
    name: "THE POWER OF FRIENDSHIP",
    rarity: "Colonel",
    image: "./assets/The_Power_of_Friendship.png"
  },
  {
    id: "epstein",
    name: "JEFFREY EPSTEIN",
    rarity: "Special",
    image: "./assets/Epstein.png"
  },
  {
    id: "peter_thiel",
    name: "PETER THIEL",
    rarity: "Colonel",
    image: "./assets/Peter_Thiel2.png"
  }
];

// ========================================
// レアリティとホロエフェクトのマッピング
// ========================================
const RARITY_TO_HOLO_EFFECT = {
  "Captain": "shiny rare",           // キャプテン → シャイニーレア
  "Lieutenant Colonel": "reverse holo", // 中佐 → リバースホロ
  "Colonel": "shiny vmax",            // 大佐 → シャイニーVMAX
  "Special": "amazing rare"           // スペシャル → アメイジングレア
};

// ========================================
// レアリティの確率設定
// ========================================
const RARITY_WEIGHTS = {
  "Captain": 40,              // 40%
  "Lieutenant Colonel": 30,   // 30%
  "Colonel": 20,              // 20%
  "Special": 10               // 10%
};

// ========================================
// カードHTML生成関数
// ========================================
function createCardHTML(cardData) {
  // レアリティをホロエフェクトにマッピング
  const holoEffect = RARITY_TO_HOLO_EFFECT[cardData.rarity] || "common";
  
  return `
    <div class="card" data-rarity="${holoEffect}" data-original-rarity="${cardData.rarity}">
      <div class="card__translater">
        <button class="card__rotator">
          <div class="card__front">
            <img src="${cardData.image}" alt="${cardData.name}" class="card__image">
            <div class="card__shine"></div>
            <div class="card__glare"></div>
            <div class="card__meta">
              <span class="card__name">${cardData.name}</span>
              <span class="card__rarity">${cardData.rarity}</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  `;
}

// ========================================
// ホロエフェクト初期化（マウス追跡）
// ========================================
function initializeCardHoloEffect(cardElement) {
  const rotator = cardElement.querySelector('.card__rotator');
  
  if (!rotator) return;

  let rect = rotator.getBoundingClientRect();
  let animationFrameId = null;
  
  // パフォーマンス最適化：リサイズ時に再計算
  const updateRect = () => {
    rect = rotator.getBoundingClientRect();
  };
  window.addEventListener('resize', updateRect);

  // マウスムーブイベント（スムーズな更新）
  rotator.addEventListener('mousemove', (e) => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const px = Math.max(0, Math.min(1, x / rect.width));
      const py = Math.max(0, Math.min(1, y / rect.height));
      
      const centerX = px - 0.5;
      const centerY = py - 0.5;
      
      // 中心からの距離（0-1の範囲）
      const distanceFromCenter = Math.min(1, Math.sqrt(centerX * centerX + centerY * centerY) * 1.4);
      
      // CSS変数を更新
      cardElement.style.setProperty('--pointer-x', `${px * 100}%`);
      cardElement.style.setProperty('--pointer-y', `${py * 100}%`);
      cardElement.style.setProperty('--pointer-from-left', px.toFixed(3));
      cardElement.style.setProperty('--pointer-from-top', py.toFixed(3));
      cardElement.style.setProperty('--pointer-from-center', distanceFromCenter.toFixed(3));
      
      // 背景位置
      cardElement.style.setProperty('--background-x', `${px * 100}%`);
      cardElement.style.setProperty('--background-y', `${py * 100}%`);
      
      // マウス座標（--mx, --my）
      cardElement.style.setProperty('--mx', `${px * 100}%`);
      cardElement.style.setProperty('--my', `${py * 100}%`);
      
      // 3D回転効果（より自然な動き）
      const maxRotation = 15; // 最大回転角度
      const rotateX = centerY * maxRotation;
      const rotateY = centerX * -maxRotation;
      
      cardElement.style.setProperty('--rx', `${rotateY}deg`);
      cardElement.style.setProperty('--ry', `${rotateX}deg`);
      
      // ホロエフェクトの強度（中心から離れるほど強く）
      const opacity = Math.max(0.3, 1 - distanceFromCenter * 0.4);
      cardElement.style.setProperty('--o', opacity.toFixed(3));
      cardElement.style.setProperty('--card-opacity', opacity.toFixed(3));
      
      // アクティブクラスを追加
      cardElement.classList.add('active');
    });
  });

  // マウスリーブイベント（リセット）
  rotator.addEventListener('mouseleave', () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // スムーズにリセット
    cardElement.style.transition = 'all 0.3s ease-out';
    cardElement.style.setProperty('--rx', '0deg');
    cardElement.style.setProperty('--ry', '0deg');
    cardElement.style.setProperty('--o', '0');
    cardElement.style.setProperty('--card-opacity', '0.5');
    
    setTimeout(() => {
      cardElement.style.transition = '';
      cardElement.classList.remove('active');
    }, 300);
  });

  // タッチイベント対応（モバイル）
  let touchStartX = 0;
  let touchStartY = 0;
  
  rotator.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    updateRect();
  });

  rotator.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const px = Math.max(0, Math.min(1, x / rect.width));
    const py = Math.max(0, Math.min(1, y / rect.height));
    
    cardElement.style.setProperty('--pointer-x', `${px * 100}%`);
    cardElement.style.setProperty('--pointer-y', `${py * 100}%`);
    
    const centerX = px - 0.5;
    const centerY = py - 0.5;
    const distanceFromCenter = Math.min(1, Math.sqrt(centerX * centerX + centerY * centerY) * 1.4);
    
    cardElement.style.setProperty('--pointer-from-center', distanceFromCenter.toFixed(3));
    const opacity = Math.max(0.3, 1 - distanceFromCenter * 0.4);
    cardElement.style.setProperty('--o', opacity.toFixed(3));
    
    cardElement.classList.add('active');
  });

  rotator.addEventListener('touchend', () => {
    cardElement.style.setProperty('--rx', '0deg');
    cardElement.style.setProperty('--ry', '0deg');
    cardElement.style.setProperty('--o', '0');
    cardElement.classList.remove('active');
  });
}

// ========================================
// ガチャ：カードを抽選
// ========================================
function drawCard() {
  // レアリティを重み付きランダムで決定
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  let selectedRarity = "Captain";
  
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity;
      break;
    }
  }
  
  // 選択されたレアリティのカードを取得
  const cardsOfRarity = CARDS.filter(card => card.rarity === selectedRarity);
  
  // ランダムに1枚選択
  const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
  
  return randomCard;
}

// ========================================
// カードを表示（フリップアニメーション付き）
// ========================================
function revealCard(cardData, containerElement) {
  // カードHTMLを生成
  const cardHTML = createCardHTML(cardData);
  
  // フリップラッパーを作成
  const flipWrap = document.createElement('div');
  flipWrap.className = 'flipWrap';
  flipWrap.innerHTML = `
    <div class="flip">
      <div class="face back">GACHA</div>
      <div class="face front">
        ${cardHTML}
      </div>
    </div>
  `;
  
  // コンテナをクリアして新しいカードを追加
  containerElement.innerHTML = '';
  containerElement.appendChild(flipWrap);
  
  // フリップアニメーション開始（少し遅延）
  setTimeout(() => {
    flipWrap.classList.add('reveal');
  }, 100);
  
  // フリップ完了後にホロエフェクトを初期化
  setTimeout(() => {
    const cardElement = flipWrap.querySelector('.card');
    if (cardElement) {
      initializeCardHoloEffect(cardElement);
      
      // レアリティに応じた演出
      playRarityEffect(cardData.rarity);
    }
  }, 850); // フリップアニメーション時間（0.85秒）
  
  return cardData;
}

// ========================================
// レアリティに応じた演出
// ========================================
function playRarityEffect(rarity) {
  const holoEffect = RARITY_TO_HOLO_EFFECT[rarity];
  
  console.log(`🎴 Drew: ${rarity} (${holoEffect} effect)`);
  
  // レアリティごとの演出
  switch(rarity) {
    case "Special":
      console.log("🌟✨ SPECIAL CARD! AMAZING RARE EFFECT! ✨🌟");
      // パーティクルエフェクトなどを追加可能
      createSpecialEffect();
      break;
    case "Colonel":
      console.log("💎⚡ COLONEL! SHINY VMAX EFFECT! ⚡💎");
      break;
    case "Lieutenant Colonel":
      console.log("🔮 Lieutenant Colonel! Reverse Holo Effect! 🔮");
      break;
    case "Captain":
      console.log("✨ Captain! Shiny Rare Effect! ✨");
      break;
  }
}

// ========================================
// スペシャルカード用のエフェクト
// ========================================
function createSpecialEffect() {
  // 画面全体にキラキラエフェクトを追加
  const container = document.body;
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '10px';
    particle.style.height = '10px';
    particle.style.borderRadius = '50%';
    particle.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '1000';
    particle.style.animation = `particle-float ${1 + Math.random() * 2}s ease-out forwards`;
    
    container.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 3000);
  }
}

// パーティクルアニメーションのスタイルを追加
if (!document.querySelector('#particle-animation-style')) {
  const style = document.createElement('style');
  style.id = 'particle-animation-style';
  style.textContent = `
    @keyframes particle-float {
      0% {
        transform: translateY(0) scale(0);
        opacity: 1;
      }
      50% {
        transform: translateY(-100px) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(-200px) scale(0);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ========================================
// コレクション管理
// ========================================
class CardCollection {
  constructor() {
    this.collection = this.loadCollection();
  }
  
  loadCollection() {
    const saved = localStorage.getItem('cardCollection');
    return saved ? JSON.parse(saved) : [];
  }
  
  saveCollection() {
    localStorage.setItem('cardCollection', JSON.stringify(this.collection));
  }
  
  addCard(cardData) {
    this.collection.push({
      ...cardData,
      obtainedAt: new Date().toISOString()
    });
    this.saveCollection();
  }
  
  getCollection() {
    return this.collection;
  }
  
  clearCollection() {
    this.collection = [];
    this.saveCollection();
  }
  
  getByRarity(rarity) {
    return this.collection.filter(card => card.rarity === rarity);
  }
  
  getStats() {
    const stats = {};
    for (const rarity of Object.keys(RARITY_WEIGHTS)) {
      stats[rarity] = this.getByRarity(rarity).length;
    }
    return stats;
  }
}

// ========================================
// 全てのカードを表示（コレクション画面用）
// ========================================
function displayAllCards(containerElement) {
  containerElement.innerHTML = '';
  
  CARDS.forEach(cardData => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'collectItem';
    cardWrapper.innerHTML = createCardHTML(cardData);
    
    containerElement.appendChild(cardWrapper);
    
    // ホロエフェクトを初期化
    const cardElement = cardWrapper.querySelector('.card');
    if (cardElement) {
      initializeCardHoloEffect(cardElement);
    }
  });
}

// ========================================
// レアリティ別にカードを表示
// ========================================
function displayCardsByRarity(rarity, containerElement) {
  const cards = CARDS.filter(card => card.rarity === rarity);
  containerElement.innerHTML = '';
  
  cards.forEach(cardData => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'collectItem';
    cardWrapper.innerHTML = createCardHTML(cardData);
    
    containerElement.appendChild(cardWrapper);
    
    const cardElement = cardWrapper.querySelector('.card');
    if (cardElement) {
      initializeCardHoloEffect(cardElement);
    }
  });
}

// ========================================
// 初期化関数
// ========================================
function initialize() {
  console.log('🎴 Card System Initialized');
  console.log('📊 Total Cards:', CARDS.length);
  console.log('🎯 Rarities:', Object.keys(RARITY_WEIGHTS));
  
  // ガチャボタンのイベント設定
  const gachaBtn = document.querySelector('.gachaBtn');
  const cardReveal = document.querySelector('.cardReveal');
  
  if (gachaBtn && cardReveal) {
    gachaBtn.addEventListener('click', () => {
      const drawnCard = drawCard();
      revealCard(drawnCard, cardReveal);
    });
  }
  
  // スワイプ対応（モバイル）
  if (cardReveal) {
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      
      // 上にスワイプ（100px以上）
      if (swipeDistance > 100) {
        const drawnCard = drawCard();
        revealCard(drawnCard, cardReveal);
        
        // スワイプフィードバック表示
        showSwipeFeedback();
      }
    });
  }
  
  // 既存のカードにホロエフェクトを適用
  document.querySelectorAll('.card').forEach(card => {
    initializeCardHoloEffect(card);
  });
}

// ========================================
// スワイプフィードバック表示
// ========================================
function showSwipeFeedback() {
  const feedback = document.createElement('div');
  feedback.className = 'swipeFeedback';
  feedback.textContent = '✨';
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add('fadeOut');
    setTimeout(() => feedback.remove(), 300);
  }, 400);
}

// ========================================
// DOMContentLoaded時に初期化
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// ========================================
// エクスポート（他のモジュールから使用可能）
// ========================================
export {
  CARDS,
  RARITY_TO_HOLO_EFFECT,
  RARITY_WEIGHTS,
  createCardHTML,
  initializeCardHoloEffect,
  drawCard,
  revealCard,
  playRarityEffect,
  displayAllCards,
  displayCardsByRarity,
  CardCollection
};


