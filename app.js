/**
 * Frozen "Let It Go" - Bilingual Educational Hub
 * Core Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentMode = 'cards';
  let currentSection = 'all';
  let searchQuery = '';
  let vocabSearchQuery = '';
  let favorites = JSON.parse(localStorage.getItem('let_it_go_favorites') || '[]');
  let isSnowing = true;
  let isPlayingAuto = false;
  let currentPlayingIndex = -1;
  let synth = window.speechSynthesis;
  let enVoice = null;

  // DOM Elements
  const lyricsGrid = document.getElementById('lyrics-grid');
  const compactContainer = document.getElementById('compact-container');
  const flashcardsGrid = document.getElementById('flashcards-grid');
  const favLyricsGrid = document.getElementById('fav-lyrics-grid');
  const favEmptyState = document.getElementById('fav-empty-state');
  const sectionPillsContainer = document.getElementById('section-pills');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const vocabSearchInput = document.getElementById('vocab-search');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const viewPanels = document.querySelectorAll('.view-panel');

  const totalLinesCount = document.getElementById('total-lines-count');
  const totalVocabCount = document.getElementById('total-vocab-count');
  const favCount = document.getElementById('fav-count');
  const favBadgeCount = document.getElementById('fav-badge-count');
  const vocabBadgeCount = document.getElementById('vocab-badge-count');

  const karaokePlayBtn = document.getElementById('karaoke-play-btn');
  const playBtnText = document.getElementById('play-btn-text');
  const stopSpeechBtn = document.getElementById('stop-speech-btn');
  const speechRateSelect = document.getElementById('speech-rate');
  const autoScrollToggle = document.getElementById('auto-scroll-toggle');
  const toggleSnowBtn = document.getElementById('toggle-snow-btn');

  const floatingPlayer = document.getElementById('floating-player');
  const playerCurrentText = document.getElementById('player-current-text');
  const playerToggleBtn = document.getElementById('player-toggle-btn');
  const playerPrevBtn = document.getElementById('player-prev-btn');
  const playerNextBtn = document.getElementById('player-next-btn');
  const playerCloseBtn = document.getElementById('player-close-btn');

  const ghModal = document.getElementById('gh-modal');
  const githubGuideBtn = document.getElementById('github-guide-btn');
  const openGhModalBtn = document.getElementById('open-gh-modal-btn');
  const closeGhModalBtn = document.getElementById('close-gh-modal');
  const modalOkBtn = document.getElementById('modal-ok-btn');
  const copyGitBtn = document.getElementById('copy-git-btn');
  const toast = document.getElementById('toast');

  // Initialize Speech Synthesis Voices
  function loadVoices() {
    if (!synth) return;
    const voices = synth.getVoices();
    // Prefer natural US/UK English voice
    enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Karen') || v.name.includes('Victoria'))) ||
              voices.find(v => v.lang.startsWith('en-US')) ||
              voices.find(v => v.lang.startsWith('en')) ||
              null;
  }

  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }

  // Toast Notification
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // Speak Text Function
  function speak(text, onEndCallback = null) {
    if (!synth) {
      showToast('⚠️ 您的瀏覽器不支援語音合成功能');
      return;
    }
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(speechRateSelect.value) || 0.9;
    utterance.pitch = 1.0;
    if (enVoice) {
      utterance.voice = enVoice;
    } else {
      utterance.lang = 'en-US';
    }

    if (onEndCallback) {
      utterance.onend = onEndCallback;
      utterance.onerror = () => {
        onEndCallback();
      };
    }

    synth.speak(utterance);
    stopSpeechBtn.style.display = 'inline-flex';
  }

  // Stop Speech
  function stopAllSpeech() {
    if (synth) {
      synth.cancel();
    }
    isPlayingAuto = false;
    currentPlayingIndex = -1;
    playBtnText.textContent = '自動逐句朗讀';
    stopSpeechBtn.style.display = 'none';
    floatingPlayer.classList.remove('show');
    clearPlayingHighlights();
  }

  stopSpeechBtn.addEventListener('click', stopAllSpeech);

  // Extract all unique vocabulary
  function getAllVocabList() {
    const map = new Map();
    lyricsData.forEach(item => {
      if (item.vocab && Array.isArray(item.vocab)) {
        item.vocab.forEach(([word, def]) => {
          const cleanWord = word.trim().toLowerCase();
          if (!map.has(cleanWord)) {
            map.set(cleanWord, {
              word: word.trim(),
              def: def.trim(),
              lineNo: item.n,
              sentence: item.en,
              zhLyric: item.zh_lyric
            });
          }
        });
      }
    });
    return Array.from(map.values());
  }

  const allVocabList = getAllVocabList();
  totalVocabCount.textContent = allVocabList.length;
  vocabBadgeCount.textContent = allVocabList.length;
  totalLinesCount.textContent = lyricsData.length;

  // Build Section Filter Pills
  function initSections() {
    const sections = [...new Set(lyricsData.map(item => item.sec))];
    let html = `<button class="sec-pill ${currentSection === 'all' ? 'active' : ''}" data-sec="all">全部段落 (${lyricsData.length})</button>`;
    sections.forEach(sec => {
      const count = lyricsData.filter(d => d.sec === sec).length;
      html += `<button class="sec-pill" data-sec="${sec}">${sec} (${count})</button>`;
    });
    sectionPillsContainer.innerHTML = html;

    sectionPillsContainer.querySelectorAll('.sec-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        sectionPillsContainer.querySelectorAll('.sec-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSection = btn.dataset.sec;
        renderCurrentView();
      });
    });
  }

  // Filter lyrics by section and search query
  function getFilteredLyrics() {
    return lyricsData.filter(item => {
      const matchSec = currentSection === 'all' || item.sec === currentSection;
      if (!matchSec) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const inEn = item.en.toLowerCase().includes(q);
      const inLiteral = item.literal_zh.toLowerCase().includes(q);
      const inZh = item.zh_lyric.toLowerCase().includes(q);
      const inNote = item.parent_note.toLowerCase().includes(q);
      const inVocab = item.vocab && item.vocab.some(([w, d]) => w.toLowerCase().includes(q) || d.toLowerCase().includes(q));
      return inEn || inLiteral || inZh || inNote || inVocab;
    });
  }

  // Toggle Favorite
  function toggleFavorite(num) {
    const idx = favorites.indexOf(num);
    if (idx > -1) {
      favorites.splice(idx, 1);
      showToast(`已從收藏移除第 ${num} 句`);
    } else {
      favorites.push(num);
      showToast(`⭐ 已收藏第 ${num} 句！`);
    }
    localStorage.setItem('let_it_go_favorites', JSON.stringify(favorites));
    updateFavCounts();
    renderCurrentView();
  }

  function updateFavCounts() {
    favCount.textContent = favorites.length;
    favBadgeCount.textContent = favorites.length;
  }
  updateFavCounts();

  // Highlight active card
  function highlightPlayingCard(num) {
    clearPlayingHighlights();
    const card = document.querySelector(`.lyric-card[data-n="${num}"]`);
    if (card) {
      card.classList.add('highlight-playing');
      if (autoScrollToggle.checked) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    const row = document.querySelector(`.compact-row[data-n="${num}"]`);
    if (row) {
      row.classList.add('highlight-playing');
      if (autoScrollToggle.checked && currentMode === 'compact') {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function clearPlayingHighlights() {
    document.querySelectorAll('.lyric-card.highlight-playing, .compact-row.highlight-playing').forEach(el => {
      el.classList.remove('highlight-playing');
    });
  }

  // Play Single Line
  window.playLine = function(num) {
    const item = lyricsData.find(d => d.n === num);
    if (!item) return;
    highlightPlayingCard(num);
    speak(item.en, () => {
      clearPlayingHighlights();
      stopSpeechBtn.style.display = 'none';
    });
  };

  // Play Single Vocab
  window.playWord = function(word, event) {
    if (event) event.stopPropagation();
    speak(word);
    showToast(`🔊 發音: "${word}"`);
  };

  // 1. Render Cards View
  function renderCards(list, container = lyricsGrid) {
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">❄️</div>
          <h3>沒有找到符合的歌詞</h3>
          <p>請嘗試其他關鍵字或切換段落篩選</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map(item => {
      const isFav = favorites.includes(item.n);
      const vocabHtml = item.vocab && item.vocab.length > 0
        ? `<div class="card-vocab">
             <span class="vocab-label">重點單字:</span>
             ${item.vocab.map(([w, d]) => `
               <span class="vocab-pill" onclick="playWord('${escapeQuotes(w)}', event)" title="點擊發音">
                 <span class="vocab-word">${escapeHtml(w)}</span>
                 <span class="vocab-def">${escapeHtml(d)}</span>
                 <span style="font-size: 0.7rem;">🔊</span>
               </span>
             `).join('')}
           </div>`
        : '';

      return `
        <div class="lyric-card" data-n="${item.n}">
          <div class="card-header">
            <span class="card-num-badge">${item.n}</span>
            <span class="card-sec-badge">${escapeHtml(item.sec)}</span>
            <div class="card-actions">
              <button class="card-icon-btn ${isFav ? 'is-fav' : ''}" onclick="toggleFavBtn(${item.n})" title="${isFav ? '取消收藏' : '收藏此句'}">
                ${isFav ? '⭐' : '☆'}
              </button>
              <button class="card-icon-btn" onclick="playLine(${item.n})" title="朗讀英文句子">
                🔊
              </button>
            </div>
          </div>

          <div class="card-en-row" onclick="playLine(${item.n})" title="點擊發音整句">
            <p class="card-en">${escapeHtml(item.en)}</p>
          </div>

          <div class="card-translations">
            <div class="trans-item">
              <span class="trans-tag">直譯解析</span>
              <p class="trans-literal">${escapeHtml(item.literal_zh)}</p>
            </div>
            <div class="trans-item">
              <span class="trans-tag">迪士尼官方版</span>
              <p class="trans-official">
                <span class="official-icon">🎵</span> ${escapeHtml(item.zh_lyric)}
              </p>
            </div>
          </div>

          ${vocabHtml}

          <div class="card-parent-note">
            <span class="note-sparkle">❄️</span>
            <div class="note-body">
              <span class="note-title">親子共讀小語</span>
              <p class="note-content">${escapeHtml(item.parent_note)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Render Compact Sing-Along View
  function renderCompact(list) {
    if (list.length === 0) {
      compactContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❄️</div>
          <h3>沒有找到符合的歌詞</h3>
        </div>`;
      return;
    }

    compactContainer.innerHTML = list.map(item => `
      <div class="compact-row" data-n="${item.n}" onclick="playLine(${item.n})">
        <div class="compact-num">#${item.n}</div>
        <div class="compact-content">
          <div class="compact-en">${escapeHtml(item.en)}</div>
          <div class="compact-zh-group">
            <span class="compact-literal">直譯：${escapeHtml(item.literal_zh)}</span>
            <span class="compact-official">官方：${escapeHtml(item.zh_lyric)}</span>
          </div>
        </div>
        <button class="compact-speak-btn" onclick="event.stopPropagation(); playLine(${item.n});" title="播放發音">
          ▶
        </button>
      </div>
    `).join('');
  }

  // 3. Render Flashcards View
  function renderFlashcards() {
    let filteredVocab = allVocabList;
    if (vocabSearchQuery) {
      const q = vocabSearchQuery.toLowerCase();
      filteredVocab = allVocabList.filter(v => v.word.toLowerCase().includes(q) || v.def.toLowerCase().includes(q));
    }

    if (filteredVocab.length === 0) {
      flashcardsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔍</div>
          <h3>未找到相符的單字</h3>
        </div>`;
      return;
    }

    flashcardsGrid.innerHTML = filteredVocab.map(v => `
      <div class="flashcard" onclick="this.classList.toggle('flipped')">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <div class="flashcard-top">
              <span class="flashcard-pill-tag">句 #${v.lineNo}</span>
              <button class="flashcard-speak" onclick="playWord('${escapeQuotes(v.word)}', event)" title="點擊發音">🔊</button>
            </div>
            <div class="flashcard-main-word">${escapeHtml(v.word)}</div>
            <div class="flashcard-hint">點擊卡片翻轉查看中文 🔄</div>
          </div>
          <div class="flashcard-back">
            <div class="flashcard-top">
              <span class="flashcard-pill-tag" style="background: rgba(253,224,71,0.2); color:#fde047;">中文釋義</span>
              <button class="flashcard-speak" onclick="playWord('${escapeQuotes(v.word)}', event)" title="點擊發音">🔊</button>
            </div>
            <div class="flashcard-def-zh">${escapeHtml(v.def)}</div>
            <div class="flashcard-context">
              <strong>歌詞例句：</strong><br>"${escapeHtml(v.sentence)}"
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 4. Render Favorites View
  function renderFavorites() {
    const favItems = lyricsData.filter(item => favorites.includes(item.n));
    if (favItems.length === 0) {
      favEmptyState.style.display = 'block';
      favLyricsGrid.innerHTML = '';
    } else {
      favEmptyState.style.display = 'none';
      renderCards(favItems, favLyricsGrid);
    }
  }

  // Global Fav Click Handler
  window.toggleFavBtn = function(num) {
    toggleFavorite(num);
  };

  // Helper escape
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
  }

  // Main Render Current View
  function renderCurrentView() {
    const filtered = getFilteredLyrics();
    if (currentMode === 'cards') {
      renderCards(filtered);
    } else if (currentMode === 'compact') {
      renderCompact(filtered);
    } else if (currentMode === 'flashcards') {
      renderFlashcards();
    } else if (currentMode === 'favorites') {
      renderFavorites();
    }
  }

  // Mode Switcher Tab Clicks
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      viewPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      document.getElementById(`${currentMode}-view`).classList.add('active');
      renderCurrentView();
    });
  });

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderCurrentView();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderCurrentView();
  });

  // Vocab search
  if (vocabSearchInput) {
    vocabSearchInput.addEventListener('input', (e) => {
      vocabSearchQuery = e.target.value.trim();
      renderFlashcards();
    });
  }

  // ==========================================
  // Continuous Karaoke Sing-Along Player
  // ==========================================
  function playSequenceFromIndex(idx) {
    if (idx < 0 || idx >= lyricsData.length) {
      stopAllSpeech();
      showToast('🎉 全曲 40 句朗讀完畢！太棒了！');
      return;
    }

    currentPlayingIndex = idx;
    isPlayingAuto = true;
    const item = lyricsData[idx];

    // Update Player UI
    floatingPlayer.classList.add('show');
    playerCurrentText.textContent = `#${item.n} ${item.en}`;
    playerToggleBtn.textContent = '⏸';
    playBtnText.textContent = `朗讀中 (#${item.n}/40)`;
    highlightPlayingCard(item.n);

    speak(item.en, () => {
      if (!isPlayingAuto) return;
      // Brief pause between lines before next line
      setTimeout(() => {
        if (isPlayingAuto) {
          playSequenceFromIndex(idx + 1);
        }
      }, 750);
    });
  }

  karaokePlayBtn.addEventListener('click', () => {
    if (isPlayingAuto) {
      stopAllSpeech();
    } else {
      playSequenceFromIndex(currentPlayingIndex >= 0 ? currentPlayingIndex : 0);
    }
  });

  playerToggleBtn.addEventListener('click', () => {
    if (isPlayingAuto) {
      synth.cancel();
      isPlayingAuto = false;
      playerToggleBtn.textContent = '▶';
      playBtnText.textContent = '繼續朗讀';
    } else {
      playSequenceFromIndex(currentPlayingIndex >= 0 ? currentPlayingIndex : 0);
    }
  });

  playerPrevBtn.addEventListener('click', () => {
    if (currentPlayingIndex > 0) {
      playSequenceFromIndex(currentPlayingIndex - 1);
    }
  });

  playerNextBtn.addEventListener('click', () => {
    if (currentPlayingIndex < lyricsData.length - 1) {
      playSequenceFromIndex(currentPlayingIndex + 1);
    }
  });

  playerCloseBtn.addEventListener('click', () => {
    stopAllSpeech();
  });

  // ==========================================
  // SNOWFLAKE PARTICLE CANVAS ANIMATION
  // ==========================================
  const canvas = document.getElementById('snow-canvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let flakes = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createFlakes(count = 70) {
    flakes = [];
    for (let i = 0; i < count; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.8 + 1,
        speedY: Math.random() * 0.9 + 0.5,
        speedX: Math.random() * 0.6 - 0.3,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
  }
  createFlakes();

  function drawSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isSnowing) return;

    ctx.fillStyle = '#ffffff';
    flakes.forEach(flake => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 242, 254, ${flake.opacity})`;
      ctx.fill();

      flake.y += flake.speedY;
      flake.x += flake.speedX;

      if (flake.y > canvas.height) {
        flake.y = -5;
        flake.x = Math.random() * canvas.width;
      }
      if (flake.x > canvas.width) flake.x = 0;
      if (flake.x < 0) flake.x = canvas.width;
    });

    animationFrameId = requestAnimationFrame(drawSnow);
  }
  drawSnow();

  toggleSnowBtn.addEventListener('click', () => {
    isSnowing = !isSnowing;
    toggleSnowBtn.innerHTML = isSnowing ? '<span class="icon">❄️</span> 飄雪特效' : '<span class="icon">🚫</span> 飄雪關閉';
    if (isSnowing) {
      drawSnow();
      showToast('❄️ 已開啟飄雪背景效果');
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
      showToast('已關閉飄雪特效');
    }
  });

  // ==========================================
  // GITHUB MODAL & COPY COMMANDS
  // ==========================================
  function openGhModal() {
    ghModal.classList.add('show');
  }

  function closeGhModal() {
    ghModal.classList.remove('show');
  }

  githubGuideBtn.addEventListener('click', openGhModal);
  openGhModalBtn.addEventListener('click', openGhModal);
  closeGhModalBtn.addEventListener('click', closeGhModal);
  modalOkBtn.addEventListener('click', closeGhModal);

  ghModal.addEventListener('click', (e) => {
    if (e.target === ghModal) closeGhModal();
  });

  copyGitBtn.addEventListener('click', () => {
    const codeText = document.getElementById('git-commands').textContent;
    navigator.clipboard.writeText(codeText).then(() => {
      copyGitBtn.textContent = '已複製！';
      showToast('📋 Git 指令已成功複製至剪貼簿！');
      setTimeout(() => {
        copyGitBtn.textContent = '複製指令';
      }, 2000);
    }).catch(() => {
      showToast('複製失敗，請手動框選複製');
    });
  });

  // Initial Initialization
  initSections();
  renderCurrentView();
});
