# ResourceHub – Resource Reservation Management System

## Overview

ResourceHub is a full-stack web application developed as part of the PrimeWave Lab Software Engineering Internship Assessment.

The system provides a centralized way to manage resources and reservations. It allows users to view available resources, create reservations, manage existing bookings, and cancel reservations when needed.

The application also uses database-level constraints to prevent overlapping confirmed reservations for the same resource.

**Live Demo:** [Open ResourceHub](https://resourcehub-qtq94yw42-amanga43s-projects.vercel.app/)
## Features

- **Dashboard:** View an overview of resources and reservations.
- **Resource Management:** View and manage resource information.
- **Reservation Management:** Create and view reservations.
- **Reservation Cancellation:** Cancel existing reservations.
- **Conflict Prevention:** Prevent overlapping confirmed reservations for the same resource.
- **Database Integration:** Store and retrieve application data using PostgreSQL.
- **REST API:** Use backend API routes to manage resources and reservations.

## Technologies Used

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Database Driver:** Node.js PostgreSQL client (`pg`)
- **Styling:** CSS
- **Development Tools:** Visual Studio Code, Git, GitHub

## Prerequisites

Before running the application, ensure that you have installed:

- Node.js (a version compatible with the project)
- npm
- Access to a PostgreSQL database
- Git (optional, for cloning the repository)

## Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd resourcehub
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the actual URL of your GitHub repository.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root directory.

Add the PostgreSQL connection settings required by `src/lib/db.ts`.

For example, if your database module uses `DATABASE_URL`:

```env
DATABASE_URL=your_postgresql_connection_string
```

Use the actual variable name expected by your application. Replace the example value with your own database connection string.

**Security:** Never commit `.env.local` or publish database credentials in the repository.

### 4. Set up the database

Ensure that the PostgreSQL database is available and that the required tables and constraints have been created.

The database schema must include the resource and reservation data required by the application. The reservation conflict-prevention constraint must also be configured.

Use the project's database schema or setup instructions to initialize the database.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

If port 3000 is already in use, use the alternative local URL shown in the terminal.

## API Endpoints

The application provides API routes for resource and reservation operations.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/resources` | Retrieve resources |
| POST | `/api/resources` | Create a resource |
| GET | `/api/resources/[id]` | Retrieve a specific resource |
| PATCH | `/api/resources/[id]` | Update a resource |
| DELETE | `/api/resources/[id]` | Delete a resource |
| GET | `/api/reservations` | Retrieve reservations |
| POST | `/api/reservations` | Create a reservation |
| PATCH | `/api/reservations/[id]` | Update or cancel a reservation, according to the supported request action |
| GET | `/api/db-test` | Test the database connection |

The exact supported request fields and actions are defined in the corresponding API route implementations.

## Reservation Conflict Prevention

ResourceHub uses PostgreSQL to maintain reservation data and prevent overlapping confirmed reservations for the same resource.

This database-level protection helps maintain data consistency when conflicting reservation requests are submitted.

## Project Structure

```text
resourcehub/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── db-test/
│   │   │   ├── resources/
│   │   │   └── reservations/
│   │   ├── reservations/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AppAlert.tsx
│   │   └── AppShell.tsx
│   └── lib/
│       └── db.ts
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

## Running and Building

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server after a successful build:

```bash
npm run start
```

## Future Improvements

Potential improvements include user authentication, role-based access control, enhanced reservation availability views, and automated testing.

## Author

Developed as part of the PrimeWave Lab Software Engineering Internship Assessment.

## License

This project was created for assessment purposes.
