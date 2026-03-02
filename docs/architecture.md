# FinBank — Architecture Overview

## System Architecture: Modular Monolith

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React 18 + Vite)           │
│  ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ┌────────┐  │
│  │Login │ │Dashboard │ │Accounts│ │Trans.│ │Ledger  │  │
│  └──────┘ └──────────┘ └────────┘ └──────┘ └────────┘  │
│                    ↕ Axios + JWT                        │
└────────────────────────────────────────────────────────-┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI — Python 3.11)            │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Middleware Layer                    │    │
│  │  CORS │ Rate Limiter │ Request Logger │ JWT     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Auth     │ │ Customers │ │ Accounts │ │ Transact │  │
│  │ Module   │ │ Module    │ │ Module   │ │  Module  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌───────────┐                             │
│  │ Ledger   │ │  Audit    │                             │
│  │ Module   │ │  Module   │                             │
│  └──────────┘ └───────────┘                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Core Layer                         │    │
│  │  Config │ Database │ Security │ Exceptions      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────┐                                    │
│  │ Event System    │───→ Webhook HTTP POST              │
│  │ (httpx+tenacity)│     (retry w/ backoff)             │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
┌───────────────┐                 ┌───────────────────┐
│   MongoDB 7   │                 │ Webhook Receiver  │
│  (Replica Set)│                 │   (External)      │
│               │                 └───────────────────┘
│ Collections:  │
│ ├─ users      │
│ ├─ customers  │
│ ├─ accounts   │
│ ├─ ledger_    │
│ │  entries    │
│ └─ audit_logs │
└───────────────┘
```

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| **Auth** | User registration, login, JWT token management |
| **Customers** | KYC creation, profile management, admin approval |
| **Accounts** | Account opening, IBAN generation, balance inquiry |
| **Transactions** | Deposit, withdrawal, transfer orchestration |
| **Ledger** | Append-only financial entries, balance computation |
| **Audit** | Immutable action logs for compliance |

## Data Flow: Transfer Operation

```
1. POST /api/v1/transactions/transfer
2. Auth middleware validates JWT
3. Transaction module validates ownership
4. Ledger service starts MongoDB session
5. Within atomic transaction:
   a. Create DEBIT entry for source account
   b. Create CREDIT entry for target account
   c. Verify source balance ≥ amount
6. Commit transaction (or abort on error)
7. Webhook: TransferCreated → TransferCompleted
8. Audit: TRANSFER_EXECUTED logged
```

## Why Modular Monolith?

| Aspect | Modular Monolith | Microservices |
|--------|-----------------|---------------|
| Deployment | Single unit | Multiple services |
| Complexity | Low | High |
| Data consistency | Easy (shared DB) | Saga pattern needed |
| Team size | 1-5 developers | 5+ developers |
| Network calls | In-process | HTTP/gRPC |

For a student project with financial consistency requirements, **Modular Monolith** provides the best balance of simplicity, consistency, and development speed.
