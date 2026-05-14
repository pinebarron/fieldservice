# FieldCapture API Reference

## Base URL

All endpoints are relative to your FieldCapture deployment root.

```
https://your-app.replit.app
```

---

## Authentication

Every endpoint marked **Auth required** accepts one of two methods:

### Option A — API Key (recommended for integrations)

Add both headers to every request:

```http
X-Client-ID: fc_id_<your_client_id>
X-Client-Secret: fc_secret_<your_client_secret>
```

Generate credentials in the app under **Settings → Developer API Access**. The secret is shown only once at creation time — store it securely.

### Option B — Session cookie

Browser-based login via Replit Auth. The session cookie is set automatically after visiting `/api/login`.

---

## Errors

All errors return JSON with an `error` or `message` key and a standard HTTP status code.

| Status | Meaning |
|--------|---------|
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthorized — missing or invalid credentials |
| `403` | Forbidden — authenticated but not allowed (e.g. not the business owner) |
| `404` | Resource not found |
| `500` | Internal server error |

```json
{ "error": "Business not found" }
```

---

## Resources

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique user ID |
| `email` | string | Email address |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `profileImageUrl` | string | Avatar URL |
| `createdAt` | timestamp | Account creation time |

### Business

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique business ID |
| `name` | string | Business name |
| `ownerId` | string | User ID of the owner |
| `address` | string | Street address |
| `city` | string | City |
| `state` | string | State (2-letter code) |
| `zipCode` | string | ZIP code |
| `phone` | string | Contact phone |
| `overview` | string | Business description |
| `hoursOfOperation` | object | Map of day → `{ open, close, closed }` |
| `brandColor` | string | Hex color, e.g. `#2563eb` |
| `logoUrl` | string | Logo URL |
| `createdAt` / `updatedAt` | timestamp | |

### BusinessMember

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Member record ID |
| `businessId` | string | Parent business |
| `userId` | string | User account linked |
| `role` | string | `"technician"`, `"admin"`, etc. |
| `createdAt` | timestamp | |

### Vendor

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `businessId` | string | |
| `name` | string | Vendor/company name |
| `contactName` | string | Primary contact |
| `contactEmail` | string | |
| `contactPhone` | string | |
| `servicesProvided` | string[] | List of services |
| `regionsServed` | string[] | List of regions |
| `insuranceProvider` | string | |
| `insurancePolicyNumber` | string | |
| `insuranceExpiry` | string | `YYYY-MM-DD` |
| `licenseNumber` | string | |
| `licenseExpiry` | string | `YYYY-MM-DD` |
| `notes` | string | |
| `status` | string | `"active"` or `"inactive"` |
| `createdAt` / `updatedAt` | timestamp | |

### Property

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `businessId` | string | |
| `propertyName` | string | Internal property label |
| `customerName` | string | Customer/owner name |
| `locationName` | string | Site name |
| `city` | string | |
| `state` | string | 2-letter state code |
| `zipCode` | string | |
| `status` | string | `"active"` or `"inactive"` |
| `notes` | string | |
| `createdAt` / `updatedAt` | timestamp | |

### PricingItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `businessId` | string | |
| `category` | string | Grouping label, default `"General"` |
| `name` | string | Item name |
| `description` | string | |
| `unit` | string | Unit of measure, default `"each"` |
| `unitPrice` | string | Numeric string, e.g. `"150.00"` |
| `isActive` | string | `"true"` or `"false"` |
| `createdAt` / `updatedAt` | timestamp | |

### Estimate

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `businessId` | string | |
| `propertyId` | string | Optional linked property |
| `title` | string | Estimate title |
| `customerName` | string | |
| `customerEmail` | string | |
| `customerPhone` | string | |
| `description` | string | Scope summary |
| `status` | string | `"draft"`, `"sent"`, `"approved"`, `"rejected"` |
| `validUntil` | string | `YYYY-MM-DD` |
| `taxRate` | string | Percentage as string, e.g. `"8.5"` |
| `discountAmount` | string | Fixed discount as string, e.g. `"100.00"` |
| `notes` | string | Internal notes |
| `createdAt` / `updatedAt` | timestamp | |

### EstimateLineItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `estimateId` | string | Parent estimate |
| `pricingItemId` | string | Optional link to catalog item |
| `description` | string | Line description |
| `quantity` | string | Numeric string |
| `unit` | string | Unit of measure |
| `unitPrice` | string | Numeric string |
| `sortOrder` | string | Numeric string for ordering |

### WorkLog

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `businessId` | string | |
| `propertyId` | string | Optional linked property |
| `technicianUserId` | string | Primary technician |
| `technicianUserIds` | string[] | All technicians on the job |
| `customerName` | string | |
| `workType` | string | Type of service performed |
| `locationName` | string | Site/location name |
| `city` | string | |
| `state` | string | 2-letter state code |
| `zipCode` | string | |
| `serviceDate` | string | `YYYY-MM-DD` |
| `startTime` | string | `HH:MM` (24-hour) |
| `endTime` | string | `HH:MM` (24-hour) |
| `workPerformed` | string | Description of work done |
| `additionalNotes` | string | |
| `status` | string | `"completed"`, `"in_progress"`, `"pending"` |
| `imageUrls` | string[] | Uploaded image URLs |
| `pdfUrls` | string[] | Uploaded PDF URLs |
| `photoMetadata` | PhotoMeta[] | GPS-tagged photo objects |
| `checkInTime` | string | ISO 8601 timestamp of check-in |
| `checkOutTime` | string | ISO 8601 timestamp of check-out |
| `checkInLat` / `checkInLng` | string | GPS coordinates at check-in |
| `checkOutLat` / `checkOutLng` | string | GPS coordinates at check-out |
| `createdAt` / `updatedAt` | timestamp | |

**PhotoMeta object:**

```json
{
  "url": "https://...",
  "type": "before | after | general",
  "lat": 37.7749,
  "lng": -122.4194,
  "address": "123 Main St",
  "capturedAt": "2025-10-01T14:30:00Z",
  "technicianName": "Jane Smith"
}
```

---

## Endpoints

### Auth

#### `GET /api/login`
Redirects the browser to Replit Auth. After login the user is redirected back to `/`.

#### `GET /api/logout`
Clears the session and redirects to Replit's logout page.

#### `GET /api/auth/user`
Returns the currently authenticated user.

**Auth required:** Yes

**Response `200`:**
```json
{
  "id": "usr_abc123",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "profileImageUrl": "https://..."
}
```

---

### Business

#### `GET /api/business`
Returns the business associated with the authenticated user, or `null` if none exists.

**Auth required:** Yes

**Response `200`:**
```json
{
  "id": "biz_abc123",
  "name": "Acme Solar",
  "ownerId": "usr_abc123",
  "address": "1 Market St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",
  "phone": "415-555-0100",
  "overview": "Solar installation and maintenance.",
  "brandColor": "#2563eb",
  "logoUrl": null,
  "createdAt": "2025-10-01T12:00:00Z",
  "updatedAt": "2025-10-01T12:00:00Z"
}
```

#### `POST /api/business`
Creates a new business. The authenticated user becomes the owner and is automatically added as a member.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "Acme Solar",
  "address": "1 Market St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",
  "phone": "415-555-0100",
  "overview": "Solar installation and maintenance.",
  "brandColor": "#2563eb"
}
```
Only `name` is required.

**Response `201`:** Business object.

#### `PATCH /api/business/settings`
Updates business settings. Owner only.

**Auth required:** Yes

**Request body:** Any subset of the Business fields (all optional).

**Response `200`:** Updated Business object.

---

### Members

#### `GET /api/business/members`
Lists all members (employees) of the business.

**Auth required:** Yes

**Response `200`:**
```json
[
  {
    "id": "mem_abc123",
    "businessId": "biz_abc123",
    "userId": "usr_xyz456",
    "role": "technician",
    "createdAt": "2025-10-01T12:00:00Z"
  }
]
```

#### `POST /api/business/members`
Adds a new employee to the business. Creates a user account for them if one doesn't exist.

**Auth required:** Yes

**Request body:**
```json
{
  "email": "tech@example.com",
  "firstName": "Bob",
  "lastName": "Jones",
  "role": "technician"
}
```
`role` defaults to `"technician"` if omitted.

**Response `201`:** BusinessMember object.

#### `PATCH /api/business/members/:id/role`
Updates a member's role.

**Auth required:** Yes

**Request body:**
```json
{ "role": "admin" }
```

**Response `200`:** Updated BusinessMember object.

#### `DELETE /api/business/members/:id`
Removes a member from the business.

**Auth required:** Yes

**Response `204`:** No content.

---

### Vendors

#### `GET /api/vendors`
Returns all vendors for the business.

**Auth required:** Yes

**Response `200`:** Array of Vendor objects.

#### `POST /api/vendors`
Creates a new vendor.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "SunPower Supplies",
  "contactName": "Alice Wu",
  "contactEmail": "alice@sunpower.com",
  "contactPhone": "800-555-0200",
  "servicesProvided": ["Panel Installation", "Inverter Repair"],
  "regionsServed": ["CA", "NV"],
  "licenseNumber": "LIC-12345",
  "licenseExpiry": "2026-12-31",
  "status": "active"
}
```
Only `name` is required.

**Response `201`:** Vendor object.

#### `GET /api/vendors/:id`
Returns a single vendor.

**Auth required:** Yes

**Response `200`:** Vendor object.

#### `PATCH /api/vendors/:id`
Updates a vendor. Any subset of vendor fields.

**Auth required:** Yes

**Response `200`:** Updated Vendor object.

#### `DELETE /api/vendors/:id`
Deletes a vendor.

**Auth required:** Yes

**Response `204`:** No content.

---

### Properties

#### `GET /api/properties`
Returns all properties (job sites) for the business.

**Auth required:** Yes

**Response `200`:** Array of Property objects.

#### `POST /api/properties`
Creates a new property.

**Auth required:** Yes

**Request body:**
```json
{
  "propertyName": "Rooftop Array A",
  "customerName": "City Hall",
  "locationName": "Main Campus",
  "city": "Sacramento",
  "state": "CA",
  "zipCode": "95814",
  "status": "active",
  "notes": "Access via north gate."
}
```
`propertyName`, `customerName`, `locationName`, `city`, `state`, and `zipCode` are required.

**Response `201`:** Property object.

#### `GET /api/properties/:id`
Returns a single property.

**Auth required:** Yes

**Response `200`:** Property object.

#### `PATCH /api/properties/:id`
Updates a property.

**Auth required:** Yes

**Response `200`:** Updated Property object.

#### `DELETE /api/properties/:id`
Deletes a property.

**Auth required:** Yes

**Response `204`:** No content.

---

### Pricing Catalog

#### `GET /api/pricing-items`
Returns all pricing catalog items for the business.

**Auth required:** Yes

**Response `200`:** Array of PricingItem objects.

#### `POST /api/pricing-items`
Creates a new pricing item.

**Auth required:** Yes

**Request body:**
```json
{
  "category": "Solar",
  "name": "Panel Cleaning",
  "description": "Full wash and inspection per panel.",
  "unit": "panel",
  "unitPrice": "12.50",
  "isActive": "true"
}
```
`name` is required. `category` defaults to `"General"`, `unit` to `"each"`, `unitPrice` to `"0"`.

**Response `201`:** PricingItem object.

#### `PATCH /api/pricing-items/:id`
Updates a pricing item.

**Auth required:** Yes

**Response `200`:** Updated PricingItem object.

#### `DELETE /api/pricing-items/:id`
Deletes a pricing item.

**Auth required:** Yes

**Response `204`:** No content.

---

### Estimates

#### `GET /api/estimates`
Returns all estimates for the business.

**Auth required:** Yes

**Response `200`:** Array of Estimate objects.

#### `POST /api/estimates`
Creates a new estimate.

**Auth required:** Yes

**Request body:**
```json
{
  "title": "Panel Cleaning — Q4",
  "customerName": "City Hall",
  "customerEmail": "fm@cityhall.gov",
  "propertyId": "prop_abc123",
  "status": "draft",
  "taxRate": "8.5",
  "discountAmount": "0",
  "validUntil": "2025-12-31"
}
```
`title` and `customerName` are required.

**Response `201`:** Estimate object.

#### `GET /api/estimates/:id`
Returns a single estimate including its line items.

**Auth required:** Yes

**Response `200`:**
```json
{
  "id": "est_abc123",
  "title": "Panel Cleaning — Q4",
  ...
  "lineItems": [
    {
      "id": "li_abc123",
      "estimateId": "est_abc123",
      "description": "Panel Cleaning",
      "quantity": "40",
      "unit": "panel",
      "unitPrice": "12.50",
      "sortOrder": "0"
    }
  ]
}
```

#### `PATCH /api/estimates/:id`
Updates an estimate and optionally replaces all line items.

**Auth required:** Yes

**Request body:**
```json
{
  "status": "sent",
  "lineItems": [
    {
      "description": "Panel Cleaning",
      "quantity": "40",
      "unit": "panel",
      "unitPrice": "12.50",
      "sortOrder": "0"
    }
  ]
}
```
All fields optional. If `lineItems` is provided, existing line items are replaced.

**Response `200`:** Updated Estimate object with `lineItems`.

#### `DELETE /api/estimates/:id`
Deletes an estimate and all its line items.

**Auth required:** Yes

**Response `204`:** No content.

---

### Work Logs

#### `GET /api/work-logs`
Returns work logs for the business. Supports filtering.

**Auth required:** Yes

**Query parameters:**

| Param | Description |
|-------|-------------|
| `workType` | Filter by work type string |
| `customerName` | Partial match on customer name |
| `technicianUserId` | Filter by technician user ID |
| `dateFrom` | Start date — `YYYY-MM-DD` |
| `dateTo` | End date — `YYYY-MM-DD` |
| `propertyId` | Filter by property |

**Response `200`:** Array of WorkLog objects (each includes a `technician` object with user details).

#### `POST /api/work-logs`
Creates a new work log.

**Auth required:** Yes

**Request body:**
```json
{
  "technicianUserId": "usr_abc123",
  "technicianUserIds": ["usr_abc123", "usr_xyz456"],
  "customerName": "City Hall",
  "workType": "Solar Panel Cleaning",
  "locationName": "Main Campus",
  "city": "Sacramento",
  "state": "CA",
  "zipCode": "95814",
  "serviceDate": "2025-10-15",
  "startTime": "08:00",
  "endTime": "14:30",
  "workPerformed": "Cleaned 40 panels, replaced 2 connectors.",
  "additionalNotes": "Customer requested follow-up in 6 months.",
  "status": "completed",
  "propertyId": "prop_abc123"
}
```
Required: `technicianUserId`, `customerName`, `workType`, `locationName`, `city`, `state`, `zipCode`, `serviceDate`, `workPerformed`.

**Response `201`:** WorkLog object.

#### `GET /api/work-logs/:id`
Returns a single work log.

**Auth required:** Yes

**Response `200`:** WorkLog object.

#### `PATCH /api/work-logs/:id`
Updates a work log. Any subset of work log fields.

**Auth required:** Yes

**Response `200`:** Updated WorkLog object.

#### `DELETE /api/work-logs/:id`
Deletes a work log.

**Auth required:** Yes

**Response `204`:** No content.

#### `POST /api/work-logs/:id/check-in`
Records a check-in for an on-site visit.

**Auth required:** Yes

**Request body:**
```json
{
  "lat": 38.5816,
  "lng": -121.4944
}
```
Both GPS coordinates are optional.

**Response `200`:** Updated WorkLog object with `checkInTime`, `checkInLat`, `checkInLng` set.

#### `POST /api/work-logs/:id/check-out`
Records a check-out from an on-site visit.

**Auth required:** Yes

**Request body:**
```json
{
  "lat": 38.5816,
  "lng": -121.4944
}
```

**Response `200`:** Updated WorkLog object with `checkOutTime`, `checkOutLat`, `checkOutLng` set.

---

### Statistics

#### `GET /api/stats`
Returns summary statistics for the business dashboard.

**Auth required:** Yes

**Response `200`:**
```json
{
  "totalJobs": 142,
  "weekJobs": 8,
  "thisMonthJobs": 31,
  "images": 420,
  "reports": 58
}
```

---

### Developer API Clients

These endpoints manage API credentials and **require session-based login** (owner only). They cannot be called using API keys.

#### `GET /api/developer/clients`
Lists all API clients for the business.

**Auth required:** Yes (session, owner only)

**Response `200`:**
```json
[
  {
    "id": "cli_abc123",
    "businessId": "biz_abc123",
    "name": "Zapier Integration",
    "clientId": "fc_id_abc123def456...",
    "isActive": "true",
    "createdAt": "2025-10-01T12:00:00Z"
  }
]
```
`clientSecretHash` is never returned.

#### `POST /api/developer/clients`
Creates a new API client and returns the plaintext secret **once**.

**Auth required:** Yes (session, owner only)

**Request body:**
```json
{ "name": "My Integration" }
```

**Response `201`:**
```json
{
  "id": "cli_abc123",
  "businessId": "biz_abc123",
  "name": "My Integration",
  "clientId": "fc_id_abc123def456...",
  "clientSecret": "fc_secret_xyz789...",
  "isActive": "true",
  "createdAt": "2025-10-01T12:00:00Z"
}
```
`clientSecret` is only present in this response. Save it immediately.

#### `DELETE /api/developer/clients/:id`
Revokes an API client. The key stops working immediately.

**Auth required:** Yes (session, owner only)

**Response `200`:**
```json
{ "success": true }
```

---

## Code Examples

### List all work logs (curl)
```bash
curl https://your-app.replit.app/api/work-logs \
  -H "X-Client-ID: fc_id_abc123..." \
  -H "X-Client-Secret: fc_secret_xyz789..."
```

### Filter work logs by date range (curl)
```bash
curl "https://your-app.replit.app/api/work-logs?dateFrom=2025-10-01&dateTo=2025-10-31" \
  -H "X-Client-ID: fc_id_abc123..." \
  -H "X-Client-Secret: fc_secret_xyz789..."
```

### Create a work log (curl)
```bash
curl -X POST https://your-app.replit.app/api/work-logs \
  -H "X-Client-ID: fc_id_abc123..." \
  -H "X-Client-Secret: fc_secret_xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "technicianUserId": "usr_abc123",
    "customerName": "City Hall",
    "workType": "Solar Panel Cleaning",
    "locationName": "Main Campus",
    "city": "Sacramento",
    "state": "CA",
    "zipCode": "95814",
    "serviceDate": "2025-10-15",
    "workPerformed": "Cleaned 40 panels.",
    "status": "completed"
  }'
```

### JavaScript / fetch
```js
const headers = {
  "X-Client-ID": "fc_id_abc123...",
  "X-Client-Secret": "fc_secret_xyz789...",
  "Content-Type": "application/json",
};

// Fetch all properties
const res = await fetch("https://your-app.replit.app/api/properties", { headers });
const properties = await res.json();

// Create a work log
const log = await fetch("https://your-app.replit.app/api/work-logs", {
  method: "POST",
  headers,
  body: JSON.stringify({
    technicianUserId: "usr_abc123",
    customerName: "City Hall",
    workType: "Inspection",
    locationName: "Roof A",
    city: "Sacramento",
    state: "CA",
    zipCode: "95814",
    serviceDate: "2025-10-15",
    workPerformed: "Annual safety inspection.",
    status: "completed",
  }),
}).then(r => r.json());
```

### Python / requests
```python
import requests

BASE = "https://your-app.replit.app"
HEADERS = {
    "X-Client-ID": "fc_id_abc123...",
    "X-Client-Secret": "fc_secret_xyz789...",
}

# List work logs
logs = requests.get(f"{BASE}/api/work-logs", headers=HEADERS).json()

# Get a specific property
prop = requests.get(f"{BASE}/api/properties/prop_abc123", headers=HEADERS).json()

# Check a technician in
requests.post(
    f"{BASE}/api/work-logs/log_abc123/check-in",
    headers=HEADERS,
    json={"lat": 38.5816, "lng": -121.4944},
)
```
