# Manual Testing Guide - Crewatt Field Service Platform

This document contains comprehensive test scripts for manually testing all features of the Crewatt platform. Each section includes preconditions, test steps, and expected results.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Onboarding](#2-onboarding)
3. [Dashboard](#3-dashboard)
4. [Work Order Management](#4-work-order-management)
5. [Scheduling & Calendar](#5-scheduling--calendar)
6. [Properties Management](#6-properties-management)
7. [Estimates](#7-estimates)
8. [Team Management](#8-team-management)
9. [Vendor Management](#9-vendor-management)
10. [Form Templates & Submissions](#10-form-templates--submissions)
11. [Customer Feedback / Scorecards](#11-customer-feedback--scorecards)
12. [GPS Photo Verification](#12-gps-photo-verification)
13. [Technician Dashboard](#13-technician-dashboard)
14. [Offline Functionality](#14-offline-functionality)
15. [Settings & Branding](#15-settings--branding)
16. [Mobile / PWA](#16-mobile--pwa)
17. [Reports](#17-reports)
18. [Contact Page](#18-contact-page)
19. [Public Pages](#19-public-pages)

---

## 1. Authentication & Authorization

### TEST 1.1: User Registration
**Preconditions:** None (fresh user)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/signup` | Signup form displayed |
| 2 | Enter valid email address | Field accepts input |
| 3 | Enter password (min 6 chars) | Field accepts input |
| 4 | Enter first name and last name | Fields accept input |
| 5 | Click "Sign Up" button | Account created, redirected to onboarding |
| 6 | Check email for verification (if enabled) | Verification email received |

### TEST 1.2: User Login
**Preconditions:** User account exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form displayed |
| 2 | Enter valid email | Field accepts input |
| 3 | Enter valid password | Field accepts input |
| 4 | Click "Sign In" button | Logged in, redirected to dashboard |
| 5 | Verify header shows user info | User name/avatar displayed |

### TEST 1.3: Invalid Login Credentials
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form displayed |
| 2 | Enter invalid email/password | Fields accept input |
| 3 | Click "Sign In" | Error message displayed |
| 4 | Verify user stays on login page | Not redirected |

### TEST 1.4: Logout
**Preconditions:** User logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click user menu in header | Dropdown appears |
| 2 | Click "Sign Out" | Logged out |
| 3 | Verify redirect to login page | Shows login form |
| 4 | Try accessing `/dashboard` directly | Redirected to login |

### TEST 1.5: Protected Route Access (Unauthenticated)
**Preconditions:** User not logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard` | Redirected to login |
| 2 | Navigate to `/schedule` | Redirected to login |
| 3 | Navigate to `/properties` | Redirected to login |
| 4 | Navigate to `/team` | Redirected to login |
| 5 | Navigate to `/settings` | Redirected to login |

### TEST 1.6: Role-Based Access (Technician)
**Preconditions:** Logged in as technician role

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/tech` | Technician dashboard loads |
| 2 | Navigate to `/dashboard` | Redirected to /tech |
| 3 | Navigate to `/schedule` | Redirected to /tech |
| 4 | Navigate to `/team` | Redirected to /tech |
| 5 | Navigate to `/tech/profile` | Profile page loads |

---

## 2. Onboarding

### TEST 2.1: Business Setup Wizard
**Preconditions:** New user, no business configured

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete signup/login | Redirected to onboarding |
| 2 | Enter business name | Field accepts input |
| 3 | Enter business address | Fields accept input |
| 4 | Enter phone number | Field accepts input |
| 5 | Select industry (Solar) | Selection saved |
| 6 | Upload logo (optional) | Image uploaded and previewed |
| 7 | Select brand color | Color picker works |
| 8 | Click "Complete Setup" | Business created, redirected to dashboard |

### TEST 2.2: Skip Optional Fields
**Preconditions:** New user in onboarding

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill only required fields | Form validates |
| 2 | Skip logo upload | Setup proceeds without logo |
| 3 | Skip brand color | Default color applied |
| 4 | Complete setup | Business created successfully |

---

## 3. Dashboard

### TEST 3.1: Dashboard Statistics Display
**Preconditions:** Logged in as admin/owner with existing work logs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard` | Dashboard loads |
| 2 | Verify "Total Jobs" card | Shows correct count |
| 3 | Verify "This Week" card | Shows jobs from current week |
| 4 | Verify "This Month" card | Shows jobs from current month |
| 5 | Verify "Total Photos" card | Shows correct photo count |

### TEST 3.2: Dashboard Map View
**Preconditions:** Work logs exist with coordinates

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View dashboard | Map loads with markers |
| 2 | Click on map marker | Popup shows job info |
| 3 | Zoom in/out on map | Map responds smoothly |
| 4 | Pan across map | Map navigates |

### TEST 3.3: Recent Work Logs Table
**Preconditions:** Work logs exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scroll to work logs table | Table displays recent logs |
| 2 | Verify columns display | Customer, date, status, etc. |
| 3 | Click on a work log row | Navigates to details or edit |
| 4 | Verify status badges | Correct colors per status |

### TEST 3.4: In-Progress Jobs Display
**Preconditions:** Jobs with "in-progress" status exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View in-progress section | Active jobs displayed |
| 2 | Verify job details shown | Customer, technician, location |
| 3 | Verify map markers for active jobs | Markers appear on map |

---

## 4. Work Order Management

### TEST 4.1: Create New Work Order
**Preconditions:** Logged in, at least one property exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/schedule` | Schedule page loads |
| 2 | Click "New Work Order" or equivalent | Form opens |
| 3 | Enter customer name | Field accepts input |
| 4 | Select or enter location | Address fields populate |
| 5 | Select work type (e.g., "Installation") | Dropdown works |
| 6 | Select service date | Date picker works |
| 7 | Enter start/end times | Time fields accept input |
| 8 | Assign technician | Dropdown shows team members |
| 9 | Enter work description | Textarea accepts input |
| 10 | Click "Save" | Work order created, appears in list |

### TEST 4.2: Edit Existing Work Order
**Preconditions:** Work order exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find work order in list | Work order visible |
| 2 | Click edit button | Edit form opens |
| 3 | Modify customer name | Change saved |
| 4 | Modify service date | Change saved |
| 5 | Change technician assignment | Change saved |
| 6 | Click "Save Changes" | Updates persisted |
| 7 | Verify changes in list | Updated data shown |

### TEST 4.3: Work Order Status Transitions
**Preconditions:** Work order in "scheduled" status

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order | Details displayed |
| 2 | Change status to "In Progress" | Status updates |
| 3 | Verify check-in time recorded | Timestamp saved |
| 4 | Change status to "Completed" | Status updates |
| 5 | Verify check-out time recorded | Timestamp saved |

### TEST 4.4: Cannot Complete Work Order
**Preconditions:** Work order in progress

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order | Details displayed |
| 2 | Click "Cannot Complete" option | Reason modal appears |
| 3 | Enter reason for not completing | Field accepts input |
| 4 | Confirm | Status changes to cannot-complete |
| 5 | Verify reason saved | Reason visible in details |

### TEST 4.5: Assign Multiple Technicians
**Preconditions:** Multiple team members exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create or edit work order | Form opens |
| 2 | Select multiple technicians | Multi-select works |
| 3 | Save work order | Multiple assignments saved |
| 4 | Verify all technicians see job | Job appears on each tech's dashboard |

### TEST 4.6: Upload Photos to Work Order
**Preconditions:** Work order exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order | Details displayed |
| 2 | Click "Add Photos" or camera icon | Upload interface opens |
| 3 | Select photo type (before/after/general) | Type selector works |
| 4 | Upload image file | Image uploads |
| 5 | Verify image appears in gallery | Thumbnail displayed |
| 6 | Upload multiple images | All images saved |

### TEST 4.7: Delete Work Order
**Preconditions:** Work order exists (ideally test/draft)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order | Details displayed |
| 2 | Click "Delete" button | Confirmation dialog appears |
| 3 | Confirm deletion | Work order removed |
| 4 | Verify removed from list | No longer appears |

---

## 5. Scheduling & Calendar

### TEST 5.1: Calendar View Load
**Preconditions:** Work orders exist with service dates

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/schedule` | Calendar loads |
| 2 | Verify current month displayed | Correct month shown |
| 3 | Verify work orders appear on dates | Events visible on calendar |
| 4 | Click on calendar event | Event details shown |

### TEST 5.2: Calendar View Modes
**Preconditions:** On schedule page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Day" view | Day view displays |
| 2 | Click "Week" view | Week view displays |
| 3 | Click "Month" view | Month view displays |
| 4 | Click "List" view | List view displays |
| 5 | Navigate forward/back | Calendar updates |

### TEST 5.3: Drag-and-Drop Rescheduling
**Preconditions:** Work orders exist on calendar

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click and hold a calendar event | Event becomes draggable |
| 2 | Drag to different date | Visual feedback shown |
| 3 | Drop on new date | Event moves to new date |
| 4 | Verify database update | Service date changed |
| 5 | Refresh page | Change persists |

### TEST 5.4: Calendar Filtering
**Preconditions:** Multiple work orders with different technicians/types

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open filter options | Filter UI appears |
| 2 | Filter by technician | Only that tech's jobs shown |
| 3 | Filter by work type | Only that type shown |
| 4 | Filter by status | Only that status shown |
| 5 | Clear filters | All jobs shown again |

### TEST 5.5: Create Recurring Schedule
**Preconditions:** Property exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new work order | Form opens |
| 2 | Enable "Recurring" option | Recurring fields appear |
| 3 | Select frequency (Weekly) | Weekly options shown |
| 4 | Select days of week | Checkboxes work |
| 5 | Set start and end date | Date range set |
| 6 | Save | Multiple jobs created |
| 7 | Verify jobs on calendar | Jobs appear on recurring dates |

---

## 6. Properties Management

### TEST 6.1: View Properties List
**Preconditions:** Properties exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/properties` | Properties list loads |
| 2 | Verify property cards/rows | Properties displayed |
| 3 | Verify customer name shown | Names visible |
| 4 | Verify address shown | Addresses visible |
| 5 | Verify property type | Residential/Commercial shown |

### TEST 6.2: Create New Property
**Preconditions:** Logged in as admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Property" | Form opens |
| 2 | Enter property name | Field accepts input |
| 3 | Enter customer name | Field accepts input |
| 4 | Enter full address | Address fields work |
| 5 | Select property type (Residential) | Selection saved |
| 6 | Add notes | Notes saved |
| 7 | Click "Save" | Property created |
| 8 | Verify geocoding | Coordinates generated |

### TEST 6.3: Edit Property
**Preconditions:** Property exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click property in list | Details shown |
| 2 | Click "Edit" | Edit form opens |
| 3 | Modify customer name | Change accepted |
| 4 | Modify address | Change accepted |
| 5 | Save changes | Updates persisted |

### TEST 6.4: Search/Filter Properties
**Preconditions:** Multiple properties exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter search term | Filter applies |
| 2 | Search by customer name | Matching properties shown |
| 3 | Search by address | Matching properties shown |
| 4 | Filter by type | Only that type shown |
| 5 | Clear search | All properties shown |

### TEST 6.5: Property Map View
**Preconditions:** Properties have coordinates

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle to map view | Map displays |
| 2 | Verify property markers | Markers appear on map |
| 3 | Click marker | Property info popup shows |
| 4 | Zoom to property | Map centers on property |

### TEST 6.6: Delete Property
**Preconditions:** Property exists with no linked work orders

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select property | Details shown |
| 2 | Click "Delete" | Confirmation appears |
| 3 | Confirm deletion | Property removed |
| 4 | Verify removal | Not in list |

---

## 7. Estimates

### TEST 7.1: View Estimates List
**Preconditions:** Estimates exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/estimates` | Estimates list loads |
| 2 | Verify estimate cards | Estimates displayed |
| 3 | Verify status badges | Draft/Sent/Accepted shown |
| 4 | Verify totals displayed | Amounts visible |

### TEST 7.2: Create New Estimate
**Preconditions:** Pricing items exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "New Estimate" | Form opens |
| 2 | Enter customer name | Field accepts input |
| 3 | Enter customer email | Field accepts input |
| 4 | Enter title/description | Fields accept input |
| 5 | Add line item from pricing library | Item added with price |
| 6 | Adjust quantity | Total recalculates |
| 7 | Add custom line item | Manual entry works |
| 8 | Set tax rate | Tax calculated |
| 9 | Add discount | Discount applied |
| 10 | Save as draft | Estimate saved |

### TEST 7.3: Edit Estimate
**Preconditions:** Draft estimate exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open estimate | Details displayed |
| 2 | Click "Edit" | Edit mode activates |
| 3 | Modify line items | Changes reflected |
| 4 | Add/remove items | List updates |
| 5 | Save changes | Changes persisted |

### TEST 7.4: Generate Estimate PDF
**Preconditions:** Estimate exists with line items

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open estimate | Details displayed |
| 2 | Click "Download PDF" | PDF generates |
| 3 | Verify PDF opens/downloads | PDF file created |
| 4 | Check PDF content | Business logo, items, totals correct |
| 5 | Verify brand colors in PDF | Custom colors applied |

### TEST 7.5: Send Estimate via Email
**Preconditions:** Estimate with customer email exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open estimate | Details displayed |
| 2 | Click "Send to Customer" | Send dialog appears |
| 3 | Verify recipient email | Correct email shown |
| 4 | Confirm send | Email sent |
| 5 | Verify status changes to "Sent" | Status updated |
| 6 | Verify sent timestamp | Timestamp recorded |

### TEST 7.6: Convert Estimate to Job
**Preconditions:** Accepted estimate exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open accepted estimate | Details displayed |
| 2 | Click "Convert to Job" | Conversion dialog appears |
| 3 | Set service date | Date selected |
| 4 | Assign technician | Tech assigned |
| 5 | Confirm conversion | Work order created |
| 6 | Verify estimate status | Status shows "Converted" |
| 7 | Verify work order exists | Job appears in schedule |

### TEST 7.7: Manage Pricing Items
**Preconditions:** Admin logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to pricing items | Pricing list shown |
| 2 | Add new pricing item | Form opens |
| 3 | Enter name, description, unit price | Fields work |
| 4 | Save item | Item added to library |
| 5 | Edit existing item | Edit works |
| 6 | Deactivate item | Item marked inactive |

---

## 8. Team Management

### TEST 8.1: View Team Members
**Preconditions:** Team members exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/team` | Team list loads |
| 2 | Verify member names | Names displayed |
| 3 | Verify roles | Roles shown (Owner, Admin, Technician) |
| 4 | Verify contact info | Phone/email shown |

### TEST 8.2: Invite New Team Member
**Preconditions:** Admin logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Invite Team Member" | Invite form opens |
| 2 | Enter email address | Field accepts input |
| 3 | Select role (Technician) | Role selected |
| 4 | Enter name (optional) | Field accepts input |
| 5 | Click "Send Invite" | Invite sent |
| 6 | Verify invite in pending list | Shows as pending |
| 7 | Check email received | Invite email arrives |

### TEST 8.3: Accept Team Invitation
**Preconditions:** Invite email received

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click invite link in email | Accept page loads |
| 2 | Enter password | Field accepts input |
| 3 | Complete account setup | Account created |
| 4 | Verify role assigned | Correct role in system |
| 5 | Verify access to tech dashboard | Can access /tech |

### TEST 8.4: Edit Team Member
**Preconditions:** Team member exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on team member | Details shown |
| 2 | Edit title | Change saved |
| 3 | Edit phone number | Change saved |
| 4 | Change role | Role updated |
| 5 | Save changes | Changes persisted |

### TEST 8.5: Remove Team Member
**Preconditions:** Non-owner team member exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select team member | Details shown |
| 2 | Click "Remove from Team" | Confirmation appears |
| 3 | Confirm removal | Member removed |
| 4 | Verify removed from list | No longer appears |
| 5 | Verify they lose access | Cannot login to business |

### TEST 8.6: Resend Invitation
**Preconditions:** Pending invitation exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find pending invite | Invite visible |
| 2 | Click "Resend" | Confirmation shown |
| 3 | Confirm resend | New email sent |
| 4 | Verify new email arrives | Email received |

---

## 9. Vendor Management

### TEST 9.1: View Vendors List
**Preconditions:** Vendors exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/vendors` | Vendors list loads |
| 2 | Verify vendor cards | Vendors displayed |
| 3 | Verify contact info | Name, email, phone shown |
| 4 | Verify services listed | Services visible |

### TEST 9.2: Create New Vendor
**Preconditions:** Admin logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Vendor" | Form opens |
| 2 | Enter company name | Field accepts input |
| 3 | Enter contact name | Field accepts input |
| 4 | Enter email and phone | Fields accept input |
| 5 | Add services provided | Multi-select/tags work |
| 6 | Add regions served | Regions added |
| 7 | Enter insurance info | Fields accept input |
| 8 | Enter license info | Fields accept input |
| 9 | Save vendor | Vendor created |

### TEST 9.3: Edit Vendor
**Preconditions:** Vendor exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click vendor in list | Details shown |
| 2 | Click "Edit" | Edit form opens |
| 3 | Modify contact info | Changes accepted |
| 4 | Update insurance expiry | Date updated |
| 5 | Save changes | Changes persisted |

### TEST 9.4: Vendor Insurance/License Expiry Tracking
**Preconditions:** Vendors with expiry dates exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View vendors list | List displayed |
| 2 | Check for expiry warnings | Upcoming expiries highlighted |
| 3 | Find expired vendor | Warning/badge shown |
| 4 | Update expiry date | Date updated |

### TEST 9.5: Delete Vendor
**Preconditions:** Vendor exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select vendor | Details shown |
| 2 | Click "Delete" | Confirmation appears |
| 3 | Confirm deletion | Vendor removed |
| 4 | Verify removal | Not in list |

---

## 10. Form Templates & Submissions

### TEST 10.1: View Form Templates
**Preconditions:** Form templates exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/forms` | Forms list loads |
| 2 | Verify template cards | Templates displayed |
| 3 | Verify work type associations | Work types shown |
| 4 | Verify active/inactive status | Status visible |

### TEST 10.2: Create Form Template
**Preconditions:** Admin logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Template" | Builder opens |
| 2 | Enter template name | Field accepts input |
| 3 | Enter description | Field accepts input |
| 4 | Select work type | Dropdown works |
| 5 | Add text field | Field added |
| 6 | Add number field | Field added |
| 7 | Add select field with options | Options configurable |
| 8 | Add photo field | Field added |
| 9 | Add signature field | Field added |
| 10 | Configure required fields | Required flag toggles |
| 11 | Save template | Template created |

### TEST 10.3: Add Conditional Logic
**Preconditions:** Form template with select field exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit form template | Builder opens |
| 2 | Select a field | Field properties shown |
| 3 | Add visibility condition | Condition UI appears |
| 4 | Set "Show when [select field] = [value]" | Condition configured |
| 5 | Save template | Logic saved |
| 6 | Test in preview | Field hides/shows correctly |

### TEST 10.4: Submit Form on Work Order
**Preconditions:** Work order with form template exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order | Form section visible |
| 2 | Fill text fields | Input accepted |
| 3 | Fill number fields | Numbers accepted |
| 4 | Select from dropdowns | Options work |
| 5 | Capture photo (with GPS) | Photo taken and tagged |
| 6 | Capture signature | Signature pad works |
| 7 | Submit form | Form saved |
| 8 | Verify submission | Responses stored |

### TEST 10.5: View Form Submissions
**Preconditions:** Form submissions exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order with submission | Submission visible |
| 2 | View all responses | Field values displayed |
| 3 | View captured photos | Photos displayed |
| 4 | View signature | Signature displayed |
| 5 | View submission timestamp | Time shown |

### TEST 10.6: Delete Form Template
**Preconditions:** Template with no submissions exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select template | Details shown |
| 2 | Click "Delete" | Confirmation appears |
| 3 | Confirm deletion | Template removed |

---

## 11. Customer Feedback / Scorecards

### TEST 11.1: Generate Feedback Link
**Preconditions:** Completed work order exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open completed work order | Details shown |
| 2 | Click "Send Feedback Request" | Dialog appears |
| 3 | Verify customer email | Email shown |
| 4 | Confirm send | Feedback token generated |
| 5 | Verify email sent | Email received |
| 6 | Verify feedback_sent_at | Timestamp recorded |

### TEST 11.2: Customer Submits Feedback
**Preconditions:** Feedback email received

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click feedback link in email | Feedback page loads |
| 2 | Verify business branding | Logo/colors shown |
| 3 | Rate quality (1-5) | Stars/rating works |
| 4 | Rate professionalism (1-5) | Rating works |
| 5 | Rate value (1-5) | Rating works |
| 6 | Rate timeliness (1-5) | Rating works |
| 7 | Enter comments | Text field works |
| 8 | Submit feedback | Success message shown |
| 9 | Try resubmitting | Duplicate prevented |

### TEST 11.3: View Feedback Results
**Preconditions:** Feedback submitted

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order as admin | Details shown |
| 2 | View feedback section | Ratings displayed |
| 3 | View customer comments | Comments shown |
| 4 | View submitted timestamp | Time displayed |

### TEST 11.4: Invalid Feedback Token
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/feedback/invalid-token` | Error page shown |
| 2 | Verify helpful message | "Invalid or expired" message |

---

## 12. GPS Photo Verification

### TEST 12.1: Capture Photo with GPS
**Preconditions:** Work order with location exists, mobile device or GPS-enabled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order | Details shown |
| 2 | Click photo capture | Camera activates |
| 3 | Allow location access | GPS permission granted |
| 4 | Take photo | Photo captured |
| 5 | Verify GPS overlay | Coordinates shown on photo |
| 6 | Upload photo | Photo saved |
| 7 | Verify metadata | Lat, lng, accuracy stored |

### TEST 12.2: Location Verification Pass
**Preconditions:** Photo taken near job site

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Capture photo at job location | Photo taken |
| 2 | Upload to work order | Photo uploaded |
| 3 | System calculates distance | Distance computed |
| 4 | Verify verification_status | Status = "verified" |
| 5 | View distance from job | Within threshold |

### TEST 12.3: Location Verification Mismatch
**Preconditions:** Photo taken far from job site

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Capture photo away from job | Photo taken |
| 2 | Upload to work order | Photo uploaded |
| 3 | System calculates distance | Distance computed |
| 4 | Verify verification_status | Status = "mismatch" |
| 5 | View distance warning | Distance shown |

### TEST 12.4: Admin Override Verification
**Preconditions:** Photo with mismatch status exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View photo as admin | Mismatch warning shown |
| 2 | Click "Override Verification" | Override dialog appears |
| 3 | Enter reason | Reason field accepts input |
| 4 | Confirm override | Status changes to "override" |
| 5 | Verify override logged | Verified_by and notes saved |

### TEST 12.5: Photo Annotations
**Preconditions:** Photo uploaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open photo | Photo viewer opens |
| 2 | Click annotate | Annotation tools appear |
| 3 | Draw arrow | Arrow rendered |
| 4 | Add text | Text added |
| 5 | Highlight area | Highlight applied |
| 6 | Save annotations | Annotations persisted |
| 7 | View annotated photo | Annotations visible |

---

## 13. Technician Dashboard

### TEST 13.1: View Today's Jobs
**Preconditions:** Logged in as technician, jobs assigned for today

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/tech` | Tech dashboard loads |
| 2 | View "Today's Jobs" section | Today's jobs displayed |
| 3 | Verify job details | Customer, time, location shown |
| 4 | Verify job count | Correct number displayed |

### TEST 13.2: View Upcoming Jobs
**Preconditions:** Jobs assigned for future dates

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View "Upcoming Jobs" section | Future jobs displayed |
| 2 | Verify dates shown | Dates visible |
| 3 | Verify sorted by date | Chronological order |

### TEST 13.3: Check In to Job
**Preconditions:** On-site at job location

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select today's job | Job details shown |
| 2 | Click "Check In" | Check-in activates |
| 3 | Allow location access | GPS captured |
| 4 | Verify check-in recorded | Timestamp and coords saved |
| 5 | Verify status changes | Job now "in-progress" |

### TEST 13.4: Check Out from Job
**Preconditions:** Checked into job

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Check Out" | Check-out activates |
| 2 | Allow location access | GPS captured |
| 3 | Verify check-out recorded | Timestamp and coords saved |
| 4 | Option to complete job | Complete dialog appears |

### TEST 13.5: Complete Job as Technician
**Preconditions:** Checked out from job

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Complete Job" | Completion flow starts |
| 2 | Fill required form fields | Form validates |
| 3 | Add completion notes | Notes accepted |
| 4 | Confirm completion | Job marked complete |
| 5 | Verify job moves to completed | Not in active jobs |

### TEST 13.6: Mark Job as Cannot Complete
**Preconditions:** Checked into job

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Cannot Complete" | Reason dialog appears |
| 2 | Select/enter reason | Reason recorded |
| 3 | Confirm | Status changes |
| 4 | Verify admin notified | Notification sent |

### TEST 13.7: Technician Profile
**Preconditions:** Logged in as technician

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/tech/profile` | Profile page loads |
| 2 | View personal info | Name, email shown |
| 3 | Edit phone number | Field editable |
| 4 | Save changes | Changes persisted |

---

## 14. Offline Functionality

### TEST 14.1: Offline Indicator
**Preconditions:** App loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect from internet | Go offline |
| 2 | Verify offline indicator | "Offline" badge/banner shown |
| 3 | Reconnect to internet | Go online |
| 4 | Verify indicator clears | Online status shown |

### TEST 14.2: Create Work Order Offline
**Preconditions:** App loaded, go offline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect from internet | Offline |
| 2 | Navigate to schedule | Page loads from cache |
| 3 | Create new work order | Form works |
| 4 | Save work order | Saved locally |
| 5 | Verify "pending sync" indicator | Sync badge shown |
| 6 | Reconnect to internet | Online |
| 7 | Verify automatic sync | Data syncs to server |
| 8 | Verify sync status clears | No pending badge |

### TEST 14.3: View Cached Data Offline
**Preconditions:** Data previously loaded while online

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load properties while online | Data cached |
| 2 | Disconnect from internet | Offline |
| 3 | Navigate to properties | Cached data displayed |
| 4 | View property details | Details shown |

### TEST 14.4: Create Property Offline
**Preconditions:** Offline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new property offline | Form works |
| 2 | Save property | Saved locally |
| 3 | Verify pending sync | Indicator shown |
| 4 | Reconnect | Property syncs |

### TEST 14.5: Submit Form Offline
**Preconditions:** Work order loaded offline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open work order offline | Form loads |
| 2 | Fill form fields | Inputs accepted |
| 3 | Capture photos | Photos stored locally |
| 4 | Submit form | Queued for sync |
| 5 | Reconnect | Form and photos sync |

### TEST 14.6: Sync Conflict Resolution
**Preconditions:** Offline changes conflict with server

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make offline changes | Saved locally |
| 2 | Have another user change same record | Server updated |
| 3 | Reconnect and sync | Conflict detected |
| 4 | Verify conflict handling | Resolution applied |

### TEST 14.7: Sync Queue Retry
**Preconditions:** Sync fails

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create offline record | Saved locally |
| 2 | Reconnect with server error | Sync fails |
| 3 | Verify retry queue | Item remains pending |
| 4 | Fix server issue | Retry succeeds |
| 5 | Verify sync completes | Item synced |

---

## 15. Settings & Branding

### TEST 15.1: Update Business Profile
**Preconditions:** Admin logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/settings` | Settings page loads |
| 2 | Edit business name | Field editable |
| 3 | Edit address | Fields editable |
| 4 | Edit phone number | Field editable |
| 5 | Save changes | Changes persisted |

### TEST 15.2: Upload Business Logo
**Preconditions:** On settings page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click logo upload area | File picker opens |
| 2 | Select image file | Image uploads |
| 3 | Verify preview | Logo shown in preview |
| 4 | Save settings | Logo persisted |
| 5 | Verify logo in header | Logo appears in app |
| 6 | Verify logo in PDFs | Logo in estimate PDFs |

### TEST 15.3: Change Brand Color
**Preconditions:** On settings page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click color picker | Color picker opens |
| 2 | Select new color | Color selected |
| 3 | Preview color | UI preview updates |
| 4 | Save settings | Color persisted |
| 5 | Verify color in app | Accent color changes |

### TEST 15.4: Configure Operating Hours
**Preconditions:** On settings page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find operating hours section | Hours UI shown |
| 2 | Set Monday hours | Time pickers work |
| 3 | Set closed days | Toggle works |
| 4 | Save changes | Hours persisted |

---

## 16. Mobile / PWA

### TEST 16.1: Install PWA
**Preconditions:** Using mobile browser (Chrome/Safari)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to app URL | App loads |
| 2 | Look for install prompt | "Add to Home Screen" appears |
| 3 | Accept installation | App installs |
| 4 | Open from home screen | App launches standalone |
| 5 | Verify no browser UI | Fullscreen app experience |

### TEST 16.2: PWA Update Notification
**Preconditions:** PWA installed, update available

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open PWA | App loads |
| 2 | Verify update prompt | "Update available" shown |
| 3 | Click update | App reloads with update |
| 4 | Verify new version | Update applied |

### TEST 16.3: Mobile Navigation
**Preconditions:** Using mobile device

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app on mobile | Mobile layout shown |
| 2 | Test hamburger menu | Menu opens |
| 3 | Navigate between pages | Navigation works |
| 4 | Test bottom navigation | Tabs work (if present) |
| 5 | Test swipe gestures | Gestures work (if implemented) |

### TEST 16.4: Mobile Camera Access
**Preconditions:** On mobile device

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open photo capture | Camera permission requested |
| 2 | Grant permission | Camera activates |
| 3 | Take photo | Photo captured |
| 4 | Verify GPS data | Location attached |
| 5 | Upload photo | Photo uploads |

### TEST 16.5: Mobile Location Services
**Preconditions:** On mobile device

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check in to job | Location requested |
| 2 | Grant permission | GPS activates |
| 3 | Verify accuracy | Accurate location captured |
| 4 | Verify map marker | Location shown on map |

---

## 17. Reports

### TEST 17.1: View Reports Dashboard
**Preconditions:** Work orders exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/reports` | Reports page loads |
| 2 | Verify statistics | Numbers displayed |
| 3 | Verify charts | Charts render |
| 4 | Verify date range selector | Selector works |

### TEST 17.2: Filter Reports by Date
**Preconditions:** On reports page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select custom date range | Date picker opens |
| 2 | Set start date | Date selected |
| 3 | Set end date | Date selected |
| 4 | Apply filter | Data filters |
| 5 | Verify numbers update | Stats recalculate |

### TEST 17.3: Work Type Breakdown
**Preconditions:** Multiple work types have jobs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View work type chart | Chart displays |
| 2 | Verify all types shown | Types listed |
| 3 | Verify counts accurate | Numbers match data |

---

## 18. Contact Page

### TEST 18.1: Submit Contact Form
**Preconditions:** None (public page)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/contact` | Contact page loads |
| 2 | Enter name | Field accepts input |
| 3 | Enter email | Field accepts input |
| 4 | Enter phone (optional) | Field accepts input |
| 5 | Enter company (optional) | Field accepts input |
| 6 | Select category | Dropdown works |
| 7 | Enter subject | Field accepts input |
| 8 | Enter message | Textarea accepts input |
| 9 | Submit form | Success message shown |
| 10 | Verify submission stored | Record in database |

### TEST 18.2: Contact Form Validation
**Preconditions:** On contact page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit empty form | Validation errors shown |
| 2 | Enter invalid email | Email validation fails |
| 3 | Fill all required fields | Validation passes |
| 4 | Submit | Form submits |

---

## 19. Public Pages

### TEST 19.1: Landing Page
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/` | Landing page loads |
| 2 | Verify hero section | Hero displayed |
| 3 | Verify feature highlights | Features shown |
| 4 | Click CTA buttons | Navigate correctly |
| 5 | Test responsive layout | Mobile layout works |

### TEST 19.2: Features Page
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/features` | Features page loads |
| 2 | Verify feature list | All features displayed |
| 3 | Test any interactive elements | Elements work |

### TEST 19.3: Plans/Pricing Page
**Preconditions:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/plans` | Pricing page loads |
| 2 | Verify pricing tiers | Plans displayed |
| 3 | Verify pricing amounts | Prices shown |
| 4 | Test signup CTAs | Navigate to signup |

---

## Test Environment Checklist

Before testing, ensure:

- [ ] Test database is seeded with sample data
- [ ] Test user accounts exist for each role (owner, admin, technician)
- [ ] Test business with logo and brand color configured
- [ ] Sample properties with coordinates exist
- [ ] Sample work orders in various statuses exist
- [ ] Sample estimates exist
- [ ] Sample vendors with insurance/license data exist
- [ ] Form templates exist
- [ ] Mobile device available for GPS/camera tests
- [ ] Multiple browsers available for cross-browser testing

---

## Bug Reporting Template

When reporting issues found during testing:

```
**Test ID:** [e.g., TEST 4.1]
**Title:** Brief description
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** What should happen
**Actual Result:** What actually happened
**Screenshots/Video:** Attach if applicable
**Browser/Device:** Chrome 120, iPhone 15
**Additional Notes:** Any other context
```

---

## Test Completion Sign-off

| Section | Tester | Date | Pass/Fail | Notes |
|---------|--------|------|-----------|-------|
| Authentication | | | | |
| Onboarding | | | | |
| Dashboard | | | | |
| Work Orders | | | | |
| Scheduling | | | | |
| Properties | | | | |
| Estimates | | | | |
| Team | | | | |
| Vendors | | | | |
| Forms | | | | |
| Feedback | | | | |
| GPS Photos | | | | |
| Technician | | | | |
| Offline | | | | |
| Settings | | | | |
| Mobile/PWA | | | | |
| Reports | | | | |
| Contact | | | | |
| Public Pages | | | | |

**Overall Status:** ____________
**Tested By:** ____________
**Date:** ____________
