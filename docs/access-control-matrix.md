# Role × collection access matrix (MVP)

| Collection | admin | manager | staff | contractor |
|------------|-------|---------|-------|--------------|
| staff-users | CRUD | read team | read self | read self |
| time-entries | CRUD | read/approve team | CRUD own | CRUD own |
| shift-notes | CRUD | read team | CRUD own | CRUD own |
| survey-templates | CRUD | read | read | read |
| survey-assignments | CRUD | read | read assigned | read assigned |
| survey-responses | read all | read all | create/read own | create/read own |
| contracts | CRUD | read | read/sign | read/sign |
| contract-signatures | read all | read team | create/read own | create/read own |
| training-modules | CRUD | read | read | read |
| training-completions | read all | read team | create/read own | create/read own |
| incidents | CRUD | read/update all | create/read own | create/read own |
| audit-log | read | — | — | — |
| media | CRUD | read | create/read | create/read |
| invite-tokens | CRUD | — | — | — |

Enforcement: Payload collection `access` hooks + middleware auth + MFA for admin/manager portal routes.
