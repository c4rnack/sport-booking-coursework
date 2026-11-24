# PULSAR — Sports Facility & Section Booking Platform

## A full-stack web application for managing and booking services across a network of sport centers. Built with **NestJS**, **Vue.js**, **PostgreSQL**, and **Prisma ORM**

This project was developed for educational purposes for "Software Documentation and Design Patterns"

## Project Structure and GoF Patterns

```text
sport-booking-coursework/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── catalog/
│   │   ├── patterns/
│   │   ├── prisma/
│   │   ├── users/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.ts
    │   ├── components/
    │   │   ├── AppHeader.vue
    │   │   ├── AppFooter.vue
    │   │   ├── BookingModal.vue
    │   │   ├── CatalogFilters.vue
    │   │   ├── LoyaltyCard.vue
    │   │   ├── PromoBanners.vue
    │   │   └── SectionCard.vue
    │   ├── router/index.ts
    │   ├── stores/auth.ts
    │   ├── types/index.ts
    │   └── views/
    │       ├── HomeView.vue
    │       ├── CatalogView.vue
    │       ├── AuthView.vue
    │       ├── ProfileView.vue
    │       └── AdminView.vue
    └── .env.example
```
This project uses 5 GoF design patterns:
* Factory Method
* Decorator
* Strategy
* Observer
* Facade

## How to run?

###Prerequisities
* **Node.js** v18+ and **npm** v9+
* **PostgreSQL** v14+ (local instance or cloud-hosted database)

### 1. Clone the Repository
```bash
git clone https://github.com/c4rnack/sport-booking-coursework
cd sport-booking-coursework
```
### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` based on `.env.example`:
```env
DATABASE_URL="your_postgresql_db_link_here"
JWT_SECRET="your-super-secret-key"
PORT=3000
```

Run database migrations, generate the Prisma client:
```bash
npx prisma migrate dev
npx prisma generate
```

Run this if you want to seed test data:
```bash
npx tsx prisma/seed.ts
```

Start the backend development server:
```bash
npm run start:dev
```
The API will be available at `http://localhost:3000/api` and interactive Swagger docs at `http://localhost:3000/api/docs`.

### 3. Frontend Setup
Open a second terminal from the repository root:
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` based on `.env.example`:
```env
API_URL="your_api_url_here"
```

Start the frontend development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.
