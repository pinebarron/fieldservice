# Work Log Management System

## Overview

This is a full-stack work log management application built for tracking service jobs, particularly focused on solar installation and maintenance work. The application allows technicians to create, view, filter, and manage work log entries with support for image and PDF attachments. It uses a modern React frontend with a Node.js/Express backend, PostgreSQL database via Drizzle ORM, and integrates with Google Cloud Storage for file uploads.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- CRUD operations for work logs (`/api/work-logs`)
- Query parameter-based filtering for work logs
- Statistics endpoint (`/api/stats`) for dashboard metrics

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
- `users` table: Basic user authentication (id, username, password)
- `work_logs` table: Core work log entries with fields for customer info, work details, technician, dates, status, and file URLs
- JSON columns for storing arrays of image and PDF URLs
- Automatic timestamps (createdAt, updatedAt) on work logs

**In-Memory Fallback**
- `MemStorage` class implementing `IStorage` interface for development/testing
- Provides same API as database storage for seamless switching

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