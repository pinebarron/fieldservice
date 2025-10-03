# FieldCapture - Work Log Management System

## Overview

FieldCapture is a field service management web application designed for solar and industrial industries. It enables businesses to manage their service teams and track work performed at customer sites with comprehensive documentation including images and reports. The application features multi-user authentication via Replit Auth, business account management, employee/crew management, and work log creation with file uploads. Built with a modern React frontend, Express backend, PostgreSQL database via Drizzle ORM, and Replit Object Storage for file uploads.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)

### Multi-Tenancy & Business Accounts
- Implemented business account system where each business owner can sign up and create their business
- Added employee management for businesses to add and manage crew members
- Work logs are now scoped to businesses with technician selection from business members
- Business owners automatically become members of their business when created

### Authentication & User Management
- Integrated Replit Auth for multi-provider authentication (Google, GitHub, X, Apple, email/password)
- Session-based authentication with PostgreSQL session storage
- User profiles with firstName, lastName, email, and profile images
- Landing page with login flow and business onboarding for new users

### Database Schema Updates
- Migrated from in-memory storage to PostgreSQL with Drizzle ORM
- Added `users` table for Replit Auth integration
- Added `businesses` table for business accounts
- Added `business_members` junction table for employee management
- Updated `work_logs` table to use `businessId` and `technicianUserId` foreign keys
- Work logs now join with users to display technician full names

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type safety and modern component patterns
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing

**UI Component Library**
- Radix UI primitives for accessible, unstyled component foundations
- shadcn/ui component system with "new-york" styling variant
- Tailwind CSS for utility-first styling with CSS variables for theming
- Custom design tokens defined in CSS variables for consistent theming

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and synchronization
- No global state management library - leveraging React Query's built-in caching
- Custom `queryClient` configuration with infinite stale time and disabled refetching

**File Upload**
- Uppy file uploader with AWS S3 integration for direct-to-storage uploads
- Dashboard modal interface for file management
- Custom `ObjectUploader` component wrapper for simplified integration

**Form Handling**
- React Hook Form for performant form state management
- Zod for runtime schema validation integrated via @hookform/resolvers
- Form validation schemas derived from database schemas for consistency

### Backend Architecture

**Server Framework**
- Express.js running on Node.js with TypeScript
- ESM module system throughout the codebase
- Custom middleware for JSON body parsing with raw body preservation (for webhook verification)
- Request/response logging middleware for API endpoints

**API Design**
- RESTful API endpoints under `/api` prefix
- Authentication endpoints: `/api/login`, `/api/logout`, `/api/auth/user`
- Business endpoints: `POST /api/business` (create), `GET /api/business` (get user's business)
- Employee management: `POST /api/business/members` (add employee), `GET /api/business/members` (list), `DELETE /api/business/members/:id` (remove)
- Work log endpoints: `POST /api/work-logs` (create), `GET /api/work-logs` (list with filters), `GET /api/work-logs/:id` (get), `PATCH /api/work-logs/:id` (update), `DELETE /api/work-logs/:id` (delete)
- Statistics endpoint: `GET /api/stats` for dashboard metrics
- All work log and business endpoints require authentication via `isAuthenticated` middleware
- Business-scoped queries automatically filter by user's business

**Development Setup**
- Vite middleware integration in development mode for HMR
- Replit-specific plugins for error overlays, cartographer, and dev banner
- Production build bundles both client (Vite) and server (esbuild)

### Data Storage

**Database**
- PostgreSQL as the primary database (via Neon serverless driver)
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with TypeScript types inferred from schema

**Database Schema**
- `users` table: User accounts from Replit Auth (id, email, firstName, lastName, profileImageUrl, timestamps)
- `sessions` table: Session storage for Replit Auth (required for authentication)
- `businesses` table: Business accounts (id, name, ownerId, timestamps)
- `business_members` table: Junction table linking users to businesses (id, businessId, userId, role, createdAt)
- `work_logs` table: Work log entries (id, businessId, technicianUserId, customer info, location details, service details, status, image/PDF URLs, timestamps)
- JSON columns in work_logs for storing arrays of image and PDF URLs
- Foreign key relationships: businesses.ownerId → users.id, business_members.userId → users.id, work_logs.businessId → businesses.id, work_logs.technicianUserId → users.id

**Authentication System**
- Replit Auth integration via `openid-client` library
- OIDC (OpenID Connect) flow for authentication
- Session storage in PostgreSQL for persistent sessions
- User data automatically synced from auth provider claims
- Support for multiple OAuth providers (Google, GitHub, X, Apple) and email/password

**Data Validation**
- Zod schemas generated from Drizzle table definitions using `drizzle-zod`
- Shared validation schemas between frontend and backend via `@shared` alias
- Runtime validation on API endpoints before database operations

### External Dependencies

**Cloud Storage**
- Google Cloud Storage for object/file storage (images and PDFs)
- Replit sidecar integration for credential management
- Custom `ObjectStorageService` for storage operations
- ACL (Access Control List) system for fine-grained object permissions via custom metadata

**ACL Architecture**
- Custom ACL policy system using object metadata (`custom:aclPolicy`)
- Support for flexible access groups (user lists, email domains, group membership, subscribers)
- Permission types: READ and WRITE
- ACL rules stored as JSON in object metadata

**Database Provider**
- Neon Database (serverless PostgreSQL) via `@neondatabase/serverless`
- Connection via `DATABASE_URL` environment variable
- Drizzle Kit for schema migrations to `./migrations` directory

**UI Dependencies**
- Comprehensive Radix UI component primitives (40+ components)
- Lucide React for icons
- Font Awesome icons (via CDN) for work type indicators
- Custom fonts: Architects Daughter, DM Sans, Fira Code, Geist Mono (via Google Fonts)

**Development Tools**
- TypeScript for type checking across entire codebase
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)
- tsx for running TypeScript server code directly in development
- esbuild for production server bundling