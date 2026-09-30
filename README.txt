US PORTFOLIO ANALYZER WEBSITE V2

WHAT THIS VERSION ADDS
- Login screen with username + password.
- Sign-up flow with persistent registered users.
- Passwords are stored as salted scrypt hashes, not plain text.
- Persistent login sessions.
- A separate saved portfolio for every username.
- Every new user begins with the 32-position default portfolio from the supplied Excel workbook.
- Add/remove companies. Search uses Nasdaq Trader's U.S. symbol directories.
- Current stock price and analyst target are refreshed automatically when available.
- Clicking a company loads a 5-year weekly price chart.
- Portfolio projections recalculate instantly when capital or allocations change.
- User portfolios persist in Netlify Blobs across redeploys.

IMPORTANT DEPLOYMENT CHANGE
This version includes server-side Netlify Functions and the @netlify/blobs package. A simple static drag-and-drop deployment may not install the dependency correctly.
Recommended: deploy through a Git repository connected to Netlify, so Netlify runs npm install and bundles the functions.

NETLIFY SETTINGS
Build command: leave blank
Publish directory: .
Functions directory: netlify/functions

DATA NOTES
Market and analyst data are fetched server-side from public market-data pages/APIs with fallbacks. These sources can change or temporarily block automated requests. The site retains the last saved values instead of deleting them if a refresh fails.
SMH is an ETF and normally does not have a company-style analyst consensus target; uncovered holdings are assumed flat in the one-year target scenario.

SECURITY NOTE
This is suitable for a private/personal site. Before opening registration to a large public audience, add rate limiting/CAPTCHA, account recovery, email verification or MFA, and formal privacy/terms pages.
