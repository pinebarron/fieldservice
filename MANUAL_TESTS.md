# Field Service Application - Manual Test Suite

## Quick Smoke Test Checklist

Run these 10 tests for a quick health check:

- [ ] Login as owner
- [ ] Create a work log with photos
- [ ] Assign to technician
- [ ] Login as technician
- [ ] Check in to job
- [ ] Fill out form
- [ ] Check out (complete job)
- [ ] Login as owner, view completed job
- [ ] Create and send estimate
- [ ] Add new team member

---

## 1. Authentication & Onboarding

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1.1 | New user signup | Go to `/signup` → Enter name, email, password → Submit | Account created, redirected to `/onboarding` |
| 1.2 | Business onboarding | On `/onboarding` → Enter business name, address, phone → Submit | Business created, redirected to `/dashboard` |
| 1.3 | Login with valid credentials | Go to `/login` → Enter email/password → Submit | Logged in, redirected to `/dashboard` |
| 1.4 | Login with invalid credentials | Go to `/login` → Enter wrong password → Submit | Error message displayed, stays on login |
| 1.5 | Session persistence | Login → Close browser → Reopen → Go to `/dashboard` | Still logged in |
| 1.6 | Unauthenticated redirect | Clear cookies → Go to `/dashboard` | Redirected to `/login` |
| 1.7 | Logout | Click logout from menu | Session cleared, redirected to `/login` |

---

## 2. Team Management & Invites

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 2.1 | Add team member | `/team` → Add Member → Enter email, name, role (technician) → Submit | Invite URL generated and displayed |
| 2.2 | Copy invite link | Click "Copy Link" on invite modal | Link copied to clipboard |
| 2.3 | Accept invite (new user) | Open invite URL → Enter password → Submit | Account created, redirected to `/tech` |
| 2.4 | Accept invite (existing user) | User already has account → Open invite URL | Shows "already set up" with login link |
| 2.5 | View team members | Go to `/team` | All members shown with roles and status |
| 2.6 | Pending badge | View member who hasn't accepted invite | Yellow "Pending" badge displayed |
| 2.7 | Remove team member | Click trash icon → Confirm | Member removed from team |

---

## 3. Schedule & Work Logs (Admin/Owner)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 3.1 | Create work log | `/schedule` → New Entry → Fill required fields → Submit | Work log created, appears in list |
| 3.2 | Assign technician | Create work log → Select technician from dropdown | Tech name shown on job card |
| 3.3 | Select form template | Create work log → Select matching work type | Form fields appear automatically |
| 3.4 | Capture before photos | Click camera on Before Photos field → Take photo | Photo appears with GPS badge if location captured |
| 3.5 | Capture after photos | Same as above for After field | Photo captured with GPS |
| 3.6 | Status change | Click status dropdown on job → Change to "in-progress" | Status updated, color changes |
| 3.7 | Edit work log | Click job → Edit fields → Save | Changes saved |
| 3.8 | Delete work log | Click delete on job → Confirm | Job removed from list |
| 3.9 | Calendar view | Toggle to calendar view | Jobs shown on correct dates |
| 3.10 | Filter by status | Select status filter dropdown | Only matching jobs shown |

---

## 4. Technician Dashboard & Workflow

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 4.1 | Tech redirect | Login as technician → Go to `/dashboard` | Redirected to `/tech` |
| 4.2 | Today's jobs | View `/tech` | Shows jobs scheduled for today |
| 4.3 | Upcoming jobs | View `/tech` | Shows future scheduled jobs |
| 4.4 | View job detail | Click on a job | Navigates to `/tech/job/[id]` |
| 4.5 | Assigned badge | View job assigned to you | Green "This job is assigned to you" badge |
| 4.6 | Check in (with GPS) | Allow location → Click "Check In" | Status changes to "in-progress", time recorded |
| 4.7 | Check in (GPS denied) | Deny location → Click "Check In" | Check in succeeds without location |
| 4.8 | Edit work notes | Click Edit on Work Notes → Update → Save | Notes saved |
| 4.9 | Fill form | Form section → Enter data → Save Form | Form submission saved |
| 4.10 | Conditional fields | Select value that triggers showIf → Check dependent field | Conditional field appears/hides |
| 4.11 | Check out | Click "Complete Job" | Status changes to "completed", time recorded |
| 4.12 | Get directions | Click "Get Directions" link | Opens Google Maps with address |

---

## 5. Form Templates

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 5.1 | Create form template | `/forms` → New Template → Add fields → Save | Template appears in list |
| 5.2 | Add text field | Edit template → Add field → Type: Text | Text input renders on form |
| 5.3 | Add select field | Add field → Type: Select → Add options | Dropdown with options renders |
| 5.4 | Add photo field | Add field → Type: Photo → Configure GPS settings | Photo capture field renders |
| 5.5 | Set work type | Edit template → Set work type | Form auto-selects for matching work logs |
| 5.6 | Conditional logic | Add showIf rule to field | Field shows/hides based on condition |
| 5.7 | Required field | Mark field as required → Submit empty | Validation error shown |
| 5.8 | Use starter template | Click "Use Template" on starter | Template copied to your forms |
| 5.9 | Delete template | Click delete → Confirm | Template removed |

---

## 6. Properties

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 6.1 | Create property | `/properties` → New → Enter address → Save | Property created with geocoded location |
| 6.2 | Link to work log | Create work log → Select property from dropdown | Address auto-fills |
| 6.3 | View on map | Dashboard map | Property markers shown |
| 6.4 | Edit property | Click property → Edit → Save | Changes saved |
| 6.5 | Mark inactive | Toggle active status | Property hidden from dropdowns |

---

## 7. Estimates

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 7.1 | Create estimate | `/estimates` → New → Fill customer info → Save | Estimate created as draft |
| 7.2 | Add line item from catalog | Click "From Catalog" → Select item | Item added with pricing |
| 7.3 | Add manual line item | Enter description, qty, price manually | Custom item added |
| 7.4 | Set tax rate | Enter tax percentage | Tax calculated on subtotal |
| 7.5 | Apply discount | Enter discount amount or % | Discount applied to total |
| 7.6 | Preview PDF | Click preview | PDF renders with branding |
| 7.7 | Send estimate | Click Send → Enter email → Send | Email sent, status changes to "Sent" |
| 7.8 | View estimate detail | Click estimate in list | Full detail page with line items |

---

## 8. Pricing Catalog

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 8.1 | Add pricing item | `/pricing` → New → Enter name, unit, price → Save | Item appears in catalog |
| 8.2 | Set category | Add item with category (Labor, Materials, etc.) | Item grouped by category |
| 8.3 | Use in estimate | Create estimate → Add from catalog | Pricing pre-fills from catalog |
| 8.4 | Edit pricing | Click item → Update price → Save | Price updated |
| 8.5 | Delete pricing | Click delete → Confirm | Item removed |

---

## 9. Settings & Branding

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 9.1 | Update business info | `/settings` → Edit name/address → Save | Info updated |
| 9.2 | Upload logo | Click upload → Select image | Logo displayed in settings |
| 9.3 | Set brand color | Pick color from picker → Save | Color applied to UI accents |
| 9.4 | Branding in PDF | Generate estimate PDF | Logo and color appear in PDF |

---

## 10. Vendors

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 10.1 | Add vendor | `/vendors` → New → Enter company info → Save | Vendor appears in list |
| 10.2 | Add services | Edit vendor → Add services offered | Services shown on vendor card |
| 10.3 | Track insurance | Enter insurance info with expiry | Insurance status displayed |
| 10.4 | Track license | Enter license info | License details shown |

---

## 11. Photo GPS Verification

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 11.1 | Photo within 100m | Capture photo at job site | Green "Verified" badge |
| 11.2 | Photo > 100m away | Capture photo from different location | Yellow "Mismatch" warning |
| 11.3 | No GPS available | Deny location permission → Capture | Photo saved without GPS badge |
| 11.4 | View photo metadata | Click photo → View details | GPS coords and distance shown |

---

## 12. Role-Based Access Control

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 12.1 | Tech blocked from /settings | Login as tech → Navigate to `/settings` | Redirected to `/tech` |
| 12.2 | Tech blocked from /team | Login as tech → Navigate to `/team` | Redirected to `/tech` |
| 12.3 | Tech can view assigned job | Navigate to `/tech/job/[assigned-id]` | Page loads, can edit |
| 12.4 | Tech view-only for unassigned | Navigate to `/tech/job/[other-id]` | Page loads, no edit buttons |
| 12.5 | Admin full access | Login as admin → Navigate all pages | All pages accessible |

---

## 13. Edge Cases & Error Handling

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 13.1 | Invalid job ID | Navigate to `/tech/job/invalid-uuid` | 404 Not Found page |
| 13.2 | Expired invite token | Use old/invalid invite URL | Error: "Invalid or expired invite" |
| 13.3 | Duplicate team member | Invite same email twice | Error: "Already a team member" |
| 13.4 | Required field empty | Submit form with required field empty | Validation error shown |
| 13.5 | Network error during save | Disconnect network → Save form | Error message, data preserved |

---

## Test Accounts

Create these test accounts for comprehensive testing:

| Role | Email | Purpose |
|------|-------|---------|
| Owner | owner@test.com | Full admin access |
| Admin | admin@test.com | Admin-level testing |
| Tech 1 | tech1@test.com | Primary technician |
| Tech 2 | tech2@test.com | Secondary technician (for assignment tests) |

---

## Test Data Checklist

Before running tests, ensure you have:

- [ ] At least 2 properties created
- [ ] At least 3 form templates (different work types)
- [ ] At least 5 pricing catalog items
- [ ] At least 2 technicians invited and accepted
- [ ] At least 1 vendor created
- [ ] Jobs in various statuses (scheduled, in-progress, completed)

---

## Browser/Device Testing Matrix

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | [ ] | [ ] |
| Safari | [ ] | [ ] |
| Firefox | [ ] | [ ] |
| Edge | [ ] | [ ] |

### Mobile-Specific Tests

- [ ] Camera capture works on iOS Safari
- [ ] Camera capture works on Android Chrome
- [ ] GPS location captured on mobile
- [ ] Touch interactions work (swipe, tap, long-press)
- [ ] Responsive layout at 375px width
- [ ] PWA install prompt appears
