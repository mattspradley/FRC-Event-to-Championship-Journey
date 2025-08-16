# Overview

FIRST Robotics Championship Tracker is a comprehensive web platform designed to track FIRST Robotics Competition teams and their championship qualification status. The application allows users to select events, view participating teams, and monitor their qualification status (qualified, waitlisted, or not qualified) for championship events. It features a detailed Team Storyboard that tracks a team's complete journey throughout the season, displaying their performance metrics, awards, and event participation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React with TypeScript using Vite as the build tool and bundler. The application leverages a modern component-based architecture with:

- **Routing**: Wouter for client-side routing with two main routes - home page for event/team listing and team storyboard for detailed team tracking
- **State Management**: React Query (TanStack Query) for server state management with built-in caching and data synchronization
- **UI Framework**: Custom component library built on Radix UI primitives with Tailwind CSS for styling
- **Styling**: Tailwind CSS with a professional theme configuration and shadcn/ui design system
- **Form Handling**: React Hook Form with Zod validation schemas

**Component Structure**: Modular component architecture with reusable UI components (EventSelector, TeamCard, StatusDashboard, etc.) that handle specific functionality domains.

## Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js, designed for deployment on Replit with automatic build and deployment processes.

**API Design**: RESTful API structure with endpoints organized by functionality:
- Event management (`/api/events`, `/api/search/events`)
- Team data (`/api/teams`, `/api/team-storyboard`)
- Version information (`/api/version`)

**Data Layer**: In-memory storage implementation with interface-based design allowing for future database integration. The storage layer handles caching of external API responses and maintains application state.

**External API Integration**: Primary integration with The Blue Alliance API for FIRST Robotics Competition data, including comprehensive caching layer (4-hour cache duration) to minimize API calls and improve performance.

## Database Architecture

**Current Implementation**: Memory-based storage with defined schema for future PostgreSQL migration using Drizzle ORM.

**Schema Design**: Well-defined entities for users, events, teams, event-team relationships, and API caching with proper foreign key relationships and data validation.

**Migration Strategy**: Drizzle configuration prepared for PostgreSQL deployment with migration scripts and schema management.

## Authentication & Authorization

**Current State**: Basic user schema defined but authentication not yet implemented in the current version.

**Planned Architecture**: Session-based authentication with PostgreSQL session storage using connect-pg-simple.

# External Dependencies

## Third-Party APIs

**The Blue Alliance API**: Primary data source for FIRST Robotics Competition information including events, teams, rankings, awards, and match data. Requires `TBA_API_KEY` environment variable for authentication.

## Analytics & Monitoring

**Google Analytics**: Integrated with measurement ID `G-NXRCBSBYE3` for user behavior tracking and page view analytics. The tracking is implemented client-side with custom event tracking for user interactions.

## Build & Deployment

**Replit Platform**: Designed specifically for Replit deployment with automatic build processes, environment variable management, and integrated development tooling.

**Build Tools**: 
- Vite for frontend bundling with React, TypeScript, and Tailwind CSS
- ESBuild for server-side TypeScript compilation
- Custom deployment script for version management and build automation

## UI & Styling Dependencies

**Component Libraries**: 
- Radix UI for accessible, unstyled component primitives
- Tailwind CSS for utility-first styling approach
- Recharts for data visualization and performance metrics
- Lucide React for consistent iconography

**Development Tools**:
- TypeScript for type safety across client and server
- Drizzle Kit for database schema management
- Various Radix UI components for complex UI patterns (dialogs, dropdowns, tooltips, etc.)

## Environment Configuration

**Required Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string (for future database integration)
- `TBA_API_KEY`: The Blue Alliance API authentication key
- `GOOGLE_ANALYTICS_ID`: Google Analytics tracking identifier (optional)

**Version Management**: Automated version tracking system that updates build numbers, commit hashes, and release information during deployment.