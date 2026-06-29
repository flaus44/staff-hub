# E-sign evidence specification

Each `contract-signatures` record stores:

- `user` — authenticated staff user ID
- `contract` + `contractVersion` — template version at sign time
- `documentHash` — SHA-256 of contract ID, version, and body text
- `signatureMethod` — draw | type
- `signedPdf` — immutable PDF in private media
- `signedAt` — UTC timestamp
- `ipAddress`, `userAgent` — request metadata
- `consentVersion` — e.g. `2026-06-01`

Records are append-only (`update: false` on collection access).
