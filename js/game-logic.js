// ゲームロジック

class GameLogic {
  constructor(typingEngine) {
    this.typingEngine = typingEngine;
    this.phrases = [];
    this.currentPhraseIndex = 0;
    this.currentRomajiPatterns = [];
    this.currentPattern = '';
    this.currentPosition = 0;
    this.score = 0;
    this.missCount = 0;
    this.totalTyped = 0;
    this.consecutiveCorrect = 0;
    this.maxConsecutiveCorrect = 0;
    this.timeLimit = 0;
    this.timeRemaining = 0;
    this.coursePrice = 0;
    this.isPlaying = false;
    this.timerInterval = null;
    this.startTime = null;
    this.bonusThresholds = [10, 20, 30, 50, 75, 100, 150, 200, 300];
    this.bonusPoints = 0;
    this.gaugeThreshold = 50; // ゲージ満タンの閾値
  }

  /**
   * コースを設定
   * @param {string} course - 'easy', 'normal', 'hard'
   */
  setCourse(course) {
    switch (course) {
      case 'easy':
        this.timeLimit = 60;
        this.coursePrice = 3000;
        break;
      case 'normal':
        this.timeLimit = 90;
        this.coursePrice = 5000;
        break;
      case 'hard':
        this.timeLimit = 120;
        this.coursePrice = 10000;
        break;
    }
    this.timeRemaining = this.timeLimit;
  }

  /**
   * フレーズをロード
   * @param {Array} phrases - フレーズの配列
   */
  loadPhrases(phrases) {
    this.phrases = [...phrases];
    this.shufflePhrases();
  }

  /**
   * フレーズをシャッフル
   */
  shufflePhrases() {
    for (let i = this.phrases.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.phrases[i], this.phrases[j]] = [this.phrases[j], this.phrases[i]];
    }
  }

  /**
   * ゲーム開始
   */
  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.missCount = 0;
    this.totalTyped = 0;
    this.consecutiveCorrect = 0;
    this.maxConsecutiveCorrect = 0;
    this.bonusPoints = 0;
    this.currentPhraseIndex = 0;
    this.startTime = Date.now();
    this.loadNextPhrase();
    this.startTimer();
  }

  /**
   * タイマー開始
   */
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 0.1;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.endGame();
      }
    }, 100);
  }

  /**
   * タイマー停止
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * 次のフレーズをロード
   */
  loadNextPhrase() {
    if (this.currentPhraseIndex >= this.phrases.length) {
      this.currentPhraseIndex = 0;
      this.shufflePhrases();
    }

    const phrase = this.phrases[this.currentPhraseIndex];
    this.currentRomajiPatterns = this.typingEngine.convertHiraganaToRomaji(phrase.hiragana);
    this.currentPattern = this.currentRomajiPatterns[0];
    this.currentPosition = 0;
    this.currentPhraseIndex++;

    return phrase;
  }

  /**
   * キー入力を処理
   * @param {string} key - 入力されたキー
   * @returns {Object} - {correct, completed, display, romaji, position}
   */
  processInput(key) {
    if (!this.isPlaying) {
      return { correct: false, completed: false };
    }

    const result = {
      correct: false,
      completed: false,
      display: this.phrases[this.currentPhraseIndex - 1].display,
      hiragana: this.phrases[this.currentPhraseIndex - 1].hiragana,
      romaji: this.currentPattern,
      position: this.currentPosition
    };

    // 現在の位置から可能なパターンを探す
    let matched = false;
    for (const pattern of this.currentRomajiPatterns) {
      if (pattern[this.currentPosition] === key) {
        // マッチした場合、そのパターンを現在のパターンとして設定
        this.currentPattern = pattern;
        this.currentPosition++;
        this.totalTyped++;
        this.consecutiveCorrect++;
        this.score++;
        matched = true;
        result.correct = true;
        result.position = this.currentPosition;
        result.romaji = this.currentPattern;

        // 最大連続記録を更新
        if (this.consecutiveCorrect > this.maxConsecutiveCorrect) {
          this.maxConsecutiveCorrect = this.consecutiveCorrect;
        }

        // ボーナスチェック
        if (this.bonusThresholds.includes(this.consecutiveCorrect)) {
          const bonus = this.consecutiveCorrect * 10;
          this.bonusPoints += bonus;
          this.score += bonus;
          result.bonus = bonus;
        }

        // ゲージ満タンチェック（50文字ごと）
        if (this.consecutiveCorrect > 0 && this.consecutiveCorrect % this.gaugeThreshold === 0) {
          result.gaugeFull = true;
          // 連続カウントはリセットせずに継続（次の50文字へ）
        }

        // フレーズ完成チェック
        if (this.currentPosition >= this.currentPattern.length) {
          result.completed = true;
          this.loadNextPhrase();
          result.nextDisplay = this.phrases[this.currentPhraseIndex - 1].display;
          result.nextHiragana = this.phrases[this.currentPhraseIndex - 1].hiragana;
          result.nextRomaji = this.currentPattern;
        }

        break;
      }
    }

    if (!matched) {
      this.missCount++;
      this.consecutiveCorrect = 0;
    }

    return result;
  }

  /**
   * 時間を追加
   * @param {number} seconds - 追加する秒数
   */
  addTime(seconds) {
    this.timeRemaining += seconds;
  }

  /**
   * ゲーム終了
   */
  endGame() {
    this.isPlaying = false;
    this.stopTimer();
  }

  /**
   * 結果を取得
   * @returns {Object} - ゲーム結果
   */
  getResults() {
    const accuracy = this.totalTyped > 0
      ? ((this.totalTyped - this.missCount) / this.totalTyped * 100).toFixed(1)
      : 0;

    const elapsedTime = this.timeLimit - this.timeRemaining;
    const wpm = elapsedTime > 0
      ? Math.round((this.totalTyped / 5) / (elapsedTime / 60))
      : 0;

    const earnedPoints = this.score;
    const profit = earnedPoints - this.coursePrice;

    return {
      coursePrice: this.coursePrice,
      earnedPoints: earnedPoints,
      profit: profit,
      totalTyped: this.totalTyped,
      missCount: this.missCount,
      accuracy: accuracy,
      maxConsecutive: this.maxConsecutiveCorrect,
      wpm: wpm,
      bonusPoints: this.bonusPoints
    };
  }

  /**
   * 現在の状態を取得
   * @returns {Object} - 現在の状態
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      timeRemaining: this.timeRemaining,
      score: this.score,
      totalTyped: this.totalTyped,
      missCount: this.missCount,
      consecutiveCorrect: this.consecutiveCorrect,
      currentDisplay: this.currentPhraseIndex > 0
        ? this.phrases[this.currentPhraseIndex - 1].display
        : '',
      currentHiragana: this.currentPhraseIndex > 0
        ? this.phrases[this.currentPhraseIndex - 1].hiragana
        : '',
      currentRomaji: this.currentPattern,
      currentPosition: this.currentPosition
    };
  }
}

// グローバルに公開
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameLogic;
}
