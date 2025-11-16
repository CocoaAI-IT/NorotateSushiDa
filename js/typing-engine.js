// タイピングエンジン - ひらがなをローマ字に変換（表記ゆれ対応）

class TypingEngine {
  constructor() {
    // ひらがな→ローマ字変換テーブル（表記ゆれ対応）
    this.conversionTable = {
      // 基本の五十音
      'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
      'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
      'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
      'さ': ['sa'], 'し': ['si', 'shi', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
      'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
      'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
      'だ': ['da'], 'ぢ': ['di', 'dji'], 'づ': ['du', 'dzu'], 'で': ['de'], 'ど': ['do'],
      'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
      'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
      'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
      'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
      'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
      'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
      'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
      'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', 'n'],

      // 拗音
      'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
      'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
      'しゃ': ['sya', 'sha', 'cya'], 'しゅ': ['syu', 'shu', 'cyu'], 'しょ': ['syo', 'sho', 'cyo'],
      'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
      'ちゃ': ['tya', 'cha', 'cya'], 'ちゅ': ['tyu', 'chu', 'cyu'], 'ちょ': ['tyo', 'cho', 'cyo'],
      'ぢゃ': ['dya', 'dja'], 'ぢゅ': ['dyu', 'dju'], 'ぢょ': ['dyo', 'djo'],
      'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
      'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
      'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
      'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
      'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
      'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],

      // ファ行
      'ふぁ': ['fa', 'huxa', 'fuxa'], 'ふぃ': ['fi', 'huxi', 'fuxi'],
      'ふぇ': ['fe', 'huxe', 'fuxe'], 'ふぉ': ['fo', 'huxo', 'fuxo'],

      // ウィ、ウェ、ウォ
      'うぃ': ['wi', 'uxi'], 'うぇ': ['we', 'uxe'], 'うぉ': ['wo', 'uxo'],

      // ヴァ行
      'ゔぁ': ['va', 'vuxa'], 'ゔぃ': ['vi', 'vuxi'], 'ゔ': ['vu'],
      'ゔぇ': ['ve', 'vuxe'], 'ゔぉ': ['vo', 'vuxo'],

      // ティ、ディ、デュ
      'てぃ': ['thi', 'texi'], 'でぃ': ['dhi', 'dexi'], 'でゅ': ['dhu', 'dexyu'],

      // トゥ、ドゥ
      'とぅ': ['twu', 'toxu'], 'どぅ': ['dwu', 'doxu'],

      // 小さい文字
      'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'],
      'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
      'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'],
      'ゎ': ['xwa', 'lwa'],
      'っ': ['xtu', 'xtsu', 'ltu', 'ltsu'],

      // 記号など
      'ー': ['-'], '、': [','], '。': ['.'], '・': ['/'],
      '「': ['['], '」': [']'], '（': ['('], '）': [')']
    };
  }

  /**
   * ひらがな文字列をローマ字の可能なパターンに変換
   * @param {string} hiragana - ひらがな文字列
   * @returns {Array} - ローマ字の可能なパターンの配列
   */
  convertHiraganaToRomaji(hiragana) {
    const patterns = [[]];
    let i = 0;

    while (i < hiragana.length) {
      let matched = false;

      // 3文字のマッチを試みる（拗音など）
      if (i + 2 < hiragana.length) {
        const threeChars = hiragana.substring(i, i + 3);
        if (this.conversionTable[threeChars]) {
          const newPatterns = [];
          for (const pattern of patterns) {
            for (const romaji of this.conversionTable[threeChars]) {
              newPatterns.push([...pattern, romaji]);
            }
          }
          patterns.length = 0;
          patterns.push(...newPatterns);
          i += 3;
          matched = true;
        }
      }

      // 2文字のマッチを試みる
      if (!matched && i + 1 < hiragana.length) {
        const twoChars = hiragana.substring(i, i + 2);
        if (this.conversionTable[twoChars]) {
          const newPatterns = [];
          for (const pattern of patterns) {
            for (const romaji of this.conversionTable[twoChars]) {
              newPatterns.push([...pattern, romaji]);
            }
          }
          patterns.length = 0;
          patterns.push(...newPatterns);
          i += 2;
          matched = true;
        }
      }

      // 1文字のマッチを試みる
      if (!matched) {
        const oneChar = hiragana[i];

        // 促音（っ）の処理
        if (oneChar === 'っ') {
          const nextChar = hiragana[i + 1];
          if (nextChar && this.conversionTable[nextChar]) {
            const nextRomaji = this.conversionTable[nextChar][0];
            const consonant = nextRomaji[0];

            // 「ch」の場合は「c」を重ねる
            if (nextRomaji.startsWith('ch')) {
              const newPatterns = [];
              for (const pattern of patterns) {
                newPatterns.push([...pattern, 'c']);
                // ltsu, xtsuも使える
                newPatterns.push([...pattern, 'ltu']);
                newPatterns.push([...pattern, 'xtu']);
              }
              patterns.length = 0;
              patterns.push(...newPatterns);
            } else {
              const newPatterns = [];
              for (const pattern of patterns) {
                newPatterns.push([...pattern, consonant]);
                // ltsu, xtsuも使える
                newPatterns.push([...pattern, 'ltu']);
                newPatterns.push([...pattern, 'xtu']);
              }
              patterns.length = 0;
              patterns.push(...newPatterns);
            }
            i++;
            matched = true;
          }
        } else if (this.conversionTable[oneChar]) {
          const newPatterns = [];
          for (const pattern of patterns) {
            for (const romaji of this.conversionTable[oneChar]) {
              newPatterns.push([...pattern, romaji]);
            }
          }
          patterns.length = 0;
          patterns.push(...newPatterns);
          i++;
          matched = true;
        }
      }

      // マッチしない文字はそのまま追加
      if (!matched) {
        for (const pattern of patterns) {
          pattern.push(hiragana[i]);
        }
        i++;
      }
    }

    // パターンを文字列に結合
    return patterns.map(pattern => pattern.join(''));
  }

  /**
   * 「ん」の後の文字によって「n」「nn」を判定
   * @param {string} romaji - ローマ字文字列
   * @returns {string} - 最適化されたローマ字文字列
   */
  optimizeN(romaji) {
    // 「n」の後に母音やy、nが来る場合は「nn」にする
    return romaji.replace(/n(?=[aiueoyn])/g, 'nn');
  }

  /**
   * ひらがなをローマ字に変換（最初のパターンを返す）
   * @param {string} hiragana - ひらがな文字列
   * @returns {string} - ローマ字文字列
   */
  getFirstRomajiPattern(hiragana) {
    const patterns = this.convertHiraganaToRomaji(hiragana);
    return patterns.length > 0 ? patterns[0] : '';
  }
}

// グローバルに公開
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TypingEngine;
}
