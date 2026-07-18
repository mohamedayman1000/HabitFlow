# Habit Tracker

Simple monthly habit tracker (client-side, no backend required).

## Structure

```
index.html      → page markup only
css/style.css   → all styles
js/app.js       → all app logic (state, rendering, dropdowns, modals, CSV export)
```

## Run

Just open `index.html` in a browser. No build step, no dependencies.

## Notes

- Data (habits, checks, custom categories) is stored in `localStorage`.
- All UI logic lives in `js/app.js`, organized top-to-bottom by feature:
  state → helpers (dates/streaks/percentages) → dropdown system → category
  CRUD → stats/donuts/charts → render() → modals (add/edit/delete habit,
  category, stats).
