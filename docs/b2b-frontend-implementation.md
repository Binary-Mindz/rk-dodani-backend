# B2B Engine Frontend Implementation Guide

This guide details the backend changes, new endpoints, payload contracts, and UI integration patterns for the B2B Enterprise and SMB billing engine.

---

## Table of Contents
1. [Architecture & Key Changes](#1-architecture--key-changes)
2. [Super Admin: Enterprise PO & Custom Assignment](#2-super-admin-enterprise-po--custom-assignment)
3. [Enterprise Team: Direct Member Provisioning](#3-enterprise-team-direct-member-provisioning)
4. [User Profile & Team Context (`/v1/users/me`)](#4-user-profile--team-context-v1usersme)
5. [Multi-Admin Governance (Owner vs. Delegated Admin)](#5-multi-admin-governance-owner-vs-delegated-admin)
6. [14-Day Free Trial Verification](#6-14-day-free-trial-verification)
7. [Frontend Developer Checklist & Action Items](#7-frontend-developer-checklist--action-items)

---

## 1. Architecture & Key Changes

| Use Case | Previous Flow | New B2B Engine Flow |
| :--- | :--- | :--- |
| **Sarah (Enterprise PO)** | Required pre-registered user. Sent Stripe checkout link via email. Required CC payment to activate. | **1.** User does **not** need to pre-exist.<br>**2.** PO checkbox (`isPo: true`) and `poNumber` entered.<br>**3.** Account instantly created and upgraded to `ENTERPRISE`.<br>**4.** Welcome email sent with auto-generated login credentials (no Stripe payment link). |
| **Marcus (SMB Credit Card)** | Manual assignment requiring existing user. | Retained standard flow: Creates custom plan and generates Stripe Checkout session for corporate credit card. |
| **Direct Member Provisioning** | Required invite email token; team members had to sign up independently. | Enterprise Owner or Delegated Admin can **directly create single or bulk (200–500 seats)** members on the platform with instant workspace assignment and email credentials. |
| **Team Role & Context** | Members lacked organization context in profile; roles guard could block members. | `/v1/users/me` returns `teamContext` showing owner, organization, role, and inherited enterprise subscription coverage. |
| **Free Trial Verification** | Failed on `payment_status: 'no_payment_required'` with `400 Bad Request`. | Accepts `'no_payment_required'`, maps status to `TRIALING`, starts 14-day trial without charging. |

---

## 2. Super Admin: Enterprise PO & Custom Assignment

### Endpoint
```http
POST /v1/admin/subscriptions/custom-assignment
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

### Scenario A: Sarah Enterprise (PO Procurement — User Does NOT Exist)
When the client pays offline via Procurement/PO (e.g. Coupa/SAP/Check), check the "PO" box, enter the PO number, and provide the client's details under `newUser`:

```json
{
  "isPo": true,
  "poNumber": "PO-ENTERPRISE-2026-9081",
  "newUser": {
    "email": "sarah.admin@megacorp.com",
    "firstName": "Sarah",
    "lastName": "Director"
  },
  "targetAudience": "B2B",
  "seats": 250,
  "planTitle": "MegaCorp Enterprise Bundle 250",
  "billingInterval": "YEARLY",
  "customPrice": 50000,
  "currency": "USD",
  "note": "Net-30 Enterprise agreement via Coupa PO"
}
```

### Scenario B: Sarah Enterprise (PO Procurement — User ALREADY Exists)
If Sarah already registered an account previously, simply provide `userId` instead of `newUser`:

```json
{
  "userId": "usr_98a72e81-f3b4-4b51",
  "isPo": true,
  "poNumber": "PO-ENTERPRISE-2026-9081",
  "targetAudience": "B2B",
  "seats": 250,
  "planTitle": "MegaCorp Enterprise Bundle 250",
  "billingInterval": "YEARLY",
  "customPrice": 50000,
  "currency": "USD"
}
```

### Scenario C: Marcus SMB (Credit Card / Stripe Session)
Leave `isPo` false or omitted. The backend will return a Stripe checkout URL:

```json
{
  "userId": "usr_marcus_smb_id",
  "isPo": false,
  "targetAudience": "B2B",
  "seats": 15,
  "planTitle": "Marcus Team SMB 15 Seats",
  "billingInterval": "MONTHLY",
  "customPrice": 450,
  "currency": "USD"
}
```

### Response (PO Flow)
```json
{
  "statusCode": 201,
  "message": "Enterprise plan successfully activated with PO #PO-ENTERPRISE-2026-9081. Account upgraded immediately.",
  "data": {
    "assignment": {
      "id": "csa_89d3...",
      "userId": "usr_created_sarah_id",
      "isPo": true,
      "poNumber": "PO-ENTERPRISE-2026-9081",
      "status": "PAID",
      "paymentUrl": null,
      "paymentSessionId": null
    },
    "paymentUrl": null,
    "paymentSessionId": null,
    "isPo": true,
    "poNumber": "PO-ENTERPRISE-2026-9081",
    "userId": "usr_created_sarah_id",
    "message": "Enterprise plan successfully activated with PO #PO-ENTERPRISE-2026-9081. Account upgraded immediately."
  }
}
```

> [!NOTE]
> For PO assignments, `paymentUrl` is `null` because no online payment is required. The account is upgraded to Enterprise immediately.

---

## 3. Enterprise Team: Direct Member Provisioning

Enterprise Account Owners (e.g., Sarah / Watson) or Delegated Admins (e.g., Maxwell) can directly provision employees into the Enterprise workspace without requiring them to sign up beforehand or wait for an invitation link.

### 3.1 Single Member Direct Provisioning

```http
POST /v1/team/members/direct-create
Authorization: Bearer <enterprise_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "email": "maxwell.edison@megacorp.com",
  "firstName": "Maxwell",
  "lastName": "Edison",
  "role": "ADMIN",
  "password": "InitialSecurePass2026!"
}
```
- `role` (Optional): `'MEMBER'` (default) or `'ADMIN'` (delegated manager).
- `password` (Optional): If omitted, the backend generates a secure random password and sends it via email.

#### Response (`201 Created`)
```json
{
  "statusCode": 201,
  "message": "Team member created and provisioned successfully",
  "data": {
    "userId": "usr_maxwell_id",
    "email": "maxwell.edison@megacorp.com",
    "fullName": "Maxwell Edison",
    "teamRole": "ADMIN",
    "enterpriseOwnerId": "usr_sarah_id"
  }
}
```

---

### 3.2 Bulk Member Direct Provisioning (200–500 Seats)

For large corporate seat bundles (e.g., onboarding 200–500 seats via CSV or batch upload):

```http
POST /v1/team/members/bulk-direct-create
Authorization: Bearer <enterprise_jwt_token>
Content-Type: application/json
```

#### Request Payload
```json
{
  "members": [
    {
      "email": "dev1@megacorp.com",
      "firstName": "Alice",
      "lastName": "Smith",
      "role": "MEMBER"
    },
    {
      "email": "lead1@megacorp.com",
      "firstName": "Bob",
      "lastName": "Jones",
      "role": "ADMIN"
    }
  ]
}
```

#### Response (`201 Created`)
```json
{
  "statusCode": 201,
  "message": "Team members bulk provisioned successfully",
  "data": {
    "totalRequested": 2,
    "createdCount": 2,
    "members": [
      {
        "userId": "usr_dev1_id",
        "email": "dev1@megacorp.com",
        "fullName": "Alice Smith",
        "teamRole": "MEMBER",
        "enterpriseOwnerId": "usr_sarah_id"
      },
      {
        "userId": "usr_lead1_id",
        "email": "lead1@megacorp.com",
        "fullName": "Bob Jones",
        "teamRole": "ADMIN",
        "enterpriseOwnerId": "usr_sarah_id"
      }
    ]
  }
}
```

> [!TIP]
> If the requested count exceeds the available remaining seats in the enterprise plan, the endpoint returns a `400 Bad Request` with:
> `"Cannot provision X members. Only Y seat(s) remaining in your enterprise plan."`

---

## 4. User Profile & Team Context (`/v1/users/me`)

Every logged-in user profile now returns a comprehensive `teamContext` object and an updated `purchaseInfo` indicating whether they are covered by an enterprise account.

```http
GET /v1/users/me
Authorization: Bearer <access_token>
```

### Scenario A: Team Member Profile (e.g., Maxwell)
```json
{
  "id": "usr_maxwell_id",
  "email": "maxwell.edison@megacorp.com",
  "fullName": "Maxwell Edison",
  "roles": ["STUDENT", "ENTERPRISE"],
  "onATeam": true,
  "teamRole": "ADMIN",
  "teamContext": {
    "isTeamMember": true,
    "isTeamOwner": false,
    "teamRole": "ADMIN",
    "enterpriseAccount": {
      "ownerId": "usr_sarah_id",
      "ownerName": "Sarah Director",
      "ownerEmail": "sarah.admin@megacorp.com",
      "planName": "MegaCorp Enterprise Bundle 250",
      "planTitle": "Enterprise Plan",
      "subscriptionStatus": "ACTIVE",
      "seatsAllocated": 250
    }
  },
  "purchaseInfo": {
    "subscriptionId": "sub_sarah_subscription_id",
    "status": "ACTIVE",
    "currentPeriodStart": "2026-09-17T00:00:00.000Z",
    "currentPeriodEnd": "2027-09-17T00:00:00.000Z",
    "isEnterpriseCovered": true,
    "plan": {
      "id": "plan_b2b_id",
      "code": "CUSTOM_PO_...",
      "name": "MegaCorp Enterprise Bundle 250",
      "targetAudience": "B2B",
      "billingInterval": "YEARLY",
      "currency": "USD",
      "priceAmount": 50000
    }
  }
}
```

### Scenario B: Enterprise Owner Profile (e.g., Watson / Sarah)
```json
{
  "id": "usr_sarah_id",
  "email": "sarah.admin@megacorp.com",
  "fullName": "Sarah Director",
  "roles": ["ENTERPRISE"],
  "onATeam": false,
  "teamRole": "OWNER",
  "teamContext": {
    "isTeamMember": false,
    "isTeamOwner": true,
    "teamRole": "OWNER",
    "enterpriseAccount": {
      "ownerId": "usr_sarah_id",
      "ownerName": "Sarah Director",
      "ownerEmail": "sarah.admin@megacorp.com",
      "planName": "MegaCorp Enterprise Bundle 250",
      "planTitle": "Enterprise Plan",
      "subscriptionStatus": "ACTIVE",
      "seatsAllocated": 250
    }
  },
  "purchaseInfo": {
    "subscriptionId": "sub_sarah_subscription_id",
    "status": "ACTIVE",
    "isEnterpriseCovered": false,
    "plan": {
      "name": "MegaCorp Enterprise Bundle 250",
      "targetAudience": "B2B"
    }
  }
}
```

---

## 5. Multi-Admin Governance (Owner vs. Delegated Admin)

The backend supports multi-admin enterprise workspaces:

1. **Enterprise Account Owner (`teamContext.isTeamOwner === true` / `teamRole === 'OWNER'`)**:
   - The primary billing contact (e.g., Sarah or Watson).
   - Can add, remove, promote, or demote members.
   - Holds the primary subscription record.
2. **Delegated Admin (`teamRole === 'ADMIN'`)**:
   - Has delegated management authority (e.g., Maxwell).
   - Can access the Team Dashboard (`/team/members`, `/team/metrics`, etc.).
   - Can directly create members or invite members on behalf of the enterprise.
   - Cannot remove or alter the Account Owner.
3. **Team Member (`teamRole === 'MEMBER'`)**:
   - Standard student / employee seat.
   - Enjoys all Enterprise learning platform features.
   - Cannot access `/team/dashboard` management tools.

### UI Display Logic
```tsx
// Example React / Next.js badge component
function TeamRoleBadge({ teamContext }) {
  if (teamContext?.isTeamOwner) {
    return <span className="badge badge-purple">Enterprise Owner</span>;
  }
  if (teamContext?.teamRole === 'ADMIN') {
    return <span className="badge badge-blue">Enterprise Co-Admin</span>;
  }
  if (teamContext?.isTeamMember) {
    return <span className="badge badge-gray">Team Member</span>;
  }
  return null;
}
```

---

## 6. 14-Day Free Trial Verification

### Stripe Trial Status
When a user begins a 14-Day Free Trial:
- Stripe creates a subscription with a trial period.
- The Checkout Session's `payment_status` is `'no_payment_required'`.
- The backend's `/v1/subscription/verify-payment?session_id=...` now recognizes `'no_payment_required'` and marks the subscription as `TRIALING`.

### Frontend Checkout Verification Call
```http
POST /v1/subscription/verify-payment?session_id={CHECKOUT_SESSION_ID}
Authorization: Bearer <access_token>
```

#### UI Success Handling
When `subscription.status === 'TRIALING'`:
- Display: `"Your 14-Day Free Trial is Active!"`.
- The user has immediate access to all plan features without paying on day 1.
- Stripe automatically bills on day 15 unless cancelled before trial end.

---

## 7. Frontend Developer Checklist & Action Items

- [ ] **Admin Panel — Custom Plan Assignment Dialog**:
  - Add a **"Purchase Order (PO)"** checkbox (`isPo`).
  - When checked, show a required **PO Number** input field (`poNumber`).
  - Add a toggle for **"Existing User vs. New Enterprise User"**.
  - If "New Enterprise User" is selected, render fields for `newUser.email`, `newUser.firstName`, `newUser.lastName`.
  - On submit with `isPo: true`, do not redirect to Stripe; show immediate success confirmation.
- [ ] **Enterprise Dashboard — Member Management**:
  - Add a **"Direct Provision Member"** button opening a form with Email, First Name, Last Name, and Role (`MEMBER` or `ADMIN`).
  - Add a **"CSV / Bulk Provision"** button for importing 200–500 seats via `POST /team/members/bulk-direct-create`.
  - Display available remaining seats calculated from `allowedSeats - activeSeats`.
- [ ] **Header / Account Navigation**:
  - Use `user.teamContext` to display the Enterprise Organization name (`enterpriseAccount.planName` or company name).
  - Show the user's role badge (`Enterprise Owner`, `Co-Admin`, or `Member`).
  - If `purchaseInfo.isEnterpriseCovered === true`, do not show "Upgrade to Pro" banner.
- [ ] **Trial Checkout Redirect Page (`/payment-success`)**:
  - Ensure success screen supports both `'ACTIVE'` and `'TRIALING'` statuses.
