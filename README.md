# Incident Analysis & Replay

## How to Start the Project

1. **Steps:**
   - Install dependencies: `bundle install`
   - Set up the database: `rails db:setup`
   - Run the start script: `chmod +x start.sh && ./start.sh`

The backend runs on port 3000 by default, and the frontend on port 5173.

---

## How to Simulate the Replay

1. Go to the dashboard in the frontend UI.
2. Navigate to the dashboard by pressing the button on the landing page.
3. You can paste in a transcript by pressing the button on the dashboard, bringing up an interactive modal.
4. Pressing submit will lead you to the analysis page.
5. Press **Play** to start the incident replay. Transcript messages and AI suggestions will appear in real time.

---

## Decisions

- **Tech Stack:** Ruby on Rails for the backend and React + Tailwind for the frontend for a modern and flexible UI.
- **Prompt Engineering & Deduplication:**
  - Used Gemini (Google LLM) to generate suggestions.
  - **Prompting Techniques:**
    - Strict prompt rules: The LLM prompt explicitly asks Gemini to avoid duplicates, near-duplicates, rephrasings, and to only return unique, actionable suggestions.
    - Good/Bad examples: The prompt includes clear examples of correct and incorrect output formats to reduce malformed data.
    - Context passing: The backend passes all previous suggestions and the last several transcript messages to Gemini for context, so it can avoid repeating itself and generate relevant and unique suggestions.
    - Fuzzy matching: After LLM generation, suggestions go through another stage of deduplication using fuzzy string matching to catch literal duplicates.
- **Real-Time UX:** Implemented polling and autoscroll for a live and responsive feel. Timeline and transcript are visible for context.
- **UI/UX:** Prioritized clarity, accessibility, and speed. Added keyboard shortcuts and clear color coding for suggestion types.

---

## What I'd'd Add or Improve With More Time

- **Websockets:** Replace polling with real-time updates via websockets for even faster UI feedback.
- **Semantic Deduplication:** Integrate embeddings for even better semantic duplicate detection.
- **Testing:** Add more automated tests (unit, integration, and end-to-end).
- **Performance:** Optimize backend jobs and frontend rendering for longer incidents.
- **UI Polish:** Add animations, better mobile support, and more customization options.
- **Accessibility:** Add accessibility features such as ARIA labels, improved keyboard navigation, and screen reader support to ensure the app is usable by everyone.

---

## How Long I Spent on the Project

- **Total time:** ~9 hours
- **Breakdown:**
  - Backend/API: 3 hours
  - Frontend/UI: 2 hours
  - AI integration & prompt tuning: 2 hour
  - Testing, polish, and debugging: 2 hours
