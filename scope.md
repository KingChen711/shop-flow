# 🚀 Microservices E-Commerce Platform - Project Scope

> A comprehensive learning project covering advanced backend technologies, microservices patterns, and cloud-native deployment.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Microservices Breakdown](#microservices-breakdown)
5. [Patterns & Techniques](#patterns--techniques)
6. [Infrastructure](#infrastructure)
7. [Development Phases](#development-phases)
8. [Learning Objectives](#learning-objectives)

---

## 🎯 Project Overview

### Project Name: **ShopFlow** - Distributed E-Commerce Platform

A full-featured e-commerce platform built with microservices architecture, designed to demonstrate and learn advanced backend patterns and cloud-native technologies.

### Core Features

- User authentication & authorization
- Product catalog management
- Shopping cart & wishlist
- Order processing with distributed transactions
- Payment processing
- Inventory management
- Notification system (Email, SMS, Push)
- File/Image management
- Search & analytics
- Admin dashboard

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KUBERNETES CLUSTER (AWS EKS)                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                    NGINX Ingress Controller                              │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
│              ┌───────────────────────┼───────────────────────┐                  │
│              │                       │                       │                  │
│              ▼                       ▼                       ▼                  │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐            │
│   │   Next.js BFF    │   │  gRPC-Gateway    │   │   Admin Panel    │            │
│   │   (Frontend)     │   │  (HTTP → gRPC)   │   │   (Next.js)      │            │
│   └──────────────────┘   └──────────────────┘   └──────────────────┘            │
│              │                       │                       │                  │
│              └───────────────────────┼───────────────────────┘                  │
│                                      │                                          │
│                              ┌───────┴───────┐                                  │
│                              │   gRPC Layer  │                                  │
│                              └───────┬───────┘                                  │
│                                      │                                          │
│   ┌──────────────────────────────────┼──────────────────────────────────────┐   │
│   │                         MICROSERVICES                                   │   │
│   │                                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│   │  │    User     │  │   Product   │  │    Order    │  │   Payment   │     │   │
│   │  │   Service   │  │   Service   │  │   Service   │  │   Service   │     │   │
│   │  │  (NestJS)   │  │  (NestJS)   │  │  (NestJS)   │  │  (NestJS)   │     │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│   │                                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│   │  │  Inventory  │  │Notification │  │    Cart     │  │   Search    │     │   │
│   │  │   Service   │  │   Service   │  │   Service   │  │   Service   │     │   │
│   │  │  (NestJS)   │  │  (NestJS)   │  │  (NestJS)   │  │  (NestJS)   │     │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│   │                                                                         │   │
│   └──────────────────────────────────┬──────────────────────────────────────┘   │
│                                      │                                          │
│   ┌──────────────────────────────────┼──────────────────────────────────────┐   │
│   │                         DATA LAYER                                      │   │
│   │                                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│   │  │ PostgreSQL  │  │   Kafka     │  │   Redis     │  │   MinIO     │     │   │
│   │  │  (Per Svc)  │  │   Cluster   │  │   Cluster   │  │   Storage   │     │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│   │                                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐                                       │   │
│   │  │  Debezium   │  │Elasticsearch│                                       │   │
│   │  │    (CDC)    │  │  (Search)   │                                       │   │
│   │  └─────────────┘  └─────────────┘                                       │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Monorepo Management

| Technology | Purpose |
|------------|---------|
| **Turborepo** | Monorepo build system, caching, task orchestration |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | BFF (Backend for Frontend), SSR, Admin Dashboard |
| **React** | UI Components |
| **TailwindCSS** | Styling |

### Backend (Microservices)

| Technology | Purpose |
|------------|---------|
| **NestJS** | Microservices framework |
| **gRPC** | Inter-service communication |
| **gRPC-Gateway** | HTTP REST to gRPC translation |
| **TypeScript** | Type-safe development |

### Databases & Storage

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database (per service) |
| **Redis Cluster** | Caching, session storage |
| **Redis Sentinel** | High availability for Redis |
| **MinIO** | S3-compatible object storage |
| **Elasticsearch** | Full-text search |

### Message Broker & Event Streaming

| Technology | Purpose |
|------------|---------|
| **Apache Kafka** | Event streaming, async communication |
| **Debezium** | Change Data Capture (CDC) |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Kubernetes** | Container orchestration |
| **NGINX Ingress** | Ingress controller, load balancing |
| **Docker** | Containerization |
| **Helm** | Kubernetes package manager |
| **AWS EKS** | Managed Kubernetes |
| **AWS RDS** | Managed PostgreSQL |
| **AWS ElastiCache** | Managed Redis |
| **AWS MSK** | Managed Kafka |
| **AWS S3** | Object storage (production) |

---

## 📦 Microservices Breakdown

### 1. User Service

```
📁 apps/user-service
├── src/
│   ├── domain/           # DDD Domain Layer
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── aggregates/
│   │   └── events/
│   ├── application/      # Application Layer (CQRS)
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── infrastructure/   # Infrastructure Layer
│   │   ├── persistence/
│   │   ├── grpc/
│   │   └── kafka/
│   └── presentation/     # Presentation Layer
│       └── grpc/
```

**Responsibilities:**
- User registration & authentication
- Profile management
- JWT token management
- Role-based access control (RBAC)

**Database:** PostgreSQL (users, roles, permissions)

**Patterns Applied:**
- Clean Architecture
- DDD (Aggregates, Value Objects, Domain Events)
- CQRS (Separate read/write models)

---

### 2. Product Service

```
📁 apps/product-service
├── src/
│   ├── domain/
│   ├── application/
│   │   ├── commands/     # CreateProduct, UpdateProduct
│   │   └── queries/      # GetProduct, ListProducts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── kafka/        # Outbox pattern implementation
│   │   └── cdc/          # Debezium configuration
│   └── presentation/
```

**Responsibilities:**
- Product CRUD operations
- Category management
- Product images (MinIO integration)
- Product search indexing

**Database:** PostgreSQL (products, categories)

**Patterns Applied:**
- Outbox Pattern (reliable event publishing)
- CDC with Debezium (sync to Elasticsearch)
- CQRS (Read from Elasticsearch, Write to PostgreSQL)

---

### 3. Order Service (Saga Orchestrator)

```
📁 apps/order-service
├── src/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── order.aggregate.ts
│   │   └── saga/
│   │       └── order-saga.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-order.command.ts
│   │   │   └── cancel-order.command.ts
│   │   └── saga/
│   │       ├── order-saga-orchestrator.ts
│   │       └── compensation-handlers/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── kafka/
│   │   └── outbox/
│   └── presentation/
```

**Responsibilities:**
- Order creation & management
- Order state machine
- Saga orchestration for distributed transactions

**Database:** PostgreSQL (orders, order_items, saga_state)

**Patterns Applied:**
- **Saga Pattern** (Orchestration-based)
  - Create Order → Reserve Inventory → Process Payment → Confirm Order
  - Compensation: Release Inventory → Refund Payment → Cancel Order
- Outbox Pattern
- Event Sourcing (optional)

---

### 4. Payment Service

```
📁 apps/payment-service
├── src/
│   ├── domain/
│   ├── application/
│   │   ├── commands/
│   │   │   ├── process-payment.command.ts
│   │   │   └── refund-payment.command.ts
│   │   └── handlers/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── kafka/
│   │   └── payment-gateway/  # Stripe/PayPal integration
│   └── presentation/
```

**Responsibilities:**
- Payment processing
- Refund handling
- Payment history

**Database:** PostgreSQL (payments, transactions)

**Patterns Applied:**
- Saga participant (compensatable transaction)
- Idempotency keys for payment retry

---

### 5. Inventory Service

```
📁 apps/inventory-service
├── src/
│   ├── domain/
│   ├── application/
│   │   ├── commands/
│   │   │   ├── reserve-stock.command.ts
│   │   │   └── release-stock.command.ts
│   │   └── handlers/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── kafka/
│   │   └── redis/          # Distributed lock implementation
│   └── presentation/
```

**Responsibilities:**
- Stock management
- Stock reservation (with distributed lock)
- Low stock alerts

**Database:** PostgreSQL (inventory, reservations)

**Patterns Applied:**
- **Distributed Lock** (Redis Redlock algorithm)
- Saga participant
- Optimistic locking

---

### 6. Notification Service

```
📁 apps/notification-service
├── src/
│   ├── domain/
│   ├── application/
│   │   ├── handlers/
│   │   │   ├── email.handler.ts
│   │   │   ├── sms.handler.ts
│   │   │   └── push.handler.ts
│   ├── infrastructure/
│   │   ├── kafka/          # Consumer for notification events
│   │   ├── providers/
│   │   │   ├── sendgrid/
│   │   │   ├── twilio/
│   │   │   └── firebase/
│   └── presentation/
```

**Responsibilities:**
- Email notifications
- SMS notifications
- Push notifications
- Notification templates

**Database:** PostgreSQL (notifications, templates)

---

### 7. Cart Service

```
📁 apps/cart-service
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   │   ├── redis/          # Cart stored in Redis
│   │   └── grpc/
│   └── presentation/
```

**Responsibilities:**
- Shopping cart management
- Cart persistence (Redis)
- Cart expiration handling

**Storage:** Redis Cluster (ephemeral cart data)

---

### 8. Search Service

```
📁 apps/search-service
├── src/
│   ├── application/
│   │   └── queries/
│   ├── infrastructure/
│   │   ├── elasticsearch/
│   │   └── kafka/          # CDC consumer
│   └── presentation/
```

**Responsibilities:**
- Full-text product search
- Faceted search
- Search suggestions

**Database:** Elasticsearch (product index)

**Patterns Applied:**
- CDC consumer (Debezium → Kafka → Elasticsearch)
- CQRS read model

---

### 9. File Service

```
📁 apps/file-service
├── src/
│   ├── application/
│   │   ├── commands/
│   │   │   ├── upload-file.command.ts
│   │   │   └── delete-file.command.ts
│   ├── infrastructure/
│   │   ├── minio/
│   │   └── grpc/
│   └── presentation/
```

**Responsibilities:**
- File upload/download
- Image processing & thumbnails
- Presigned URLs

**Storage:** MinIO (local) / AWS S3 (production)

---

## 🔄 Patterns & Techniques

### 1. Saga Pattern (Distributed Transactions)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORDER SAGA ORCHESTRATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   START                                                                     │
│     │                                                                       │
│     ▼                                                                       │
│   ┌─────────────────┐    Success    ┌─────────────────┐                     │
│   │  Create Order   │──────────────▶│ Reserve Stock   │                     │
│   │   (Pending)     │               │  (Inventory)    │                     │
│   └─────────────────┘               └────────┬────────┘                     │
│           │                                  │                              │
│           │ Failure                          │ Success                      │
│           ▼                                  ▼                              │
│   ┌─────────────────┐               ┌─────────────────┐                     │
│   │  Cancel Order   │               │Process Payment  │                     │
│   │   (Rollback)    │               │   (Payment)     │                     │
│   └─────────────────┘               └────────┬────────┘                     │
│                                              │                              │
│                              ┌───────────────┼───────────────┐              │
│                              │ Success       │               │ Failure      │
│                              ▼               │               ▼              │
│                    ┌─────────────────┐       │     ┌─────────────────┐      │
│                    │ Confirm Order   │       │     │ Release Stock   │      │
│                    │  (Completed)    │       │     │ Cancel Order    │      │
│                    └─────────────────┘       │     └─────────────────┘      │
│                                              │                              │
│                                              │ Failure (after payment)      │
│                                              ▼                              │
│                                    ┌─────────────────┐                      │
│                                    │ Refund Payment  │                      │
│                                    │ Release Stock   │                      │
│                                    │ Cancel Order    │                      │
│                                    └─────────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Outbox Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTBOX PATTERN FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────────────────────────┐                  │
│   │   Service   │      │         PostgreSQL              │                  │
│   │             │      │  ┌───────────┐  ┌────────────┐  │                  │
│   │  Business   │─────▶│  │  Domain   │  │   Outbox   │  │                  │
│   │   Logic     │  TX  │  │   Table   │  │   Table    │  │                  │
│   │             │      │  └───────────┘  └─────┬──────┘  │                  │
│   └─────────────┘      └──────────────────────┬─────────┘                   │
│                                               │                             │
│                                               │ CDC (Debezium)              │
│                                               ▼                             │
│                                        ┌─────────────┐                      │
│                                        │    Kafka    │                      │
│                                        │    Topic    │                      │
│                                        └──────┬──────┘                      │
│                                               │                             │
│                        ┌──────────────────────┼──────────────────────┐      │
│                        ▼                      ▼                      ▼      │
│                 ┌─────────────┐       ┌─────────────┐       ┌─────────────┐ │
│                 │  Consumer   │       │  Consumer   │       │  Consumer   │ │
│                 │  Service A  │       │  Service B  │       │  Service C  │ │
│                 └─────────────┘       └─────────────┘       └─────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. CQRS Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CQRS ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌─────────────┐                                    │
│                          │   Client    │                                    │
│                          └──────┬──────┘                                    │
│                                 │                                           │
│              ┌──────────────────┴──────────────────┐                        │
│              │                                     │                        │
│              ▼                                     ▼                        │
│   ┌──────────────────┐                  ┌──────────────────┐                │
│   │  Command Side    │                  │   Query Side     │                │
│   │                  │                  │                  │                │
│   │  ┌────────────┐  │                  │  ┌────────────┐  │                │
│   │  │  Commands  │  │                  │  │  Queries   │  │                │
│   │  └─────┬──────┘  │                  │  └─────┬──────┘  │                │
│   │        │         │                  │        │         │                │
│   │        ▼         │                  │        ▼         │                │
│   │  ┌────────────┐  │                  │  ┌────────────┐  │                │
│   │  │  Handlers  │  │                  │  │  Handlers  │  │                │
│   │  └─────┬──────┘  │                  │  └─────┬──────┘  │                │
│   │        │         │                  │        │         │                │
│   │        ▼         │                  │        ▼         │                │
│   │  ┌────────────┐  │   CDC/Events    │  ┌────────────┐  │                 │
│   │  │ PostgreSQL │──┼────────────────▶│  │Elasticsearch│  │                │
│   │  │  (Write)   │  │                  │  │   (Read)   │  │                │
│   │  └────────────┘  │                  │  └────────────┘  │                │
│   │                  │                  │                  │                │
│   └──────────────────┘                  └──────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Distributed Lock (Redis Redlock)

```typescript
// Example: Stock reservation with distributed lock
async reserveStock(productId: string, quantity: number) {
  const lockKey = `lock:inventory:${productId}`;
  const lock = await this.redlock.acquire([lockKey], 5000);
  
  try {
    const inventory = await this.inventoryRepo.findByProductId(productId);
    
    if (inventory.availableStock < quantity) {
      throw new InsufficientStockError();
    }
    
    inventory.reserve(quantity);
    await this.inventoryRepo.save(inventory);
    
  } finally {
    await lock.release();
  }
}
```

### 5. CDC (Change Data Capture) with Debezium

```yaml
# Debezium connector configuration
name: "product-connector"
config:
  connector.class: "io.debezium.connector.postgresql.PostgresConnector"
  database.hostname: "postgres"
  database.port: "5432"
  database.user: "debezium"
  database.password: "secret"
  database.dbname: "product_db"
  table.include.list: "public.products,public.outbox_events"
  transforms: "outbox"
  transforms.outbox.type: "io.debezium.transforms.outbox.EventRouter"
```

### 6. Query Optimization Techniques

- **Indexing Strategy:** B-tree, GIN, GiST indexes
- **Query Analysis:** EXPLAIN ANALYZE
- **Pagination:** Cursor-based pagination
- **N+1 Prevention:** DataLoader pattern
- **Read Replicas:** Separate read/write connections
- **Materialized Views:** Pre-computed aggregations
- **Connection Pooling:** PgBouncer

---

## 🏢 Infrastructure

### Turborepo Structure

```
📁 shopflow/
├── 📄 turbo.json
├── 📄 package.json
├── 📁 apps/
│   ├── 📁 web/                    # Next.js Customer Frontend
│   ├── 📁 admin/                  # Next.js Admin Dashboard
│   ├── 📁 gateway/                # gRPC-Gateway
│   ├── 📁 user-service/           # NestJS
│   ├── 📁 product-service/        # NestJS
│   ├── 📁 order-service/          # NestJS
│   ├── 📁 payment-service/        # NestJS
│   ├── 📁 inventory-service/      # NestJS
│   ├── 📁 notification-service/   # NestJS
│   ├── 📁 cart-service/           # NestJS
│   ├── 📁 search-service/         # NestJS
│   └── 📁 file-service/           # NestJS
├── 📁 packages/
│   ├── 📁 proto/                  # Shared protobuf definitions
│   ├── 📁 shared-types/           # Shared TypeScript types
│   ├── 📁 shared-utils/           # Shared utilities
│   ├── 📁 ui/                     # Shared UI components
│   ├── 📁 eslint-config/          # Shared ESLint config
│   └── 📁 tsconfig/               # Shared TypeScript config
├── 📁 infrastructure/
│   ├── 📁 docker/
│   │   └── 📄 docker-compose.yml
│   ├── 📁 kubernetes/
│   │   ├── 📁 base/
│   │   ├── 📁 overlays/
│   │   │   ├── 📁 development/
│   │   │   ├── 📁 staging/
│   │   │   └── 📁 production/
│   │   └── 📁 charts/             # Helm charts
│   └── 📁 terraform/              # AWS Infrastructure
│       ├── 📁 modules/
│       │   ├── 📁 eks/
│       │   ├── 📁 rds/
│       │   ├── 📁 elasticache/
│       │   └── 📁 msk/
│       └── 📁 environments/
│           ├── 📁 dev/
│           ├── 📁 staging/
│           └── 📁 prod/
└── 📁 tools/
    ├── 📁 scripts/
    └── 📁 generators/
```

### Kubernetes Resources

```yaml
# Example: Order Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: shopflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-service
          image: shopflow/order-service:latest
          ports:
            - containerPort: 50051  # gRPC
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: order-service-secrets
                  key: database-url
            - name: KAFKA_BROKERS
              value: "kafka-0.kafka:9092,kafka-1.kafka:9092"
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: order-service-secrets
                  key: redis-url
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### NGINX Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shopflow-ingress
  namespace: shopflow
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.shopflow.com
        - www.shopflow.com
        - admin.shopflow.com
      secretName: shopflow-tls
  rules:
    - host: api.shopflow.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grpc-gateway
                port:
                  number: 8080
    - host: www.shopflow.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 3000
    - host: admin.shopflow.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: admin
                port:
                  number: 3001
```

---

## 📅 Development Phases

### Phase 1: Foundation (Weeks 1-2)

- [ ] **Setup Turborepo monorepo structure**
- [ ] **Configure shared packages (proto, types, utils)**
- [ ] **Setup Docker Compose for local development**
  - PostgreSQL (multiple instances)
  - Redis Cluster
  - Kafka + Zookeeper
  - MinIO
  - Elasticsearch
- [ ] **Create base NestJS service template**
  - Clean Architecture folder structure
  - gRPC setup
  - Database connection (TypeORM/Prisma)
  - Kafka integration

### Phase 2: Core Services (Weeks 3-5)

- [ ] **User Service**
  - User registration/login
  - JWT authentication
  - gRPC endpoints
  - DDD implementation
  
- [ ] **Product Service**
  - Product CRUD
  - Category management
  - MinIO file upload
  - Outbox pattern implementation
  - CDC setup with Debezium

- [ ] **Cart Service**
  - Redis-based cart
  - Cart operations
  - gRPC endpoints

### Phase 3: Order Flow & Saga (Weeks 6-8)

- [ ] **Inventory Service**
  - Stock management
  - Distributed lock implementation
  - Reserve/Release operations

- [ ] **Order Service**
  - Order management
  - **Saga Orchestrator implementation**
  - State machine

- [ ] **Payment Service**
  - Payment processing
  - Refund handling
  - Saga participant

### Phase 4: Supporting Services (Weeks 9-10)

- [ ] **Notification Service**
  - Email/SMS/Push handlers
  - Kafka consumers
  - Template management

- [ ] **Search Service**
  - Elasticsearch integration
  - CDC consumer
  - Full-text search API

- [ ] **gRPC-Gateway**
  - HTTP → gRPC translation
  - API documentation

### Phase 5: Frontend (Weeks 11-12)

- [ ] **Next.js Customer Web App**
  - Product browsing
  - Shopping cart
  - Checkout flow
  - Order history

- [ ] **Next.js Admin Dashboard**
  - Product management
  - Order management
  - Analytics

### Phase 6: Kubernetes & AWS (Weeks 13-15)

- [ ] **Local Kubernetes (minikube/kind)**
  - Deploy all services
  - ConfigMaps & Secrets
  - NGINX Ingress setup

- [ ] **AWS Infrastructure (Terraform)**
  - EKS cluster
  - RDS PostgreSQL
  - ElastiCache Redis
  - MSK Kafka
  - S3 bucket

- [ ] **CI/CD Pipeline**
  - GitHub Actions
  - Docker image builds
  - Kubernetes deployments

### Phase 7: Optimization & Monitoring (Weeks 16-17)

- [ ] **Query Optimization**
  - Index optimization
  - Query analysis
  - Connection pooling

- [ ] **Monitoring & Observability**
  - Prometheus + Grafana
  - Distributed tracing (Jaeger)
  - Log aggregation (ELK)

- [ ] **Performance Testing**
  - Load testing (k6)
  - Stress testing

---

## 🎓 Learning Objectives

### By completing this project, you will learn:

#### gRPC & Communication
- [ ] Define protobuf schemas
- [ ] Implement gRPC servers and clients in NestJS
- [ ] Setup gRPC-Gateway for REST compatibility
- [ ] Handle gRPC streaming

#### Microservices & Kafka
- [ ] Design service boundaries
- [ ] Implement async communication with Kafka
- [ ] Handle message ordering and partitioning
- [ ] Implement dead letter queues

#### Distributed Patterns
- [ ] **Saga Pattern**: Orchestrate distributed transactions
- [ ] **Distributed Lock**: Implement Redlock algorithm
- [ ] **Outbox Pattern**: Ensure reliable event publishing
- [ ] **CDC**: Capture and propagate data changes

#### Redis
- [ ] Configure Redis Sentinel for HA
- [ ] Setup Redis Cluster for scaling
- [ ] Implement caching strategies
- [ ] Use Redis for session storage

#### PostgreSQL
- [ ] Design normalized schemas
- [ ] Implement complex queries
- [ ] Optimize with indexes
- [ ] Use transactions effectively

#### Clean Architecture & DDD
- [ ] Structure code in layers
- [ ] Identify bounded contexts
- [ ] Implement aggregates and entities
- [ ] Apply domain events

#### CQRS
- [ ] Separate command and query models
- [ ] Implement read-optimized views
- [ ] Sync data between models

#### Infrastructure
- [ ] Deploy to Kubernetes
- [ ] Configure NGINX Ingress
- [ ] Use Helm for packaging
- [ ] Provision AWS resources with Terraform

---

## 📚 Resources

### Documentation
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [gRPC](https://grpc.io/docs/)
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [Debezium](https://debezium.io/documentation/)
- [Redis](https://redis.io/documentation)
- [Kubernetes](https://kubernetes.io/docs/)
- [Turborepo](https://turbo.build/repo/docs)

### Books
- "Building Microservices" by Sam Newman
- "Domain-Driven Design" by Eric Evans
- "Designing Data-Intensive Applications" by Martin Kleppmann

---

## 🚦 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/shopflow.git

# Install dependencies
pnpm install

# Start infrastructure (Docker Compose)
pnpm infra:up

# Run all services in development
pnpm dev

# Run specific service
pnpm dev --filter=order-service

# Build all services
pnpm build

# Run tests
pnpm test
```

---

**Happy Learning! 🎉**

> "The best way to learn is by building. Start with Phase 1 and progress through each phase, taking time to understand each pattern and technology deeply."

