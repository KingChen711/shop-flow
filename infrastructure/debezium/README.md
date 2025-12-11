# Debezium CDC Configuration

This folder contains Debezium connector configurations for Change Data Capture (CDC).

## What is CDC?

Change Data Capture (CDC) is a pattern that captures changes in a database and streams them to other systems. Debezium reads the PostgreSQL WAL (Write-Ahead Log) and publishes changes to Kafka.

## How it works

```
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PostgreSQL    │───▶│  Debezium   │───▶│    Kafka    │───▶│  Consumers  │
│  (product_db)   │    │  Connector  │    │   Topics    │    │  (Search,   │
│                 │    │             │    │             │    │   etc.)     │
└─────────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Connectors

### product-connector.json

Captures changes from the product database:

- `products` table → `product.public.products` topic
- `categories` table → `product.public.categories` topic
- `outbox_events` table → Routed to specific topics based on aggregate type

## Usage

### Register a connector

```bash
# Register the product connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @product-connector.json
```

### List connectors

```bash
curl http://localhost:8083/connectors
```

### Check connector status

```bash
curl http://localhost:8083/connectors/product-connector/status
```

### Delete a connector

```bash
curl -X DELETE http://localhost:8083/connectors/product-connector
```

## Outbox Pattern with Debezium

The Outbox pattern uses Debezium to capture events from the `outbox_events` table:

1. Service writes to `outbox_events` table (same transaction as domain changes)
2. Debezium captures the insert from PostgreSQL WAL
3. EventRouter transform routes events to appropriate Kafka topics
4. Events are deleted from outbox after processing

## Topics Created

After registering the connector, these topics are created:

- `product.public.products` - Product table changes
- `product.public.categories` - Category table changes
- `Product.events` - Product domain events (from outbox)
- `Category.events` - Category domain events (from outbox)

## Prerequisites

1. PostgreSQL must have `wal_level = logical`
2. User must have REPLICATION permission
3. Tables must have PRIMARY KEY for CDC to work properly

## Troubleshooting

### Check Debezium logs

```bash
docker logs shopflow-debezium
```

### Check if WAL level is correct

```sql
SHOW wal_level;  -- Should be 'logical'
```

### Restart connector

```bash
curl -X POST http://localhost:8083/connectors/product-connector/restart
```
