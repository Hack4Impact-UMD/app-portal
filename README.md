<p align="center"><img src="frontend/public/h4i-logo.png" alt="Hack4Impact Logo" width="200"/></p>

# 📝 Hack4Impact-UMD Application Portal

This repository contains the source code for the Hack4Impact-UMD Application Portal. The interface includes features for applicants to submit and view the status of their applications, and features to make reviewing applications more efficient for club members.

In addition, the project is integrated with [Professor](https://github.com/Hack4Impact-UMD/professor), our autograder service for asynchronously testing engineering assessments in isolation. 

## ✨ Tech Stack

### Frontend

- **Framework:** [React](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
- **Routing:** [React Router](https://reactrouter.com/)
- **Schema Validation:** [Zod](https://zod.dev/)

### Backend

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express](https://expressjs.com/)
- **Platform:** [Firebase](https://firebase.google.com/) (Cloud Functions, Firestore, Authentication, Storage)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Task Queue:** [Cloud Tasks](https://cloud.google.com/tasks)

## 📂 Directory Structure

### Frontend

```
frontend/
├── public/              # Static assets
└── src/
    ├── components/      # Reusable React components
    ├── config/          # Firebase and React Query configuration
    ├── contexts/        # React contexts for state management
    ├── hooks/           # Custom React hooks
    ├── lib/             # Utility functions
    ├── pages/           # Top-level page components
    ├── services/        # Services for interacting with the backend
    ├── types/           # TypeScript type definitions
    └── utils/           # Miscellaneous utility functions
```

### Backend

```
backend/
└── functions/
    ├── src/
    │   ├── middleware/  # Express middleware
    │   ├── models/      # Data models
    │   ├── routes/      # API routes
    │   ├── types/       # TypeScript type definitions
    │   └── utils/       # Utility functions
    └── lib/             # Compiled JavaScript code
```

## 🚀 Building and Running Locally

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

For more information on fetching data from the backend, see the [Data Fetching Guide](./DataFetching.md).

### Backend

For instructions on setting up the Firebase emulators, see the [Firebase Emulator Setup Guide](./backend/README.md).

1.  Navigate to the `backend/functions` directory:
    ```bash
    cd backend/functions
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
4.  Run the Firebase emulators:
    ```bash
    npm run serve
    ```
## 🖼️ Screenshots

_Note: Some of these may be outdated_

<img width="1913" height="1014" alt="Screenshot From 2025-07-05 23-40-49" src="https://github.com/user-attachments/assets/e5c5c1d7-3b83-4b98-b67d-5e2fefe64bd3" />

<img width="1920" height="1012" alt="Screenshot From 2025-07-05 20-14-49" src="https://github.com/user-attachments/assets/5a77712f-4936-4a8c-95d8-0cb7e3a0e33a" />

<img width="1920" height="1017" alt="Screenshot From 2025-06-29 21-31-37" src="https://github.com/user-attachments/assets/57dbd6c1-2bbb-4cc0-913c-ea0a6eadd7ed" />

<img width="1920" height="1013" alt="Screenshot From 2025-05-20 21-41-19" src="https://github.com/user-attachments/assets/ae3580eb-3b5b-495c-9d4e-5e2ecea3121d" />

## 📞 Team Contacts

| Name | Role | Contact | Email |
|------|------|---------|-------|
| **Ramy Kaddouri** | Tech Lead | [Slack](https://hack4impact.slack.com/) | [TODO](mailto:lanceu0128@gmail.com) |
| **Lance Uymatiao** | Tech Lead | [Slack](https://hack4impact.slack.com/) | [lanceu0128@gmail.com](mailto:lanceu0128@gmail.com) |
