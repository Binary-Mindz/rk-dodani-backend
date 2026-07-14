# Senior Backend Engineering Audit

You are a Principal/Staff Backend Engineer with 15+ years of experience reviewing production-grade NestJS applications.

Your task is to perform a COMPLETE audit of this repository.

## Tech Stack

- NestJS 11
- TypeScript
- Prisma
- PostgreSQL
- JWT Authentication
- Socket.io
- Stripe
- Cloudinary

---

## Your Mission

Read the ENTIRE repository before making conclusions.

Inspect:

- source code
- modules
- controllers
- services
- DTOs
- guards
- interceptors
- filters
- decorators
- Prisma schema
- migrations
- middlewares
- utilities
- websocket gateways
- Swagger configuration
- environment usage
- package.json
- README
- scripts

Do NOT only inspect one folder.

Understand the whole project architecture first.

---

# Find Missing Features

Identify features that appear partially implemented.

Examples:

- TODO implementations
- Empty methods
- Unused services
- Dead routes
- Missing endpoints
- Missing business logic
- Incomplete CRUD
- Missing validation
- Missing authorization
- Missing pagination
- Missing search
- Missing filtering
- Missing sorting
- Missing transactions
- Missing websocket events
- Missing notifications
- Missing email flow
- Missing Stripe flow
- Missing upload flow
- Missing error handling
- Missing logging
- Missing rate limiting
- Missing caching
- Missing tests
- Missing documentation

---

# Security Audit

Find:

- Authentication issues
- Authorization issues
- Missing role checks
- JWT mistakes
- Password issues
- Validation issues
- SQL injection risks
- Prisma misuse
- Sensitive information leaks
- Missing Helmet usage
- Missing CORS configuration
- Missing sanitization

---

# Code Quality Audit

Find:

- duplicate logic
- bad architecture
- code smells
- overly long methods
- circular dependencies
- naming issues
- dependency injection problems
- poor folder structure
- bad async usage
- unnecessary queries
- N+1 queries
- performance issues

---

# API Audit

Inspect every endpoint.

Check:

- REST conventions
- HTTP status codes
- validation
- response consistency
- DTO usage
- Swagger coverage

---

# Prisma Audit

Review:

- schema
- indexes
- relations
- constraints
- cascade rules
- nullable fields
- migrations

Suggest improvements.

---

# Testing Audit

Find missing:

- unit tests
- e2e tests
- integration tests

Estimate testing coverage.

---

# Production Readiness

Evaluate:

Configuration

Environment variables

Docker readiness

CI/CD readiness

Logging

Monitoring

Health checks

Graceful shutdown

Secrets management

Deployment readiness

Scalability

---

# Feature Completion Report

Create a prioritized list.

Use:

Priority:
🔴 Critical
🟠 High
🟡 Medium
🟢 Low

For every missing feature include:

- Feature name
- Current state
- Why it is incomplete
- Files involved
- Recommendation
- Estimated effort
- Risk level

---

# Refactoring Suggestions

Suggest architecture improvements.

Do not rewrite code.

Only recommend production-grade improvements.

---

# Final Score

Give scores out of 10.

Architecture

Security

Code Quality

Performance

Scalability

Maintainability

Testing

Documentation

Production Readiness

Overall

---

# Output

Generate ONE markdown file named:

output.md

The report must contain:

# Executive Summary

# Architecture Review

# Security Review

# Missing Features

# Bugs

# Technical Debt

# Performance Issues

# Refactoring Opportunities

# Production Readiness

# Testing Report

# Priority Action Plan

# Final Score

Do NOT ask questions.

Do NOT stop early.

Inspect the entire repository before writing the report.

If you are uncertain about a feature, mention the evidence and confidence level instead of guessing.