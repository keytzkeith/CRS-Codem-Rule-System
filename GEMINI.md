# CRS (Codem System Rule) Project Context

## Project Overview
CRS is a focused, personal trading journal application designed for execution review, disciplined trade logging, and practical analytics. It aims to help traders refine rule-based systems without platform clutter. 

Created by Keith Odera, the platform consists of three main components:
1. **Frontend:** Built with Vue 3, Vite, Pinia, Vue Router, and styled with Tailwind CSS.
2. **Backend:** A Node.js server using Express to handle API requests and business logic.
3. **Database:** PostgreSQL for persistent storage of user data and trades.
4. **Documentation:** A dedicated Docusaurus-based documentation site.

The application emphasizes execution quality, discipline tracking, setup review, and account-aware risk management over broad social trading features.

## Architecture & Tech Stack
*   **Frontend Development:** Vue 3, Vite 5
*   **Backend Development:** Node.js, Express
*   **Database:** PostgreSQL (with Docker for local development)
*   **Documentation Site:** Docusaurus
*   **Key Directories:**
    *   `frontend/`: Contains the Vue 3 application.
    *   `backend/`: Contains the Node.js API server and database migrations.
    *   `docs-site/`: Contains the Docusaurus documentation source code.
    *   `config/`: Shared configuration files like `siteIdentity.json` and `release.json`.
    *   `docker/` and `scripts/`: Utilities for deployment, database migrations, and local environment setup.

## Local Development Setup

To run the full stack locally, follow these steps:

### 1. Database (PostgreSQL)
Start the PostgreSQL database using Docker Compose:
```bash
docker compose -f docker-compose.dev.yaml up -d postgres
```

### 2. Backend
Run the Node.js Express server:
```bash
cd backend
npm run dev
# Server will start on port 3000
```

### 3. Frontend
Run the Vue application:
```bash
cd frontend
npm run dev -- --host 0.0.0.0
# App will be accessible at http://localhost:5173
```

### 4. Documentation (Optional)
To run the Docusaurus docs site locally:
```bash
cd docs-site
npm install
npm run start
# Docs will be accessible at http://localhost:3001
```

## Available Scripts & Commands
*   `node scripts/sync-release-version.js`: Synchronizes the release version across the project components.
*   Various shell scripts are available in the `scripts/` directory for tasks such as backups (`backup.sh`), deployments (`deploy.sh`), and migrations (`setup.sh`, `migrate-postgres-16.sh`).

## Development Conventions
*   **Agent Skills:** Custom AI agent skills and configurations are maintained in the `.agents/` directory.
*   **Identity Configuration:** Public identity values (like domains, support emails) should be updated in `config/siteIdentity.json` and `backend/.env.production.example` before public deployment.
*   **Database Migrations:** The `backend/migrations/` directory contains SQL files for version-controlled database schema changes. Ensure migrations are applied when setting up or updating the database.
*   **Code Style:** Based on the presence of modern tools (Vue 3, Vite), standard JavaScript/TypeScript conventions should be adhered to.

For more detailed setup instructions, refer to `backend/docs/LOCAL_SETUP.md` or `docs-site/docs/getting-started/local-setup.md`.
