// State management
let habits = [];
let completions = {};
let currentDate = new Date().toISOString().split('T')[0];

// Initialize app
function init() {
    loadData();
    updateDateDisplay();
    renderHabitsList();
    renderTodayHabits();
    renderCalendar();
    updateStreak();
    attachEventListeners();
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('habitTrackerData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            habits = data.habits || [];
            completions = data.completions || {};
        } catch (error) {
            console.error('Error loading data:', error);
            habits = [];
            completions = {};
        }
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('habitTrackerData', JSON.stringify({
            habits,
            completions
        }));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Update date display in header
function updateDateDisplay() {
    const dateEl = document.querySelector('.date-display');
    if (dateEl) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = today.toLocaleDateString('en-US', options);
    }
}

// Render habits list in sidebar
function renderHabitsList() {
    const listEl = document.getElementById('habits-list');
    if (!listEl) return;

    if (habits.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">Add your first habit to get started</div>
            </div>
        `;
        return;
    }

    listEl.innerHTML = habits.map((habit, index) => `
        <div class="habit-item" data-index="${index}">
            <span class="habit-name">${escapeHtml(habit)}</span>
            <button class="delete-habit" data-index="${index}">×</button>
        </div>
    `).join('');

    // Attach delete event listeners
    listEl.querySelectorAll('.delete-habit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteHabit(index);
        });
    });
}

// Render today's habits with checkboxes
function renderTodayHabits() {
    const todayEl = document.getElementById('today-habits');
    if (!todayEl) return;

    if (habits.length === 0) {
        todayEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <div class="empty-state-text">No habits yet. Add one to begin tracking!</div>
            </div>
        `;
        return;
    }

    if (!completions[currentDate]) {
        completions[currentDate] = {};
    }

    todayEl.innerHTML = habits.map((habit, index) => {
        const isCompleted = completions[currentDate][index] || false;
        return `
            <div class="habit-checkbox-item ${isCompleted ? 'completed' : ''}" data-index="${index}">
                <input type="checkbox" class="habit-checkbox" id="habit-${index}" ${isCompleted ? 'checked' : ''} data-index="${index}">
                <label class="habit-label" for="habit-${index}">${escapeHtml(habit)}</label>
            </div>
        `;
    }).join('');

    // Attach checkbox event listeners
    todayEl.querySelectorAll('.habit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = parseInt(checkbox.dataset.index);
            toggleHabit(index);
        });
    });
}

// Add new habit
function addHabit(habitName) {
    const trimmedName = habitName.trim();
    if (!trimmedName) return false;

    habits.push(trimmedName);
    saveData();
    renderHabitsList();
    renderTodayHabits();
    renderCalendar();
    return true;
}

// Delete habit
function deleteHabit(index) {
    if (!confirm('Delete this habit? This will remove all tracking history for this habit.')) {
        return;
    }

    habits.splice(index, 1);

    // Reindex completions for all dates
    Object.keys(completions).forEach(date => {
        const newCompletions = {};
        Object.keys(completions[date]).forEach(i => {
            const idx = parseInt(i);
            if (idx < index) {
                newCompletions[idx] = completions[date][idx];
            } else if (idx > index) {
                newCompletions[idx - 1] = completions[date][idx];
            }
        });
        completions[date] = newCompletions;
    });

    saveData();
    renderHabitsList();
    renderTodayHabits();
    renderCalendar();
    updateStreak();
}

// Toggle habit completion
function toggleHabit(index) {
    if (!completions[currentDate]) {
        completions[currentDate] = {};
    }
    
    completions[currentDate][index] = !completions[currentDate][index];
    saveData();
    renderTodayHabits();
    updateStreak();
    renderCalendar();
}

// Calculate and update streak
function updateStreak() {
    const streakEl = document.getElementById('streak-number');
    if (!streakEl) return;

    if (habits.length === 0) {
        streakEl.textContent = '0';
        return;
    }

    let streak = 0;
    let checkDate = new Date();

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayCompletions = completions[dateStr];

        // If no completions for this day, check if it's today or future
        if (!dayCompletions || Object.keys(dayCompletions).length === 0) {
            // If it's today or future, don't break streak yet
            const today = new Date().toISOString().split('T')[0];
            if (dateStr >= today) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }

        // Count completed habits for this day
        const completedCount = Object.values(dayCompletions).filter(v => v).length;
        
        // If no habits were completed, break streak
        if (completedCount === 0) {
            break;
        }

        // Check if all habits were completed
        if (completedCount === habits.length) {
            streak++;
        } else {
            // Partial completion doesn't break streak but doesn't count
            // Only break if it's not today
            const today = new Date().toISOString().split('T')[0];
            if (dateStr < today) {
                break;
            }
        }

        checkDate.setDate(checkDate.getDate() - 1);
    }

    streakEl.textContent = streak;
}

// Render calendar heatmap
function renderCalendar() {
    const calendarEl = document.getElementById('calendar-heatmap');
    if (!calendarEl) return;

    const today = new Date();
    const days = [];

    // Generate last 28 days (4 weeks)
    for (let i = 27; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        days.push(date);
    }

    calendarEl.innerHTML = days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayCompletions = completions[dateStr] || {};
        const completedCount = Object.values(dayCompletions).filter(v => v).length;
        const totalHabits = habits.length;

        let level = 0;
        if (totalHabits > 0 && completedCount > 0) {
            const percentage = completedCount / totalHabits;
            if (percentage >= 1) {
                level = 4;
            } else if (percentage >= 0.75) {
                level = 3;
            } else if (percentage >= 0.5) {
                level = 2;
            } else {
                level = 1;
            }
        }

        const dayNumber = date.getDate();
        return `<div class="calendar-day level-${level}" title="${dateStr}: ${completedCount}/${totalHabits} completed">${dayNumber}</div>`;
    }).join('');
}

// Attach event listeners
function attachEventListeners() {
    const form = document.getElementById('add-habit-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('habit-input');
            if (input) {
                const habitName = input.value;
                if (addHabit(habitName)) {
                    input.value = '';
                }
            }
        });
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
