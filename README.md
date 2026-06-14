# WMS — Warehouse Management System

A production-ready Warehouse Management System for small to medium businesses, built with **Angular 20**, **NestJS 10**, **PostgreSQL 16**, and **Docker Compose**.

## Features

### Warehouse Operations
- **Warehouse hierarchy** — Manage warehouses, zones (with zone types), and bin locations (with location types) in a 3-level tree
- **Bulk CSV import** — Import bin locations via drag-and-drop CSV upload with row validation
- **Receiving workflow** — Create purchase orders with status machine: `draft → in-progress → completed / cancelled`
- **Shipping workflow** — Create sales orders with status machine: `draft → picking → packing → shipped / cancelled`
- **Inventory management** — View stock levels, low-stock alerts, and manual adjustments

### Product Management
- **Products** — SKU-based product catalog with descriptions and status tracking
- **Categories** — Materialized-path tree hierarchy with parent-child relationships
- **Units of Measure** — Configurable UOM collection per product
- **Barcodes** — Multiple barcode support per product

### Access Control
- **JWT authentication** — Access + refresh token flow with auto-refresh
- **Role-based access** — Admin, Manager, Operator roles
- **Permission system** — Granular permissions per resource (create, read, update, delete)
- **Registration** — Self-registration with auto-assigned Operator role

### User Interface
- **Standalone Angular 20** — Lazy-loaded routes, Material Design components
- **Dashboard** — KPI cards for key warehouse metrics
- **Admin panel** — Tabbed view for user and role management
- **Responsive design** — Works on desktop and tablet
- **Swagger docs** — Interactive API documentation at `/api/docs`

## Tech Stack

| Layer       | Technology                                     |
|-------------|-----------------------------------------------|
| Frontend    | Angular 20, Angular Material, RxJS            |
| Backend     | NestJS 10, TypeORM, Passport JWT, CQRS        |
| Database    | PostgreSQL 16                                 |
| Container   | Docker Compose (dev + prod profiles)          |
| Testing     | Jest (backend), Jasmine/Karma (frontend)      |

## Architecture

```
backend/
  src/
    api/             # Controllers, DTOs, guards, interceptors
    application/     # Services, CQRS handlers
    domain/          # Entities, value objects, aggregates
    infrastructure/  # Persistence, repositories, migrations
frontend/
  src/
    app/
      core/          # Auth, HTTP interceptors, guards
      features/      # Lazy-loaded route components
      layouts/       # Main layout with sidenav/toolbar
      shared/        # Models, dialogs, pipes
```

The backend follows **Clean Architecture** and **Domain-Driven Design** principles with explicit separation between API, application, domain, and infrastructure layers.

## Quick Start

Prerequisites: [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

```bash
# Clone the repository
git clone https://github.com/asmitrofanov74/wms.git
cd wms

# Start all services in development mode
docker compose up -d

# Services will be available at:
#   Frontend: http://localhost:4200
#   Backend:  http://localhost:3000
#   API Docs: http://localhost:3000/api/docs
```

The first startup will build Docker images, install dependencies, and seed the database with initial data (three users, three roles, 44 permissions).

## Seeded Credentials

| Role      | Email                 | Password      |
|-----------|----------------------|---------------|
| Admin     | admin@wms.com        | admin123      |
| Manager   | manager@wms.com      | manager123    |
| Operator  | operator@wms.com     | operator123   |

## Scripts

### Root

| Command               | Description                |
|-----------------------|----------------------------|
| `docker compose up -d`  | Start all dev services     |
| `docker compose down`   | Stop all services          |

### Backend

```bash
cd backend
npm run start:dev    # Start dev server with hot-reload
npm run test         # Run unit tests (104 tests)
npm run build        # Build for production
```

### Frontend

```bash
cd frontend
npm run start        # Start Angular dev server
npm run test         # Run unit tests (97 tests)
npm run build        # Build for production
```

## Production Deployment

```bash
# Set required environment variables
export DB_PASSWORD=your_secure_password
export JWT_SECRET=your_jwt_secret
export JWT_REFRESH_SECRET=your_refresh_secret

# Start production services
docker compose -f docker-compose.prod.yml up -d

# Frontend served on port 80, backend on port 3000
```

## API Endpoints

| Module       | Endpoints                                            |
|--------------|-------------------------------------------------------|
| Auth         | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me` |
| Users        | `GET/POST /api/v1/users`, `GET/PUT/DELETE /api/v1/users/:id` |
| Roles        | `GET/POST /api/v1/roles`, `GET/PUT/DELETE /api/v1/roles/:id`, `GET /api/v1/roles/permissions` |
| Warehouses   | `GET/POST /api/v1/warehouses`, `GET/PUT/DELETE /api/v1/warehouses/:id` |
| Zones        | `GET/POST /api/v1/warehouses/:id/zones`, `GET/PUT/DELETE /api/v1/zones/:id` |
| Locations    | `GET/POST /api/v1/zones/:id/locations`, `GET/PUT/DELETE /api/v1/locations/:id`, `POST /api/v1/locations/import` |
| Products     | `GET/POST /api/v1/products`, `GET/PUT/DELETE /api/v1/products/:id` |
| Categories   | `GET/POST /api/v1/categories`, `GET/PUT/DELETE /api/v1/categories/:id` |
| Receiving    | `GET/POST /api/v1/receiving`, `GET/PUT /api/v1/receiving/:id`, `PUT /api/v1/receiving/:id/receive` |
| Shipping     | `GET/POST /api/v1/shipping`, `GET/PUT /api/v1/shipping/:id`, `PUT /api/v1/shipping/:id/pick`, `PUT /api/v1/shipping/:id/pack`, `PUT /api/v1/shipping/:id/ship` |
| Inventory    | `GET /api/v1/inventory`, `POST /api/v1/inventory/adjust` |

Full interactive documentation available at `http://localhost:3000/api/docs` when the backend is running.

## Testing

- **Backend**: 104 unit tests across 10 suites (auth, users, roles, warehouses, zones, locations, products, categories, receiving, shipping)
- **Frontend**: 97 unit tests across 12 suites (components, services, guards, interceptors)

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## License

[MIT](LICENSE)
