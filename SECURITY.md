# SECURITY.md

Purpose
- Document security posture, authentication & authorization, secrets management, encryption standards, and common vulnerability mitigations for maintainers and automated agents.

1. Authentication & Authorization
- Authentication:
  - JWT-based authentication: server signs tokens using JWT_SECRET. Tokens returned on login/register flows.
  - Passwords: stored using bcrypt hashes (bcryptjs/bcrypt). Minimum length enforced at registration (>=8).
  - Client-side: passwords are AES-encrypted in transit and sent as { encryptedPassword, iv } — server decrypts using AES_SECRET_KEY (decryptAES utility). This is an additional layer on top of TLS but should not replace TLS.
- Authorization:
  - Role-based: admin JWT contains { role: "admin" } used by authAdmin middleware. User endpoints validated against token userId where needed.
  - Principle of least privilege: admin routes protected by middleware; enforce server-side checks on all operations (e.g., product creation, stock adjustments, financial endpoints).

2. Transport and Encryption
- Use TLS (HTTPS) for all production traffic. Ensure load balancer or CDN terminates TLS with strong ciphers.
- At-rest:
  - Secrets (JWT_SECRET, AES_SECRET_KEY, DB credentials, payment keys) must be stored in environment variables and secret stores (e.g., Vault, AWS Secrets Manager, Railway/Heroku secret configs). Do NOT commit secrets to repo.
  - Database: enable encryption-at-rest provided by cloud DB service.
- In-transit:
  - Enforce HTTPS and HSTS. APIs must reject non-secure requests in production.

3. Secrets management
- .env files: .env.example exists; real .env must be gitignored. Rotate secrets regularly.
- Recommend using a secrets manager for production. CI/CD pipelines should inject secrets via secured environment variables.
- Limit access to production secrets using IAM and audit logs.

4. Common web vulnerability mitigations
- CORS:
  - The backend uses FRONTEND_URL and ADMIN_URL from .env as allowed origins. Restrict origins to exact production domains; avoid wildcard origins in production.
- Rate limiting:
  - Add rate limiting (express-rate-limit) to auth endpoints (/login, /register) and other abusive endpoints (password reset, checkout) to mitigate brute-force attacks.
- CSRF:
  - For JWT in localStorage, protect state-changing endpoints by requiring CSRF protections. Prefer HttpOnly secure cookies for tokens to mitigate CSRF.
- XSS:
  - Sanitize user-generated content (reviews.comment, letters, notes) before rendering. Use proper escaping on server-side and client-side when injecting HTML.
- Input validation & sanitization:
  - Use validator and explicit checks (length, types). For JSON fields, validate structure and maximum sizes to avoid huge payloads.
- SQL Injection:
  - Using Prisma mitigates classic SQL injection; still validate user input and avoid constructing raw SQL with user data.
- File upload safety:
  - Validate file types and sizes before uploading to Cloudinary. Use server-side checks for MIME type and size limits.
- Authentication protections:
  - Enforce account lockout or rate-limited retries for repeated failed logins.
  - Use strong JWT secret and consider short-lived access tokens + refresh tokens pattern for higher security.

5. Data privacy and compliance
- Personal data: email, phone, addresses are stored. Treat these as PII and follow applicable laws (GDPR, local data protection laws).
- Data retention: define retention policies for logs, orders, and audit trails. Provide endpoints for data deletion if subject to GDPR "right to be forgotten" (not implemented by default).
- Payment data: never store raw payment credentials. Use payment provider tokens (Stripe/Razorpay). Follow PCI-DSS guidance and rely on payment processor for PCI compliance.

6. Operational security
- Logging: avoid logging secrets (tokens, passwords). Use redaction in logs.
- Monitoring & alerting: add alerts for spikes in failed logins, sudden changes in ledger balances, or repeated 500 errors.
- Backups: implement regular DB backups and test restore procedures.

7. Recommended hardening
- Use Content Security Policy (CSP) headers to reduce XSS risk.
- Set secure cookie attributes: HttpOnly, Secure, SameSite=Strict for auth cookies.
- Use helmet middleware for common security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- Enforce TLS 1.2+ and strong cipher suites.

8. Incident response
- Maintain an incident response playbook for data breaches: contain, assess, notify, remediate, and audit.
- Rotate compromised secrets immediately and invalidate active sessions (rotate JWT secret or maintain a token revocation list).

-- End of SECURITY.md --
