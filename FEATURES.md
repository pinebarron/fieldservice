# Crewatt - Field Service Management Platform

## Overview

Crewatt is a professional work log management system designed for solar field service teams. Built with Next.js 15, React 18, TypeScript, and Supabase, it provides a mobile-first, offline-capable platform for managing field operations.

**Tech Stack:** Next.js 15, React 18, TypeScript, Supabase (PostgreSQL), Tailwind CSS, PWA-enabled, Capacitor (iOS/Android)

---

## Core Features

### 1. Work Order Management

- **Create, edit, and view work logs** with full job details
- **Technician assignment** - Single or multiple technicians per job
- **Job status tracking** - Scheduled, In-Progress, Completed, Cannot-Complete
- **Check-in/check-out** with GPS coordinates
- **Photo documentation** - Before/after/general with GPS tagging
- **Form submissions** linked to work orders
- **Cannot-complete tracking** with reason capture
- **Customer confirmation** flag for pre-dispatch verification

### 2. Scheduling & Calendar

- **Full calendar view** with FullCalendar integration
- **Drag-and-drop scheduling** for easy job assignment
- **Job filtering** by date, technician, status, and work type
- **In-progress job tracking** with real-time status
- **Recurring job scheduling** - Daily, weekly, or monthly frequencies
- **View modes** - Day, week, month, and list views

### 3. Customer & Property Management

- **Property database** with full address and coordinates
- **Residential vs. Commercial** classification
- **Property-linked work orders** and estimates
- **Geocoding** - Automatic address-to-coordinate conversion
- **Customer information** tied to properties
- **Notes and status tracking** per property

### 4. Estimates & Pricing

- **Estimate creation** with line items
- **Pricing item library** (rate cards) for quick pricing
- **PDF generation** - Branded with business logo and colors
- **Tax calculations** and discount support
- **Email delivery** via SendGrid integration
- **Estimate-to-job conversion** tracking
- **Status workflow** - Draft, Sent, Accepted, Converted

### 5. Custom Forms & Templates

- **Form template system** with JSON schema storage
- **Field types supported:**
  - Text input
  - Textarea
  - Number input
  - Select dropdown
  - Checkbox
  - Time picker
  - Signature capture
  - GPS-verified photo
  - Document upload
- **Conditional logic** - Field visibility based on previous answers
- **Industry-specific templates** - Solar and Pressure Washing starter forms
- **Form responses** stored with work logs

### 6. GPS-Verified Photo System

- **Live GPS capture** at shutter time
- **EXIF data extraction** from photos
- **Location verification** - Distance calculation from job site
- **Verification status** - Pending, Verified, Mismatch, Override
- **Photo annotations** - Arrows, text, highlights
- **Photo metadata storage** - Device info, accuracy, altitude
- **Photo types** - Before, after, general classification

### 7. Customer Feedback / Scorecards

- **Unique feedback tokens** per work order
- **Public feedback links** - No authentication required
- **5-point rating system** for:
  - Quality of work
  - Professionalism
  - Value for money
  - Timeliness
- **Comment/notes field** for additional feedback
- **Duplicate submission prevention**
- **Feedback analytics** - Track sent and submitted timestamps

### 8. Team Management

- **Email invitations** for new team members
- **Invite token system** for secure account creation
- **Role-based access control:**
  - Owner - Full access
  - Admin - Management access
  - Technician - Field operations only
- **Team member profiles** with phone and title
- **Technician dashboard** - Today's and upcoming jobs

### 9. Vendor Management

- **Vendor contact database**
- **Insurance tracking** - Provider, policy, expiry
- **License tracking** - Number and expiry
- **Service areas** - Regions served
- **Services provided** list
- **Geographic coordinates** for route planning

### 10. Mobile & Field Features

- **Mobile-first responsive design**
- **PWA support** - Installable as home screen app
- **Native app wrappers** - Capacitor for iOS/Android
- **GPS photo tagging** with metadata
- **Location verification** for photos
- **Technician check-in/out** with location tracking
- **Real-time photo upload** with background sync

### 11. Offline-First Architecture

- **Local IndexedDB storage** via Dexie.js
- **Sync queue** for pending mutations
- **Offline work log creation**
- **Offline property management**
- **Offline form submissions** with queued photos
- **Automatic sync** when connection restored
- **Retry mechanism** with up to 5 attempts
- **Visual sync status indicators**

### 12. Reporting & Analytics

- **Dashboard statistics:**
  - Total jobs
  - This week's jobs
  - This month's jobs
  - Total photos
- **Location heatmap** - Map view of recent jobs
- **Recent work logs table** with filtering
- **Work type breakdown** by industry

### 13. Settings & Branding

- **Business profile management**
- **Logo upload** for branded documents
- **Brand color customization**
- **Contact information** management
- **Operating hours** configuration

### 14. Authentication & Security

- **Supabase Auth** - Email/password authentication
- **Server-side session management** with cookies
- **OAuth support** for external providers
- **Row Level Security** - Business data isolation
- **Protected routes** via middleware
- **Role-based redirects** - Technicians to /tech, admins to /dashboard

---

## Industry Support

### Solar Industry
- Site surveys
- Installation jobs
- Inspection workflows
- Maintenance tracking
- Solar-specific work types
- Industry pricing templates

### Pressure Washing (Configurable)
- Before/after documentation
- Estimate walkthrough
- Roof soft wash workflows
- Industry-specific forms

---

## Technical Architecture

### Database Tables
- Users
- Businesses
- Business Members (Team)
- Work Logs
- Properties
- Job Photos
- Vendors
- Estimates
- Estimate Line Items
- Pricing Items
- Form Templates
- Form Submissions
- Contact Submissions
- API Clients
- Recurring Schedules

### API Integrations
- **SendGrid** - Email delivery
- **Nominatim/Google** - Geocoding
- **Supabase Storage** - Image uploads
- **Capacitor** - Native mobile features
- **Leaflet** - Interactive maps
- **FullCalendar** - Scheduling interface

---

## Application Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/login` | User login | Public |
| `/signup` | Account registration | Public |
| `/onboarding` | Business setup wizard | Auth |
| `/dashboard` | Admin dashboard | Admin/Owner |
| `/tech` | Technician dashboard | Technician |
| `/schedule` | Work log calendar | Admin |
| `/properties` | Property management | Admin |
| `/vendors` | Vendor management | Admin |
| `/estimates` | Estimate management | Admin |
| `/estimates/[id]` | Estimate detail | Admin |
| `/forms` | Form template builder | Admin |
| `/team` | Team management | Admin |
| `/settings` | Business settings | Admin |
| `/features` | Feature list | Public |
| `/plans` | Pricing page | Public |
| `/contact` | Contact form | Public |
| `/feedback/[token]` | Customer feedback | Public |
| `/tech/profile` | Technician profile | Technician |
| `/reports` | Reporting dashboard | Admin |

---

## Key Workflows

### Work Order Lifecycle
1. **Creation** - Set customer, location, work type, assign technician
2. **Scheduling** - Assign date/time, optional customer confirmation
3. **Check-in** - Technician verifies location via GPS
4. **Execution** - Complete forms, capture photos, add notes
5. **Check-out** - Final location verification
6. **Completion** - Mark complete or cannot-complete
7. **Feedback** - Send customer scorecard, collect ratings

### Estimate to Job Conversion
1. Create estimate with line items
2. Send to customer or save as draft
3. Customer accepts estimate
4. Convert to work order
5. Track conversion metrics

### Photo Verification
1. Technician captures photo with GPS
2. System records location and metadata
3. Distance calculated to job site
4. Verification status assigned
5. Admin can override if needed

---

## Platform Support

- **Web** - Full responsive web application
- **iOS** - Native app via Capacitor
- **Android** - Native app via Capacitor
- **PWA** - Installable progressive web app
- **Offline** - Full offline-first support
