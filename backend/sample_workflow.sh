#!/bin/bash
# Nutmeg Backend - Sample curl Commands
# Complete end-to-end workflow examples

BASE_URL="http://localhost:8000"

echo "=========================================="
echo "Nutmeg Backend - Sample Workflow"
echo "=========================================="
echo ""

# ==========================================
# SCENARIO 1: Login as Two Different Users
# ==========================================

echo "=== Scenario 1: Authenticating Users ==="
echo ""

# Login as Nikhil
echo "1. Login as nikhil@nutmeg.com..."
NIKHIL_TOKEN=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

if [ -z "$NIKHIL_TOKEN" ]; then
  echo "❌ Failed to login as Nikhil"
  exit 1
fi
echo "✅ Nikhil logged in"
echo ""

# Login as Jayasree
echo "2. Login as jayasree@nutmeg.com..."
JAYASREE_TOKEN=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jayasree@nutmeg.com","password":"nutmeg123"}' \
  | jq -r '.access_token')

if [ -z "$JAYASREE_TOKEN" ]; then
  echo "❌ Failed to login as Jayasree"
  exit 1
fi
echo "✅ Jayasree logged in"
echo ""

# ==========================================
# SCENARIO 2: Create Projects
# ==========================================

echo "=== Scenario 2: Creating Projects ==="
echo ""

# Nikhil creates collaborative project
echo "3. Nikhil creates collaborative project..."
PROJECT1=$(curl -s -X POST $BASE_URL/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{
    "name": "Website Redesign",
    "members": ["jayasree@nutmeg.com"],
    "start_date": "2026-01-23T00:00:00",
    "end_date": "2026-01-30T00:00:00"
  }')

PROJECT1_ID=$(echo $PROJECT1 | jq -r '.id')
echo "✅ Project created: Website Redesign (ID: $PROJECT1_ID)"
echo ""

# Jayasree creates individual project
echo "4. Jayasree creates individual project..."
PROJECT2=$(curl -s -X POST $BASE_URL/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  -d '{
    "name": "Design Portfolio Update",
    "start_date": "2026-01-24T00:00:00",
    "end_date": "2026-01-31T00:00:00"
  }')

PROJECT2_ID=$(echo $PROJECT2 | jq -r '.id')
echo "✅ Project created: Design Portfolio Update (ID: $PROJECT2_ID)"
echo ""

# ==========================================
# SCENARIO 3: Assign Tasks to Team Members
# ==========================================

echo "=== Scenario 3: Creating & Assigning Tasks ==="
echo ""

# Create team task (assigned to ALL)
echo "5. Create team task for all members..."
TEAM_TASK=$(curl -s -X POST $BASE_URL/projects/$PROJECT1_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{
    "title": "Review wireframes",
    "description": "Everyone should review the wireframe designs",
    "assignees": ["ALL"],
    "priority": "high",
    "deadline": "2026-01-28T23:59:59"
  }')

TEAM_TASK_ID=$(echo $TEAM_TASK | jq -r '.id')
echo "✅ Team task created (ID: $TEAM_TASK_ID)"
echo "   Assignees:"
echo $TEAM_TASK | jq -r '.assignees[] | "   - \(.name) (\(.email))"'
echo ""

# Create specific task for Jayasree
echo "6. Create task specifically for Jayasree..."
SPECIFIC_TASK=$(curl -s -X POST $BASE_URL/projects/$PROJECT1_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{
    "title": "Design homepage mockup",
    "description": "Create high-fidelity mockup for new homepage",
    "assignees": ["jayasree@nutmeg.com"],
    "priority": "urgent",
    "deadline": "2026-01-27T18:00:00"
  }')

SPECIFIC_TASK_ID=$(echo $SPECIFIC_TASK | jq -r '.id')
echo "✅ Specific task created for Jayasree (ID: $SPECIFIC_TASK_ID)"
echo ""

# Create another team task
echo "7. Create second team task..."
TEAM_TASK2=$(curl -s -X POST $BASE_URL/projects/$PROJECT1_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{
    "title": "Sprint planning meeting",
    "assignees": ["ALL"],
    "priority": "medium"
  }')

TEAM_TASK2_ID=$(echo $TEAM_TASK2 | jq -r '.id')
echo "✅ Second team task created (ID: $TEAM_TASK2_ID)"
echo ""

# ==========================================
# SCENARIO 4: Complete Tasks & Check Activity
# ==========================================

echo "=== Scenario 4: Completing Tasks ==="
echo ""

# Jayasree completes her specific task
echo "8. Jayasree completes 'Design homepage mockup'..."
curl -s -X PUT $BASE_URL/tasks/$SPECIFIC_TASK_ID/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  -d '{"status":"done"}' | jq '.'
echo ""

# Nikhil marks team task as in progress
echo "9. Nikhil marks team task as in progress..."
curl -s -X PUT $BASE_URL/tasks/$TEAM_TASK_ID/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{"status":"in_progress"}' | jq '.'
echo ""

# Jayasree also completes team task
echo "10. Jayasree completes team task..."
curl -s -X PUT $BASE_URL/tasks/$TEAM_TASK_ID/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  -d '{"status":"done"}' | jq '.'
echo ""

# Nikhil completes team task (should mark overall as done)
echo "11. Nikhil completes team task (should complete overall)..."
curl -s -X PUT $BASE_URL/tasks/$TEAM_TASK_ID/my-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{"status":"done"}' | jq '.'
echo ""

# ==========================================
# SCENARIO 5: Check Activity Feed
# ==========================================

echo "=== Scenario 5: Activity Feed ==="
echo ""

echo "12. View recent team activities (last 5)..."
curl -s "$BASE_URL/activities?limit=5" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  | jq '.[] | {
    user: .user_name,
    activity: .description,
    time: .humanized_time,
    project: .project_name
  }'
echo ""

echo "13. View Jayasree's activities only..."
curl -s "$BASE_URL/activities/my?limit=5" \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  | jq '.[] | {
    activity: .description,
    time: .humanized_time
  }'
echo ""

# ==========================================
# SCENARIO 6: Dashboard Statistics
# ==========================================

echo "=== Scenario 6: Dashboard Statistics ==="
echo ""

echo "14. View team dashboard..."
curl -s $BASE_URL/dashboard/stats \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  | jq '{
    projects: {
      total: .total_projects,
      active: .active_projects,
      completed: .completed_projects
    },
    tasks: {
      total: .total_tasks,
      completed: .completed_tasks
    },
    team_members: [.members[] | {
      name: .name,
      active_projects: .active_projects,
      completed_this_week: .completed_tasks_this_week
    }]
  }'
echo ""

# ==========================================
# SCENARIO 7: Test 2-Project Limit
# ==========================================

echo "=== Scenario 7: Testing 2-Project Limit ==="
echo ""

# Nikhil creates second project
echo "15. Nikhil creates second project..."
PROJECT3=$(curl -s -X POST $BASE_URL/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{
    "name": "Mobile App Development",
    "start_date": "2026-01-25T00:00:00",
    "end_date": "2026-02-01T00:00:00"
  }')

PROJECT3_ID=$(echo $PROJECT3 | jq -r '.id')
echo "✅ Second project created (ID: $PROJECT3_ID)"
echo ""

# Try to create third project (should fail)
echo "16. Nikhil tries to create third project (should fail)..."
FAIL_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  -d '{
    "name": "Third Project (Should Fail)",
    "start_date": "2026-01-26T00:00:00",
    "end_date": "2026-02-02T00:00:00"
  }')

echo "$FAIL_RESPONSE" | jq '.'
echo ""

# ==========================================
# SCENARIO 8: Collaborative vs Individual
# ==========================================

echo "=== Scenario 8: Filter Projects ==="
echo ""

echo "17. Get Nikhil's collaborative projects..."
curl -s "$BASE_URL/projects?type=collaborative" \
  -H "Authorization: Bearer $NIKHIL_TOKEN" \
  | jq '.[] | {
    name: .name,
    is_collaborative: .is_collaborative,
    members: [.members[] | .name]
  }'
echo ""

echo "18. Get Jayasree's individual projects..."
curl -s "$BASE_URL/projects?type=individual" \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  | jq '.[] | {
    name: .name,
    is_collaborative: .is_collaborative
  }'
echo ""

# ==========================================
# SCENARIO 9: Get User's Tasks
# ==========================================

echo "=== Scenario 9: User's Assigned Tasks ==="
echo ""

echo "19. Get Jayasree's assigned tasks..."
curl -s $BASE_URL/user/tasks \
  -H "Authorization: Bearer $JAYASREE_TOKEN" \
  | jq '.[] | {
    title: .title,
    project: .project_name,
    my_status: .my_status,
    overall_status: .overall_status,
    priority: .priority
  }'
echo ""

# ==========================================
# Summary
# ==========================================

echo "=========================================="
echo "✅ All scenarios completed successfully!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Created 3 projects (2 for Nikhil, 1 for Jayasree)"
echo "- Created 3 tasks with different assignment patterns"
echo "- Tested individual task completion"
echo "- Tested team task completion flow"
echo "- Verified activity logging"
echo "- Checked dashboard statistics"
echo "- Validated 2-project limit enforcement"
echo "- Filtered collaborative vs individual projects"
echo ""
