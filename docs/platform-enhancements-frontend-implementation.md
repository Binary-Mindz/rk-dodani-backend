# Platform Enhancements Frontend Implementation Guide

This guide details the frontend integration patterns, API contracts, TypeScript definitions, and UI/UX recommendations for the 5 newly implemented platform features:
1. **Maintenance Mode & System-Wide Interception**
2. **Dynamic Content Type Management**
3. **Enterprise User Team Member Role Separation**
4. **Resilient Billing Plan Deletion & Archival**
5. **Admin User Management Account Deletion**

---

## Table of Contents
1. [Maintenance Mode & System Interception](#1-maintenance-mode--system-interception)
2. [Dynamic Content Type Management](#2-dynamic-content-type-management)
3. [Enterprise Team Member Role Separation](#3-enterprise-team-member-role-separation)
4. [Resilient Billing Plan Deletion & Archival](#4-resilient-billing-plan-deletion--archival)
5. [Admin User Management Account Deletion](#5-admin-user-management-account-deletion)
6. [TypeScript Interfaces & Type Definitions](#6-typescript-interfaces--type-definitions)
7. [Frontend Developer Checklist & Action Items](#7-frontend-developer-checklist--action-items)

---

## 1. Maintenance Mode & System Interception

### 1.1 Overview & Behavior
- When maintenance mode is active, the backend globally blocks all regular users, enterprise users, and enterprise team admins with **`HTTP 503 Service Unavailable`**.
- **No Login / No Registration**: Regular users and enterprise users **cannot** register or log in while maintenance mode is active. Calls to `/v1/auth/login`, `/v1/auth/register`, etc. return `503 Service Unavailable`.
- **System Admin Access Only**: Only System Administrators (`SUPER_ADMIN`) are permitted to log in (via `/v1/auth/login`) and make API calls during maintenance mode. Enterprise Admins (`teamRole: ADMIN` / `ENTERPRISE`) are **not** system admins and remain blocked.
- Public whitelisted routes include: `/health`, `/`, `/docs`, and maintenance toggle endpoints `/v1/admin/settings/maintenance`.
- When maintenance mode is toggled **ON**, the system automatically dispatches a branded HTML email notification to all active registered users containing the custom message and estimated completion time.

### 1.2 Admin APIs: Toggle Maintenance Mode

#### GET Maintenance Status
```http
GET /v1/admin/settings/maintenance
Authorization: Bearer <super_admin_jwt_token>
```
**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Maintenance setting fetched successfully.",
  "data": {
    "isUnderMaintenance": true,
    "message": "We are performing a scheduled database upgrade. Services will resume shortly.",
    "endTime": "2026-09-21T20:00:00.000Z"
  }
}
```

#### PATCH Maintenance Settings
```http
PATCH /v1/admin/settings/maintenance
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```
**Request Payload:**
```json
{
  "isUnderMaintenance": true,
  "message": "We are upgrading our core infrastructure. Please check back at 8:00 PM UTC.",
  "endTime": "2026-09-21T20:00:00.000Z"
}
```

### 1.3 Handling HTTP 503 in Frontend Interceptor
Configure your Axios / Fetch response interceptor to intercept `503` responses globally:

```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 503) {
      const maintenanceData = error.response.data?.data || {};
      const customMessage =
        maintenanceData.message ||
        'The platform is currently undergoing scheduled maintenance.';
      const endTime = maintenanceData.endTime;

      // Dispatch global event or update React/Zustand store
      window.dispatchEvent(
        new CustomEvent('maintenance_mode_active', {
          detail: { message: customMessage, endTime },
        }),
      );
    }
    return Promise.reject(error);
  },
);
```

### 1.4 Recommended Maintenance Modal / Full-Screen View
Render a full-screen maintenance overlay when `maintenance_mode_active` is received (except when the user is an active `SUPER_ADMIN` in the admin dashboard):
- Display the custom message returned by `data.message`.
- If `data.endTime` is provided, display a real-time countdown timer.
- Include a "Retry" button that pings `/health` to check if the platform is back online.

---

## 2. Dynamic Content Type Management

### 2.1 Overview & Schema Changes
- `ContentType.code` is now a **dynamic string** (`VARCHAR`/`TEXT`), no longer restricted to a fixed Postgres enum.
- Super Admins can define any new content type code (e.g. `WEBINAR`, `TOOLKIT`, `CASE_STUDY`, `REPORT`, `INFOGRAPHIC`).
- Codes are automatically trimmed and capitalized to uppercase (e.g., `webinar` -> `WEBINAR`).

### 2.2 Create Content Type (Admin)
```http
POST /v1/admin/content-types
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

**Request Payload:**
```json
{
  "code": "WEBINAR",
  "name": "Live & Recorded Webinars",
  "description": "Interactive video workshops and expert panel discussions",
  "icon": "video-camera",
  "isActive": true
}
```

**Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "message": "Content type created successfully",
  "data": {
    "id": "ctype-8021a-49bf",
    "code": "WEBINAR",
    "name": "Live & Recorded Webinars",
    "description": "Interactive video workshops and expert panel discussions",
    "icon": "video-camera",
    "isActive": true,
    "createdAt": "2026-09-21T15:30:00.000Z",
    "updatedAt": "2026-09-21T15:30:00.000Z"
  }
}
```

### 2.3 Filter Content Bookmarks by Dynamic Type
```http
GET /v1/content/bookmarks?contentTypeCode=WEBINAR&page=1&limit=10
Authorization: Bearer <user_jwt_token>
```
The query parameter `contentTypeCode` accepts any string matching an active content type.

---

## 3. Enterprise Team Member Role Separation

### 3.1 Architecture & Hierarchy Correction
Previously, adding a team member gave them an `ENTERPRISE` role directly in `UserRole`. This caused team members to mistakenly appear as independent enterprise owners with separate seat accounts.

| User Persona | `roles` Array | `parentUserId` | `teamRole` | Platform Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Enterprise Owner** | `[{ role: { code: "ENTERPRISE" } }]` | `null` | `null` | **Enterprise User** (Owner of subscription & seats) |
| **Enterprise Team Member** | `[{ role: { code: "USER" } }]` | `"owner-uuid"` | `"MEMBER"` | **Team Member (MEMBER)** |
| **Enterprise Co-Admin** | `[{ role: { code: "USER" } }]` | `"owner-uuid"` | `"ADMIN"` | **Team Member (ADMIN)** |

> [!NOTE]
> Team members inherit enterprise permissions and feature entitlements dynamically at runtime through their `parentUserId`'s active B2B subscription.

### 3.2 SuperAdmin User Management Listing
```http
GET /v1/admin/user-management?page=1&limit=20
Authorization: Bearer <super_admin_jwt_token>
```

**Response Item Example:**
```json
{
  "id": "usr-member-102",
  "email": "employee@megacorp.com",
  "fullName": "Alice Johnson",
  "status": "ACTIVE",
  "roles": ["USER"],
  "teamRole": "MEMBER",
  "parentUserId": "usr-sarah-owner",
  "personaType": "Team Member (MEMBER)",
  "parentEnterpriseUser": {
    "id": "usr-sarah-owner",
    "email": "sarah.admin@megacorp.com",
    "fullName": "Sarah Jenkins"
  },
  "subscription": {
    "planName": "Enterprise 500 Seats",
    "status": "ACTIVE",
    "isInheritedFromEnterprise": true
  }
}
```

### 3.3 UI Implementation in Admin Users Table
- **Persona Column / Badge**:
  - `Enterprise User`: Blue badge (`bg-blue-100 text-blue-800`).
  - `Team Member`: Purple badge (`bg-purple-100 text-purple-800`), with label `Team Member (MEMBER)`.
  - Display parent enterprise owner info under the team member row:
    ```tsx
    {user.parentEnterpriseUser && (
      <span className="text-xs text-gray-500">
        Org: {user.parentEnterpriseUser.fullName} ({user.parentEnterpriseUser.email})
      </span>
    )}
    ```

---

## 4. Resilient Billing Plan Deletion & Archival

### 4.1 Business Rules & Cascade Logic
Previously, deleting a plan failed with HTTP 400 or Postgres foreign key constraint errors if any customer subscription or entitlement was attached to it.

The plan deletion system now handles both scenarios automatically:
1. **Soft Delete (Historical Preservation)**: If the plan has active or past subscriptions (`subscriptions > 0`) or enterprise assignments (`customSubscriptionAssignments > 0`):
   - Sets `deletedAt: new Date()`
   - Sets `isActive: false` and `isPublic: false`
   - Archives the Stripe product (`active: false`) on Stripe
   - Preserves historical subscriber receipts, invoices, and billing consistency
2. **Hard Delete (Clean Database Purge)**: If the plan is unused:
   - Deletes attached entitlements
   - Deletes the plan row permanently from the database
   - Archives the Stripe product if registered on Stripe

### 4.2 Delete Plan API
```http
DELETE /v1/admin/plans/:id
Authorization: Bearer <super_admin_jwt_token>
```

**Response when Soft-Deleted (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Plan deleted successfully",
  "data": {
    "deleted": true,
    "softDeleted": true,
    "message": "Plan has active/historical subscriptions or enterprise assignments. It has been deactivated and safely archived."
  }
}
```

**Response when Hard-Deleted (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Plan deleted successfully",
  "data": {
    "deleted": true,
    "softDeleted": false,
    "message": "Plan deleted successfully."
  }
}
```

### 4.3 Listing Plans with Soft-Deleted Filter
```http
GET /v1/admin/plans?includeDeleted=false&page=1&limit=10
Authorization: Bearer <super_admin_jwt_token>
```
- By default, `includeDeleted` is `false`, omitting soft-deleted/archived plans from active plan tables.
- Pass `?includeDeleted=true` to display an "Archived Plans" view in the admin panel.
- `GET /v1/plans` (public pricing page) **always** excludes soft-deleted plans.

---

## 5. Admin User Management Account Deletion

### 5.1 Business Rules & Revocation
The Super Admin user management panel now provides account deletion with two operational modes:
- **Soft Deletion (`DELETE /v1/admin/user-management/:id`)**:
  - Immediately revokes access (`status: 'DELETED'`, `deletedAt: new Date()`).
  - Purges all active login tokens and sessions (`UserSession.deleteMany`), forcing immediate logout.
  - Cancels any active or trialing subscriptions (`SubscriptionStatus.CANCELED`).
  - Detaches team members if the deleted user was an enterprise owner (`parentUserId = null`).
  - Excluded from default user management listings (unless filtered by `?status=DELETED`).
- **Permanent Purge (`DELETE /v1/admin/user-management/:id?hard=true`)**:
  - Permanently purges user records, sessions, entitlements, and roles from the database (GDPR / privacy compliance).

### 5.2 Endpoints

#### Soft Delete (Recommended Default)
```http
DELETE /v1/admin/user-management/:id
Authorization: Bearer <super_admin_jwt_token>
```
**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "User account deleted and revoked successfully.",
  "data": {
    "success": true,
    "id": "usr-6913b56c-1455-4e3f",
    "status": "DELETED",
    "deletedAt": "2026-09-21T15:35:00.000Z"
  }
}
```

#### Permanent Purge (Hard Delete)
```http
DELETE /v1/admin/user-management/:id?hard=true
Authorization: Bearer <super_admin_jwt_token>
```
**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "User account permanently purged from the database.",
  "data": {
    "success": true,
    "id": "usr-6913b56c-1455-4e3f",
    "hardDeleted": true
  }
}
```

### 5.3 UI Confirmation Modal
When clicking "Delete User" in the admin panel, display a confirmation dialog:
```tsx
<Modal title="Delete User Account">
  <p>
    Are you sure you want to delete <strong>{user.email}</strong>? 
    Their active sessions will be terminated immediately and subscriptions will be canceled.
  </p>
  
  <div className="mt-4 flex items-center space-x-2">
    <input
      type="checkbox"
      id="hardDelete"
      checked={isHardDelete}
      onChange={(e) => setIsHardDelete(e.target.checked)}
    />
    <label htmlFor="hardDelete" className="text-sm text-red-600 font-medium">
      Permanently purge all user records from database (Hard Delete)
    </label>
  </div>

  <div className="mt-6 flex justify-end space-x-3">
    <button onClick={onClose}>Cancel</button>
    <button
      className="bg-red-600 text-white px-4 py-2 rounded"
      onClick={() => handleDelete(user.id, isHardDelete)}
    >
      Confirm Deletion
    </button>
  </div>
</Modal>
```

---

## 6. TypeScript Interfaces & Type Definitions

```ts
// ==========================================
// 1. Maintenance Mode
// ==========================================
export interface MaintenanceSettings {
  isUnderMaintenance: boolean;
  message: string;
  endTime: string | null;
}

export interface MaintenanceGuardPayload {
  statusCode: 503;
  error: 'Service Unavailable';
  message: string;
  data: MaintenanceSettings;
}

// ==========================================
// 2. Dynamic Content Type
// ==========================================
export interface ContentTypeItem {
  id: string;
  code: string; // Dynamic uppercase string (e.g. 'WEBINAR', 'TOOLKIT')
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentTypePayload {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

// ==========================================
// 3. User Management & Personas
// ==========================================
export type UserPersonaType =
  | 'Super Admin'
  | 'Enterprise User'
  | 'Team Member (ADMIN)'
  | 'Team Member (MEMBER)'
  | 'Individual Consumer';

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING' | 'DELETED';

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  status: UserStatus;
  roles: string[];
  teamRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  parentUserId?: string | null;
  personaType: UserPersonaType;
  parentEnterpriseUser?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  deletedAt?: string | null;
  createdAt: string;
}

// ==========================================
// 4. Billing Plan Management
// ==========================================
export interface PlanItem {
  id: string;
  code: string;
  name: string;
  planTitle?: string | null;
  description?: string | null;
  subtitle?: string | null;
  targetAudience: 'B2C' | 'B2B';
  billingProvider: 'STRIPE';
  billingInterval: 'MONTHLY' | 'YEARLY';
  currency: string;
  priceAmount: number;
  isActive: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  deletedAt?: string | null;
  isDeleted?: boolean;
}

export interface PlanDeleteResult {
  deleted: boolean;
  softDeleted: boolean;
  message: string;
}
```

---

## 7. Frontend Developer Checklist & Action Items

- [ ] **Maintenance Interceptor**: Add response interceptor checking for `status === 503` and render global maintenance banner/view with countdown timer.
- [ ] **Maintenance Bypass**: Verify that administrators authenticated with `SUPER_ADMIN` can access `/admin/settings/maintenance` while maintenance mode is active.
- [ ] **Dynamic Content Types**:
  - Replace hardcoded content type dropdowns in CMS forms with dynamic fetching from `GET /v1/content-types`.
  - In Admin Content Type creation, change code field from select box to text input with uppercase transformation.
- [ ] **Team Member Badges**:
  - In the Admin User Management table, render `personaType` badge.
  - For team members, display parent enterprise owner name and email.
- [ ] **Resilient Plan Delete**:
  - Integrate `DELETE /v1/admin/plans/:id`.
  - Handle both `softDeleted: true` (show "Archived" notification) and `softDeleted: false` (show "Permanently Deleted" notification).
  - Add "Show Archived Plans" toggle using `?includeDeleted=true`.
- [ ] **User Deletion & Purge**:
  - Add "Delete Account" action to the user table row actions.
  - Implement confirmation modal with optional "Permanently purge (Hard Delete)" checkbox (`?hard=true`).
  - Verify that deleted users disappear from active user listings.
