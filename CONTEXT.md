I am modifying an existing repository into a personal trading dashboard called CRS.

First, inspect the current repo and explain:

1. current stack
2. folder structure
3. reusable components
4. parts that should be removed or replaced
5. the best way to adapt it into a trading dashboard

Then create an implementation plan for these pages:

- Dashboard
- Trades
- Journal
- Analytics
- Settings

Important:

- do not overcomplicate the app
- keep it personal-use focused
- prioritize useful trading stats and journaling
- build with a dark premium UI
- use mock data first
- keep code clean and modular
- preserve as much of the repo structure as reasonable


I want to modify an existing repo into my personal trading dashboard and journal app called CRS.

Goal:
Build a clean, modern, dark-themed trade tracking dashboard for personal use. It should not be overcomplicated. Focus on useful journaling, analytics, and discipline tracking for a rule-based trader.

Core requirements:

1. Create a dashboard homepage with summary cards:

- total trades
- win rate
- net pnl
- average win
- average loss
- profit factor
- average RR
- current streak
- best day
- worst day

1. Create a trades page:

- responsive table
- columns: date, pair, direction, setup type, session, entry, stop loss, take profit, result in R, result amount, status, followed plan
- filters for pair, session, setup type, result, date range
- search input
- clickable row to open trade details

1. Create a trade detail / journal page:

- show full trade information
- journal fields: why I took the trade, HTF bias, entry model, followed plan yes/no, emotion before, emotion after, mistake made, lesson learned, notes
- allow screenshot attachment or image preview
- show checklist:
  - HTF BOS confirmed
  - pullback to OB
  - M15 confirmation
  - traded with bias
  - valid session
  - RR >= 1:2

1. Create an analytics page with only useful charts:

- equity curve
- pnl by week or month
- win rate by setup type
- performance by pair
- performance by session
- calendar heatmap
- mistake frequency summary

1. Use a clean dark UI with a premium trading-journal feel:

- modern card layout
- rounded corners
- subtle shadows or glass effect
- minimal sidebar
- good spacing
- status badges for win/loss/breakeven
- responsive design

1. Keep the architecture simple and maintainable.

- reusable components
- clear folder structure
- mock local data first
- avoid overengineering
- avoid unnecessary libraries
- comment important code

1. Suggested setup tags:

- reversal
- continuation
- liquidity sweep
- BOS entry
- OB retest
- London
- New York
- A+ setup
- FOMO
- counter-trend

1. Make the app feel motivating and practical, not cluttered.

Please:

- analyze the existing repo structure first
- keep what is reusable
- refactor only where needed
- generate a clear implementation plan
- then start by building the dashboard page and shared components first
- use realistic sample trade data for testing
- keep naming consistent with the app name CRS
