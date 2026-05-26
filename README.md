# DeskFlow — Support Ticket Triage Board

DeskFlow is a modern support ticket triage board that enables customers to submit tickets with customized priority SLAs, and allows agents to manage, triage, and progress tickets across statuses using step-by-step state transition rules and a premium, responsive drag-and-drop dashboard.

---

## Technical Stack
- **Database:** MongoDB (via MongoDB Atlas) & Mongoose Schema Validation
- **Backend:** Node.js, Express.js Router, and CORS Middleware
- **Frontend:** React (Vite), Vanilla CSS Glassmorphism Design System, Lucide React Icons
- **API Documentation & Testing:** Postman API Collection
- **Hosting:** Netlify (Frontend)

---

## Features

### 1. Robust MERN Backend (`backend/`)
- **Mongoose Data Model**: Rigid validation of subject, description, customer email formatting, and enum constraints for priorities (`low`, `medium`, `high`, `urgent`) and statuses (`open`, `in_progress`, `resolved`, `closed`).
- **State Transition Machine**: Status changes are checked mathematically (`newIndex - oldIndex === 1 or -1 or 0`) to prevent illegal state jumps. Transitioning to `resolved` sets `resolvedAt`, while transitioning backward clears it.
- **Dynamic Derived Fields**:
  - `ageMinutes`: Time elapsed between creation and now, or creation and resolution (stops growing once resolved/closed).
  - `slaBreached`: Dynamically evaluated at read time by checking if `ageMinutes` exceeds priority SLA thresholds (Urgent = 1h, High = 4h, Medium = 24h, Low = 72h).
- **API Endpoints**:
  - `POST /tickets`: Create a support ticket.
  - `GET /tickets`: Lists all tickets with combinable parameters (`?status`, `?priority`, and `?breached=true`).
  - `PATCH /tickets/:id`: Updates a ticket and validates state transitions.
  - `GET /tickets/stats`: Aggregates ticket status, priority, and counts currently open SLA-breached tickets.
  - `DELETE /tickets/:id`: Permanently deletes a ticket.

### 2. Premium React Dashboard UI (`frontend/`)
- **Custom CSS Glassmorphic Styling**: Custom stylesheet (`frontend/src/index.css`) featuring deep space tones, harmonized priority colors, glowing neon hover cards, responsive grids, and standard browser scrollbars.
- **Metrics Summary Strip**: Top stats summary displaying overall numbers and highlighting active SLA-breached tickets with a glowing pulse.
- **Action Transition Controls**: Action buttons on ticket cards are strictly limited to valid adjacent movements. Invalid drag drops trigger custom shake animations and snap the card back.
- **Combined Query Selectors**: Combine selectors to filter the entire triage board by priority and toggle breached-only items simultaneously.
- **Slide-out Creation Panel**: Sliding glass panel drawer for creating tickets with real-time email regex check and inline error alerts.

---

## Live Deployments & Connections

- **Live Deployed Frontend URL:** [merry-cascaron-db37e8.netlify.app](http://merry-cascaron-db37e8.netlify.app)
- **Live Deployed Backend URL:** [deskflow-triage-board-1.onrender.com](https://deskflow-triage-board-1.onrender.com)
- **Postman API Testing Collection:** **DeskFlow API** (available directly in `Krish Chourasia's Workspace` in your Postman Cloud client, or locally via `DeskFlow.postman_collection.json`).

---

## Getting Started

### 1. Configure MongoDB
Paste your MongoDB Atlas Connection String in the `backend/.env` file:
`MONGODB_URI=your-mongodb-atlas-string`

### 2. Run the Express Backend
```powershell
cd backend
npm install
npm run dev
```
The backend server runs on [http://localhost:5000](http://localhost:5000). Check health status at `http://localhost:5000/health`.

### 3. Run the React Frontend
```powershell
cd frontend
npm install
npm run dev
```
The Vite React server runs on [http://localhost:3000](http://localhost:3000).
