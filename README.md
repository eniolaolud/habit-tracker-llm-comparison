# Habit Tracker — Multi-LLM Code Generation Comparison  
*A technical evaluation using ChatGPT, Claude, and Gemini*

This project demonstrates how three modern Large Language Models (**ChatGPT**, **Claude**, and **Gemini**) independently generated a fully functional **Habit Tracker web application**, using identical requirements.

Each model produced its own complete version of the app:

- `index.html`
- `style.css`
- `app.js`

This repository compares their output in terms of **code quality**, **UI design**, **JavaScript logic**, **accuracy**, and **overall development experience**.

---

## Project Overview

Every LLM-generated Habit Tracker includes:

- Sidebar for adding and managing habits  
- Daily task checklist with checkboxes  
- Automatic daily streak calculation  
- LocalStorage for persistent data  
- Responsive UI layouts  
- Activity heatmap for the past 30 days  
- Independent implementation by each LLM  

This allows a direct and fair comparison of how each model handles the same engineering task.

---

## Project Structure

### ChatGPT Version
- `chatgpt-version/index.html`
- `chatgpt-version/style.css`
- `chatgpt-version/app.js`

### Claude Version
- `claude-version/index.html`
- `claude-version/style.css`
- `claude-version/app.js`

### Gemini Version
- `gemini-version/index.html`
- `gemini-version/style.css`
- `gemini-version/app.js`

### Documentation
- `llm-comparison-report.md`
- `README.md`
---

## LLMs Used

| Model | Strengths | Notes |
|-------|-----------|-------|
| **ChatGPT** | Most reliable JavaScript, fewest bugs, fastest generation | Best for logic-heavy tasks |
| **Claude** | Cleanest HTML structure, highly semantic, strong UI organization | Best for structured UI development |
| **Gemini** | Modern CSS, strong layout intuition, modular JS | Required minor bug fixes in heatmap logic |

A detailed analysis is available in:  
**[`llm-comparison-report.md`](./llm-comparison-report.md)**



## How to Run Locally

1. Clone the repo:
   git clone https://github.com/eniolaolud/habit-tracker-llm-comparison

2. Open any of the HTML files in your browser:
   - chatgpt-version/index.html
   - claude-version/index.html
   - gemini-version/index.html

3. The app will load immediately — no installation required.

## Purpose of the project
This project demonstrates:

- Practical evaluation of multiple LLMs using identical engineering requirements  
- Differences in structure, design, and logic across three models  
- A complete AI-assisted frontend app built independently by each LLM  
- Real-world engineering decision-making and LLM orchestration  
- Useful comparison for research, hiring, and rapid prototyping  

---

## Key Technologies

- HTML5  
- CSS3 (modern responsive UI)  
- JavaScript (localStorage & frontend logic)  
- LocalStorage API  
- Three LLMs for code generation (ChatGPT, Claude, Gemini)  

---

## Documentation

Full technical analysis is available here:

👉 **[llm-comparison-report.md](./llm-comparison-report.md)**

---

## Author

**Eniola Oludayo**  
AI-assisted development • Frontend engineering • LLM systems

Feel free to reach out for collaboration or feedback.

---

## Support

If you found this project helpful, please consider giving the repository a star!
