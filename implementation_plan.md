# Create Backend and Connect to PostgreSQL

The goal of this task is to replace the hardcoded mock data in the React frontend with a real backend connected to a PostgreSQL database.

## User Review Required

> [!IMPORTANT]
> This plan requires setting up a local PostgreSQL instance. Do you already have PostgreSQL installed and running on your Windows machine, or would you prefer to use Docker to run the database?

> [!WARNING]
> Implementing a backend for all the mock data (`bankingData.ts`, `fraudData.ts`, `mockData.ts`, `xaiData.ts`) will require creating several database tables and API endpoints. We will start with a core set of models (e.g., Bank Connectors, Data Flows) and expand iteratively.

## Open Questions

1. **Database Connection**: Please provide the PostgreSQL connection string you would like to use (e.g., `postgresql://postgresql://postgres:lightking@localhost:5432/algorisk`).
2. **Backend Location**: I propose creating a `backend` folder inside the `AlgoRiskAI` project. Does this sound good, or would you prefer a different folder structure?
3. **ORM Selection**: I recommend using **Prisma** as the ORM because it provides excellent TypeScript support and makes schema management very easy. Let me know if you prefer another ORM (like Sequelize or TypeORM).

## Proposed Changes

### 1. Initialize Backend Project
We will create a new Node.js + Express server with TypeScript in a `backend` directory.

#### [NEW] `backend/package.json`
Dependencies: `express`, `cors`, `dotenv`, `prisma`, `@prisma/client`.
Dev Dependencies: `typescript`, `ts-node`, `nodemon`, `@types/express`, `@types/node`.

#### [NEW] `backend/prisma/schema.prisma`
Prisma schema defining the initial tables for the data currently hardcoded in `src/data/bankingData.ts` (e.g., `BankConnector`, `ApiLog`, `DataFlow`).

#### [NEW] `backend/src/index.ts`
The main entry point for the Express server.

#### [NEW] `backend/src/routes/*.ts`
API routes to serve the data (e.g., `GET /api/banking/connectors`).

### 2. Update Frontend (Vite/React)

#### [MODIFY] `ALGORISKAI/vite.config.ts`
Add a proxy configuration so `/api` requests are forwarded to the local backend server (e.g., `http://localhost:5000`).

#### [MODIFY] `ALGORISKAI/src/data/*.ts`
Refactor the frontend to fetch data from the backend instead of using the static objects. We will implement React `useEffect` hooks or a data fetching library (like React Query, if desired) to load this data dynamically.

## Verification Plan

### Automated Tests
- The backend will compile with TypeScript without errors.
- Prisma schema will successfully generate the client and apply migrations.

### Manual Verification
- Start the Express backend (`npm run dev`).
- Start the Vite frontend (`npm run dev`).
- Open the application in the browser and verify that data on the dashboard is loaded successfully from the API.
- Check the Network tab in Chrome DevTools to ensure real HTTP requests are being made.
