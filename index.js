const CHOICES = ['rock', 'paper', 'scissors'];

const EMOJI = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
};

// beats[x] = what x beats
const BEATS = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
};

const RESULT_MESSAGES = {
    win: [
        'Crushing it! 🔥',
        'You dominate! 💪',
        'Flawless! 🎯',
        'Too easy for you! 😎',
    ],
    lose: [
        'CPU wins this one! 🤖',
        'Better luck next round!',
        'The machine is learning… 🧠',
        'Outsmarted! 😬',
    ],
    draw: [
        "Great minds think alike! 🤝",
        "It's a standoff!",
        "Perfect mirror! 🪞",
        "Neither budges!",
    ],
};

// Mutable game state
const state = {
    userScore: 0,
    cpuScore: 0,
    round: 1,
    history: [],   // [{round, user, cpu, result}]
    locked: false, // prevent clicks mid-animation
};

/* ══════════════════════════════════════════════
   DOM REFS
══════════════════════════════════════════════ */
const els = {
    scoreUser: document.getElementById('score-user'),
    scoreCpu: document.getElementById('score-cpu'),
    roundText: document.getElementById('round-text'),
    choiceBtns: document.querySelectorAll('.choice-btn'),
    userWrap: document.getElementById('user-emoji-wrap'),
    cpuWrap: document.getElementById('cpu-emoji-wrap'),
    thinking: document.getElementById('thinking'),
    resultBanner: document.getElementById('result-banner'),
    resultTitle: document.getElementById('result-title'),
    resultDesc: document.getElementById('result-desc'),
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),
    resetBtn: document.getElementById('reset-btn'),
};

/* ══════════════════════════════════════════════
   CORE GAME LOGIC
══════════════════════════════════════════════ */

/** Returns a random CPU choice */
function getCpuChoice() {
    return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

/** 
 * Determines winner.
 * Returns 'win' | 'lose' | 'draw' from the user's perspective.
 */
function getResult(user, cpu) {
    if (user === cpu) return 'draw';
    if (BEATS[user] === cpu) return 'win';
    return 'lose';
}

/** Returns a random message for a given result type */
function getRandomMessage(result) {
    const pool = RESULT_MESSAGES[result];
    return pool[Math.floor(Math.random() * pool.length)];
}

/** Returns a human-readable description of why user won/lost */
function getResultDescription(result, user, cpu) {
    if (result === 'draw') return `Both chose ${user} — it's a tie!`;
    if (result === 'win') return `${capitalize(user)} beats ${capitalize(cpu)}`;
    return `${capitalize(cpu)} beats ${capitalize(user)}`;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ══════════════════════════════════════════════
   UI UPDATES
══════════════════════════════════════════════ */

function animateScore(el, value) {
    el.textContent = value;
    el.classList.remove('score-animated');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('score-animated');
}

function setRoundText(text) {
    els.roundText.textContent = text;
}

function lockButtons(lock) {
    state.locked = lock;
    els.choiceBtns.forEach(btn => { btn.disabled = lock; });
}

function clearSelections() {
    els.choiceBtns.forEach(btn => {
        btn.className = 'choice-btn';
    });
}

function highlightButton(choice) {
    const btn = document.getElementById(`btn-${choice}`);
    if (btn) btn.classList.add(`selected-${choice}`);
}

function showThinking(show) {
    els.thinking.classList.toggle('active', show);
}

function hideResultBanner() {
    els.resultBanner.className = 'card' === '' ? '' : '';
    els.resultBanner.classList.remove('show', 'win', 'lose', 'draw');
    els.resultBanner.style.display = '';
}

function showResultBanner(result, user, cpu) {
    els.resultBanner.className = '';
    els.resultBanner.id = 'result-banner';
    els.resultBanner.classList.add('show', result);
    const labels = { win: '🎉 You Win!', lose: '💀 You Lose!', draw: '🤝 Draw!' };
    els.resultTitle.textContent = labels[result];
    els.resultDesc.textContent =
        getRandomMessage(result) + '  ·  ' + getResultDescription(result, user, cpu);
}

function setBattleEmoji(wrap, emoji, popAnim = false) {
    wrap.textContent = emoji;
    if (popAnim) {
        wrap.classList.remove('visible');
        void wrap.offsetWidth;
        wrap.classList.add('visible');
    }
}

function applyBattleGlow(result) {
    els.userWrap.classList.remove('winner-glow', 'loser-dim', 'shake');
    els.cpuWrap.classList.remove('winner-glow', 'loser-dim', 'shake');
    if (result === 'win') {
        els.userWrap.classList.add('winner-glow');
        els.cpuWrap.classList.add('loser-dim');
        void els.cpuWrap.offsetWidth;
        els.cpuWrap.classList.add('shake');
    } else if (result === 'lose') {
        els.cpuWrap.classList.add('winner-glow');
        els.userWrap.classList.add('loser-dim');
        void els.userWrap.offsetWidth;
        els.userWrap.classList.add('shake');
    }
}

/* ══════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════ */
function addHistoryEntry(entry) {
    state.history.unshift(entry);          // newest first
    if (state.history.length > 5) state.history.pop();
    renderHistory();
}

function renderHistory() {
    if (state.history.length === 0) {
        els.historyEmpty.style.display = 'block';
        els.historyList.innerHTML = '';
        els.historyList.appendChild(els.historyEmpty);
        return;
    }
    els.historyList.innerHTML = '';
    state.history.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.animationDelay = `${idx * 0.05}s`;
        div.innerHTML = `
        <span class="h-round">#${item.round}</span>
        <span class="h-emojis">
          ${EMOJI[item.user]}
          <span class="h-vs">vs</span>
          ${EMOJI[item.cpu]}
        </span>
        <span class="h-result ${item.result}">${item.result === 'win' ? 'Win' : item.result === 'lose' ? 'Lose' : 'Draw'}</span>
      `;
        els.historyList.appendChild(div);
    });
}

/* ══════════════════════════════════════════════
   CONFETTI (on win)
══════════════════════════════════════════════ */
const CONFETTI_COLORS = ['#818cf8', '#f472b6', '#38bdf8', '#4ade80', '#fbbf24', '#fb923c', '#a78bfa'];

function spawnConfetti(count = 36) {
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-particle';
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const x = Math.random() * 100;
        const dur = 1.2 + Math.random() * 1.2;
        const delay = Math.random() * 0.6;
        el.style.cssText = `
        left:${x}vw;
        background:${color};
        animation-duration:${dur}s;
        animation-delay:${delay}s;
        width:${6 + Math.random() * 6}px;
        height:${6 + Math.random() * 6}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), (dur + delay) * 1000 + 200);
    }
}

/* ══════════════════════════════════════════════
   MAIN PLAY FLOW
══════════════════════════════════════════════ */
async function play(userChoice) {
    if (state.locked) return;

    // 1. Lock UI & reset visual state
    lockButtons(true);
    clearSelections();
    hideResultBanner();
    els.userWrap.classList.remove('winner-glow', 'loser-dim', 'shake', 'visible');
    els.cpuWrap.classList.remove('winner-glow', 'loser-dim', 'shake', 'visible');

    // 2. Show user choice immediately
    highlightButton(userChoice);
    setBattleEmoji(els.userWrap, EMOJI[userChoice], true);
    setBattleEmoji(els.cpuWrap, '❓', false);
    setRoundText(`Round ${state.round} · CPU is thinking…`);

    // 3. Pretend CPU is "thinking" for suspense
    showThinking(true);
    await delay(700);
    showThinking(false);

    // 4. Determine result
    const cpuChoice = getCpuChoice();
    const result = getResult(userChoice, cpuChoice);

    // 5. Reveal CPU choice with animation
    setBattleEmoji(els.cpuWrap, EMOJI[cpuChoice], true);
    await delay(350);

    // 6. Apply glow / dim to battle emojis
    applyBattleGlow(result);
    await delay(200);

    // 7. Show result banner
    showResultBanner(result, userChoice, cpuChoice);

    // 8. Update scores
    if (result === 'win') {
        state.userScore++;
        animateScore(els.scoreUser, state.userScore);
        spawnConfetti(32);
    } else if (result === 'lose') {
        state.cpuScore++;
        animateScore(els.scoreCpu, state.cpuScore);
    }

    // 9. Update history
    addHistoryEntry({ round: state.round, user: userChoice, cpu: cpuChoice, result });
    state.round++;
    setRoundText(`Round ${state.round} · Make your choice`);

    // 10. Unlock buttons after brief pause
    await delay(450);
    lockButtons(false);
}

/* ══════════════════════════════════════════════
   RESET
══════════════════════════════════════════════ */
function resetGame() {
    state.userScore = 0;
    state.cpuScore = 0;
    state.round = 1;
    state.history = [];
    state.locked = false;

    els.scoreUser.textContent = '0';
    els.scoreCpu.textContent = '0';
    setRoundText('Round 1 · Make your choice');

    clearSelections();
    lockButtons(false);
    hideResultBanner();

    setBattleEmoji(els.userWrap, '❓', false);
    setBattleEmoji(els.cpuWrap, '❓', false);
    els.userWrap.classList.remove('winner-glow', 'loser-dim', 'shake', 'visible');
    els.cpuWrap.classList.remove('winner-glow', 'loser-dim', 'shake', 'visible');

    showThinking(false);
    renderHistory();
}

/* ══════════════════════════════════════════════
   UTILITY
══════════════════════════════════════════════ */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ══════════════════════════════════════════════
   EVENT LISTENERS
══════════════════════════════════════════════ */
els.choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => play(btn.dataset.choice));
});

els.resetBtn.addEventListener('click', resetGame);

// Keyboard shortcuts: R, P, S keys
document.addEventListener('keydown', (e) => {
    if (state.locked) return;
    const map = { r: 'rock', p: 'paper', s: 'scissors' };
    const choice = map[e.key.toLowerCase()];
    if (choice) play(choice);
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
renderHistory();