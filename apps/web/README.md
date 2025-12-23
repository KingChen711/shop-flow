# ShopFlow Customer Web App

A modern e-commerce storefront built with Next.js 16, React 19, and Tailwind CSS.

## Features

- **Product Browsing**: Browse products with filters, search, and sorting
- **Product Details**: View detailed product information, specifications, and reviews
- **Shopping Cart**: Add items, update quantities, persistent cart storage
- **Checkout Flow**: Multi-step checkout with shipping and payment
- **Order History**: View past orders and track shipments
- **Responsive Design**: Mobile-first, works on all devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library
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

# Run the web app
pnpm dev --filter=web
```

Or navigate to the web directory:

```bash
cd apps/web
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── account/           # Account & orders pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── products/          # Product listing & details
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── layout/            # Header, Footer
│   ├── products/          # Product components
│   └── ui/                # UI primitives
├── lib/                   # Utilities and API
│   ├── api/               # API client and services
│   └── utils.ts           # Utility functions
├── store/                 # Zustand stores
│   └── cart-store.ts      # Cart state management
└── public/                # Static assets
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server on port 3000

# Building
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run unit tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Run ESLint
pnpm check-types      # Run TypeScript check
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with featured products |
| `/products` | Product listing with filters |
| `/products/[id]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/checkout/success` | Order confirmation |
| `/account` | User account |
| `/account/orders` | Order history |

## Cart Storage

The cart uses Zustand with localStorage persistence. Cart data survives page refreshes and browser restarts.

## API Integration

The app includes a complete API client ready for backend integration:

- `productsApi` - Product operations
- `ordersApi` - Order management
- `cartApi` - Server-side cart (optional)
- `authApi` - Authentication

Currently using mock data; connect to ShopFlow API Gateway for full functionality.

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test cart-store.test.ts
```

## License

MIT
