# Deployment & Testing Recommendations (Claude Architectural Review)

> **Document Summary:**  
> Architectural recommendations, security considerations, DPDP Act 2023 compliance items, testing checklists, and load testing advice for the **RIS HR & Career Portal** repository (`HR_RIS`).

---

## 1. Deployment Approach

**Given the stack (React/Vite frontend, FastAPI backend, Vercel serverless entrypoint), the recommended deployment strategy is a split architecture:**

1. **Frontend (React/Vite)** → Vercel static hosting is a natural fit — build output served via CDN, fast and cheap.
2. **Backend (FastAPI)** → Two real options:
   - **Vercel serverless functions** (`api/index.py`) — works, but watch out for cold starts, execution time limits, and the fact that SQLAlchemy connection pooling behaves badly in serverless (each invocation can spin up a new DB connection). If you go this route, use a connection pooler (e.g., PgBouncer, or a managed Postgres with built-in pooling like Neon/Supabase).
   - **A persistent server** (Railway, Render, Fly.io, or AWS ECS/EC2) — better if you expect steady traffic, want WebSocket support later, or want predictable DB connections. Given this is a real recruitment cycle with bursty traffic near deadlines, a persistent backend is usually safer.
3. **Database** → Move off SQLite before production. Use managed Postgres (Neon, Supabase, AWS RDS, etc.) with automated backups — candidate PII in an ephemeral SQLite file is risky both operationally and legally.
4. **File Storage** → Resumes and publication attachments shouldn't sit on the serverless filesystem (it's ephemeral). Use AWS S3 or equivalent object storage with signed URLs.
5. **Secrets** → JWT signing key, DB credentials, any third-party keys go into environment variables via Vercel/host secrets manager — never in the repo.
6. **Migrations** → Use Alembic with SQLAlchemy so schema changes are versioned and repeatable across environments (dev/staging/prod).
7. **Environments** → At minimum: dev (SQLite ok), staging (Postgres, seeded/anonymized data), production (Postgres, real data, stricter access controls).

---

## 2. Testing Checklist

### Backend (pytest + FastAPI TestClient)
- **Unit tests for Pydantic validators** — especially the publication validation rule (count > 0 → link mandatory) and Class X/XII conditional logic.
- **Integration tests for each API route** (job CRUD, application submission, JWT login, filtering/scoring endpoints).
- **Auth tests** — token expiry, invalid/tampered JWT, role-based access (candidate vs HR).
- **Excel export test** — verify all 67 columns populate correctly, especially the calculated Age field and semicolon-joined publication links, across edge cases (no publications, no work experience, pursuing degree flags).
- **DB constraint tests** — cascading deletes/updates across `candidate_metadata`, `candidate_schooling`, etc.

### Frontend (Vitest/Jest + React Testing Library, Cypress/Playwright for E2E)
- **Full 5-step wizard flow**, including back/forward navigation preserving state.
- **Conditional field rendering** (Class XII optional for MTS, publication validation fields).
- **File upload flow (resume)** — size/type limits, error states.
- **HR portal filtering and drawer inspection** with large candidate lists (test pagination/performance).

---

## 3. Security Testing (Important for Handling PII)

- **SQL injection / input sanitization** on all form fields.
- **File upload validation** — restrict to expected types (PDF only), scan for malicious payloads, don't trust client-side MIME type.
- **JWT secret strength, token storage** (avoid localStorage for sensitive tokens if feasible; consider httpOnly cookies).
- **Rate limiting** on public-facing endpoints (job application submission, login) to prevent abuse/scraping.
- **CORS configuration** — lock down to your actual frontend origin(s) in production.
- **Verify HR endpoints** are properly gated by auth middleware, not just hidden in the UI.

---

## 4. Data Privacy & Compliance (DPDP Act 2023)

- **India's DPDP Act 2023 Compliance:** Since you're collecting DOB, mobile numbers, and other PII, check consent language, data retention policy, right-to-deletion handling.
- **Export Access Control:** Ensure exported Excel files (with full PII) are access-controlled, not just publicly downloadable links.

---

## 5. Load & Performance Testing

- **Deadline Traffic Spikes:** Simulate deadline-day traffic spikes (recruitment portals often see huge last-minute submission bursts) — use `k6` or `Locust` against the application submission endpoint specifically.
- **Excel Export Benchmarking:** Test the Excel export under a large candidate volume — openpyxl generation can be slow/memory-heavy at scale; verify it doesn't time out serverless function limits if you go that route.
