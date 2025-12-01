/* app.js
   Habit Tracker - connects to semantic HTML + style.css
   - Stores habits + completions in localStorage
   - Renders sidebar, today's checklist, streaks, and heatmap
*/

/* -------------------------
   Utilities
   ------------------------- */
const LS_KEY = 'habit-tracker:v1';
const DATE_FORMAT = (d = new Date()) => d.toISOString().slice(0, 10); // YYYY-MM-DD

const storageRead = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : { habits: [] };
  } catch (e) {
    console.error('Failed to read storage', e);
    return { habits: [] };
  }
};

const storageWrite = (data) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write storage', e);
  }
};

const uid = () => 'h_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* date helpers */
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return DATE_FORMAT(d);
};

const daysBetween = (start, end) => {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
  return diff;
};

/* -------------------------
   App State & DOM refs
   ------------------------- */
let state = storageRead(); // { habits: [ { id, name, createdAt, completions: { 'YYYY-MM-DD': true }, lastCompletedDate, streak } ] }

const refs = {
  addForm: document.querySelector('.add-habit-form'),
  addInput: document.querySelector('.habit-input'),
  sidebarList: document.querySelector('.habit-list-items'),
  todayChecklist: document.querySelector('.habit-checklist'),
  heatmap: document.querySelector('.calendar-heatmap'),
  dateDisplay: document.querySelector('.date-display'),
  streakDisplay: document.querySelector('.streak-display')
};

/* -------------------------
   Persistence helpers
   ------------------------- */
const saveState = () => {
  storageWrite(state);
};

/* -------------------------
   Habit CRUD
   ------------------------- */
function createHabit(name) {
  const now = DATE_FORMAT();
  return {
    id: uid(),
    name: (name || '').trim(),
    createdAt: now,
    completions: {}, // { 'YYYY-MM-DD': true }
    lastCompletedDate: null,
    streak: 0
  };
}

function addHabit(name) {
  if (!name || !name.trim()) return null;
  const h = createHabit(name);
  state.habits.push(h);
  saveState();
  render();
  return h;
}

function removeHabit(habitId) {
  state.habits = state.habits.filter(h => h.id !== habitId);
  saveState();
  render();
}

/* -------------------------
   Completion toggles & streaks
   ------------------------- */
function isCompletedOn(habit, dateStr) {
  return Boolean(habit.completions && habit.completions[dateStr]);
}

function setCompletion(habitId, dateStr, completed) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  habit.completions = habit.completions || {};
  if (completed) {
    habit.completions[dateStr] = true;
    habit.lastCompletedDate = dateStr;
  } else {
    delete habit.completions[dateStr];
    // update lastCompletedDate to latest existing date or null
    const keys = Object.keys(habit.completions || {}).sort().reverse();
    habit.lastCompletedDate = keys.length ? keys[0] : null;
  }
  habit.streak = calculateHabitStreak(habit);
  saveState();
  render(); // re-render everything that depends on completions
}

/* Calculate consecutive-day streak ending today (includes today if completed) */
function calculateHabitStreak(habit) {
  const comps = habit.completions || {};
  if (!comps || Object.keys(comps).length === 0) return 0;
  let streak = 0;
  let d = DATE_FORMAT(); // start from today
  while (true) {
    if (comps[d]) {
      streak++;
      d = addDays(d, -1);
    } else {
      break;
    }
  }
  return streak;
}

/* Recalculate every habit's streaks (useful on load) */
function recalcAllStreaks() {
  state.habits.forEach(h => {
    h.streak = calculateHabitStreak(h);
    // update lastCompletedDate if missing
    const keys = Object.keys(h.completions || {}).sort().reverse();
    h.lastCompletedDate = keys.length ? keys[0] : null;
  });
  saveState();
}

/* -------------------------
   Rendering
   ------------------------- */
function formatDateDisplay(dateStr) {
  // Nice readable date like "November 30, 2025"
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderDateAndStreak() {
  const today = DATE_FORMAT();
  if (refs.dateDisplay) refs.dateDisplay.textContent = formatDateDisplay(today);

  // total streak shown in top bar - we choose to show sum of current streaks across habits
  const totalStreak = state.habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  if (refs.streakDisplay) {
    // update textual display content
    refs.streakDisplay.textContent = `Streak: ${totalStreak} day${totalStreak === 1 ? '' : 's'}`;

    // re-append streak pill (keeps visual bar pseudo elements working)
    const pill = document.createElement('span');
    pill.className = 'streak-pill';
    pill.textContent = `${state.habits.length ? state.habits.reduce((mx, h) => Math.max(mx, h.streak || 0), 0) : 0} max`;
    refs.streakDisplay.appendChild(pill);

    // update CSS var for visual bar (we compute percent based on average streak vs 30 days)
    const avgStreak = state.habits.length ? (state.habits.reduce((a, b) => a + (b.streak || 0), 0) / state.habits.length) : 0;
    // clamp percent 0..1 assuming 30 days as "full"
    const percent = Math.max(0, Math.min(1, avgStreak / 30));
    document.documentElement.style.setProperty('--streak-percent', String(percent));
  }
}

function renderSidebar() {
  const ul = refs.sidebarList;
  if (!ul) return;
  ul.innerHTML = '';

  state.habits.forEach(habit => {
    const li = document.createElement('li');
    li.className = 'habit-item';
    li.dataset.id = habit.id;
    li.tabIndex = 0;
    li.title = habit.name;
    li.textContent = habit.name;

    // optional: right-click to remove
    li.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (confirm(`Remove habit "${habit.name}"?`)) {
        removeHabit(habit.id);
      }
    });

    // clicking highlights (simple)
    li.addEventListener('click', () => {
      const currently = ul.querySelector('.habit-item.active');
      if (currently) currently.classList.remove('active');
      li.classList.add('active');
    });

    ul.appendChild(li);
  });
}

function renderTodayChecklist() {
  const ul = refs.todayChecklist;
  if (!ul) return;
  ul.innerHTML = '';

  const today = DATE_FORMAT();
  // Render each habit with a checkbox
  state.habits.forEach(habit => {
    const li = document.createElement('li');
    li.className = 'check-item';

    const label = document.createElement('label');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'check-input';
    input.dataset.id = habit.id;
    input.checked = isCompletedOn(habit, today);
    input.setAttribute('aria-label', `Complete ${habit.name} for today`);

    // animate on change
    input.addEventListener('change', (e) => {
      const checked = e.target.checked;
      // set completion in storage
      setCompletion(habit.id, today, checked);
      // quick animation
      e.target.classList.add('checked-animate');
      setTimeout(() => e.target.classList.remove('checked-animate'), 350);
    });

    const text = document.createElement('span');
    text.textContent = habit.name;

    // small streak indicator
    const small = document.createElement('span');
    small.className = 'small';
    small.style.marginLeft = 'auto';
    small.textContent = `${habit.streak || 0} 🔥`;

    label.appendChild(input);
    label.appendChild(text);
    label.appendChild(small);
    li.appendChild(label);
    ul.appendChild(li);
  });

  // If no habits, show a placeholder
  if (state.habits.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'small';
    placeholder.textContent = 'No habits yet — add one in the sidebar.';
    const li = document.createElement('li');
    li.className = 'check-item';
    li.appendChild(placeholder);
    ul.appendChild(li);
  }
}

/* Heatmap: build past N days grid and color based on % of habits completed that day */
function generateHeatmap(days = 90) {
  const container = refs.heatmap;
  if (!container) return;
  container.innerHTML = '';
  if (days <= 0) return;

  // Build array of date strings ending today
  const today = DATE_FORMAT();
  const start = addDays(today, -(days - 1));
  const dates = [];
  for (let i = 0; i < days; i++) {
    dates.push(addDays(start, i));
  }

  // For each date compute completion ratio across habits
  const totalHabits = state.habits.length || 0;

  dates.forEach(dateStr => {
    const d = document.createElement('div');
    d.className = 'day';
    d.dataset.date = dateStr;
    d.title = dateStr;
    // calculate how many habits completed on this date
    let completedCount = 0;
    state.habits.forEach(h => {
      if (h.completions && h.completions[dateStr]) completedCount++;
    });

    let level = 0;
    if (totalHabits === 0) {
      level = 0;
    } else {
      const pct = completedCount / totalHabits;
      if (pct === 0) level = 0;
      else if (pct > 0 && pct <= 0.33) level = 1;
      else if (pct > 0.33 && pct <= 0.66) level = 2;
      else level = 3;
    }

    d.classList.add(`level-${level}`);

    // show tooltip info via title (completions / total)
    d.title = `${dateStr} — ${completedCount}/${totalHabits} habit${totalHabits === 1 ? '' : 's'} done`;

    // clicking a heatmap day toggles completions for today? we'll toggle all habits as a convenience:
    d.addEventListener('click', () => {
      // Toggle: if date already full (level 3), clear completions for that date; otherwise mark all habits completed for that date.
      if (level === 3) {
        // clear for all habits
        state.habits.forEach(h => {
          if (h.completions && h.completions[dateStr]) {
            delete h.completions[dateStr];
          }
        });
      } else {
        state.habits.forEach(h => {
          h.completions = h.completions || {};
          h.completions[dateStr] = true;
        });
      }
      // recompute streaks & re-render
      recalcAllStreaks();
      render();
    });

    container.appendChild(d);
  });
}

/* Render everything */
function render() {
  renderDateAndStreak();
  renderSidebar();
  renderTodayChecklist();
  generateHeatmap(90);
}

/* -------------------------
   Load on init
   ------------------------- */
function loadState() {
  state = storageRead();
  // normalize state shape
  if (!Array.isArray(state.habits)) state.habits = [];
  // ensure completions objects exist
  state.habits.forEach(h => {
    if (!h.completions || typeof h.completions !== 'object') h.completions = {};
    if (typeof h.streak !== 'number') h.streak = calculateHabitStreak(h);
  });
  recalcAllStreaks();
}

/* -------------------------
   Event wiring
   ------------------------- */
function attachEvents() {
  if (refs.addForm) {
    refs.addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = refs.addInput.value.trim();
      if (!val) return;
      addHabit(val);
      refs.addInput.value = '';
      refs.addInput.focus();
    });
  }

  // keyboard: Enter on habit input also handled by form submit
  // Optional: support clearing storage for debugging with Ctrl+Alt+R
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r') {
      if (confirm('Reset all habits and data?')) {
        localStorage.removeItem(LS_KEY);
        state = { habits: [] };
        render();
      }
    }
  });
}

/* -------------------------
   Boot
   ------------------------- */
function init() {
  loadState();
  attachEvents();
  render();

  // small accessibility: focus input if none
  if (state.habits.length === 0 && refs.addInput) refs.addInput.focus();
}

// run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
