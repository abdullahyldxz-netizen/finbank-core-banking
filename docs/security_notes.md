# Security Notes — FinBank Mini Core Banking System

## Authentication & Authorization

### JWT-Based Authentication (Supabase Auth)
- All protected endpoints require a Bearer JWT token in the Authorization header
- Tokens are issued by **Supabase Auth** upon successful login via `/api/v1/auth/login`
- Token expiry: 60 minutes (Supabase default, configurable)
- Password hashing: Managed by Supabase (bcrypt with automatic salt)
- Token verification: Backend validates token via `supabase.auth.get_user(token)` API call

### Role-Based Access Control (RBAC)
- **Admin Role**: Full access to all endpoints, including customer management, audit logs, and system oversight
- **Customer Role**: Access limited to own accounts, transactions, and ledger entries
- **Employee Role**: Access to customer management and transaction processing
- **CEO Role**: Executive dashboard with reporting and audit access
- Access is enforced at the route level via FastAPI dependencies (`require_role`, `require_roles`)
- Multi-role dependencies available: `require_staff` (employee + admin), `require_management` (CEO + admin)

## API Security

### Input Validation
- All request bodies are validated using **Pydantic models** with strict type constraints
- Email format validation using `EmailStr` type
- Password minimum length: 8 characters, maximum: 128 characters
- National ID: exactly 11 digits (Turkish TC Kimlik format)
- Transaction amounts: must be > 0 and ≤ 1,000,000 TRY
- Currency: must be a 3-letter uppercase ISO 4217 code (e.g., TRY, USD, EUR)
- Account type: enum restricted to `checking` or `savings`

### Rate Limiting
- Authentication endpoints: **5 requests/minute** per IP (brute-force protection)
- General endpoints: **60 requests/minute** per IP
- Implemented via `slowapi` middleware with sliding window

### CORS Handling
- Origins are explicitly whitelisted: `http://localhost:3000`, `http://localhost:5173`
- Configurable via `CORS_ORIGINS` environment variable
- Credentials, methods, and headers are all explicitly allowed

### Secure Error Responses
- Error responses use standard HTTP status codes (400, 401, 403, 404, 409)
- **No internal error details or stack traces** exposed to clients
- Domain-specific exceptions provide meaningful messages:
  - `InsufficientFundsError` (400) — balance < requested amount
  - `AccountNotFoundError` (404) — invalid account ID
  - `AccountFrozenError` (403) — account is frozen/closed
  - `SameAccountTransferError` (400) — transfer to self
  - `DuplicateTransactionError` (409) — idempotency violation

## Audit Logging

Every security-relevant and mutation action is logged to the `audit_logs` collection:

| Field | Description | Example |
|---|---|---|
| `user_id` | Who performed the action | `abc-123-def` |
| `user_email` | Email for identification | `user@finbank.com` |
| `role` | User's role at time of action | `customer` |
| `action` | What was performed | `TRANSFER_EXECUTED` |
| `outcome` | SUCCESS or FAILURE | `SUCCESS` |
| `timestamp` | When (UTC) | `2026-02-28T12:00:00Z` |
| `ip_address` | Client's IP | `192.168.1.10` |
| `user_agent` | Browser/device info | `Mozilla/5.0...` |
| `details` | Human-readable description | `Transfer 5000 TRY from ACC-001 to ACC-002` |

### Logged Actions
- `REGISTER` — New account creation
- `LOGIN_SUCCESS` / `LOGIN_FAILED` — Authentication attempts
- `DEPOSIT_EXECUTED` — Money deposited
- `WITHDRAWAL_EXECUTED` — Money withdrawn
- `TRANSFER_EXECUTED` / `TRANSFER_FAILED` — Transfer operations
- `CUSTOMER_CREATED` — KYC profile creation
- `KYC_STATUS_UPDATED` — Admin KYC approval/rejection

## Secrets Management
- `.env.example` file provided with all configuration keys (no values)
- `.env` file is listed in `.gitignore` — **never committed** to version control
- JWT_SECRET must be changed from default in production
- Supabase keys (URL, ANON_KEY, SERVICE_ROLE_KEY) are environment variables
- MongoDB connection strings are environment variables
- Webhook URLs are configurable

## Financial Data Integrity

### Ledger Integrity (NoSQL Consistency)
- Ledger entries are **append-only** — no UPDATE or DELETE operations allowed
- MongoDB **JSON Schema validation** enforces required fields at the database level
- **Unique composite index** `(transaction_ref, account_id, type)` prevents duplicate entries
- Transfers use **multi-document transactions** with MongoDB replica set for ACID atomicity
- Balances are **computed** (never stored), eliminating drift between ledger and balance
- **Double-entry bookkeeping**: every transfer creates paired DEBIT + CREDIT entries
- **Idempotency**: transaction references prevent double-processing of the same operation

### Why Append-Only?
In real banking systems, financial records must be immutable for regulatory compliance.
If a correction is needed, a new reversing entry is created (like a real bank's correction journal entry),
rather than modifying or deleting the original record.
