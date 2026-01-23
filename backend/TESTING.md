# Nutmeg Backend - Testing Guide

Comprehensive testing guide with curl commands for all endpoints.

---

## Prerequisites

1. Backend server running on `http://localhost:8000`
2. Test users created in database:
   - nikhil@nutmeg.com (password: nutmeg123)
   - jayasree@nutmeg.com (password: nutmeg123)

---

## Authentication

### 1. Login to Get JWT Token

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}'
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response (401):**
```json
{
  "detail": "Invalid credentials"
}
```

> **Note:** Save the `access_token` value. Use it in the `Authorization: Bearer <token>` header for all subsequent requests.

---

## Project Management

### 2. Create Project

```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "name": "Q4 Marketing Campaign",
    "members": ["jayasree@nutmeg.com"],
    "start_date": "2026-01-25T00:00:00",
    "end_date": "2026-02-01T00:00:00"
  }'
```

**Success Response (200):**
```json
{
  "id": 5,
  "name": "Q4 Marketing Campaign",
  "status": "active",
  "created_by": "nikhil@nutmeg.com",
  "start_date": "2026-01-25T00:00:00",
  "end_date": "2026-02-01T00:00:00",
  "created_at": "2026-01-22T10:15:30.123456"
}
```

**Validation Errors:**

**Too many active projects (400):**
```json
{
  "detail": "You already have 2 active projects. Complete one before creating another."
}
```

**Invalid timeline (400):**
```json
{
  "detail": "Project timeline must be between 1 and 14 days"
}
```

**Invalid member email (400):**
```json
{
  "detail": "User with email john@example.com does not exist"
}
```

### 3. List Projects

**Get all projects (current user is creator or member):**
```bash
curl http://localhost:8000/projects \
  -H "Authorization: Bearer <your_token>"
```

**Filter by status:**
```bash
curl "http://localhost:8000/projects?status=active" \
  -H "Authorization: Bearer <your_token>"
```

**Filter by type:**
```bash
curl "http://localhost:8000/projects?type=collaborative" \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
[
  {
    "id": 5,
    "name": "Q4 Marketing Campaign",
    "status": "active",
    "created_by": "nikhil@nutmeg.com",
    "start_date": "2026-01-25T00:00:00",
    "end_date": "2026-02-01T00:00:00",
    "created_at": "2026-01-22T10:15:30",
    "is_collaborative": true,
    "members": [
      {
        "email": "nikhil@nutmeg.com",
        "name": "Nikhil",
        "role": "owner"
      },
      {
        "email": "jayasree@nutmeg.com",
        "name": "Jayasree",
        "role": "member"
      }
    ],
    "total_tasks": 3,
    "completed_tasks": 1
  }
]
```

### 4. Update Project

```bash
curl -X PUT http://localhost:8000/projects/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"status": "done"}'
```

**Success Response (200):**
```json
{
  "id": 5,
  "name": "Q4 Marketing Campaign",
  "status": "done",
  "created_by": "nikhil@nutmeg.com",
  ...
}
```

### 5. Delete Project

```bash
curl -X DELETE http://localhost:8000/projects/5 \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
{
  "message": "Project archived 🌱"
}
```

---

## Task Management

### 6. Create Team Task (Assign to All Members)

```bash
curl -X POST http://localhost:8000/projects/5/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Review campaign materials",
    "description": "Everyone should review the campaign materials",
    "assignees": ["ALL"],
    "priority": "high",
    "deadline": "2026-01-30T23:59:59"
  }'
```

**Success Response (200):**
```json
{
  "id": 12,
  "title": "Review campaign materials",
  "description": "Everyone should review the campaign materials",
  "status": "todo",
  "priority": "high",
  "is_team_task": true,
  "deadline": "2026-01-30T23:59:59",
  "project_id": 5,
  "created_at": "2026-01-22T10:20:00",
  "assignees": [
    {
      "email": "nikhil@nutmeg.com",
      "name": "Nikhil",
      "status": "todo"
    },
    {
      "email": "jayasree@nutmeg.com",
      "name": "Jayasree",
      "status": "todo"
    }
  ]
}
```

### 7. Create Task for Specific User

```bash
curl -X POST http://localhost:8000/projects/5/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Design social media graphics",
    "description": "Create graphics for Instagram and Facebook",
    "assignees": ["jayasree@nutmeg.com"],
    "priority": "medium"
  }'
```

**Success Response (200):**
```json
{
  "id": 13,
  "title": "Design social media graphics",
  "is_team_task": false,
  "assignees": [
    {
      "email": "jayasree@nutmeg.com",
      "name": "Jayasree",
      "status": "todo"
    }
  ],
  ...
}
```

### 8. List Project Tasks

```bash
curl http://localhost:8000/projects/5/tasks \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
[
  {
    "id": 12,
    "title": "Review campaign materials",
    "status": "todo",
    "is_team_task": true,
    "assignees": [...],
    ...
  },
  {
    "id": 13,
    "title": "Design social media graphics",
    "status": "todo",
    "is_team_task": false,
    "assignees": [...],
    ...
  }
]
```

### 9. Get My Tasks (Current User's Assigned Tasks)

```bash
curl http://localhost:8000/user/tasks \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
[
  {
    "id": 12,
    "title": "Review campaign materials",
    "project_name": "Q4 Marketing Campaign",
    "my_status": "todo",
    "overall_status": "todo",
    ...
  }
]
```

### 10. Update My Status for a Task

```bash
curl -X PUT http://localhost:8000/tasks/12/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"status": "done"}'
```

**Success Response (200):**
```json
{
  "message": "Your status updated to 'done'",
  "your_status": "done",
  "task_status": "in_progress",
  "all_assignees_completed": false
}
```

> **Note:** For team tasks, overall status becomes "done" only when ALL assignees complete.

### 11. Update Task Metadata

```bash
curl -X PUT http://localhost:8000/tasks/12 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Review campaign materials (Updated)",
    "priority": "urgent"
  }'
```

**Success Response (200):**
```json
{
  "id": 12,
  "title": "Review campaign materials (Updated)",
  "priority": "urgent",
  "assignees": [...],
  ...
}
```

### 12. Delete Task

```bash
curl -X DELETE http://localhost:8000/tasks/12 \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
{
  "message": "Task removed 🌱"
}
```

---

## Activity Feed & Dashboard

### 13. Get All Team Activities

```bash
curl "http://localhost:8000/activities?limit=10" \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
[
  {
    "id": 45,
    "user_email": "nikhil@nutmeg.com",
    "user_name": "Nikhil",
    "activity_type": "task_completed",
    "description": "Nikhil completed task 'Review campaign materials'",
    "project_id": 5,
    "project_name": "Q4 Marketing Campaign",
    "created_at": "2026-01-22T10:25:00",
    "humanized_time": "5 minutes ago",
    "color": "#14b8a6"
  },
  ...
]
```

### 14. Get My Activities

```bash
curl "http://localhost:8000/activities/my?limit=20" \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
[
  {
    "id": 45,
    "user_email": "nikhil@nutmeg.com",
    "user_name": "Nikhil",
    "activity_type": "project_created",
    "description": "Nikhil created project 'Q4 Marketing Campaign'",
    ...
  }
]
```

### 15. Get Dashboard Statistics

```bash
curl http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer <your_token>"
```

**Success Response (200):**
```json
{
  "total_projects": 10,
  "active_projects": 4,
  "completed_projects": 6,
  "total_tasks": 25,
  "completed_tasks": 15,
  "members": [
    {
      "email": "nikhil@nutmeg.com",
      "name": "Nikhil",
      "active_projects": 2,
      "completed_tasks_this_week": 8
    },
    {
      "email": "jayasree@nutmeg.com",
      "name": "Jayasree",
      "active_projects": 1,
      "completed_tasks_this_week": 5
    }
  ]
}
```

---

## End-to-End Test Scenarios

### Scenario 1: Complete Project Workflow

```bash
# 1. Login as nikhil
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

# 2. Create collaborative project
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Website Redesign",
    "members": ["jayasree@nutmeg.com"],
    "start_date": "2026-01-23T00:00:00",
    "end_date": "2026-01-30T00:00:00"
  }'

# 3. Create team task
curl -X POST http://localhost:8000/projects/1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Review wireframes",
    "assignees": ["ALL"],
    "priority": "high"
  }'

# 4. Check activities
curl http://localhost:8000/activities \
  -H "Authorization: Bearer $TOKEN"

# 5. View dashboard
curl http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Test 2-Project Limit

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

# Create first project
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Project 1","start_date":"2026-01-23T00:00:00","end_date":"2026-01-30T00:00:00"}'

# Create second project
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Project 2","start_date":"2026-01-24T00:00:00","end_date":"2026-01-31T00:00:00"}'

# Try to create third project (should fail)
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Project 3","start_date":"2026-01-25T00:00:00","end_date":"2026-02-01T00:00:00"}'
# Expected: "You already have 2 active projects..."
```

### Scenario 3: Individual vs Collaborative Projects

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

# Create individual project (no members)
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Solo Project","start_date":"2026-01-23T00:00:00","end_date":"2026-01-30T00:00:00"}'

# Create collaborative project (with members)
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Team Project","members":["jayasree@nutmeg.com"],"start_date":"2026-01-24T00:00:00","end_date":"2026-01-31T00:00:00"}'

# Filter by type
curl "http://localhost:8000/projects?type=individual" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:8000/projects?type=collaborative" \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 4: Team Task Completion Flow

```bash
# Login as nikhil
NIKHIL_TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

# Login as jayasree
JAYASREE_TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jayasree@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

# Nikhil creates team task
curl -X POST http://localhost:8000/projects/1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{"title":"Team standup","assignees":["ALL"],"priority":"medium"}'

# Nikhil marks his part done
curl -X PUT http://localhost:8000/tasks/1/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{"status":"done"}'
# Expected: task_status = "in_progress"

# Jayasree marks her part done
curl -X PUT http://localhost:8000/tasks/1/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  -d '{"status":"done"}'
# Expected: task_status = "done", all_assignees_completed = true
```

---

## Common Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 401 | Not authenticated | Missing or invalid JWT token |
| 401 | Invalid credentials | Wrong email/password in login |
| 400 | Validation error | Invalid request body or parameters |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not found | Resource doesn't exist |
| 500 | Internal server error | Server-side error |

---

## Testing Tips

1. **Use jq for JSON parsing:**
   ```bash
   curl http://localhost:8000/projects -H "Authorization: Bearer $TOKEN" | jq '.'
   ```

2. **Save token as environment variable:**
   ```bash
   export TOKEN=$(curl -s -X POST http://localhost:8000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}' \
     | jq -r '.access_token')
   ```

3. **Verbose output for debugging:**
   ```bash
   curl -v http://localhost:8000/projects -H "Authorization: Bearer $TOKEN"
   ```

4. **Pretty print responses:**
   ```bash
   curl http://localhost:8000/projects -H "Authorization: Bearer $TOKEN" | jq '.'
   ```
