# Field Capture - Field Service Management Application

## Project Overview

**Field Capture** is a comprehensive field service management application designed for businesses that dispatch technicians to job sites. It provides work logging, GPS-verified photo documentation, estimate generation, and offline-first mobile support.

**Tech Stack:**
- **Framework:** Next.js 15.1 (App Router)
- **Language:** TypeScript 5.6
- **Frontend:** React 18.3, Tailwind CSS, Radix UI/shadcn
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Offline:** Dexie.js (IndexedDB), next-pwa
- **Email:** SendGrid
- **Maps:** React-Leaflet, Nominatim geocoding
- **PDF:** pdf-lib, pdfkit, @react-pdf/renderer

---

## Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Work Log Management** | Create, edit, and track service records with photos, GPS, and custom forms | Complete |
| **GPS Photo Verification** | Capture photos with embedded GPS coordinates, auto-verify location against job site | Complete |
| **Estimate Builder** | Create itemized estimates with pricing catalog, generate PDFs, email to customers | Complete |
| **Property/Job Site Management** | Track customer locations with geocoding and mapping | Complete |
| **Team Management** | Add technicians, assign roles, track assignments | Complete |
| **Vendor Directory** | Manage subcontractors with insurance and license tracking | Complete |
| **Offline Support** | Full offline functionality with automatic sync when online | Complete |
| **PWA** | Installable on mobile/desktop with native-like experience | Complete |
| **Dashboard** | Statistics, recent activity, job map visualization | Complete |

### Detailed Feature Breakdown

#### 1. Work Log Management (`/schedule`)
- Create work logs with service date, time, work type, and description
- Assign multiple technicians to a job
- Associate with properties/job sites
- Capture before/after photos with GPS verification
- Custom form templates per work type
- Check-in/check-out with GPS coordinates
- Status tracking: pending, scheduled, in-progress, completed

#### 2. GPS Photo System
- Real-time GPS capture at shutter time
- EXIF data embedding using piexifjs
- Automatic location verification (100m radius threshold)
- Verification statuses: pending, verified, mismatch, override
- Distance calculation using Haversine formula
- Photo classification: before, after, general

#### 3. Estimate Management (`/estimates`)
- Create estimates with customer info and line items
- Pricing catalog integration (categories, units, pricing)
- Tax rate and discount support
- PDF generation with business branding
- Email delivery via SendGrid
- Status workflow: draft → sent → approved/rejected

#### 4. Geocoding & Mapping
- Address-to-coordinates conversion (OpenStreetMap Nominatim)
- Rate-limited batch geocoding (1 request/second)
- Dashboard map with job locations (Leaflet)
- Distance calculations between points

#### 5. Offline Functionality
- IndexedDB storage via Dexie.js
- Automatic sync queue for mutations
- Retry logic with exponential backoff
- Offline indicator in UI
- Service worker with smart caching strategies

---

## Architecture

### Directory Structure

```
/FieldService
├── /app                      # Next.js App Router
│   ├── /api                  # API routes
│   │   ├── /geocode          # Geocoding endpoints
│   │   ├── /photos           # Photo upload with verification
│   │   ├── /upload           # File upload to Supabase Storage
│   │   ├── /estimates/[id]   # Estimate PDF/email
│   │   └── /offline/sync     # Offline sync endpoints
│   ├── /auth                 # Auth callback
│   ├── /dashboard            # Main dashboard
│   ├── /schedule             # Work log management
│   ├── /estimates            # Estimate management
│   ├── /properties           # Job site management
│   ├── /vendors              # Vendor directory
│   ├── /team                 # Team management
│   ├── /settings             # Business settings
│   ├── /pricing              # Pricing catalog
│   ├── /forms                # Custom form templates
│   ├── /onboarding           # Initial setup
│   ├── /login, /signup       # Authentication
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── /components               # Reusable React components
│   ├── /ui                   # shadcn/ui components
│   ├── WorkLogForm.tsx       # Work log creation form
│   ├── FormPhotoField.tsx    # GPS-verified photo field for forms
│   ├── EstimateForm.tsx      # Estimate creation form
│   ├── GPSCamera.tsx         # GPS-enabled camera
│   ├── ImageUpload.tsx       # Multi-image uploader (legacy)
│   ├── AppHeader.tsx         # Navigation header
│   ├── OfflineIndicator.tsx  # Offline status
│   └── ...
├── /lib                      # Utility functions
│   ├── /supabase             # Supabase client setup
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   ├── admin.ts          # Service role client
│   │   └── getUserAndBusiness.ts
│   ├── /offline              # Offline functionality
│   │   ├── db.ts             # Dexie database schema
│   │   ├── syncService.ts    # Sync queue management
│   │   └── offlineStorage.ts # Storage utilities
│   ├── geocoding.ts          # Nominatim geocoding
│   ├── exif.ts               # GPS/EXIF embedding
│   ├── form-types.ts         # Photo field types (PhotoFieldConfig, FormPhotoValue)
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # General utilities
├── /types                    # Shared type definitions
├── /supabase/migrations      # Database migrations
├── middleware.ts             # Auth middleware
├── next.config.ts            # PWA configuration
└── tailwind.config.ts        # Tailwind configuration
```

### Data Flow Patterns

#### Work Log Creation Flow
```
1. User fills WorkLogForm (client)
2. GPSCamera captures photos with coordinates
3. piexifjs embeds EXIF data in images
4. Images uploaded to Supabase Storage
5. Server action creates work_log record
6. Background geocoding of address
7. If offline: queued in Dexie → synced when online
```

#### Photo System (Consolidated into Form Templates)
Photos are now captured through form template fields with configurable GPS verification:

**PhotoFieldConfig Properties:**
- `gpsRequired`: Must capture with GPS camera (not gallery upload)
- `verifyLocation`: Verify photo GPS against job site coordinates
- `verificationRadius`: Distance threshold in meters (default 100m)
- `classification`: 'before' | 'after' | 'general' for reporting
- `minPhotos` / `maxPhotos`: Enforce photo count requirements

**Default Photo Fields:**
When no form template is selected, default Before/After photo fields are shown with GPS verification enabled.

#### Photo Verification Flow
```
1. Form photo field rendered with GPSCamera
2. GPS coordinates captured at shutter time
3. EXIF data embedded in image via piexifjs
4. Photo uploaded to Supabase Storage
5. createWorkLog saves to both photo_metadata (legacy) and job_photos (new)
6. Server geocodes job address → calculates distance from photo GPS
7. Auto-verified if within verificationRadius (default 100m)
8. Status: 'verified' | 'mismatch' | 'pending'
```

#### Estimate Workflow
```
draft → sent (via email) → approved/rejected
```

---

## Components

### UI Framework
- **Radix UI** - Accessible primitives (Dialog, Select, Tabs, etc.)
- **shadcn/ui** - Pre-built components on Radix
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations

### Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| `WorkLogForm` | `/components/WorkLogForm.tsx` | Main form for creating work logs |
| `GPSCamera` | `/components/GPSCamera.tsx` | Camera with real-time GPS capture |
| `ImageUpload` | `/components/ImageUpload.tsx` | Multi-image uploader with preview |
| `EstimateForm` | `/components/EstimateForm.tsx` | Estimate creation form |
| `AppHeader` | `/components/AppHeader.tsx` | Navigation and branding |
| `OfflineIndicator` | `/components/OfflineIndicator.tsx` | Shows offline status |
| `UpdatePrompt` | `/components/UpdatePrompt.tsx` | PWA update notification |
| `DashboardMap` | (in dashboard) | Leaflet map with job locations |

### shadcn/ui Components (`/components/ui/`)
- Accordion, Alert Dialog, Avatar, Badge, Button
- Calendar, Card, Checkbox, Collapsible, Command
- Dialog, Dropdown Menu, Form, Input, Label
- Navigation Menu, Popover, Progress, Radio Group
- Scroll Area, Select, Separator, Sheet, Slider
- Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.1.0 | React framework |
| `react` | 18.3.1 | UI library |
| `typescript` | 5.6.3 | Type safety |
| `@supabase/supabase-js` | 2.45.0 | Database/Auth client |
| `@supabase/ssr` | 0.5.2 | Server-side auth |
| `tailwindcss` | 3.4.17 | CSS framework |
| `dexie` | 4.4.2 | IndexedDB wrapper (offline) |
| `next-pwa` | 5.6.0 | PWA support |
| `@sendgrid/mail` | 8.1.6 | Email delivery |
| `react-leaflet` | 4.2.1 | Map component |
| `leaflet` | 1.9.4 | Map library |
| `pdf-lib` | 1.17.1 | PDF generation |
| `pdfkit` | 0.18.0 | PDF generation |
| `@react-pdf/renderer` | 4.5.1 | React PDF |
| `piexifjs` | 1.0.6 | EXIF/GPS embedding |
| `react-hook-form` | 7.76.0 | Form management |
| `zod` | 3.24.2 | Schema validation |
| `@hookform/resolvers` | 3.10.0 | Form validation |
| `date-fns` | 3.6.0 | Date utilities |
| `framer-motion` | 11.13.1 | Animations |
| `recharts` | 2.15.2 | Charts |
| `lucide-react` | 0.453.0 | Icons |
| `react-icons` | 5.4.0 | Additional icons |
| `class-variance-authority` | 0.7.1 | Component variants |
| `clsx` | 2.1.1 | Classname utility |
| `tailwind-merge` | 2.6.0 | Tailwind class merge |
| `cmdk` | 1.1.1 | Command palette |
| `vaul` | 1.1.2 | Drawer component |
| `embla-carousel-react` | 8.6.0 | Carousel |
| `react-day-picker` | 8.10.1 | Date picker |
| `react-resizable-panels` | 2.1.7 | Resizable panels |
| `input-otp` | 1.4.2 | OTP input |
| `next-themes` | 0.4.6 | Theme switching |

### Radix UI Components
Full suite of `@radix-ui/react-*` components (accordion, dialog, dropdown-menu, popover, select, tabs, toast, tooltip, etc.)

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/typography` | 0.5.15 | Prose styling |
| `sharp` | 0.34.5 | Image optimization |
| `autoprefixer` | 10.4.20 | CSS vendor prefixes |
| `postcss` | 8.4.47 | CSS processing |

---

## Database Schema

### Entity Relationship Diagram

```
users (1) ──────< businesses (1) ──────< business_members (>1)
   │                   │
   │                   ├──────< properties (job sites)
   │                   │              │
   │                   ├──────< work_logs ────────< job_photos
   │                   │
   │                   ├──────< estimates ────────< estimate_line_items
   │                   │                                   │
   │                   ├──────< pricing_items ─────────────┘
   │                   │
   │                   ├──────< vendors
   │                   │
   │                   └──────< api_clients
   │
   └─────────────────────────────────────────────────────────┘
                          (technician assignments)
```

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| email | VARCHAR (UNIQUE) | User email |
| first_name | VARCHAR | First name |
| last_name | VARCHAR | Last name |
| profile_image_url | VARCHAR | Avatar URL |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

#### `businesses`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| name | TEXT | Business name |
| owner_id | VARCHAR (FK) | Owner user ID |
| address, city, state, zip_code | TEXT | Address fields |
| phone | TEXT | Phone number |
| overview | TEXT | Business description |
| hours_of_operation | JSONB | Operating hours |
| brand_color | TEXT | Hex color code |
| logo_url | TEXT | Logo image URL |

#### `business_members`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| user_id | VARCHAR (FK) | User reference |
| role | TEXT | 'technician', 'admin' |

#### `properties` (Job Sites)
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| property_name | TEXT | Site name |
| customer_name | TEXT | Customer name |
| location_name, city, state, zip_code | TEXT | Address |
| lat, lng | DECIMAL | Geocoded coordinates |
| geocoded_at | TIMESTAMP | When geocoded |
| geocode_source | TEXT | 'nominatim', 'manual' |
| status | TEXT | 'active', 'inactive' |

#### `work_logs`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| property_id | VARCHAR (FK) | Property reference |
| technician_user_id | VARCHAR (FK) | Primary technician |
| technician_user_ids | JSONB | Array of technician IDs |
| customer_name | TEXT | Customer name |
| work_type | TEXT | Type of work |
| location_name, city, state, zip_code | TEXT | Job address |
| service_date | TEXT | Date of service |
| start_time, end_time | TEXT | Work times |
| work_performed | TEXT | Description |
| additional_notes | TEXT | Notes |
| status | TEXT | 'pending', 'scheduled', 'in_progress', 'completed' |
| image_urls | JSONB | Array of image URLs |
| pdf_urls | JSONB | Array of PDF URLs |
| photo_metadata | JSONB | GPS data for photos |
| check_in_time, check_out_time | TEXT | Check-in/out times |
| check_in_lat, check_in_lng | TEXT | Check-in coordinates |
| check_out_lat, check_out_lng | TEXT | Check-out coordinates |
| job_lat, job_lng | DECIMAL | Geocoded job location |

#### `job_photos`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| work_log_id | VARCHAR (FK) | Work log reference |
| url | TEXT | Photo URL |
| storage_path | TEXT | Storage path |
| photo_type | TEXT | 'before', 'after', 'general' |
| lat, lng | DECIMAL | Captured GPS coordinates |
| accuracy_meters | DECIMAL | GPS accuracy |
| altitude_meters | DECIMAL | Altitude |
| job_lat, job_lng | DECIMAL | Expected job location |
| distance_from_job_meters | DECIMAL | Distance from job |
| location_verified | BOOLEAN | Auto-verified flag |
| verification_status | TEXT | 'pending', 'verified', 'mismatch', 'override' |
| verification_notes | TEXT | Notes |
| verified_by | VARCHAR (FK) | Verifier user ID |
| verified_at | TIMESTAMP | Verification time |
| captured_at | TIMESTAMP | Photo capture time |
| captured_by | VARCHAR (FK) | Photographer user ID |
| device_info | JSONB | Device metadata |
| exif_data | JSONB | Full EXIF data |
| annotations | JSONB | Photo annotations |

#### `estimates`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| property_id | VARCHAR (FK) | Property reference |
| title | TEXT | Estimate title |
| customer_name, customer_email, customer_phone | TEXT | Customer info |
| description | TEXT | Work description |
| status | TEXT | 'draft', 'sent', 'approved', 'rejected' |
| valid_until | TEXT | Expiration date |
| tax_rate | TEXT | Tax percentage |
| discount_amount | TEXT | Discount |
| notes | TEXT | Additional notes |

#### `estimate_line_items`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| estimate_id | VARCHAR (FK) | Estimate reference |
| pricing_item_id | VARCHAR (FK) | Pricing item reference |
| description | TEXT | Line item description |
| quantity | TEXT | Quantity |
| unit | TEXT | Unit of measure |
| unit_price | TEXT | Price per unit |
| sort_order | TEXT | Display order |

#### `pricing_items`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| category | TEXT | Item category |
| name | TEXT | Item name |
| description | TEXT | Description |
| unit | TEXT | Unit of measure |
| unit_price | TEXT | Price per unit |
| is_active | TEXT | Active status |

#### `vendors`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (PK) | UUID |
| business_id | VARCHAR (FK) | Business reference |
| name | TEXT | Vendor name |
| contact_name, contact_email, contact_phone | TEXT | Contact info |
| services_provided | JSONB | Services array |
| regions_served | JSONB | Regions array |
| insurance_provider, insurance_policy_number, insurance_expiry | TEXT | Insurance |
| license_number, license_expiry | TEXT | License info |
| notes | TEXT | Notes |
| status | TEXT | 'active', 'inactive' |

### Database Features
- **Row Level Security (RLS):** Enabled on all tables
- **Triggers:** Auto-update `updated_at` timestamps
- **Functions:** `haversine_distance()` for GPS calculations
- **Views:** `jobs_needing_geocoding` for batch processing

---

## API Routes

### Geocoding (`/api/geocode`)
| Method | Description |
|--------|-------------|
| POST | Geocode single work log or property |
| PUT | Batch geocode multiple records (rate-limited) |
| GET | Count records needing geocoding |

### Photos (`/api/photos`)
| Method | Description |
|--------|-------------|
| POST | Upload photo with GPS verification |
| GET | Fetch photos for a work log |

### Upload (`/api/upload`)
| Method | Description |
|--------|-------------|
| POST | Upload file to Supabase Storage |
| GET | Get signed upload URL |

### Estimates (`/api/estimates/[id]`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pdf` | POST | Generate PDF |
| `/send` | POST | Email estimate to customer |

### Offline Sync (`/api/offline`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sync/work-logs` | POST | Sync offline work logs |
| `/sync/work-logs/[id]` | PATCH | Update specific work log |
| `/sync/properties` | POST | Sync offline properties |
| `/data/work-logs` | GET | Fetch for offline cache |
| `/data/properties` | GET | Fetch for offline cache |

---

## Server Actions

Located in each feature's `actions.ts` file:

| Feature | Actions |
|---------|---------|
| `/schedule` | `createWorkLog()` |
| `/estimates` | `createEstimate()`, `updateEstimateStatus()`, `deleteEstimate()` |
| `/properties` | `createProperty()`, `deleteProperty()` |
| `/vendors` | `createVendor()`, `deleteVendor()` |
| `/team` | `addTeamMember()` |
| `/settings` | `updateBusinessInfo()`, `updateBusinessLogo()` |
| `/auth` | `signUp()`, `signIn()`, `signOut()`, `getCurrentUser()` |

---

## Authentication

- **Provider:** Supabase Auth (email/password)
- **Session:** Cookie-based via `@supabase/ssr`
- **Middleware:** `/middleware.ts` protects routes

### Protected Routes
- `/dashboard`
- `/schedule`
- `/estimates`
- `/properties`
- `/team`
- `/vendors`
- `/settings`
- `/pricing`
- `/forms`
- `/onboarding`

---

## Environment Variables

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Required - Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Application
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_APP_URL=
NODE_ENV=

# Optional
ANTHROPIC_API_KEY=          # AI features (future)
STRIPE_PUBLIC_KEY=          # Payments (future)
STRIPE_SECRET_KEY=
GOOGLE_CLIENT_ID=           # Calendar integration (future)
GOOGLE_CLIENT_SECRET=
CRON_SECRET=                # Scheduled jobs
ADMIN_USER_ID=              # Admin access
```

---

## Development

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations in Supabase SQL Editor
# (Execute files in /supabase/migrations in order)

# Start development server
npm run dev
```

### Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## Roadmap

### Near-Term Enhancements
- [ ] Calendar integration (Google Calendar sync)
- [ ] Push notifications for job assignments
- [ ] Invoice generation from approved estimates
- [ ] Customer portal for estimate approval
- [ ] Technician mobile app (React Native)

### Medium-Term Features
- [ ] Route optimization for multiple jobs
- [ ] Inventory/parts tracking
- [ ] Time tracking and payroll integration
- [ ] Customer relationship management (CRM)
- [ ] Automated follow-up emails

### Long-Term Vision
- [ ] AI-powered job estimation
- [ ] Equipment maintenance scheduling
- [ ] Multi-tenant white-label platform
- [ ] Integration marketplace (QuickBooks, ServiceTitan, etc.)
- [ ] Advanced analytics and reporting

---

## Key File References

| Purpose | File Path |
|---------|-----------|
| Database schema | `/supabase/migrations/001_initial_schema.sql` |
| Photo GPS schema | `/supabase/migrations/002_job_photos.sql` |
| Geocoding schema | `/supabase/migrations/003_job_geocoding.sql` |
| Photo form integration | `/supabase/migrations/004_photo_form_integration.sql` |
| Geocoding logic | `/lib/geocoding.ts` |
| EXIF/GPS handling | `/lib/exif.ts` |
| Photo form types | `/lib/form-types.ts` |
| Offline database | `/lib/offline/db.ts` |
| Sync service | `/lib/offline/syncService.ts` |
| Auth helper | `/lib/supabase/getUserAndBusiness.ts` |
| Work log actions | `/app/schedule/actions.ts` |
| Form templates actions | `/app/forms/actions.ts` |
| Form photo field | `/components/FormPhotoField.tsx` |
| GPS camera | `/components/GPSCamera.tsx` |
| Estimate email | `/app/api/estimates/[id]/send/route.ts` |
| Photo upload | `/app/api/photos/route.ts` |
| Auth middleware | `/middleware.ts` |
| PWA config | `/next.config.ts` |

---

## Security

- JWT authentication via Supabase
- Row-Level Security on all tables
- Business ID enforcement on queries
- Service role key server-side only
- HTTPS in production
- Signed URLs for storage

---

*Last Updated: May 2025*
