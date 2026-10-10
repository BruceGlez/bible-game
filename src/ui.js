import { sounds } from './audio.js';

export class GameUI {
  constructor() {
    this.createElements();
    this.typewriterTimeout = null;
  }

  createElements() {
    // 1. Notification Banner
    this.notifEl = document.createElement('div');
    this.notifEl.className = 'game-notification';
    document.body.appendChild(this.notifEl);

    // 2. HUD: Top Bar & Compass & Quest tracker
    this.hudEl = document.createElement('div');
    this.hudEl.className = 'hud-container';
    this.hudEl.innerHTML = `
      <div class="hud-top-left">
        <div class="hud-title">THE SEEKER</div>
        <div class="hud-subtitle">Path of the Wayfarer</div>
        <div class="faith-bar-container">
          <div class="faith-bar-label">FAITH ENERGY</div>
          <div class="faith-bar-track">
            <div id="faith-bar-fill" class="faith-bar-fill"></div>
          </div>
        </div>
      </div>

      <div class="hud-top-right">
        <div class="compass-container">
          <div id="compass-needle" class="compass-needle">▲</div>
          <div class="compass-label">N</div>
        </div>
        <div class="hud-buttons">
          <button id="btn-journal" class="hud-btn" aria-label="Journal">📜</button>
          <button id="btn-audio" class="hud-btn" aria-label="Sound">🎵</button>
          <button id="btn-help" class="hud-btn" aria-label="Help">❓</button>
          <button id="btn-install" class="hud-btn install-btn hidden" aria-label="Install">📲</button>
          <button id="btn-fullscreen" class="hud-btn" aria-label="Fullscreen">⛶</button>
        </div>
      </div>

      <div class="quest-tracker hidden" id="quest-tracker">
        <div class="quest-tracker-badge">ACTIVE MISSION</div>
        <div class="quest-tracker-title" id="qt-title"></div>
        <div class="quest-tracker-ref" id="qt-ref"></div>
        <div class="quest-tracker-obj" id="qt-obj"></div>
        <div class="quest-tracker-progress" id="qt-progress"></div>
      </div>

      <div class="prompt-interaction" id="interaction-prompt">
        <span class="prompt-icon">💬</span>
        <span class="prompt-action">Interact</span>
        <strong class="prompt-target"></strong>
      </div>
    `;
    document.body.appendChild(this.hudEl);

    // 3. Dialogue Modal
    this.dialogueModal = document.createElement('div');
    this.dialogueModal.className = 'modal-backdrop hidden';
    this.dialogueModal.innerHTML = `
      <div class="parchment-box dialogue-box" id="dialogue-box">
        <div class="dialogue-header">
          <div class="speaker-avatar-wrap">
            <div class="speaker-avatar" id="dialogue-avatar">👴</div>
          </div>
          <div class="speaker-meta">
            <div class="speaker-name" id="dialogue-name">Elder Simeon</div>
            <div class="speaker-title" id="dialogue-title">Bethany Village Patriarch</div>
          </div>
          <div class="dialogue-counter" id="dialogue-counter">1 / 1</div>
        </div>

        <div class="dialogue-body" id="dialogue-body">
          <div class="dialogue-content" id="dialogue-text">...</div>
          <div class="dialogue-quest-card hidden" id="dialogue-quest-card"></div>
        </div>

        <div class="dialogue-footer">
          <div class="dialogue-hint" id="dialogue-hint">Tap text to skip typing</div>
          <div class="dialogue-actions" id="dialogue-actions">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.dialogueModal);

    // 4. Scripture Journal Modal
    this.journalModal = document.createElement('div');
    this.journalModal.className = 'modal-backdrop hidden';
    this.journalModal.innerHTML = `
      <div class="parchment-box journal-book">
        <div class="journal-close-btn" id="journal-close-btn">✕</div>
        <div class="journal-book-layout">
          <div class="journal-page left-page">
            <h3 class="page-header">CHRONICLE OF SCRIPTURES</h3>
            <p class="page-sub">Sacred scrolls discovered along your pilgrimage.</p>
            <div class="scroll-list" id="journal-scroll-list">
              <!-- Dynamically populated -->
            </div>
          </div>
          <div class="journal-page right-page" id="journal-detail-page">
            <div class="journal-placeholder-text">Select a scripture scroll on the left to read and reflect.</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.journalModal);

    // 5. Scroll Reward Celebration Modal
    this.rewardModal = document.createElement('div');
    this.rewardModal.className = 'modal-backdrop hidden';
    this.rewardModal.innerHTML = `
      <div class="parchment-box reward-box">
        <div class="reward-sparkle">✦ ✦ ✦</div>
        <h2 class="reward-header">SACRED SCROLL DISCOVERED!</h2>
        <div class="reward-title" id="reward-scroll-title">The Good Shepherd</div>
        <div class="reward-ref" id="reward-scroll-ref">Psalm 23:1-3</div>
        <blockquote class="reward-quote" id="reward-scroll-text"></blockquote>
        <div class="reward-reflection" id="reward-scroll-refl"></div>
        <button id="reward-btn-continue" class="parchment-btn primary-btn" style="margin-top: 18px;">Accept & Continue</button>
      </div>
    `;
    document.body.appendChild(this.rewardModal);

    // 6. Help / Instructions Modal
    this.helpModal = document.createElement('div');
    this.helpModal.className = 'modal-backdrop hidden';
    this.helpModal.innerHTML = `
      <div class="parchment-box help-box">
        <div class="journal-close-btn" id="help-close-btn">✕</div>
        <h2 class="page-header">THE WAYFARER'S GUIDE</h2>
        <p class="page-sub">Explore ancient Judea, solve missions grounded in Bible history, and collect sacred wisdom.</p>
        
        <div class="help-grid">
          <div class="help-section">
            <h4>🎮 Touch Controls</h4>
            <ul>
              <li><strong>Left thumb:</strong> Drag anywhere on the left side to walk / run</li>
              <li><strong>Right thumb:</strong> Drag to rotate the camera, pinch to zoom</li>
              <li><strong>⬆ JUMP:</strong> Jump & vault</li>
              <li><strong>💨 ROLL:</strong> Dodge roll</li>
              <li><strong>✨ FAITH:</strong> Light of Faith (illuminates darkness & glyphs)</li>
              <li><strong>💬 ACT:</strong> Talk to villagers, guide sheep, pick up objects</li>
              <li><strong>📜:</strong> Open Scripture Journal</li>
            </ul>
          </div>
          <div class="help-section">
            <h4>📜 Biblical Missions Included</h4>
            <ul>
              <li><strong>1. The Parable of the Lost Sheep (Luke 15):</strong> Find the 3 lost lambs in the hills and guide them to the sheepfold.</li>
              <li><strong>2. Living Water (John 4):</strong> Climb the watchtower ruins, retrieve the stone gear, and restore the village well.</li>
              <li><strong>3. Five Smooth Stones (1 Samuel 17):</strong> Explore the dry brook bed of Elah to collect the stones of faith.</li>
              <li><strong>4. Light in the Cavern (Isaiah 9 / Psalm 119):</strong> Cast the Light of Faith in the western cavern to reveal ancient scriptures.</li>
            </ul>
          </div>
        </div>
        <button id="help-btn-ok" class="parchment-btn primary-btn" style="margin-top: 20px;">Return to Journey</button>
      </div>
    `;
    document.body.appendChild(this.helpModal);

    // 7. Mobile Controls
    this.mobileControlsEl = document.createElement('div');
    this.mobileControlsEl.className = 'mobile-controls-container';
    this.mobileControlsEl.innerHTML = `
      <div class="joystick-zone" id="joystick-zone">
        <div class="joystick-knob" id="joystick-knob"></div>
      </div>
      <div class="action-buttons">
        <div class="action-buttons-wrapper">
          <div class="touch-btn btn-jump" id="btn-touch-jump" title="Jump"><span class="btn-icon">⬆</span><span class="btn-text">JUMP</span></div>
          <div class="touch-btn btn-roll" id="btn-touch-roll" title="Evade Roll"><span class="btn-icon">💨</span><span class="btn-text">ROLL</span></div>
          <div class="touch-btn btn-faith" id="btn-touch-faith" title="Light of Faith"><span class="btn-icon">✨</span><span class="btn-text">FAITH</span></div>
          <div class="touch-btn btn-interact" id="btn-touch-interact" title="Interact"><span class="btn-icon">💬</span><span class="btn-text">ACT</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.mobileControlsEl);

    // 8. iOS Install Instruction Modal
    this.iosInstallModal = document.createElement('div');
    this.iosInstallModal.className = 'modal-backdrop hidden';
    this.iosInstallModal.innerHTML = `
      <div class="parchment-box ios-install-box">
        <div class="journal-close-btn" id="ios-install-close">✕</div>
        <div class="ios-install-icon">📲</div>
        <h2 class="page-header">INSTALL ON YOUR DEVICE</h2>
        <p class="page-sub">Play full-screen with offline support on iOS or Android.</p>
        <div class="ios-install-steps">
          <div class="ios-step"><span class="step-num">1</span> Tap the <strong>Share</strong> icon <strong>⎋</strong> in Safari (or Menu ⋮ in Chrome).</div>
          <div class="ios-step"><span class="step-num">2</span> Scroll down and tap <strong>Add to Home Screen ⊞</strong>.</div>
          <div class="ios-step"><span class="step-num">3</span> Open from your Home Screen for full immersion!</div>
        </div>
        <button id="ios-install-ok" class="parchment-btn primary-btn" style="margin-top: 18px; width: 100%;">Understood</button>
      </div>
    `;
    document.body.appendChild(this.iosInstallModal);

    // Setup button listeners
    this.setupListeners();
  }

  setupListeners() {
    // Journal toggle
    document.getElementById('btn-journal').addEventListener('click', () => {
      this.toggleJournal();
    });
    document.getElementById('journal-close-btn').addEventListener('click', () => {
      this.journalModal.classList.add('hidden');
    });

    // Audio toggle / init
    const btnAudio = document.getElementById('btn-audio');
    btnAudio.addEventListener('click', () => {
      sounds.ensureContext();
      if (!sounds.bgmPlaying) {
        sounds.startMusic();
        btnAudio.innerText = "🔊";
      } else {
        sounds.isMuted = !sounds.isMuted;
        btnAudio.innerText = sounds.isMuted ? "🔇" : "🔊";
      }
    });

    // Help modal
    document.getElementById('btn-help').addEventListener('click', () => {
      this.helpModal.classList.remove('hidden');
    });
    document.getElementById('help-close-btn').addEventListener('click', () => {
      this.helpModal.classList.add('hidden');
    });
    document.getElementById('help-btn-ok').addEventListener('click', () => {
      this.helpModal.classList.add('hidden');
    });

    // Fullscreen toggle
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Fullscreen error", err);
        });
      } else {
        document.exitFullscreen();
      }
    });

    // Install Button handler
    const btnInstall = document.getElementById('btn-install');
    btnInstall.addEventListener('click', () => {
      if (this.onInstallHandler) {
        this.onInstallHandler();
      } else {
        this.showIOSInstallTip();
      }
    });

    document.getElementById('ios-install-close').addEventListener('click', () => {
      this.iosInstallModal.classList.add('hidden');
    });
    document.getElementById('ios-install-ok').addEventListener('click', () => {
      this.iosInstallModal.classList.add('hidden');
    });

    // Check if on mobile device to show install button if not standalone
    const isStandalone = ('standalone' in navigator && navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) {
      btnInstall.classList.remove('hidden');
    }

    // Reward modal close
    document.getElementById('reward-btn-continue').addEventListener('click', () => {
      this.rewardModal.classList.add('hidden');
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.toggleJournal();
      } else if (e.key === 'Escape') {
        this.journalModal.classList.add('hidden');
        this.dialogueModal.classList.add('hidden');
        this.helpModal.classList.add('hidden');
        this.rewardModal.classList.add('hidden');
      }
    });
  }

  showNotification(msg) {
    this.notifEl.innerText = msg;
    this.notifEl.classList.add('show');
    clearTimeout(this._notifTimeout);
    this._notifTimeout = setTimeout(() => {
      this.notifEl.classList.remove('show');
    }, 4000);
  }

  updateFaithBar(current, max) {
    const fill = document.getElementById('faith-bar-fill');
    if (fill) {
      const pct = Math.max(0, Math.min(100, (current / max) * 100));
      fill.style.width = `${pct}%`;
    }
  }

  updateCompass(cameraAngle) {
    const needle = document.getElementById('compass-needle');
    if (needle) {
      needle.style.transform = `rotate(${-cameraAngle}rad)`;
    }
  }

  updateQuestHUD(quest) {
    const tracker = document.getElementById('quest-tracker');
    if (!tracker) return;

    if (!quest || (quest.status !== 'active' && quest.status !== 'ready')) {
      tracker.classList.add('hidden');
      return;
    }

    tracker.classList.remove('hidden');
    const titleEl = document.getElementById('qt-title');
    const refEl = document.getElementById('qt-ref');
    const objEl = document.getElementById('qt-obj');
    if (titleEl) titleEl.innerText = quest.title;
    if (refEl) refEl.innerText = quest.scriptureRef || '';
    if (objEl) objEl.innerText = quest.objective;

    const badgeEl = tracker.querySelector('.quest-tracker-badge');
    if (badgeEl) {
      if (quest.status === 'ready') {
        badgeEl.innerText = 'MISSION READY TO COMPLETE';
        badgeEl.classList.add('ready');
      } else {
        badgeEl.innerText = 'ACTIVE MISSION';
        badgeEl.classList.remove('ready');
      }
    }

    const progressEl = document.getElementById('qt-progress');
    if (progressEl) {
      if (quest.targetCount > 1) {
        progressEl.style.display = 'block';
        progressEl.innerText = `Progress: ${quest.currentCount} / ${quest.targetCount}`;
      } else {
        progressEl.style.display = 'none';
      }
    }
  }

  showInteractionPrompt(data) {
    const prompt = document.getElementById('interaction-prompt');
    if (!prompt) return;

    if (typeof data === 'string') {
      prompt.innerHTML = `
        <span class="prompt-icon">💬</span>
        <span class="prompt-action">${data}</span>
      `;
    } else {
      prompt.innerHTML = `
        <span class="prompt-icon">${data.icon || '💬'}</span>
        <span class="prompt-action">${data.action}</span>
        <strong class="prompt-target">${data.target}</strong>
      `;
    }
    prompt.classList.add('visible');
    
    const touchBtn = document.getElementById('btn-touch-interact');
    if (touchBtn) touchBtn.classList.add('pulse');
  }

  hideInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) prompt.classList.remove('visible');

    const touchBtn = document.getElementById('btn-touch-interact');
    if (touchBtn) touchBtn.classList.remove('pulse');
  }

  formatDialogueText(text) {
    // Style quoted scripture & direct speech with warm glowing quotes
    return text.replace(/['"]([^'"]+)['"]/g, '<span class="scripture-quote">“$1”</span>');
  }

  openDialogue({ npc, lines, type = 'greeting', quest = null, onAccept, onDecline, onComplete }) {
    this.dialogueModal.classList.remove('hidden');

    const avatarMap = {
      simeon: '👴',
      martha: '👩',
      caleb: '🧑‍🌾'
    };
    const avatarEl = document.getElementById('dialogue-avatar');
    if (avatarEl) avatarEl.innerText = avatarMap[npc.id] || '📜';

    document.getElementById('dialogue-name').innerText = npc.name;
    document.getElementById('dialogue-title').innerText = npc.title;

    let lineIndex = 0;
    let isTyping = false;
    const dialogueBox = document.getElementById('dialogue-box');
    const textEl = document.getElementById('dialogue-text');
    const cardEl = document.getElementById('dialogue-quest-card');
    const counterEl = document.getElementById('dialogue-counter');
    const actionsEl = document.getElementById('dialogue-actions');
    const hintEl = document.getElementById('dialogue-hint');

    const renderButtons = () => {
      actionsEl.innerHTML = '';
      const isLast = lineIndex === lines.length - 1;

      if (!isLast) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'parchment-btn primary-btn';
        nextBtn.innerText = 'Continue ❯';
        nextBtn.onclick = (e) => {
          e.stopPropagation();
          sounds.ensureContext();
          lineIndex++;
          showLine();
        };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'parchment-btn';
        closeBtn.innerText = 'Leave';
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          this.dialogueModal.classList.add('hidden');
          if (onDecline) onDecline();
        };

        actionsEl.appendChild(closeBtn);
        actionsEl.appendChild(nextBtn);
      } else {
        // Final line actions depending on dialogue type
        if (type === 'offer' && quest) {
          const acceptBtn = document.createElement('button');
          acceptBtn.className = 'parchment-btn primary-btn accept-quest-btn';
          acceptBtn.innerHTML = '✦ Accept Mission';
          acceptBtn.onclick = (e) => {
            e.stopPropagation();
            sounds.ensureContext();
            this.dialogueModal.classList.add('hidden');
            if (onAccept) onAccept();
          };

          const declineBtn = document.createElement('button');
          declineBtn.className = 'parchment-btn';
          declineBtn.innerText = 'Maybe Later';
          declineBtn.onclick = (e) => {
            e.stopPropagation();
            this.dialogueModal.classList.add('hidden');
            if (onDecline) onDecline();
          };

          actionsEl.appendChild(declineBtn);
          actionsEl.appendChild(acceptBtn);
        } else if (type === 'turn_in' && quest) {
          const claimBtn = document.createElement('button');
          claimBtn.className = 'parchment-btn primary-btn claim-reward-btn';
          claimBtn.innerHTML = 'Claim Sacred Scroll 📜';
          claimBtn.onclick = (e) => {
            e.stopPropagation();
            sounds.ensureContext();
            this.dialogueModal.classList.add('hidden');
            if (onComplete) onComplete();
          };

          actionsEl.appendChild(claimBtn);
        } else if (type === 'in_progress') {
          const okBtn = document.createElement('button');
          okBtn.className = 'parchment-btn primary-btn';
          okBtn.innerText = 'Understood ❯';
          okBtn.onclick = (e) => {
            e.stopPropagation();
            this.dialogueModal.classList.add('hidden');
          };
          actionsEl.appendChild(okBtn);
        } else {
          // Greeting
          const byeBtn = document.createElement('button');
          byeBtn.className = 'parchment-btn primary-btn';
          byeBtn.innerText = 'Farewell';
          byeBtn.onclick = (e) => {
            e.stopPropagation();
            this.dialogueModal.classList.add('hidden');
          };
          actionsEl.appendChild(byeBtn);
        }
      }
    };

    const finishLineImmediately = () => {
      if (!isTyping) return false;
      clearTimeout(this.typewriterTimeout);
      isTyping = false;
      const currentRawLine = lines[lineIndex];
      textEl.innerHTML = this.formatDialogueText(currentRawLine);

      if (lineIndex === lines.length - 1 && type === 'offer' && quest) {
        cardEl.classList.remove('hidden');
        cardEl.innerHTML = `
          <div class="quest-offer-box">
            <div class="qob-ribbon">📜 SACRED MISSION OFFER</div>
            <div class="qob-title">${quest.title}</div>
            <div class="qob-ref">📖 ${quest.scriptureRef || ''}</div>
            <div class="qob-obj">🎯 ${quest.objective}</div>
          </div>
        `;
      } else if (lineIndex === lines.length - 1 && type === 'turn_in' && quest) {
        cardEl.classList.remove('hidden');
        cardEl.innerHTML = `
          <div class="quest-turnin-box">
            <div class="qtb-ribbon">✨ MISSION ACCOMPLISHED</div>
            <div class="qtb-title">${quest.title}</div>
            <div class="qtb-sub">All objectives fulfilled faithfully in the name of the Lord.</div>
          </div>
        `;
      } else {
        cardEl.classList.add('hidden');
      }

      renderButtons();
      if (hintEl) hintEl.innerText = lineIndex < lines.length - 1 ? 'Tap Continue ❯' : '';
      return true;
    };

    // Tap dialogue body to instantly reveal full text
    dialogueBox.onclick = () => {
      if (isTyping) {
        finishLineImmediately();
      }
    };

    const showLine = () => {
      const line = lines[lineIndex];
      counterEl.innerText = `${lineIndex + 1} / ${lines.length}`;
      cardEl.classList.add('hidden');
      textEl.innerHTML = '';
      clearTimeout(this.typewriterTimeout);
      isTyping = true;
      if (hintEl) hintEl.innerText = 'Tap text to skip typing ▾';

      let charIdx = 0;
      const type = () => {
        if (!isTyping) return;
        if (charIdx < line.length) {
          textEl.innerText = line.slice(0, charIdx + 1);
          if (charIdx % 3 === 0) sounds.playDialogueBlip();
          charIdx++;
          this.typewriterTimeout = setTimeout(type, 16);
        } else {
          // Finished typing this line
          finishLineImmediately();
        }
      };
      type();
      renderButtons();
    };

    showLine();
  }

  showScrollUnlockedModal(scroll) {
    document.getElementById('reward-scroll-title').innerText = scroll.title;
    document.getElementById('reward-scroll-ref').innerText = scroll.reference;
    document.getElementById('reward-scroll-text').innerText = `"${scroll.text}"`;
    document.getElementById('reward-scroll-refl').innerText = scroll.reflection;
    this.rewardModal.classList.remove('hidden');
  }

  toggleJournal(scrolls = []) {
    if (this.journalModal.classList.contains('hidden')) {
      this.openJournal(scrolls);
    } else {
      this.journalModal.classList.add('hidden');
    }
  }

  openJournal(scrolls = []) {
    this.journalModal.classList.remove('hidden');
    const listEl = document.getElementById('journal-scroll-list');
    listEl.innerHTML = '';

    if (scrolls.length === 0) {
      listEl.innerHTML = '<div style="font-style: italic; color: #7a6345; margin-top: 15px;">No scrolls discovered yet. Speak with Elder Simeon in Bethany to begin your quest!</div>';
      return;
    }

    scrolls.forEach((sc, idx) => {
      const item = document.createElement('div');
      item.className = 'journal-scroll-item';
      item.innerHTML = `
        <span class="scroll-seal">📿</span>
        <div>
          <div class="item-title">${sc.title}</div>
          <div class="item-ref">${sc.reference}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        this.showJournalDetail(sc);
      });
      listEl.appendChild(item);
    });

    // Auto-select first scroll
    this.showJournalDetail(scrolls[0]);
  }

  showJournalDetail(sc) {
    const page = document.getElementById('journal-detail-page');
    page.innerHTML = `
      <div class="scroll-detail-header">
        <h2>${sc.title}</h2>
        <div class="scroll-detail-ref">${sc.reference}</div>
      </div>
      <div class="ornament-divider">❖ ❖ ❖</div>
      <blockquote class="scroll-detail-scripture">
        "${sc.text}"
      </blockquote>
      <div class="scroll-detail-sub">SPIRITUAL REFLECTION:</div>
      <div class="scroll-detail-reflection">
        ${sc.reflection}
      </div>
    `;
  }

  setupPWAInstall(onInstallClick) {
    this.onInstallHandler = onInstallClick;
    const btn = document.getElementById('btn-install');
    if (btn) {
      btn.classList.remove('hidden');
    }
  }

  showIOSInstallTip() {
    this.iosInstallModal.classList.remove('hidden');
  }

  hideInstallButton() {
    const btn = document.getElementById('btn-install');
    if (btn) {
      btn.classList.add('hidden');
    }
  }
}
