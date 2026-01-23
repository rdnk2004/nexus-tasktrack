# Nutmeg Backend - API Documentation

Complete API reference for the Nutmeg task management backend.

**Base URL:** `http://localhost:8000`

**Version:** 2.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Project Endpoints](#project-endpoints)
3. [Task Endpoints](#task-endpoints)
4. [Activity & Dashboard Endpoints](#activity--dashboard-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)

---

## Authentication

All endpoints except `/login` require JWT authentication via the `Authorization` header.

### POST /login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

**Example:**
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}'
```

---

## Project Endpoints

### POST /projects

Create a new project with optional team members.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "members": ["email1", "email2"],  // Optional, emails of team members
  "start_date": "ISO 8601 datetime",
  "end_date": "ISO 8601 datetime"
}
```

**Validation Rules:**
- User can have maximum 2 active projects
- Timeline must be 1-14 days
- Member emails must exist in database
- Creator cannot be in members list (auto-added as owner)

**Response (200):**
```json
{
  "id": 1,
  "name": "Project Name",
  "status": "active",
  "created_by": "user@example.com",
  "start_date": "2026-01-25T00:00:00",
  "end_date": "2026-02-01T00:00:00",
  "created_at": "2026-01-22T10:15:30.123456"
}
```

**Errors:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated

**Activity Logged:** `PROJECT_CREATED`

---

### GET /projects

List projects where user is creator or member.

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `done`, `archived`)
- `type` (optional): Filter by type (`individual`, `collaborative`)

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Project Name",
    "status": "active",
    "created_by": "user@example.com",
    "start_date": "2026-01-25T00:00:00",
    "end_date": "2026-02-01T00:00:00",
    "created_at": "2026-01-22T10:15:30",
    "is_collaborative": true,
    "members": [
      {
        "email": "user@example.com",
        "name": "User",
        "role": "owner"
      },
      {
        "email": "member@example.com",
        "name": "Member",
        "role": "member"
      }
    ],
    "total_tasks": 5,
    "completed_tasks": 2
  }
]
```

**Example:**
```bash
# Get all active projects
curl "http://localhost:8000/projects?status=active" \
  -H "Authorization: Bearer $TOKEN"

# Get collaborative projects only
curl "http://localhost:8000/projects?type=collaborative" \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET /projects/{id}

Get a single project by ID.

**Authentication:** Required

**Path Parameters:**
- `id` (integer): Project ID

**Response (200):**
```json
{
  "id": 1,
  "name": "Project Name",
  "status": "active",
  "created_by": "user@example.com",
  ...
}
```

**Errors:**
- `404 Not Found` - Project doesn't exist
- `403 Forbidden` - User not authorized to view

---

### PUT /projects/{id}

Update project details.

**Authentication:** Required (must be creator)

**Path Parameters:**
- `id` (integer): Project ID

**Request Body:**
```json
{
  "name": "string",           // Optional
  "status": "active|done|archived",  // Optional
  "end_date": "ISO 8601 datetime"    // Optional
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Updated Name",
  "status": "done",
  ...
}
```

**Activity Logged:** `PROJECT_COMPLETED` (when status changes to "done")

---

### DELETE /projects/{id}

Delete a project.

**Authentication:** Required (must be creator)

**Path Parameters:**
- `id` (integer): Project ID

**Response (200):**
```json
{
  "message": "Project archived 🌱"
}
```

---

## Task Endpoints

### POST /projects/{id}/tasks

Create a task within a project.

**Authentication:** Required

**Path Parameters:**
- `id` (integer): Project ID

**Request Body:**
```json
{
  "title": "string",
  "description": "string",              // Optional
  "assignees": ["email1", "email2"],    // Use ["ALL"] for all project members
  "priority": "low|medium|high|urgent", // Optional, default: "medium"
  "deadline": "ISO 8601 datetime"       // Optional
}
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "high",
  "is_team_task": true,
  "deadline": "2026-01-30T23:59:59",
  "project_id": 1,
  "created_at": "2026-01-22T10:20:00",
  "assignees": [
    {
      "email": "user1@example.com",
      "name": "User1",
      "status": "todo"
    },
    {
      "email": "user2@example.com",
      "name": "User2",
      "status": "todo"
    }
  ]
}
```

**Notes:**
- If `assignees = ["ALL"]`, task is assigned to all project members
- If assignees list has multiple users, `is_team_task = true`
- Each assignee gets their own status tracked independently

**Activity Logged:** `TASK_CREATED`

---

### GET /projects/{id}/tasks

List all tasks in a project.

**Authentication:** Required

**Path Parameters:**
- `id` (integer): Project ID

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Task Title",
    "status": "todo",
    "priority": "high",
    "is_team_task": false,
    "assignees": [
      {
        "email": "user@example.com",
        "name": "User",
        "status": "todo"
      }
    ],
    ...
  }
]
```

---

### GET /user/tasks

Get all tasks assigned to the current user.

**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Task Title",
    "project_name": "Project Name",
    "project_id": 1,
    "my_status": "todo",
    "overall_status": "todo",
    "priority": "high",
    "deadline": "2026-01-30T23:59:59",
    ...
  }
]
```

**Notes:**
- `my_status`: Current user's individual status for this task
- `overall_status`: Overall task status (changes to "done" when all assignees complete)

---

### PUT /tasks/{id}/my-status

Update your individual status for a task.

**Authentication:** Required (must be an assignee)

**Path Parameters:**
- `id` (integer): Task ID

**Request Body:**
```json
{
  "status": "todo|in_progress|done"
}
```

**Response (200):**
```json
{
  "message": "Your status updated to 'done'",
  "your_status": "done",
  "task_status": "in_progress",
  "all_assignees_completed": false
}
```

**Notes:**
- Updates only your individual status
- Overall task status becomes "done" when ALL assignees complete
- For single-assignee tasks, overall status updates immediately

**Activity Logged:** `TASK_COMPLETED` (when overall status becomes "done")

---

### PUT /tasks/{id}

Update task metadata (title, description, priority, deadline).

**Authentication:** Required

**Path Parameters:**
- `id` (integer): Task ID

**Request Body:**
```json
{
  "title": "string",           // Optional
  "description": "string",     // Optional
  "priority": "low|medium|high|urgent",  // Optional
  "deadline": "ISO 8601 datetime"        // Optional
}
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Updated Title",
  "priority": "urgent",
  "assignees": [...],
  ...
}
```

**Notes:**
- Does NOT update task status (use `/my-status` endpoint for that)
- Only updates metadata fields

---

### DELETE /tasks/{id}

Delete a task.

**Authentication:** Required

**Path Parameters:**
- `id` (integer): Task ID

**Response (200):**
```json
{
  "message": "Task removed 🌱"
}
```

**Activity Logged:** `TASK_UPDATED`

---

## Activity & Dashboard Endpoints

### GET /activities

Get recent activities from all team members.

**Authentication:** Required

**Query Parameters:**
- `limit` (integer, optional): Number of activities to return (default: 50)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_email": "user@example.com",
    "user_name": "User",
    "activity_type": "task_completed",
    "description": "User completed task 'Task Title'",
    "project_id": 1,
    "project_name": "Project Name",
    "created_at": "2026-01-22T10:25:00",
    "humanized_time": "5 minutes ago",
    "color": "#14b8a6"
  }
]
```

**Activity Types & Colors:**
- `project_created` - Green (#10b981)
- `project_completed` - Blue (#3b82f6)
- `task_created` - Purple (#8b5cf6)
- `task_completed` - Teal (#14b8a6)
- `task_updated` - Amber (#f59e0b)

---

### GET /activities/my

Get recent activities by current user only.

**Authentication:** Required

**Query Parameters:**
- `limit` (integer, optional): Number of activities to return (default: 50)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_email": "current@example.com",
    "user_name": "Current",
    "activity_type": "project_created",
    "description": "Current created project 'New Project'",
    ...
  }
]
```

---

### GET /dashboard/stats

Get team-wide statistics and metrics.

**Authentication:** Required

**Response (200):**
```json
{
  "total_projects": 10,
  "active_projects": 4,
  "completed_projects": 6,
  "total_tasks": 25,
  "completed_tasks": 15,
  "members": [
    {
      "email": "user1@example.com",
      "name": "User1",
      "active_projects": 2,
      "completed_tasks_this_week": 8
    },
    {
      "email": "user2@example.com",
      "name": "User2",
      "active_projects": 1,
      "completed_tasks_this_week": 5
    }
  ]
}
```

**Metrics:**
- Team-wide: Total/active/completed projects and tasks
- Per-member: Active projects count and tasks completed in the last 7 days

---

## Data Models

### Project

```typescript
{
  id: integer,
  name: string,
  status: "active" | "done" | "archived",
  created_by: string (email),
  start_date: datetime,
  end_date: datetime,
  created_at: datetime
}
```

### Task

```typescript
{
  id: integer,
  title: string,
  description: string | null,
  status: "todo" | "in_progress" | "doing" | "done",
  priority: "low" | "medium" | "high" | "urgent",
  is_team_task: boolean,
  deadline: datetime | null,
  project_id: integer,
  created_at: datetime
}
```

### TaskAssignee

```typescript
{
  task_id: integer,
  user_email: string,
  status: "todo" | "in_progress" | "doing" | "done",
  assigned_at: datetime,
  completed_at: datetime | null
}
```

### ProjectMember

```typescript
{
  project_id: integer,
  user_email: string,
  role: "owner" | "member",
  joined_at: datetime
}
```

### Activity

```typescript
{
  id: integer,
  user_email: string,
  activity_type: "project_created" | "project_completed" | "task_created" | "task_completed" | "task_updated",
  description: string,
  project_id: integer,
  task_id: integer | null,
  created_at: datetime
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful request |
| 400 | Bad Request | Validation error, invalid parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission for this resource |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

### Common Errors

**Authentication Errors:**
```json
{
  "detail": "Not authenticated"
}
{
  "detail": "Invalid or expired token"
}
{
  "detail": "Invalid credentials"
}
```

**Validation Errors:**
```json
{
  "detail": "You already have 2 active projects. Complete one before creating another."
}
{
  "detail": "Project timeline must be between 1 and 14 days"
}
{
  "detail": "User with email example@test.com does not exist"
}
```

**Authorization Errors:**
```json
{
  "detail": "You must be the project creator to update this project"
}
{
  "detail": "You are not a member of this project"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This may be added in future versions.

---

## Changelog

### Version 2.0 (Current)
- Implemented many-to-many task assignment via TaskAssignee
- Added individual status tracking for team tasks
- Created activity feed and dashboard endpoints
- Added comprehensive project member management
- Implemented 2-project active limit
- Enhanced all responses with enriched data

### Version 1.0
- Basic project and task CRUD operations
- Simple task cloning system
- Basic authentication

---

## Support

For issues or questions, contact the development team.
