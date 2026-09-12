# Team Roster Dashboard

A minimal team directory with authentication, role-based authorization (Admin / Editor / Viewer), and full CRUD on members — built with React, Vite, and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Demo accounts

| Role   | Email                  | Password  |
|--------|-------------------------|-----------|
| Admin  | priya@company.com       | demo123   |
| Member | jordan@company.com      | demo123   |

You can also create a brand-new account from the "Create an account" link on the sign-in screen — pick any role (Admin, Editor, or Viewer) when signing up.

## Project structure

```
team-roster-dashboard/
├── index.html              # Vite HTML entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx             # React root, mounts <App />
    ├── index.css            # Tailwind directives
    ├── App.jsx              # Main app: auth, authorization, CRUD, theme
    ├── components/
    │   ├── Dot.jsx           # Small colored status dot
    │   ├── FieldWrap.jsx     # Red-border + exclamation wrapper for invalid fields
    │   └── ToastCard.jsx     # Toast notification (success/error)
    └── lib/
        ├── theme.js          # Light/dark color palettes
        ├── constants.js      # Roles, seed data, storage keys, small helpers
        └── storage.js        # localStorage-backed persistence layer
```

## How it works

- **Authentication** — sign in with email/password against stored credentials, or create a new account. Passwords are required to be at least 6 characters. Duplicate emails are rejected.
- **Authorization** — Admins can add, edit, remove, and reassign anyone's role. Editors and Viewers can only view the roster and edit their own name/email; attempts to change other fields are ignored server-side (in `App.jsx`), not just hidden in the UI.
- **CRUD** — add, edit, and remove team members from a slide-over panel, with per-field required validation (red border + exclamation icon) and a delete confirmation step.
- **Persistence** — the roster, credentials, and your light/dark theme preference are saved to the browser's `localStorage` via `src/lib/storage.js`, so they survive a page refresh.
- **Theme** — toggle light/dark mode from the dashboard's top bar (sun/moon icon). All colors come from `src/lib/theme.js`.

## Notes on adapting this from a Claude.ai artifact

This project began as a single-file Claude.ai artifact, which uses a sandboxed `window.storage` API instead of real browser storage. `src/lib/storage.js` re-implements that same API shape on top of real `localStorage`, so the rest of the app didn't need to change. If you'd rather use a real backend, replace the calls in `src/lib/storage.js` (or in `App.jsx`, for auth) with real API requests — the rest of the component logic doesn't need to change.

**Security note:** passwords are currently stored in plain text in `localStorage` for demo purposes. Don't use this authentication approach as-is in a real production app — hash and store credentials server-side instead.
