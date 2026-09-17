# Service & Service Group Draft System — Frontend Implementation Guide

This guide details the new **Draft & Publishing System** for **Services** and **Service Groups** managed by the website administrator.

---

## 1. Overview & Business Rules

| Entity | Status Field | Default on Creation | Public Behavior | Admin Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Service Group** | `status` (`DRAFT`, `PUBLISHED`) | `DRAFT` | Only `PUBLISHED` groups are returned. | Admin can view all groups or filter by `?status=DRAFT` or `?status=PUBLISHED`. |
| **Service** | `status` (`DRAFT`, `PUBLISHED`) | `DRAFT` | Only `PUBLISHED` services whose parent group is also `PUBLISHED` (or standalone) are returned. | Admin can view all services or filter by `?status=DRAFT` or `?status=PUBLISHED`. |

### Status Enum
```ts
export enum PublishStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}
```
> For Service and Service Group management, the two primary operational statuses are **`DRAFT`** and **`PUBLISHED`**.

---

## 2. Service Management APIs

### 2.1 Create Service (Admin)
Allows admin to save a service as a `DRAFT` while preparing content, or publish it directly.

```http
POST /admin/services
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "name": "Cloud Security Strategy 2026",
  "description": "Executive blueprint for multi-cloud security.",
  "serviceGroupId": "grp-b3e1-4c12",
  "criticalFriction": "Friction between DevOps speed and compliance governance.",
  "agentarumParadigm": "Automated security gatekeeping via AgentArum agents.",
  "hardTangibleDeliverables": [
    "Security Architecture Blueprint",
    "Compliance Matrix",
    "Implementation Playbook"
  ],
  "status": "DRAFT"
}
```
* `status` (Optional): `'DRAFT'` (default if omitted) or `'PUBLISHED'`.

#### Response (`201 Created`)
```json
{
  "statusCode": 201,
  "message": "Service created successfully",
  "data": {
    "id": "srv-9081a-21cb",
    "name": "Cloud Security Strategy 2026",
    "description": "Executive blueprint for multi-cloud security.",
    "status": "DRAFT",
    "serviceGroupId": "grp-b3e1-4c12",
    "serviceGroup": {
      "id": "grp-b3e1-4c12",
      "name": "Cybersecurity & Governance",
      "description": "Enterprise security practices",
      "icon": "shield-lock",
      "status": "PUBLISHED"
    },
    "criticalFriction": "Friction between DevOps speed and compliance governance.",
    "agentarumParadigm": "Automated security gatekeeping via AgentArum agents.",
    "hardTangibleDeliverables": [
      "Security Architecture Blueprint",
      "Compliance Matrix",
      "Implementation Playbook"
    ],
    "createdAt": "2026-09-17T11:45:00.000Z",
    "updatedAt": "2026-09-17T11:45:00.000Z"
  }
}
```

---

### 2.2 Get Services List (Admin)
Allows admin to list and filter services by `status`, `serviceGroupId`, search term, and pagination.

```http
GET /admin/services?status=DRAFT&page=1&limit=10
Authorization: Bearer <super_admin_jwt_token>
```

#### Query Parameters
- `status` (Optional): `'DRAFT'` | `'PUBLISHED'`. If omitted, returns **all** services regardless of status.
- `serviceGroupId` (Optional): Filter by parent service group ID.
- `search` (Optional): Search term in title, description, or deliverables.
- `page` (Optional): Default `1`.
- `limit` (Optional): Default `10`.

#### Response (`200 OK`)
```json
{
  "statusCode": 200,
  "message": "Services fetched successfully",
  "data": {
    "items": [
      {
        "id": "srv-9081a-21cb",
        "name": "Cloud Security Strategy 2026",
        "status": "DRAFT",
        "serviceGroupId": "grp-b3e1-4c12",
        "serviceGroup": {
          "id": "grp-b3e1-4c12",
          "name": "Cybersecurity & Governance",
          "status": "PUBLISHED"
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 2.3 Get Single Service Details (Admin)
Returns complete details of any service (whether `DRAFT` or `PUBLISHED`).

```http
GET /admin/services/:id
Authorization: Bearer <super_admin_jwt_token>
```

---

### 2.4 Update Service (Admin)
Updates service content and optionally updates `status`.

```http
PATCH /admin/services/:id
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "name": "Cloud Security Strategy 2026 (Updated)",
  "status": "PUBLISHED"
}
```

---

### 2.5 Quick Status Update / Publish Toggle (Admin)
Use this dedicated endpoint in table row actions or switch toggles for fast 1-click publishing / unpublishing without sending the full service payload.

```http
PATCH /admin/services/:id/status
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "status": "PUBLISHED"
}
```

#### Response (`200 OK`)
```json
{
  "statusCode": 200,
  "message": "Service status updated successfully",
  "data": {
    "id": "srv-9081a-21cb",
    "name": "Cloud Security Strategy 2026",
    "status": "PUBLISHED"
  }
}
```

---

### 2.6 Public Service Endpoints (Website Visitors)
Public endpoints **strictly return only published content**. Draft services are completely hidden.

- `GET /services?serviceGroupId=...&search=...&page=1&limit=10`: Returns only services where `status === 'PUBLISHED'` and whose parent group is also published.
- `GET /services/:id`: Returns service details only if `status === 'PUBLISHED'`. Returns `404 Not Found` if in `DRAFT`.

---

## 3. Service Group Management APIs

### 3.1 Create Service Group (Admin)
```http
POST /admin/service-groups
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "name": "AI Executive Ecosystem",
  "description": "Advisory services for AI leadership and governance.",
  "icon": "brain-circuit",
  "order": 1,
  "status": "DRAFT"
}
```
* `status` (Optional): `'DRAFT'` (default if omitted) or `'PUBLISHED'`.

#### Response (`201 Created`)
```json
{
  "statusCode": 201,
  "message": "Service group created successfully",
  "data": {
    "id": "grp-1092a",
    "name": "AI Executive Ecosystem",
    "description": "Advisory services for AI leadership and governance.",
    "icon": "brain-circuit",
    "order": 1,
    "status": "DRAFT",
    "createdAt": "2026-09-17T11:45:00.000Z",
    "updatedAt": "2026-09-17T11:45:00.000Z"
  }
}
```

---

### 3.2 Get Service Groups List (Admin)
```http
GET /admin/service-groups?status=DRAFT&page=1&limit=10
Authorization: Bearer <super_admin_jwt_token>
```

#### Query Parameters
- `status` (Optional): `'DRAFT'` | `'PUBLISHED'`. If omitted, returns all groups.
- `search` (Optional): Search by group name or description.
- `page` (Optional): Default `1`.
- `limit` (Optional): Default `10`.

---

### 3.3 Quick Status Update / Publish Toggle (Admin)
Use this endpoint to publish or unpublish a service group with 1 click.

```http
PATCH /admin/service-groups/:id/status
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "status": "PUBLISHED"
}
```

---

### 3.4 Public Service Group Endpoints (Website Visitors)
- `GET /service-groups`: Returns all service groups where `status === 'PUBLISHED'`.
- `GET /service-groups/:id`: Returns service group details only if `status === 'PUBLISHED'`. Returns `404 Not Found` if in `DRAFT`.

---

## 4. Frontend UI Components & Implementation Guide

### 4.1 TypeScript Types
```ts
export enum PublishStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  status: PublishStatus;
  serviceGroupId?: string | null;
  serviceGroup?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    status: PublishStatus;
  } | null;
  criticalFriction?: string | null;
  agentarumParadigm?: string | null;
  hardTangibleDeliverables?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceGroupItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  order: number;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}
```

---

### 4.2 Status Badge UI Component
```tsx
import React from 'react';
import { PublishStatus } from './types';

export const StatusBadge: React.FC<{ status: PublishStatus }> = ({ status }) => {
  if (status === PublishStatus.PUBLISHED) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
        Published
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
      Draft
    </span>
  );
};
```

---

### 4.3 Quick Publish / Draft Toggle Function
```ts
// Update service status (1-click action in admin table)
async function toggleServiceStatus(serviceId: string, currentStatus: PublishStatus) {
  const nextStatus = currentStatus === PublishStatus.PUBLISHED 
    ? PublishStatus.DRAFT 
    : PublishStatus.PUBLISHED;

  const res = await fetch(`/api/v1/admin/services/${serviceId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({ status: nextStatus }),
  });

  if (!res.ok) throw new Error('Failed to update status');
  return await res.json();
}
```

---

### 4.4 Admin Create / Edit Modal Pattern
Provide two clear submission buttons on the service creation form:
1. **"Save as Draft"**: Submits payload with `"status": "DRAFT"`.
2. **"Publish Service"**: Submits payload with `"status": "PUBLISHED"`.

---

## 5. Frontend Action Checklist

- [ ] **Service Management Table (`/admin/services`)**:
  - Add a **"Status"** column with `<StatusBadge status={item.status} />`.
  - Add a **Status Filter Dropdown** with options: `All Statuses`, `Draft`, `Published`.
  - Add a quick toggle switch or action menu option to Publish / Unpublish directly from the row (`PATCH /admin/services/:id/status`).
- [ ] **Service Form Modal**:
  - Add "Save as Draft" and "Publish" buttons.
- [ ] **Service Group Management Table (`/admin/service-groups`)**:
  - Add a **"Status"** column and `<StatusBadge status={group.status} />`.
  - Add a **Status Filter Dropdown** (`All`, `Draft`, `Published`).
  - Add a quick action button to toggle between Draft and Published (`PATCH /admin/service-groups/:id/status`).
- [ ] **Public Website Services Page**:
  - Point public queries to `GET /services` and `GET /service-groups` (which automatically return only active, published records).
