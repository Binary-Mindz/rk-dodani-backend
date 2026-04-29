# AgentArum AI - Lead with Intelligence. Decide with Confidence.

## 1. Purpose of This Document

This document explains the AgentArum platform from a frontend point of view.

It enables frontend developers to understand:

- The product vision
- Business goals
- Page structure
- Role-based flows
- User journeys
- Dashboard responsibilities

**Goal:**
After reading this, a frontend developer should clearly understand how the entire system works without backend explanations.

---

## 2. Product Summary

**AgentArum** is a premium AI leadership consulting and research platform.

### Core Purposes

- Showcase consulting services professionally
- Publish free & premium research and insights

### Platform Nature

- Content platform ✅
- Conversion platform ✅
- Subscription system ✅

---

## 2.1 Main Business Areas

- Consulting services showcase
- Research & insights publishing
- Media & knowledge library
- Premium subscriptions
- Patreon-based access
- Inquiry & lead capture
- Admin-controlled CMS

---

## 2.2 Main Frontend Areas

- Public Website
- Authentication Pages
- User Account Area
- Admin Dashboard

---

## 3. Main Product Goals

- Present brand professionally
- Explain services quickly
- Enable content discovery
- Convert visitors → leads/subscribers
- Handle gated content access
- Provide role-based tools
- Maintain simple navigation

---

## 4. Roles and Access Model

| Role        | Description        | Access           |
| ----------- | ------------------ | ---------------- |
| Guest       | Not logged in      | Public website   |
| User        | Logged-in user     | Public + Account |
| Admin       | Operations manager | Dashboard tools  |
| Editor      | Content manager    | Content tools    |
| Support     | Support agent      | Inquiry tools    |
| Super Admin | Full control       | Everything       |

### 4.1 Frontend Rules

- Guest → no private/admin pages
- User → no admin tools
- Admin → role-based dashboard
- Editor → content tools only
- Support → inquiry tools only
- Super Admin → full access

---

## 5. Information Architecture

### 5.1 Public Pages

- Home
- About
- Services
- Service Details
- Research & Insights
- Content Details
- Media & Insights
- Pricing
- Contact
- Login / Register
- Forgot / Reset Password
- Verify Email

---

### 5.2 User Area

- Account Overview
- Profile
- Subscription
- Patreon
- My Library
- Account Settings

---

### 5.3 Dashboard

- Dashboard Home
- Content
- Categories
- Tags
- Assets
- Pages
- Services
- Plans
- Inquiries
- Users
- Settings
- Audit Logs
- Webhook Logs

---

## 6. Layout Strategy

### 6.1 Public Layout

- Header (Navigation)
- Main Content
- Footer

**Header Navigation**

- Home
- About
- Services
- Research & Insights
- Media & Insights
- Pricing
- Contact
- Login / Get Started

**Footer**

- Brand info
- Contact info
- Links
- Social media

---

### 6.2 User Area Layout

- Sidebar / Tabs
- Profile summary
- Card-based sections

---

### 6.3 Dashboard Layout

- Sidebar
- Top bar
- Main content (tables/forms/cards)

---

## 7. Public Pages Breakdown

### 7.1 Home Page

Sections:

1. Hero
2. Intro
3. Services
4. Research
5. Media
6. Subscription
7. Pricing preview
8. CTA
9. Footer

---

### 7.2 About Page

- Hero
- Mission & vision
- Platform purpose
- Optional founder section

---

### 7.3 Services Page

- Service list/cards
- Featured services
- CTA

---

### 7.4 Service Detail

- Title
- Description
- CTA
- Related services

---

### 7.5 Research & Insights

- Search
- Filters (category/tag/type)
- Content list
- Gated indicators

---

### 7.6 Content Detail

Includes:

- Title, author, date
- Content body
- Tags & categories
- Assets
- Related content

#### Access Logic

| Type          | Behavior           |
| ------------- | ------------------ |
| PUBLIC        | Show content       |
| AUTHENTICATED | Require login      |
| PREMIUM       | Show subscribe CTA |
| PATREON       | Show connect CTA   |
| TIER_BASED    | Backend check      |
| CUSTOM        | Backend logic      |

---

### 7.7 Media & Insights

- Videos / Podcasts
- Filters
- Latest media

---

### 7.8 Pricing

- Plan cards
- Features
- CTA
- Optional FAQ

---

### 7.9 Contact

- Contact form
- Email / phone
- Office info

---

## 8. Authentication

### Register

- Name
- Email
- Password

### Login

- Email
- Password

### Verify Email

- OTP input

### Password Reset

- Email → Token → New password

---

## 9. User Journey

### Guest

1. Visit site
2. Explore content
3. Hit gated content
4. Register / subscribe

---

### Logged-in User

1. Login
2. Access account
3. Consume content
4. Manage profile

---

### Subscription Flow

1. Select plan
2. Stripe checkout
3. Webhook update
4. Access granted

---

### Patreon Flow

1. Connect Patreon
2. OAuth flow
3. Sync membership
4. Unlock content

---

## 10. User Account Area

### Overview

- Subscription summary
- Patreon status

### Profile

- Personal info
- Password update

### Subscription

- Plan details
- Cancel / upgrade

### Patreon

- Connect / disconnect
- Tier status

### My Library

- Accessible content list

### Settings

- Preferences

---

## 11. Admin Role Flows

### Super Admin

- Full system control
- Monitor logs & operations

### Admin

- Manage platform operations

### Editor

- Manage content

### Support

- Handle inquiries

---

## 12. Dashboard Modules

### Dashboard Home

- Stats & recent activity

### Content

- CRUD content
- Access rules

### Categories & Tags

- Manage taxonomy

### Assets

- Manage files

### Pages

- Static content

### Services

- Service management

### Plans

- Pricing management

### Inquiries

- Lead management

### Users

- User management

### Settings

- System config

### Logs

- Audit & webhook logs

---

## 13. Sidebar by Role

| Role        | Sidebar         |
| ----------- | --------------- |
| Super Admin | Everything      |
| Admin       | Most modules    |
| Editor      | Content-related |
| Support     | Inquiries only  |

---

## 14. UI Guidelines

### Lists

- Tables
- Filters
- Pagination

### Detail Pages

- Header + actions
- Sections

### Forms

- Grouped inputs
- Validation

### Cards

- Used for public UI

---

## 15. API & State Handling

- Use access tokens
- Handle:
  - 401 Unauthorized
  - 403 Forbidden
  - 404 Not Found
  - 500 Server Error

- Use pagination
- Show loading & empty states

---

## 16. Recommended Build Order

1. Layout & routing
2. Auth pages
3. Public pages
4. Content system
5. Pricing
6. User area
7. Stripe & Patreon
8. Dashboard shell
9. CMS modules
10. Full admin system

---

## 17. Final Summary

- Public site → discovery + conversion
- User area → access + subscription
- Dashboard → management system

The frontend should be:

- Modular
- Role-based
- Clean and scalable

---
