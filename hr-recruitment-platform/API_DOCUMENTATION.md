# NovumFlow API Documentation

## Overview

NovumFlow provides a secure API for integrating HR and Care data with third-party systems. This API allows you to programmatically access staff records, compliance status, and operational metrics.

## Authentication

Authentication is handled via **API Keys**. You can generate and manage API keys in the **Developer Settings** section of the NovumFlow HR dashboard.

Include your API key in the `x-api-key` header of every request:

```bash
curl -H "x-api-key: nf_live_..." https://<project-ref>.functions.supabase.co/api/v1/resource
```

## Endpoints

### 1. Staff Directory

**GET** `/api/v1/staff`

Returns a list of active staff members with their basic details and compliance status.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "role": "Carer",
      "status": "Active",
      "compliance": {
        "dbs_status": "Valid",
        "rtw_status": "Valid"
      }
    }
  ]
}
```

### 2. Compliance Summary

**GET** `/api/v1/compliance/summary`

Returns aggregated compliance metrics for the organization.

**Response:**
```json
{
  "data": {
    "total_staff": 45,
    "compliant_staff": 42,
    "expired_dbs": 1,
    "expired_training": 2
  }
}
```

## Rate Limiting

API usage is limited to **1000 requests per hour** per API key.

## Errors

- `401 Unauthorized`: Invalid or missing API Key.
- `403 Forbidden`: API Key does not have the required scope.
- `429 Too Many Requests`: Rate limit exceeded.

## Webhooks

Subscribe to events to receive real-time notifications.

### Supported Events
- `employee.created`: Triggered when a new staff member is added.
- `employee.updated`: Triggered when staff details change.
- `application.created`: Triggered when a new job application is received.

### Payload Format
```json
{
  "event": "employee.created",
  "timestamp": "2026-01-14T12:00:00Z",
  "data": {
    "id": "...",
    "full_name": "New Hire"
  }
}
```
