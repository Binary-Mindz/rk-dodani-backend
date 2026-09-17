# Product Draft & Publishing System - Frontend Implementation Guide

This guide details the backend changes, endpoints, and frontend implementation guidelines for managing **Products** with a **Draft / Published** lifecycle.

---

## Table of Contents
1. [Overview & Requirements](#1-overview--requirements)
2. [Data Model Changes](#2-data-model-changes)
3. [Public vs. Admin Access Rules](#3-public-vs-admin-access-rules)
4. [API Endpoints Reference](#4-api-endpoints-reference)
5. [Frontend UI Guidelines & Integration Examples](#5-frontend-ui-guidelines--integration-examples)
6. [TypeScript Interfaces](#6-typescript-interfaces)
7. [Frontend Developer Checklist](#7-frontend-developer-checklist)

---

## 1. Overview & Requirements

Previously, creating or updating a product immediately affected public-facing pages (`/products`). 

With this implementation:
- Admins can create and edit products in **`DRAFT`** status.
- Public visitors on `/products` only see **`PUBLISHED`** products.
- Admins can filter products by `status=DRAFT` or `status=PUBLISHED` in the Admin Panel.
- Admins can publish or unpublish products with a single click via a dedicated toggle endpoint (`PATCH /v1/admin/products/:id/status`).

---

## 2. Data Model Changes

The `Product` entity has been updated with the `PublishStatus` enum:

```typescript
export enum PublishStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REVIEW = 'REVIEW',       // Reserved for future editorial approval
  SCHEDULED = 'SCHEDULED', // Reserved for future timed releases
  ARCHIVED = 'ARCHIVED',   // Reserved for sunsetted items
}
```

### New Field:
| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `status` | `PublishStatus` | `DRAFT` | The current publication state. Newly created products default to `DRAFT`. |

---

## 3. Public vs. Admin Access Rules

```
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│         Public Visitors          │        │        Super Admin Panel         │
│         GET /v1/products         │        │      GET /v1/admin/products      │
└────────────────┬─────────────────┘        └────────────────┬─────────────────┘
                 │                                           │
                 ▼                                           ▼
   Only items with:                           All items (DRAFT + PUBLISHED)
   • status: "PUBLISHED"                      Or filtered by:
   • isActive: true                           • ?status=DRAFT
                                              • ?status=PUBLISHED
```

- **Public endpoints (`/products`, `/products/:id`)**:
  - Automatically filter to `status: PUBLISHED` and `isActive: true`.
  - Attempting to access a draft product via `GET /v1/products/:draftId` returns `404 Not Found`.
- **Admin endpoints (`/admin/products`, `/admin/products/:id`)**:
  - Can view, edit, and preview all products regardless of status.
  - Can filter using `GET /v1/admin/products?status=DRAFT` or `?status=PUBLISHED`.

---

## 4. API Endpoints Reference

### 4.1. Public Endpoints (Website / Catalog)

#### 1. Get All Published Products
```http
GET /v1/products
```
*Query Parameters (Optional):*
- `search`: Search string matching title, subtitle, module, or description.
- `module`: Filter by module name.
- `page`: Page number (default: 1).
- `limit`: Items per page (default: 10).

*Response:*
Returns array of products where `status === "PUBLISHED"` and `isActive === true`.

#### 2. Get Single Product Details
```http
GET /v1/products/:id
```
*Behavior:*
- Returns product details if `status === "PUBLISHED"`.
- Returns `404 Not Found` if product is in `DRAFT` or inactive.

---

### 4.2. Admin Endpoints (Admin CMS Portal)

#### 1. List Products (Admin)
```http
GET /v1/admin/products
Authorization: Bearer <super_admin_jwt>
```
*Query Parameters:*
- `status`: Optional filter — `"DRAFT"` or `"PUBLISHED"`. Omit to retrieve all.
- `search`: Search title, subtitle, module, or description.
- `module`: Filter by module name.
- `page`: Page number.
- `limit`: Items per page.

#### 2. Create Product (Draft or Published)
```http
POST /v1/admin/products
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "title": "Autonomous Risk Modeling Engine",
  "subTitle": "Enterprise Decision Intelligence",
  "module": "Risk & Compliance",
  "description": "Real-time algorithmic risk modeling across all business units.",
  "status": "DRAFT",
  "order": 1,
  "scaleValueImpact": {
    "title": "Value Impact",
    "description": "Reduces portfolio risk volatility by 35%"
  }
}
```
*Note:* If `status` is omitted, it defaults to `"DRAFT"`.

#### 3. Update Product Details
```http
PATCH /v1/admin/products/:id
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "title": "Autonomous Risk Modeling Engine v2",
  "status": "PUBLISHED"
}
```

#### 4. Quick Status Toggle (Publish / Unpublish)
Use this dedicated endpoint for table row actions or switch toggles:

```http
PATCH /v1/admin/products/:id/status
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "status": "PUBLISHED"
}
```
*To unpublish back to draft:*
```json
{
  "status": "DRAFT"
}
```

#### 5. Get Product Details (Admin)
```http
GET /v1/admin/products/:id
Authorization: Bearer <super_admin_jwt>
```
Returns the product regardless of whether it is `DRAFT` or `PUBLISHED`.

#### 6. Delete Product
```http
DELETE /v1/admin/products/:id
Authorization: Bearer <super_admin_jwt>
```

---

## 5. Frontend UI Guidelines & Integration Examples

### 5.1. Admin Products Table
1. **Status Filter Tabs**:
   - Add filter tabs above the table: `All | Published | Drafts`.
   - Send `?status=PUBLISHED` or `?status=DRAFT`.
2. **Status Badge**:
   - `PUBLISHED`: Green badge (`bg-emerald-100 text-emerald-800`).
   - `DRAFT`: Yellow/Amber badge (`bg-amber-100 text-amber-800`).
3. **Quick Publish/Unpublish Action**:
   - A dropdown or button row action calling `PATCH /v1/admin/products/:id/status`.

```tsx
// Example Quick Publish Toggle Handler
async function handleTogglePublish(productId: string, currentStatus: 'DRAFT' | 'PUBLISHED') {
  const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
  await api.patch(`/v1/admin/products/${productId}/status`, {
    status: newStatus,
  });
  toast.success(`Product ${newStatus === 'PUBLISHED' ? 'published to live site' : 'reverted to draft'}`);
  refetchProducts();
}
```

### 5.2. Create / Edit Form
1. **Save as Draft vs. Publish Immediately**:
   - Provide two action buttons at the bottom of the form:
     - **Save as Draft**: Sets `status: 'DRAFT'`.
     - **Publish Now**: Sets `status: 'PUBLISHED'`.
2. **Status Switch in Edit Mode**:
   - An intuitive toggle switch or selector indicating the current status.

---

## 6. TypeScript Interfaces

```typescript
export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'REVIEW' | 'SCHEDULED' | 'ARCHIVED';

export interface Product {
  id: string;
  title: string;
  subTitle: string;
  module: string;
  description: string;
  order: number;
  isActive: boolean;
  status: PublishStatus;
  scaleValueImpact?: { title: string; description: string } | null;
  mitigationVector?: { title: string; description: string } | null;
  platformCapabilitiesDescriptor?: { title: string; description: string } | null;
  retailBanking?: { title: string; description: string; keyFeatures?: string[] } | null;
  capitalMarkets?: { title: string; description: string; keyFeatures?: string[] } | null;
  wealthAndAsset?: { title: string; description: string; keyFeatures?: string[] } | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueryProductParams {
  search?: string;
  module?: string;
  status?: PublishStatus;
  page?: number;
  limit?: number;
}
```

---

## 7. Frontend Developer Checklist

- [ ] **Admin Products Table**: Add **Status** column with `DRAFT` / `PUBLISHED` badges.
- [ ] **Filter Controls**: Add `status` filter (`All`, `Drafts`, `Published`) calling `/v1/admin/products?status=...`.
- [ ] **Row Action**: Add **Publish / Unpublish** toggle calling `PATCH /v1/admin/products/:id/status`.
- [ ] **Product Form**: Add **"Save as Draft"** (`status: "DRAFT"`) and **"Publish"** (`status: "PUBLISHED"`) buttons.
- [ ] **Public Site Verification**: Ensure public catalog `/products` only consumes `GET /v1/products` (which filters drafts out automatically).
