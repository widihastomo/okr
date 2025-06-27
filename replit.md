# OKR Management System

## Overview

This is a full-stack web application for managing Objectives and Key Results (OKRs). The system allows users to create, track, and manage organizational objectives with measurable key results. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence through Drizzle ORM.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: User and team management with role-based access control
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
The system uses multiple interconnected entities:
- **Users**: Manages user accounts with roles (admin, manager, member), authentication data, and profile information
- **Teams**: Organization groups with owners, descriptions, and member management
- **Team Members**: Junction table linking users to teams with specific roles
- **Cycles**: Time-based containers (monthly, quarterly, annual) for organizing objectives
- **Templates**: Reusable OKR structures for common objective patterns
- **Objectives**: Contains title, description, timeframe, owner, and status
- **Key Results**: Linked to objectives, tracks current/target values with units, key result types, and assigned users
- **Types**: Support for various measurement units (number, percentage, currency)
- **Key Result Types**: Three calculation methods for different goal types:
  - `increase_to`: Traditional progress calculation ((Current - Baseline) / (Target - Baseline)) * 100%
  - `decrease_to`: Reverse progress calculation ((Baseline - Current) / (Baseline - Target)) * 100%
  - `achieve_or_not`: Binary achievement (100% if achieved, 0% if not)

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
- June 26, 2025. Added comprehensive user and team management system:
  * Database schema extended with users, teams, and team members tables
  * Full CRUD API endpoints for user and team operations
  * User management interface with role-based permissions (admin, manager, member)
  * Team creation and management functionality
  * Team member assignment and role management
  * Database storage implementation with PostgreSQL
  * Updated navigation to include Users page
- June 26, 2025. Implemented complete authentication system:
  * Full Replit Auth/OpenID Connect integration
  * Session management with PostgreSQL storage
  * Protected API routes with authentication middleware
  * Landing page for unauthenticated users
  * Home page for authenticated users with logout functionality
  * Conditional routing based on authentication status
  * Auth hooks and error handling utilities
  * Fixed sidebar duplication issue
- June 27, 2025. Completed comprehensive UUID migration:
  * Migrated all ID fields from integer to UUID format for enhanced security
  * Updated database schema with uuid() primary keys and defaultRandom()
  * Rebuilt database with PostgreSQL UUID support
  * Created sample data with predefined UUIDs for testing
  * Fixed Create OKR form validation and TypeScript errors
  * Updated API endpoints to handle UUID string parameters
  * Enhanced system security with non-sequential, cryptographically secure identifiers
- June 27, 2025. Fixed sidebar layout and positioning:
  * Implemented full-height fixed sidebar from top to bottom
  * Added proper header spacer to prevent content overlap
  * Fixed z-index layering between header and sidebar
  * Configured dashboard as the default index page
  * Enhanced responsive layout for mobile and desktop views
- June 27, 2025. Standardized button styling across all components:
  * Updated all primary buttons to use consistent blue color scheme (bg-blue-600, hover:bg-blue-700)
  * Applied uniform styling with rounded corners and smooth transitions
  * Replaced bg-primary references with explicit blue colors for visual consistency
  * Enhanced user interface cohesion matching sidebar navigation styling
- June 27, 2025. Implemented comprehensive automatic status tracking system:
  * Added progress tracking calculations with "on_track", "at_risk", "behind", "completed" status values
  * Created automatic status calculation based on ideal progress achievement ratios
  * Integrated progress-tracker.ts module for real-time status updates
  * Added API endpoints for progress updates and bulk status recalculation
  * Enhanced frontend with status badges and visual indicators for Key Results
  * Implemented "Update Status" button for manual refresh of all status calculations
  * Status automatically updates when Key Result progress is modified via check-ins
- June 27, 2025. Enhanced progress bars with threshold indicators:
  * Added timeProgressPercentage field to database schema for storing ideal progress calculations
  * Implemented real-time ideal progress calculation based on current date and Key Result timeline
  * Enhanced progress bars with gray vertical threshold indicators showing ideal achievement levels
  * Added visual legend explaining current progress vs ideal target relationship
  * Fixed threshold calculation to use live timeline data rather than stored values
  * Progress bars now accurately show where teams should be based on time elapsed
- June 27, 2025. Implemented precise gap-based status calculation formula:
  * Updated progress tracking to use exact formula: ideal_progress = (time_passed / total_time) * 100
  * Implemented gap calculation: gap = progress - ideal_progress for accurate status determination
  * Enhanced status logic: Completed (≥100%), Ahead (gap ≥0%), On Track (gap = 0%), At Risk (-20% ≤ gap < 0%), Behind (gap < -20%)
  * Added "ahead" status support with blue visual indicators for teams exceeding timeline expectations
  * Integrated precise gap percentages in recommendations for actionable insights
  * Validated formula accuracy through comprehensive testing scenarios
```

## User Preferences

Preferred communication style: Simple, everyday language.