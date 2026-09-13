# AI_CONTEXT.md

Purpose
- Provide guidance to LLMs and developer tools working on this repository: coding standards, naming conventions, file locations, testing expectations, and constraints to respect when generating or modifying code.

1. Repository overview for LLMs
- Root layout: frontend/, admin/, backend/ (primary work occurs in backend/ and frontend/)
- Backend uses Node.js, Express, Prisma (MySQL); frontend uses React + Vite + Tailwind.
- Significant files:
  - backend/prisma/schema.prisma — canonical DB schema
  - backend/controllers/*.js — business logic (use these as behavioral source of truth)
  - backend/config/db.js — Prisma client
  - backend/.env.example — required environment variables
  - frontend/src/* — UI components and routes

2. Coding standards and conventions
- JavaScript style:
  - ESM modules (import/export). Use async/await for async ops.
  - Naming: camelCase for variables and functions, PascalCase for React components and Prisma model names.
  - Keep controllers thin: validate input, call prisma, transform data, and return JSON.
- Error handling: controllers catch exceptions and return { success: false, message: error.message }. Prefer preserving existing pattern but propose migration to proper status codes if asked.
- Avoid changing response schema unexpectedly: many clients expect { success, message, ... }.

3. File paths & boundaries
- Backend modifications should stay under backend/ unless frontend/back-end contract changes required.
- Add tests under backend/tests and frontend/tests when necessary.
- Avoid editing seed files unless migration is intended.

4. Testing requirements
- Unit tests for business logic (e.g., pricing, stock adjustments, accounting posting) are valuable. Use existing test patterns in backend/tests.
- Integration tests: cover critical flows — auth, payments (mock providers), order creation, stock updates.
- Linting: frontend uses ESLint; follow existing ESLint config. Keep code formatted consistently.

5. Known issue patterns & edge cases
- Mixed DB artifacts: mongodb.js exists but prisma is canonical. Avoid reintroducing Mongoose code.
- JSON fields: controllers expect JSON strings or arrays; always normalize before writing (use try/catch around JSON.parse).
- Dates: some models use BigInt for epoch millis. Convert to Number before JSON responses to avoid serializer issues.
- Concurrency: stock adjustments may race. When modifying stock, prefer serializing updates or using DB transactions (Prisma transactions) for correctness.
- Error response shape: many endpoints return 200 with success:false — maintain compatibility when changing behavior.

6. Constraints for code generation
- Do not commit secrets or sample credentials into code or docs.
- Keep PRs small and focused; follow existing folder and naming conventions.
- Use prisma client for DB interactions; prefer prisma.* APIs over raw SQL unless necessary.
- Maintain backward compatibility for APIs unless user specifies breaking-change versioning.

7. Security and privacy constraints
- Never output or hardcode JWT_SECRET, AES keys, payment keys, or DB credentials in code or generated examples.
- When adding logging, redact PII and tokens.

8. API expectations for LLM-generated code
- Preserve existing JSON response shapes: { success: boolean, message?: string, ...data }
- For new endpoints, design idempotent operations where appropriate and include input validation and unit tests.

9. PR & commit guidance for LLMs
- Create a single commit per logical change; include Co-authored-by trailer: Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
- Include brief commit message referencing files changed.
- When modifying schema.prisma, include corresponding prisma migrate or db push commands in commit notes.

10. Helpful heuristics for LLMs
- Inspect backend/controllers/* for real-world behavior rather than only reading schema.prisma.
- When touching product or user flows, ensure Cloudinary and payment integrations are preserved; mock them in tests.
- For UI changes, follow Tailwind pattern and reuse existing components; create small presentational components rather than duplicating styles.

-- End of AI_CONTEXT.md --
