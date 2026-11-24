# SellQuest

SellQuest is a C2C marketplace for buying and selling second-hand goods in Kazakhstan.

> **Status:** Sprint 01 — Foundation v0.1.0 (in development)

## Product Vision

SellQuest is built around four differentiating features (planned for future sprints):

| Feature       | Description                                                          |
|---------------|----------------------------------------------------------------------|
| **Match**     | Connects buyers' wanted requests with relevant seller listings.      |
| **Condition** | Standardized product condition information.                          |
| **Proof**     | Buyer-requested evidence of product condition or possession.         |
| **Deal**      | Offers, reservations, negotiation, and transaction status tracking.  |

A **Trust & Safety** layer supports account security, moderation, fraud reporting, and risk controls.

## Sprint 01 Scope

- User registration, login, logout (session-based authentication)
- Current user profile
- Product categories
- Public catalog and listing details (`ACTIVE` listings only)
- Manual listing draft creation
- Personal drafts list (owner-only access)
- API validation, permissions, automated tests, CI

**Out of scope for Sprint 01:** AI features, Match, Proof, Deal, payments, advanced fraud detection.

### Known limitation: email verification

In local development, registration creates **unverified** accounts.
The system does **not** send verification emails and never marks an email as verified.
Email verification will be implemented in a later sprint.

## Tech Stack

| Layer          | Technologies                                                          |
|----------------|-----------------------------------------------------------------------|
| Backend        | Python 3.12, Django 5.2 LTS, Django REST Framework, PostgreSQL        |
| Frontend       | React, TypeScript, Vite, Tailwind CSS, React Router                   |
| Testing        | pytest, pytest-django, Ruff, Vitest, React Testing Library, Playwright |
| Infrastructure | Docker Compose, GitHub Actions, OpenAPI                               |

## Architecture

Modular monolith:

```text
React SPA (frontend)  ──HTTP/JSON + session cookie──▶  Django REST API (backend)  ──▶  PostgreSQL
```

- Authentication: Django server-side sessions, HttpOnly cookies, CSRF protection. No JWT in `localStorage`.
- API base path: `/api/v1/`
- Identifiers: UUID
- Prices: integer, KZT
- Timestamps: UTC

## Repository Structure

```text
.
├── backend/              # Django project (SQ-002)
│   └── apps: accounts, categories, listings
├── frontend/             # React + TypeScript app (SQ-003)
├── .github/workflows/    # CI pipelines (SQ-011)
├── docker-compose.yml    # Local development stack (SQ-002)
└── README.md
```

## Getting Started

> Setup instructions will be added as the backend (SQ-002) and frontend (SQ-003) are initialized.

### Requirements

- Git 2.40+
- Python 3.12
- Node.js 22 LTS or 24 LTS
- Docker Desktop (with Docker Compose v2+)

## Git Workflow

- `main` — stable code only.
- `feature/SQ-XXX-short-description` — feature branches.
- All changes go through Pull Requests with code review.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `ci:`.

## Team

| Role        | Responsibilities                                                       |
|-------------|------------------------------------------------------------------------|
| Developer A | Accounts, authentication API, auth frontend, profile page, auth tests  |
| Developer B | Categories, listings, catalog API and frontend, drafts, listing tests  |
| Both        | Architecture, Docker, CI, integration, security review, documentation  |
