// 回らない寿司打 - メインスクリプト

class SushiTypingGame {
  constructor() {
    this.typingEngine = new TypingEngine();
    this.gameLogic = new GameLogic(this.typingEngine);
    this.selectedCourse = 'normal';
    this.phrases = null;
    this.sushiTypes = [
      'sushi-maguro.svg',
      'sushi-salmon.svg',
      'sushi-ebi.svg',
      'sushi-tamago.svg',
      'sushi-ikura.svg',
      'sushi-uni.svg',
      'sushi-ika.svg',
      'sushi-tako.svg'
    ];
    this.currentSushiIndex = 0;

    // 音声要素（プレースホルダー）
    this.sounds = {
      typing: new Audio('sounds/typing.mp3'),
      correct: new Audio('sounds/correct.mp3'),
      miss: new Audio('sounds/miss.mp3'),
      complete: new Audio('sounds/complete.mp3'),
      combo: new Audio('sounds/combo.mp3'),
      bgm: new Audio('sounds/bgm.mp3'),
      result: new Audio('sounds/result.mp3')
    };

    this.init();
  }

  /**
   * 初期化
   */
  async init() {
    await this.loadPhrases();
    this.setupEventListeners();
    this.showScreen('start-screen');
  }

  /**
   * フレーズデータをロード
   */
  async loadPhrases() {
    try {
      const response = await fetch('data/phrases.json');
      this.phrases = await response.json();
    } catch (error) {
      console.error('フレーズデータの読み込みに失敗しました:', error);
      // フォールバック用のダミーデータ
      this.phrases = {
        easy: [
          { display: 'お寿司が好きです', hiragana: 'おすしがすきです' }
        ],
        normal: [
          { display: '本日の築地直送のまぐろは絶品です', hiragana: 'ほんじつのつきじちょくそうのまぐろはぜっぴんです' }
        ],
        hard: [
          { display: '当店は創業明治三十年の老舗でございます', hiragana: 'とうてんはそうぎょうめいじさんじゅうねんのしにせでございます' }
        ]
      };
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // コース選択ボタン
    document.querySelectorAll('.course-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const course = e.currentTarget.dataset.course;
        this.startCourse(course);
      });
    });

    // リザルト画面のボタン
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.startCourse(this.selectedCourse);
    });

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
      this.showScreen('start-screen');
    });

    // キーボード入力
    document.addEventListener('keydown', (e) => {
      if (this.gameLogic.isPlaying) {
        // 特殊キーは無視
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          this.handleKeyInput(e.key);
        }
      }
    });
  }

  /**
   * 画面を表示
   */
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
  }

  /**
   * コースを開始
   */
  startCourse(course) {
    this.selectedCourse = course;
    this.gameLogic.setCourse(course);
    this.gameLogic.loadPhrases(this.phrases[course]);

    this.showScreen('game-screen');
    this.updateUI();

    // カウントダウン後にゲーム開始
    setTimeout(() => {
      this.gameLogic.startGame();
      this.updateUI();
      this.updateDisplay();
      this.startGameLoop();
      this.changeSushi();
    }, 500);
  }

  /**
   * ゲームループ開始
   */
  startGameLoop() {
    this.gameLoopInterval = setInterval(() => {
      this.updateUI();

      // ゲーム終了チェック
      if (!this.gameLogic.isPlaying && this.gameLoopInterval) {
        clearInterval(this.gameLoopInterval);
        this.showResults();
      }
    }, 100);
  }

  /**
   * キー入力を処理
   */
  handleKeyInput(key) {
    const result = this.gameLogic.processInput(key.toLowerCase());

    if (result.correct) {
      // 正解
      this.playSound('typing');
      this.updateDisplay();
      this.animateTypingArea('correct');

      // ボーナス表示
      if (result.bonus) {
        this.showBonus(result.bonus);
        this.playSound('combo');
      }

      // フレーズ完成
      if (result.completed) {
        this.playSound('complete');
        this.animateSushiEaten();
        setTimeout(() => {
          this.changeSushi();
          this.updateDisplay();
        }, 500);
      }
    } else {
      // ミス
      this.playSound('miss');
      this.animateTypingArea('incorrect');
    }

    this.updateUI();
  }

  /**
   * 表示を更新
   */
  updateDisplay() {
    const state = this.gameLogic.getState();

    // フレーズ表示
    document.getElementById('phrase-display').textContent = state.currentDisplay;

    // ローマ字表示
    const typed = state.currentRomaji.substring(0, state.currentPosition);
    const remaining = state.currentRomaji.substring(state.currentPosition);

    document.getElementById('romaji-typed').textContent = typed;
    document.getElementById('romaji-remaining').textContent = remaining;
  }

  /**
   * UIを更新
   */
  updateUI() {
    const state = this.gameLogic.getState();

    // 時間表示
    const timeDisplay = document.getElementById('time-display');
    timeDisplay.textContent = state.timeRemaining.toFixed(1) + '秒';

    // 時間警告
    if (state.timeRemaining <= 10 && state.timeRemaining > 0) {
      timeDisplay.classList.add('time-warning');
    } else {
      timeDisplay.classList.remove('time-warning');
    }

    // コース価格
    document.getElementById('course-price-display').textContent =
      this.gameLogic.coursePrice.toLocaleString() + '円';

    // スコア
    document.getElementById('score-display').textContent =
      state.score.toLocaleString() + '円';

    // タイプ数
    document.getElementById('typed-count').textContent = state.totalTyped;

    // ミス数
    document.getElementById('miss-count').textContent = state.missCount;

    // WPM計算
    const elapsedTime = (this.gameLogic.timeLimit - state.timeRemaining) / 60;
    const wpm = elapsedTime > 0 ? Math.round((state.totalTyped / 5) / elapsedTime) : 0;
    document.getElementById('wpm-display').textContent = wpm;

    // 連続ミスなしバー
    const maxConsecutive = 300; // バーの最大値
    const percentage = Math.min((state.consecutiveCorrect / maxConsecutive) * 100, 100);
    const consecutiveBar = document.getElementById('consecutive-bar');
    consecutiveBar.style.width = percentage + '%';

    if (state.consecutiveCorrect > 0) {
      consecutiveBar.classList.add('active');
    } else {
      consecutiveBar.classList.remove('active');
    }

    document.getElementById('consecutive-count').textContent = state.consecutiveCorrect + '文字';
  }

  /**
   * 寿司を変更
   */
  changeSushi() {
    const sushiImage = document.getElementById('sushi-image');
    const sushiContainer = sushiImage.parentElement;

    // ランダムに寿司を選択
    this.currentSushiIndex = Math.floor(Math.random() * this.sushiTypes.length);
    sushiImage.src = 'images/' + this.sushiTypes[this.currentSushiIndex];

    // アニメーション
    sushiContainer.classList.remove('sushi-slide-in');
    void sushiContainer.offsetWidth; // リフロー
    sushiContainer.classList.add('sushi-slide-in');
  }

  /**
   * 寿司が食べられるアニメーション
   */
  animateSushiEaten() {
    const sushiImage = document.getElementById('sushi-image');
    sushiImage.classList.add('sushi-eaten');

    setTimeout(() => {
      sushiImage.classList.remove('sushi-eaten');
    }, 500);
  }

  /**
   * タイピングエリアのアニメーション
   */
  animateTypingArea(type) {
    const typingArea = document.querySelector('.typing-area');
    typingArea.classList.add(type);

    setTimeout(() => {
      typingArea.classList.remove(type);
    }, 300);
  }

  /**
   * ボーナス表示
   */
  showBonus(bonus) {
    const notification = document.getElementById('bonus-notification');
    notification.textContent = `🎉 BONUS +${bonus}pt! 🎉`;
    notification.style.display = 'block';
    notification.classList.remove('bonus-show');
    void notification.offsetWidth; // リフロー
    notification.classList.add('bonus-show');

    setTimeout(() => {
      notification.style.display = 'none';
    }, 2000);
  }

  /**
   * 結果を表示
   */
  showResults() {
    const results = this.gameLogic.getResults();

    // 結果を表示
    document.getElementById('result-price').textContent =
      results.coursePrice.toLocaleString() + '円';
    document.getElementById('result-earned').textContent =
      results.earnedPoints.toLocaleString() + '円';

    const profitElement = document.getElementById('result-profit');
    const profitText = results.profit >= 0
      ? `+${results.profit.toLocaleString()}円 🎉`
      : `${results.profit.toLocaleString()}円`;

    profitElement.textContent = profitText;

    if (results.profit >= 0) {
      profitElement.classList.remove('negative');
    } else {
      profitElement.classList.add('negative');
    }

    document.getElementById('result-typed').textContent = results.totalTyped + '文字';
    document.getElementById('result-miss').textContent = results.missCount + '回';
    document.getElementById('result-accuracy').textContent = results.accuracy + '%';
    document.getElementById('result-consecutive').textContent = results.maxConsecutive + '文字';
    document.getElementById('result-wpm').textContent = results.wpm;
    document.getElementById('result-bonus').textContent = results.bonusPoints + 'pt';

    // 画面切り替え
    this.showScreen('result-screen');
    this.playSound('result');
  }

  /**
   * 音声を再生
   */
  playSound(soundName) {
    if (this.sounds[soundName]) {
      // プレースホルダー音声は実際には再生されない
      try {
        this.sounds[soundName].currentTime = 0;
        this.sounds[soundName].play().catch(() => {
          // 音声再生エラーは無視（プレースホルダーのため）
        });
      } catch (error) {
        // エラーは無視
      }
    }
  }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
  const game = new SushiTypingGame();
});
