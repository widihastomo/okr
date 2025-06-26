# OKR Management System

## Overview

This is a full-stack web application for managing Objectives and Key Results (OKRs). The system allows users to create, track, and manage organizational objectives with measurable key results. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence through Drizzle ORM.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives with custom styling via Tailwind CSS
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: Custom component system built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query for server state, local React state for UI state

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (using Neon serverless in production)
- **API Design**: RESTful API with JSON responses
- **Development**: Hot reloading with Vite middleware integration

### Database Schema
The system uses two main entities:
- **Objectives**: Contains title, description, timeframe, owner, and status
- **Key Results**: Linked to objectives, tracks current/target values with units, key result types, and status
- **Types**: Support for various measurement units (number, percentage, currency)
- **Key Result Types**: Three calculation methods for different goal types:
  - `increase_to`: Traditional progress calculation (current/target * 100)
  - `decrease_to`: Inverse progress calculation (target/current * 100)
  - `achieve_or_not`: Binary achievement (100% when target is met, 0% otherwise)

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data from the API
2. **API Layer**: Express routes handle HTTP requests and validate input using Zod schemas
3. **Business Logic**: Storage layer abstracts database operations
4. **Database**: Drizzle ORM executes type-safe PostgreSQL queries
5. **Response**: JSON data flows back through the layers to update the UI

The application supports both in-memory storage (for development) and PostgreSQL storage (for production).

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for production
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitive components
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development Mode
- Runs with `npm run dev` using TSX for TypeScript execution
- Vite middleware serves the frontend with hot module replacement
- Express server handles API routes and serves static files in production

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles the server code for Node.js execution
- Database: Connects to PostgreSQL via environment variables
- Deployment: Configured for Replit's autoscale deployment target

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string (required for production)
- **Port Configuration**: Server runs on port 5000, exposed as port 80

## Changelog
```
Changelog:
- June 26, 2025. Initial setup
```

## User Preferences

Preferred communication style: Simple, everyday language.