// --- Configuration ---
const STORAGE_KEYS = {
    HABITS: 'habitTracker_habits',
    COMPLETIONS: 'habitTracker_completions'
};

// --- Global State ---
let habits = []; // Array of { id: string, name: string }
let completions = {}; // Object of { habitId: { dateKey: boolean, ... } }

// --- DOM Element References ---
const DOMElements = {
    dateTitle: document.getElementById('date-title'),
    streakValue: document.getElementById('streak-value'),
    habitCreationForm: document.getElementById('habit-creation-form'),
    habitNameInput: document.getElementById('habit-name-input'),
    habitList: document.getElementById('habit-list'),
    taskListContainer: document.getElementById('task-list-container'),
    heatmapVisualization: document.getElementById('heatmap-visualization'),
};

// --- Utility Functions ---

/** Generates a unique ID (simple UUID style) */
const generateId = () => {
    return 'h' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
};

/** Gets today's date key (YYYY-MM-DD) */
const getTodayDateKey = () => {
    return new Date().toISOString().slice(0, 10);
};

/**
 * Calculates the consecutive days streak where ALL active habits were completed.
 * @returns {number} The current streak length.
 */
const calculateStreak = () => {
    const today = getTodayDateKey();
    let streak = 0;
    
    // If no habits exist, streak is 0
    if (habits.length === 0) return 0;

    let checkDate = new Date();
    
    // Check backwards from today
    for (let i = 0; i < 365; i++) {
        const dateKey = checkDate.toISOString().slice(0, 10);
        
        // Determine if ALL habits were completed on this date
        const allCompleted = habits.every(habit => {
            return completions[habit.id] && completions[habit.id][dateKey] === true;
        });

        if (allCompleted) {
            streak++;
        } else if (i > 0) {
            // Streak broken, stop checking unless it's the current day (i=0)
            break;
        }

        // Move to the previous day
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Special case: if today was not completed, but yesterday was, the streak is 1.
        if (i === 0 && !allCompleted) {
            break;
        }
    }
    
    return streak;
};

// --- Storage Functions (localStorage) ---

/** Loads habits and completions from localStorage. */
const loadData = () => {
    try {
        const savedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
        const savedCompletions = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
        
        habits = savedHabits ? JSON.parse(savedHabits) : [];
        completions = savedCompletions ? JSON.parse(savedCompletions) : {};
    } catch (e) {
        console.error("Error loading data from localStorage:", e);
        habits = [];
        completions = {};
    }
};

/** Saves current habits and completions to localStorage. */
const saveData = () => {
    try {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
        localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
    }
};

// --- Rendering Functions ---

/** Updates the streak display. */
const renderStreak = (streak) => {
    DOMElements.streakValue.textContent = `${streak} Days`;
};

/**
 * Renders the habit list (sidebar) and today's tasks (main area).
 */
const renderHabits = () => {
    DOMElements.habitList.innerHTML = '';
    DOMElements.taskListContainer.innerHTML = '';
    const todayKey = getTodayDateKey();

    if (habits.length === 0) {
        DOMElements.habitList.innerHTML = '<li>No habits added yet.</li>';
        DOMElements.taskListContainer.innerHTML = '<p>Add a habit on the left to get started!</p>';
        return;
    }

    habits.forEach(habit => {
        const isCompleted = completions[habit.id] && completions[habit.id][todayKey] === true;

        // 1. Render Sidebar Item
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${habit.name}</span><button data-habit-id="${habit.id}">Edit</button>`;
        // Note: Actual Edit/Delete functionality is beyond this scope but structure is ready.
        DOMElements.habitList.appendChild(listItem);

        // 2. Render Today's Task Card
        const cardDiv = document.createElement('div');
        cardDiv.id = `task-card-${habit.id}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `task-${habit.id}`;
        checkbox.checked = isCompleted;
        checkbox.dataset.habitId = habit.id;
        checkbox.addEventListener('change', handleToggleCompletion);

        const label = document.createElement('label');
        label.htmlFor = `task-${habit.id}`;
        label.textContent = habit.name;

        cardDiv.appendChild(checkbox);
        cardDiv.appendChild(label);
        DOMElements.taskListContainer.appendChild(cardDiv);

        // Apply completion style based on checkbox state (CSS handles the line-through)
    });

    renderStreak(calculateStreak());
};

/**
 * Renders the 30-day calendar heatmap.
 */
const renderHeatmap = () => {
    DOMElements.heatmapVisualization.innerHTML = '';
    
    // We only need the legend placeholder text to remain
    const legend = document.getElementById('heatmap-legend');
    if (legend && legend.parentNode) {
        legend.parentNode.removeChild(legend);
    }

    const today = new Date();
    
    // Generate the last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toISOString().slice(0, 10);
        
        let completedCount = 0;
        
        // Count how many habits were completed on this specific day
        habits.forEach(habit => {
            if (completions[habit.id] && completions[habit.id][dateKey] === true) {
                completedCount++;
            }
        });

        // Calculate progress (0 to 1)
        const totalHabits = habits.length > 0 ? habits.length : 1;
        const progress = completedCount / totalHabits;
        
        let level = 0;
        if (progress > 0 && progress <= 0.33) {
            level = 1; // Low
        } else if (progress > 0.33 && progress <= 0.66) {
            level = 2; // Medium
        } else if (progress > 0.66) {
            level = 3; // High
        }

        const cell = document.createElement('div');
        // The CSS will define the styling for these levels (e.g., .level-3 background color)
        cell.className = `level-${level}`; 
        cell.title = `${dateKey}: ${completedCount}/${totalHabits} habits completed`;
        DOMElements.heatmapVisualization.appendChild(cell);
    }
    
    // Re-append the legend after generation
    if (legend) {
        DOMElements.heatmapVisualization.appendChild(legend);
    }
};

// --- Event Handlers ---

/**
 * Handles adding a new habit from the form.
 */
const handleNewHabit = (event) => {
    event.preventDefault();
    const name = DOMElements.habitNameInput.value.trim();
    
    if (name) {
        const newHabit = {
            id: generateId(),
            name: name
        };
        
        habits.push(newHabit);
        completions[newHabit.id] = {}; // Initialize completions for the new habit
        
        saveData();
        renderHabits();
        renderHeatmap();
        DOMElements.habitNameInput.value = ''; // Clear input
    }
};

/**
 * Handles checking/unchecking a habit completion.
 */
const handleToggleCompletion = (event) => {
    const checkbox = event.target;
    const habitId = checkbox.dataset.habitId;
    const isChecked = checkbox.checked;
    const todayKey = getTodayDateKey();

    if (!completions[habitId]) {
        completions[habitId] = {};
    }

    // Set or unset completion status for today
    completions[habitId][todayKey] = isChecked;

    saveData();
    renderHabits(); // Re-render to update all UI (streak, other checkboxes)
    renderHeatmap();
};

/**
 * Sets the current date in the header.
 */
const setHeaderDate = () => {
    const today = new Date();
    DOMElements.dateTitle.textContent = `Today: ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
};

// --- Initialization ---

/**
 * Initializes the application.
 */
const init = () => {
    setHeaderDate();
    loadData();
    renderHabits();
    renderHeatmap();
    
    // Attach event listener for habit creation
    if (DOMElements.habitCreationForm) {
        DOMElements.habitCreationForm.addEventListener('submit', handleNewHabit);
    }
};

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
