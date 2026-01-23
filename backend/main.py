from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
import json
from datetime import datetime, timedelta

# Local Imports
from app.jwt_utils import create_access_token
from app.db import engine, get_session

from app.security import hash_password, verify_password
from app.dependencies import get_current_user
from app.models import (
    User, 
    Project, ProjectStatus, ProjectCreate, ProjectUpdate, ProjectMember,
    Task, TaskStatus, TaskPriority, TaskCreate, TaskUpdate, TaskAssignee, TaskStatusUpdate,
    Activity, ActivityType,
    ProjectResponse, MemberInfo,
    TaskResponse, AssigneeInfo
)

app = FastAPI(
    title="Nutmeg Backend",
    description="API for Nutmeg Project Management",
    version="2.0.0"
)

# -------- Middleware --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Constants & Config --------
FIXED_USERS = [
    "nikhil@nutmeg.com",
    "jayasree@nutmeg.com",
    "nandana@nutmeg.com",
    "hafeez@nutmeg.com",
]
DEFAULT_PASSWORD = "nutmeg123"
MAX_ACTIVE_PROJECTS = 2
MIN_PROJECT_DAYS = 1
MAX_PROJECT_DAYS = 14


# -------- Request Models (Local) --------
class LoginRequest(BaseModel):
    email: str
    password: str


# -------- Helper Functions --------
def log_activity(
    session: Session,
    project_id: int,
    user_email: str,
    activity_type: ActivityType,
    description: str,
    task_id: int = None,
    extra_data: str = None
):
    """
    Helper to create activity log entries.
    Fire-and-forget: logs errors but doesn't raise exceptions.
    """
    try:
        activity = Activity(
            project_id=project_id,
            user_email=user_email,
            activity_type=activity_type,
            description=description,
            extra_data=extra_data,
            created_at=datetime.utcnow()
        )
        session.add(activity)
        # Note: Not committing here - let the calling endpoint commit
    except Exception as e:
        print(f"⚠️  Activity logging failed: {e}")


def get_user_name(email: str) -> str:
    """Extract friendly name from email"""
    return email.split("@")[0].capitalize()


def humanize_timestamp(dt: datetime) -> str:
    """Convert datetime to human-readable relative time"""
    now = datetime.utcnow()
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    else:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"


def get_activity_color(activity_type: str) -> str:
    """Get hex color code for activity type"""
    colors = {
        "project_created": "#10b981",  # green
        "project_completed": "#3b82f6",  # blue
        "task_created": "#8b5cf6",  # purple
        "task_completed": "#14b8a6",  # teal
        "task_updated": "#f59e0b",  # amber
    }
    return colors.get(activity_type, "#6b7280")  # default gray


# -------- Startup --------
@app.on_event("startup")
def on_startup():
    # Database is created here if it doesn't exist
    SQLModel.metadata.create_all(engine)

    # Seed fixed users
    with Session(engine) as session:
        for email in FIXED_USERS:
            existing = session.exec(select(User).where(User.email == email)).first()
            if not existing:
                user = User(email=email, password=hash_password(DEFAULT_PASSWORD))
                session.add(user)
        session.commit()


@app.get("/", tags=["Health"])
def root():
    return {"status": "Nutmeg backend running 🚀"}


# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.post("/login", tags=["Auth"])
def login(request: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == request.email)).first()

    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )

    # Friendly name logic
    name = request.email.split("@")[0].capitalize()
    token = create_access_token({"email": request.email})

    return {
        "message": f"Welcome back, {name}",
        "email": request.email,
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/me", tags=["Auth"])
def read_me(current_user: str = Depends(get_current_user)):
    return {
        "email": current_user,
        "status": "authenticated"
    }


# ==========================================
# USER ENDPOINTS
# ==========================================

@app.get("/users", tags=["Users"])
def list_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    # Return list of emails for simplicity
    return [u.email for u in users]

@app.get("/user/stats", tags=["Users"])
def get_user_stats(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Active Projects created by user
    active_count = session.exec(
        select(Project)
        .where(Project.created_by == current_user)
        .where(Project.status == ProjectStatus.ACTIVE)
    ).all()
    
    # Done Projects created by user
    done_count = session.exec(
        select(Project)
        .where(Project.created_by == current_user)
        .where(Project.status == ProjectStatus.DONE)
    ).all()
    
    # Note: total implies total projects involved or created? 
    # Current logic matches original: total projects created
    
    return {
        "active_count": len(active_count),
        "done_count": len(done_count),
        "total": len(active_count) + len(done_count)
    }


# ==========================================
# PROJECT ENDPOINTS
# ==========================================

@app.post("/projects", tags=["Projects"], response_model=Project)
def create_project(
    project_data: ProjectCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        # ===== VALIDATION 1: Max Active Projects Rule =====
        active_projects = session.exec(
            select(Project)
            .where(Project.created_by == current_user)
            .where(Project.status == ProjectStatus.ACTIVE)
        ).all()
        
        if len(active_projects) >= MAX_ACTIVE_PROJECTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {MAX_ACTIVE_PROJECTS} active projects allowed. Complete or archive existing projects first."
            )
        
        # ===== VALIDATION 2: Timeline (1-14 days) =====
        now = datetime.utcnow()
        duration = (project_data.end_date - project_data.start_date).days
        
        if duration < MIN_PROJECT_DAYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project duration must be at least {MIN_PROJECT_DAYS} day(s)"
            )
        
        if duration > MAX_PROJECT_DAYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project duration cannot exceed {MAX_PROJECT_DAYS} days"
            )
        
        # ===== VALIDATION 3: All member emails exist =====
        for member_email in project_data.members:
            if member_email == current_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Don't include yourself in members list (auto-added as creator)"
                )
            
            user_exists = session.exec(
                select(User).where(User.email == member_email)
            ).first()
            
            if not user_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User '{member_email}' not found"
                )
        
        # ===== CREATE PROJECT =====
        project = Project(
            name=project_data.name,
            created_by=current_user,
            status=ProjectStatus.ACTIVE,
            start_date=project_data.start_date,
            end_date=project_data.end_date,
            created_at=datetime.utcnow()
        )
        session.add(project)
        session.flush()  # Get project.id without committing
        
        # ===== ADD CREATOR AS OWNER =====
        creator_member = ProjectMember(
            project_id=project.id,
            user_email=current_user,
            role="owner",
            joined_at=datetime.utcnow()
        )
        session.add(creator_member)
        
        # ===== ADD MEMBERS =====
        for member_email in project_data.members:
            member = ProjectMember(
                project_id=project.id,
                user_email=member_email,
                role="member",
                joined_at=datetime.utcnow()
            )
            session.add(member)
        
        # ===== LOG ACTIVITY =====
        log_activity(
            session=session,
            project_id=project.id,
            user_email=current_user,
            activity_type=ActivityType.PROJECT_CREATED,
            description=f"{current_user.split('@')[0]} created project '{project.name}'",
            extra_data=json.dumps({"members": project_data.members})
        )
        
        # ===== COMMIT TRANSACTION =====
        session.commit()
        session.refresh(project)
        
        return project
        
    except HTTPException:
        raise  # Re-raise validation errors
    except Exception as e:
        session.rollback()
        print(f"❌ Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects", tags=["Projects"], response_model=List[ProjectResponse])
def list_projects(
    status: Optional[ProjectStatus] = Query(None, description="Filter by project status"),
    type: Optional[str] = Query(None, description="Filter by type: 'individual' or 'collaborative'"),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all projects where current user is either creator or member.
    
    Filters:
    - status: active | done | archived
    - type: individual (solo projects) | collaborative (team projects)
    
    Returns enriched project data with members and task counts.
    """
    
    try:
        # Get all projects where user is a member (includes creator)
        member_projects = session.exec(
            select(ProjectMember.project_id)
            .where(ProjectMember.user_email == current_user)
        ).all()
        
        # If user has no projects, return empty list
        if not member_projects:
            return []
        
        # Build query for projects user is involved in
        query = select(Project).where(Project.id.in_(member_projects))
        
        # Apply status filter
        if status:
            query = query.where(Project.status == status)
        
        # Execute query (sorted in Python for now)
        projects = session.exec(query).all()
        projects = sorted(projects, key=lambda p: p.created_at, reverse=True)
        
        # Enrich each project with members and task stats
        enriched_projects = []
        
        for project in projects:
            # Get all members for this project
            members_data = session.exec(
                select(ProjectMember)
                .where(ProjectMember.project_id == project.id)
            ).all()
            
            # Sort members: owners first, then members
            members_data = sorted(members_data, key=lambda m: 0 if m.role == "owner" else 1)
            
            members = [
                MemberInfo(
                    email=member.user_email,
                    role=member.role,
                    joined_at=member.joined_at
                )
                for member in members_data
            ]
            
            # Determine if collaborative (more than just the creator)
            is_collaborative = len(members) > 1
            
            # Apply type filter
            if type:
                if type == "individual" and is_collaborative:
                    continue
                elif type == "collaborative" and not is_collaborative:
                    continue
            
            # Get task statistics
            all_tasks = session.exec(
                select(Task).where(Task.project_id == project.id)
            ).all()
            
            total_tasks = len(all_tasks)
            completed_tasks = len([t for t in all_tasks if t.status == TaskStatus.DONE])
            
            # Create enriched response
            enriched_project = ProjectResponse(
                id=project.id,
                name=project.name,
                status=project.status,
                created_by=project.created_by,
                created_at=project.created_at,
                start_date=project.start_date,
                end_date=project.end_date,
                members=members,
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                is_collaborative=is_collaborative
            )
            
            enriched_projects.append(enriched_project)
        
        return enriched_projects
        
    except Exception as e:
        print(f"❌ Error in GET /projects: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")


@app.get("/projects/{project_id}", tags=["Projects"], response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a single project by ID with enriched data (members and task stats)."""
    
    try:
        # Check if project exists
        project = session.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is a member
        is_member = session.exec(
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .where(ProjectMember.user_email == current_user)
        ).first()
        
        if not is_member:
            raise HTTPException(status_code=403, detail="You are not a member of this project")
        
        # Get all members for this project
        members_data = session.exec(
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
        ).all()
        
        # Sort members: owners first, then members
        members_data = sorted(members_data, key=lambda m: 0 if m.role == "owner" else 1)
        
        members = [
            MemberInfo(
                email=member.user_email,
                role=member.role,
                joined_at=member.joined_at
            )
            for member in members_data
        ]
        
        # Determine if collaborative
        is_collaborative = len(members) > 1
        
        # Get task statistics
        all_tasks = session.exec(
            select(Task).where(Task.project_id == project_id)
        ).all()
        
        total_tasks = len(all_tasks)
        completed_tasks = len([t for t in all_tasks if t.status == TaskStatus.DONE])
        
        # Create enriched response
        enriched_project = ProjectResponse(
            id=project.id,
            name=project.name,
            status=project.status,
            created_by=project.created_by,
            created_at=project.created_at,
            start_date=project.start_date,
            end_date=project.end_date,
            members=members,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            is_collaborative=is_collaborative
        )
        
        return enriched_project
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in GET /projects/{project_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching project: {str(e)}")


@app.put("/projects/{project_id}", tags=["Projects"], response_model=Project)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only creator can update (simple rule)
    if project.created_by != current_user:
         raise HTTPException(status_code=403, detail="Only the creator can modify this project")

    # Track old status for activity logging
    old_status = project.status

    project_data = project_update.dict(exclude_unset=True)
    for key, value in project_data.items():
        setattr(project, key, value)
    
    # Log activity if project was completed
    if 'status' in project_data and project_data['status'] == ProjectStatus.DONE and old_status != ProjectStatus.DONE:
        log_activity(
            session=session,
            project_id=project.id,
            user_email=current_user,
            activity_type=ActivityType.PROJECT_COMPLETED,
            description=f"{get_user_name(current_user)} completed project '{project.name}'"
        )
    
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


# ==========================================
# TASK ENDPOINTS
# ==========================================

@app.post("/projects/{project_id}/tasks", tags=["Tasks"], response_model=TaskResponse)
def add_task(
    project_id: int,
    task_data: TaskCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Validate project exists
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Determine if team task
    is_team_task = not task_data.assignees or task_data.assignees == ["ALL"]
    
    # Create single task
    task = Task(
        project_id=project_id,
        title=task_data.title,
        description=task_data.description,
        deadline=task_data.deadline,
        priority=task_data.priority,
        status=TaskStatus.TODO,
        is_team_task=is_team_task,
        created_by=current_user
    )
    session.add(task)
    session.flush()  # Get task.id
    
    # Create TaskAssignee records
    if is_team_task:
        # Get all project members
        members = session.exec(
            select(ProjectMember).where(ProjectMember.project_id == project_id)
        ).all()
        
        for member in members:
            assignee = TaskAssignee(
                task_id=task.id,
                user_email=member.user_email,
                status=TaskStatus.TODO
            )
            session.add(assignee)
    else:
        # Create assignees for specific emails
        for email in task_data.assignees:
            # Validate email exists
            user = session.exec(select(User).where(User.email == email)).first()
            if not user:
                raise HTTPException(status_code=404, detail=f"User '{email}' not found")
            
            assignee = TaskAssignee(
                task_id=task.id,
                user_email=email,
                status=TaskStatus.TODO
            )
            session.add(assignee)
    
    # Log activity
    log_activity(
        session=session,
        project_id=project_id,
        user_email=current_user,
        activity_type=ActivityType.TASK_CREATED,
        description=f"{get_user_name(current_user)} created task '{task.title}' in '{project.name}'",
        task_id=task.id
    )
    
    session.commit()
    session.refresh(task)
    
    # Return enriched response with assignees
    assignees_data = session.exec(
        select(TaskAssignee).where(TaskAssignee.task_id == task.id)
    ).all()
    
    assignees = [
        AssigneeInfo(
            email=a.user_email,
            status=a.status,
            assigned_at=a.assigned_at,
            completed_at=a.completed_at
        )
        for a in assignees_data
    ]
    
    return TaskResponse(**task.dict(), assignees=assignees)

@app.get("/projects/{project_id}/tasks", tags=["Tasks"], response_model=List[TaskResponse])
def list_project_tasks(
    project_id: int,
    session: Session = Depends(get_session)
):
    tasks = session.exec(
        select(Task).where(Task.project_id == project_id)
    ).all()
    
    enriched_tasks = []
    for task in tasks:
        # Get assignees for this task
        assignees_data = session.exec(
            select(TaskAssignee).where(TaskAssignee.task_id == task.id)
        ).all()
        
        assignees = [
            AssigneeInfo(
                email=a.user_email,
                status=a.status,
                assigned_at=a.assigned_at,
                completed_at=a.completed_at
            )
            for a in assignees_data
        ]
        
        enriched_tasks.append(TaskResponse(**task.dict(), assignees=assignees))
    
    return enriched_tasks

@app.get("/user/tasks", tags=["Tasks"], response_model=List[TaskResponse])
def list_my_tasks(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all tasks assigned to current user"""
    # Get all tasks where user is an assignee
    my_assignments = session.exec(
        select(TaskAssignee).where(TaskAssignee.user_email == current_user)
    ).all()
    
    task_ids = [a.task_id for a in my_assignments]
    
    # Handle empty case early
    if not task_ids:
        return []
    
    # Now safe to use .in_()
    tasks = session.exec(
        select(Task).where(Task.id.in_(task_ids))
    ).all()
    
    enriched_tasks = []
    for task in tasks:
        assignees_data = session.exec(
            select(TaskAssignee).where(TaskAssignee.task_id == task.id)
        ).all()
        
        assignees = [
            AssigneeInfo(
                email=a.user_email,
                status=a.status,
                assigned_at=a.assigned_at,
                completed_at=a.completed_at
            )
            for a in assignees_data
        ]
        
        enriched_tasks.append(TaskResponse(**task.dict(), assignees=assignees))
    
    return enriched_tasks

@app.put("/tasks/{task_id}/my-status", tags=["Tasks"])
def update_my_task_status(
    task_id: int,
    status_update: TaskStatusUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update only current user's status for this task"""
    new_status = status_update.status
    
    # Get task assignee for current user
    my_assignment = session.exec(
        select(TaskAssignee)
        .where(TaskAssignee.task_id == task_id)
        .where(TaskAssignee.user_email == current_user)
    ).first()
    
    if not my_assignment:
        raise HTTPException(status_code=404, detail="Task not assigned to you")
    
    # Update individual status
    old_status = my_assignment.status
    my_assignment.status = new_status
    
    if new_status == TaskStatus.DONE and old_status != TaskStatus.DONE:
        my_assignment.completed_at = datetime.utcnow()
        
        # Log activity
        task = session.get(Task, task_id)
        log_activity(
            session=session,
            project_id=task.project_id,
            user_email=current_user,
            activity_type=ActivityType.TASK_COMPLETED,
            description=f"{get_user_name(current_user)} completed their part of task '{task.title}'",
            task_id=task_id
        )
    
    # Check if ALL assignees are done
    all_assignees = session.exec(
        select(TaskAssignee).where(TaskAssignee.task_id == task_id)
    ).all()
    
    all_done = all([a.status == TaskStatus.DONE for a in all_assignees])
    
    # Update task overall status
    task = session.get(Task, task_id)
    if all_done:
        task.status = TaskStatus.DONE
    elif new_status == TaskStatus.DOING and task.status == TaskStatus.TODO:
        task.status = TaskStatus.DOING
    
    task.updated_at = datetime.utcnow()
    
    session.add(my_assignment)
    session.add(task)
    session.commit()
    
    return {
        "message": "Status updated",
        "task_status": task.status,
        "your_status": my_assignment.status
    }

@app.put("/tasks/{task_id}", tags=["Tasks"], response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate, 
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update task metadata (title, description, deadline, priority). Use /my-status for status updates."""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update only metadata fields (exclude status)
    task_data = task_update.dict(exclude_unset=True, exclude={'status'})
    for key, value in task_data.items():
        setattr(task, key, value)

    task.updated_at = datetime.utcnow()
    
    session.add(task)
    session.commit()
    session.refresh(task)
    
    # Return enriched response
    assignees_data = session.exec(
        select(TaskAssignee).where(TaskAssignee.task_id == task.id)
    ).all()
    
    assignees = [
        AssigneeInfo(
            email=a.user_email,
            status=a.status,
            assigned_at=a.assigned_at,
            completed_at=a.completed_at
        )
        for a in assignees_data
    ]
    
    return TaskResponse(**task.dict(), assignees=assignees)

@app.delete("/tasks/{task_id}", tags=["Tasks"])
def delete_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Save task info before deletion
    task_title = task.title
    task_project_id = task.project_id
    
    # Log activity before deleting
    log_activity(
        session=session,
        project_id=task_project_id,
        user_email=current_user,
        activity_type=ActivityType.TASK_UPDATED,  # Using TASK_UPDATED as closest match
        description=f"{get_user_name(current_user)} deleted task '{task_title}'",
        task_id=task_id
    )

    session.delete(task)
    session.commit()
    return {"message": "Task removed 🌱"}


# ==========================================
# ACTIVITY FEED & DASHBOARD ENDPOINTS
# ==========================================

@app.get("/activities", tags=["Activity"])
def list_activities(
    current_user: str = Depends(get_current_user),
    limit: int = 50,
    session: Session = Depends(get_session)
):
    """Get recent activities from all team members"""
    activities = session.exec(
        select(Activity)
        .order_by(Activity.created_at.desc())
        .limit(limit)
    ).all()
    
    enriched_activities = []
    for activity in activities:
        # Get project and task names
        project = session.get(Project, activity.project_id)
        project_name = project.name if project else "Unknown Project"
        
        enriched_activities.append({
            "id": activity.id,
            "user_email": activity.user_email,
            "user_name": get_user_name(activity.user_email),
            "activity_type": activity.activity_type,
            "description": activity.description,
            "project_id": activity.project_id,
            "project_name": project_name,
            "created_at": activity.created_at.isoformat(),
            "humanized_time": humanize_timestamp(activity.created_at),
            "color": get_activity_color(activity.activity_type)
        })
    
    return enriched_activities


@app.get("/activities/my", tags=["Activity"])
def list_my_activities(
    current_user: str = Depends(get_current_user),
    limit: int = 50,
    session: Session = Depends(get_session)
):
    """Get recent activities by current user"""
    activities = session.exec(
        select(Activity)
        .where(Activity.user_email == current_user)
        .order_by(Activity.created_at.desc())
        .limit(limit)
    ).all()
    
    enriched_activities = []
    for activity in activities:
        # Get project and task names
        project = session.get(Project, activity.project_id)
        project_name = project.name if project else "Unknown Project"
        
        enriched_activities.append({
            "id": activity.id,
            "user_email": activity.user_email,
            "user_name": get_user_name(activity.user_email),
            "activity_type": activity.activity_type,
            "description": activity.description,
            "project_id": activity.project_id,
            "project_name": project_name,
            "created_at": activity.created_at.isoformat(),
            "humanized_time": humanize_timestamp(activity.created_at),
            "color": get_activity_color(activity.activity_type)
        })
    
    return enriched_activities


@app.get("/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get team-wide statistics for dashboard"""
    # Get all projects
    all_projects = session.exec(select(Project)).all()
    active_projects = [p for p in all_projects if p.status == ProjectStatus.ACTIVE]
    completed_projects = [p for p in all_projects if p.status == ProjectStatus.DONE]
    
    # Get all tasks
    all_tasks = session.exec(select(Task)).all()
    completed_tasks = [t for t in all_tasks if t.status == TaskStatus.DONE]
    
    # Get all users who have created projects or are project members
    all_users = session.exec(select(User)).all()
    
    # Calculate per-member stats
    members = []
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    
    for user in all_users:
        # Count active projects created by this user
        user_active_projects = len([
            p for p in active_projects if p.created_by == user.email
        ])
        
        # Count tasks completed by this user in the last week
        user_completed_tasks_week = session.exec(
            select(TaskAssignee)
            .where(TaskAssignee.user_email == user.email)
            .where(TaskAssignee.status == TaskStatus.DONE)
            .where(TaskAssignee.completed_at >= one_week_ago)
        ).all()
        
        members.append({
            "email": user.email,
            "name": get_user_name(user.email),
            "active_projects": user_active_projects,
            "completed_tasks_this_week": len(user_completed_tasks_week)
        })
    
    return {
        "total_projects": len(all_projects),
        "active_projects": len(active_projects),
        "completed_projects": len(completed_projects),
        "total_tasks": len(all_tasks),
        "completed_tasks": len(completed_tasks),
        "members": members
    }
