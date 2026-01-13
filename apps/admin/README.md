# ShopFlow Admin Dashboard

A modern admin dashboard for managing the ShopFlow e-commerce platform, built with Next.js 16, React 19, and Tailwind CSS.

## Features

- **Dashboard**: Overview of store performance with key metrics and charts
- **Products Management**: Full CRUD operations for products
- **Orders Management**: View and manage customer orders
- **Customers**: Customer management and insights
- **Analytics**: Business performance insights and reports
- **Notifications**: Real-time alerts and notifications
- **Settings**: Store configuration

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Monorepo**: Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Run the admin dashboard
pnpm dev --filter=admin
```

Or navigate to the admin directory:

```bash
cd apps/admin
pnpm dev
```

The admin dashboard will be available at [http://localhost:3001](http://localhost:3001).

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

| Variable                           | Description               | Default                      |
| ---------------------------------- | ------------------------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL`              | API Gateway URL           | `http://localhost:5000`      |
| `NEXT_PUBLIC_AUTH_URL`             | Authentication URL        | `http://localhost:5000/auth` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS`     | Enable analytics features | `true`                       |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | Enable notifications      | `true`                       |

## Project Structure

```
apps/admin/
├── app/                    # Next.js App Router pages
│   ├── analytics/         # Analytics page
│   ├── customers/         # Customers page
│   ├── notifications/     # Notifications page
│   ├── orders/            # Orders management
│   ├── products/          # Products management
│   ├── settings/          # Settings page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── analytics/         # Analytics components
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Layout components
│   ├── orders/            # Orders components
│   ├── products/          # Products components
│   └── ui/                # UI primitives
├── lib/                   # Utilities and API
│   ├── api/               # API client and services
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## API Integration

The dashboard connects to the ShopFlow API Gateway. Configure the API URL in your environment variables.

### API Endpoints Used

- `GET /api/products` - List products
- `GET /api/orders` - List orders
- `GET /api/analytics/*` - Analytics data
- `GET /api/customers` - Customer data

## Development

### Available Scripts

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type checking
pnpm check-types
```

## License

MIT
