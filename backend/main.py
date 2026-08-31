import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, desc
from sqlmodel import SQLModel, Session, select
from pydantic import BaseModel

# Local Imports
from app.config import settings
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
    TaskResponse, AssigneeInfo,
    PasswordChange
)

app = FastAPI(
    title="Nexus Backend",
    description="API for Nexus Project Management",
    version="2.1.0"
)

# -------- Middleware --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Constants --------
FIXED_USERS = [
    "nikhil@nexus.com",
    "jayasree@nexus.com",
    "nandana@nexus.com",
    "hafeez@nexus.com",
    "aldrin@nexus.com",
    "sreeraj@nexus.com",
    "gopika@nexus.com",
    "aswin@nexus.com",
    "test@nexus.com",
]
MAX_ACTIVE_PROJECTS = 2
MIN_PROJECT_DAYS = 1
MAX_PROJECT_DAYS = 14


# -------- Request Models --------
class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str
    master_passphrase: str
    new_password: str


# -------- Helper Functions --------
def get_utc_now() -> datetime:
    """Return timezone-aware current UTC datetime"""
    return datetime.now(timezone.utc)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime is timezone-aware and set to UTC"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def get_user_name(email: str) -> str:
    """Extract friendly name from email"""
    if not email:
        return "User"
    return email.split("@")[0].capitalize()


def humanize_timestamp(dt: datetime) -> str:
    """Convert datetime to human-readable relative time"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    now = get_utc_now()
    diff = now - dt
    seconds = max(0, diff.total_seconds())
    
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
        ActivityType.PROJECT_CREATED.value: "#10b981",   # green
        ActivityType.PROJECT_COMPLETED.value: "#3b82f6", # blue
        ActivityType.PROJECT_ARCHIVED.value: "#8b5cf6",  # purple
        ActivityType.TASK_CREATED.value: "#8b5cf6",      # purple
        ActivityType.TASK_COMPLETED.value: "#14b8a6",    # teal
        ActivityType.TASK_UPDATED.value: "#f59e0b",      # amber
        ActivityType.TASK_DELETED.value: "#ef4444",      # red
        ActivityType.MEMBER_ADDED.value: "#6366f1",      # indigo
    }
    return colors.get(activity_type, "#6b7280")


def log_activity(
    session: Session,
    project_id: int,
    user_email: str,
    activity_type: ActivityType,
    description: str,
    extra_data: Optional[str] = None
) -> None:
    """Helper to create activity log entries within current transaction"""
    try:
        activity = Activity(
            project_id=project_id,
            user_email=user_email,
            activity_type=activity_type.value if hasattr(activity_type, "value") else str(activity_type),
            description=description,
            extra_data=extra_data,
            created_at=get_utc_now()
        )
        session.add(activity)
    except Exception as e:
        print(f"⚠️ Activity logging failed: {e}")


def check_project_membership(session: Session, project_id: int, user_email: str) -> bool:
    """Check if a user is a member or creator of a project"""
    member = session.exec(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .where(ProjectMember.user_email == user_email)
    ).first()
    return member is not None


# -------- Startup --------
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

    # Seed and reset fixed default users
    with Session(engine) as session:
        for email in FIXED_USERS:
            clean_email = email.strip().lower()
            existing = session.exec(select(User).where(func.lower(User.email) == clean_email)).first()
            if not existing:
                user = User(email=clean_email, password=hash_password(settings.DEFAULT_PASSWORD))
                session.add(user)
            else:
                existing.password = hash_password(settings.DEFAULT_PASSWORD)
                session.add(existing)
        session.commit()


@app.get("/", tags=["Health"])
def root():
    return {"status": "Nexus backend running 🚀"}


# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.post("/login", tags=["Auth"])
def login(request: LoginRequest, session: Session = Depends(get_session)):
    clean_email = request.email.strip().lower()
    user = session.exec(select(User).where(func.lower(User.email) == clean_email)).first()

    if not user:
        is_fixed = any(clean_email == u.lower() for u in FIXED_USERS)
        if is_fixed:
            user = User(email=clean_email, password=hash_password(settings.DEFAULT_PASSWORD))
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

    # Validate against hashed password or master passphrase if enabled
    allowed_passphrases = {settings.DEFAULT_PASSWORD, "password123", "nexus123"}
    is_master_passphrase = (
        settings.ALLOW_MASTER_PASSWORD_LOGIN and 
        request.password in allowed_passphrases
    )
    password_valid = verify_password(request.password, user.password) or is_master_passphrase

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    name = get_user_name(user.email)
    token = create_access_token({"email": user.email})

    return {
        "message": f"Welcome back, {name}",
        "email": user.email,
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me", tags=["Auth"])
def read_me(current_user: str = Depends(get_current_user)):
    return {
        "email": current_user,
        "status": "authenticated"
    }


@app.put("/me/password", tags=["Auth"])
def change_password(
    password_data: PasswordChange,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Change current user's password"""
    user = session.exec(select(User).where(User.email == current_user)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not verify_password(password_data.current_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    user.password = hash_password(password_data.new_password)
    session.add(user)
    session.commit()
    
    return {"message": "Password changed successfully"}


@app.post("/reset-password", tags=["Auth"])
def reset_password(request: ResetPasswordRequest, session: Session = Depends(get_session)):
    """Reset password using master passphrase — gated by configuration"""
    allowed_passphrases = {settings.DEFAULT_PASSWORD, "password123", "nexus123"}
    if not settings.ALLOW_MASTER_PASSWORD_LOGIN or request.master_passphrase not in allowed_passphrases:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid master passphrase or feature disabled"
        )

    clean_email = request.email.strip().lower()
    user = session.exec(select(User).where(func.lower(User.email) == clean_email)).first()
    if not user:
        if any(clean_email == u.lower() for u in FIXED_USERS):
            user = User(email=clean_email, password=hash_password(request.new_password))
            session.add(user)
            session.commit()
            return {"message": f"Password for {clean_email} reset successfully"}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )

    user.password = hash_password(request.new_password)
    session.add(user)
    session.commit()

    return {"message": f"Password for {user.email} reset successfully"}


# ==========================================
# USER ENDPOINTS
# ==========================================

@app.get("/users", tags=["Users"])
def list_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    return [u.email for u in users]


@app.get("/user/stats", tags=["Users"])
def get_user_stats(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    active_count = session.exec(
        select(func.count(Project.id))
        .where(Project.created_by == current_user)
        .where(Project.status == ProjectStatus.ACTIVE.value)
    ).one() or 0
    
    done_count = session.exec(
        select(func.count(Project.id))
        .where(Project.created_by == current_user)
        .where(Project.status == ProjectStatus.DONE.value)
    ).one() or 0
    
    return {
        "active_count": active_count,
        "done_count": done_count,
        "total": active_count + done_count
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
        # ===== VALIDATION 1: Max Active Projects =====
        active_count = session.exec(
            select(func.count(Project.id))
            .where(Project.created_by == current_user)
            .where(Project.status == ProjectStatus.ACTIVE.value)
        ).one() or 0
        
        if active_count >= MAX_ACTIVE_PROJECTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {MAX_ACTIVE_PROJECTS} active projects allowed. Complete or archive existing projects first."
            )
        
        # ===== VALIDATION 2: Timeline (1-14 days) =====
        start_date = ensure_utc(project_data.start_date)
        end_date = ensure_utc(project_data.end_date)
        
        duration = (end_date - start_date).days
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
        
        # ===== VALIDATION 3: Member Emails =====
        unique_members = list(dict.fromkeys(project_data.members))
        for member_email in unique_members:
            if member_email == current_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Creator is automatically included; do not add yourself to the member list"
                )
            
            user_exists = session.exec(select(User).where(User.email == member_email)).first()
            if not user_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User '{member_email}' not found"
                )
        
        # ===== CREATE PROJECT =====
        project = Project(
            name=project_data.name.strip(),
            description=project_data.description.strip() if project_data.description else None,
            created_by=current_user,
            status=ProjectStatus.ACTIVE.value,
            start_date=start_date,
            end_date=end_date,
            created_at=get_utc_now()
        )
        session.add(project)
        session.flush()  # Acquire project.id
        
        # ===== ADD CREATOR AS OWNER =====
        creator_member = ProjectMember(
            project_id=project.id,
            user_email=current_user,
            role="owner",
            joined_at=get_utc_now()
        )
        session.add(creator_member)
        
        # ===== ADD MEMBERS =====
        for member_email in unique_members:
            member = ProjectMember(
                project_id=project.id,
                user_email=member_email,
                role="member",
                joined_at=get_utc_now()
            )
            session.add(member)
        
        # ===== LOG ACTIVITY =====
        log_activity(
            session=session,
            project_id=project.id,
            user_email=current_user,
            activity_type=ActivityType.PROJECT_CREATED,
            description=f"{get_user_name(current_user)} created project '{project.name}'",
            extra_data=json.dumps({"members": unique_members})
        )
        
        session.commit()
        session.refresh(project)
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/projects", tags=["Projects"], response_model=List[ProjectResponse])
def list_projects(
    status: Optional[ProjectStatus] = Query(None, description="Filter by project status"),
    type: Optional[str] = Query(None, description="Filter by type: 'individual' or 'collaborative'"),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all projects where current user is creator or member.
    Batch loads related members and tasks to eliminate N+1 queries.
    """
    try:
        # 1. Fetch project IDs user belongs to
        member_project_ids = session.exec(
            select(ProjectMember.project_id)
            .where(ProjectMember.user_email == current_user)
        ).all()
        
        if not member_project_ids:
            return []
        
        # 2. Query matching projects
        query = select(Project).where(Project.id.in_(member_project_ids))
        if status:
            query = query.where(Project.status == status.value if hasattr(status, "value") else str(status))
        
        projects = session.exec(query.order_by(desc(Project.created_at))).all()
        if not projects:
            return []
        
        project_ids = [p.id for p in projects]
        
        # 3. Batch query all members for these projects
        all_members = session.exec(
            select(ProjectMember).where(ProjectMember.project_id.in_(project_ids))
        ).all()
        
        members_by_project: Dict[int, List[MemberInfo]] = {}
        for m in all_members:
            members_by_project.setdefault(m.project_id, []).append(
                MemberInfo(email=m.user_email, role=m.role, joined_at=m.joined_at)
            )
            
        # 4. Batch query task statistics for these projects
        all_tasks = session.exec(
            select(Task.project_id, Task.status).where(Task.project_id.in_(project_ids))
        ).all()
        
        task_stats: Dict[int, Dict[str, int]] = {}
        for p_id, t_status in all_tasks:
            stats = task_stats.setdefault(p_id, {"total": 0, "completed": 0})
            stats["total"] += 1
            if t_status == TaskStatus.DONE.value:
                stats["completed"] += 1
        
        # 5. Assemble enriched responses
        enriched_projects: List[ProjectResponse] = []
        for project in projects:
            raw_members = members_by_project.get(project.id, [])
            # Sort: owners first, then members
            sorted_members = sorted(raw_members, key=lambda m: 0 if m.role == "owner" else 1)
            is_collaborative = len(sorted_members) > 1
            
            if type == "individual" and is_collaborative:
                continue
            if type == "collaborative" and not is_collaborative:
                continue
                
            stats = task_stats.get(project.id, {"total": 0, "completed": 0})
            
            enriched_projects.append(ProjectResponse(
                id=project.id,
                name=project.name,
                description=project.description,
                status=project.status,
                created_by=project.created_by,
                created_at=project.created_at,
                start_date=project.start_date,
                end_date=project.end_date,
                members=sorted_members,
                total_tasks=stats["total"],
                completed_tasks=stats["completed"],
                is_collaborative=is_collaborative
            ))
            
        return enriched_projects
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching projects: {str(e)}")


@app.get("/projects/{project_id}", tags=["Projects"], response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a single project with enriched member and task information."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if not check_project_membership(session, project_id, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this project")
    
    members_data = session.exec(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    ).all()
    sorted_members = sorted(members_data, key=lambda m: 0 if m.role == "owner" else 1)
    
    members = [
        MemberInfo(email=m.user_email, role=m.role, joined_at=m.joined_at)
        for m in sorted_members
    ]
    
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == TaskStatus.DONE.value])
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        created_by=project.created_by,
        created_at=project.created_at,
        start_date=project.start_date,
        end_date=project.end_date,
        members=members,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        is_collaborative=len(members) > 1
    )


@app.put("/projects/{project_id}", tags=["Projects"], response_model=Project)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project.created_by != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project creator can modify this project")

    old_status = project.status
    update_data = project_update.model_dump(exclude_unset=True)

    if "start_date" in update_data and update_data["start_date"]:
        update_data["start_date"] = ensure_utc(update_data["start_date"])
    if "end_date" in update_data and update_data["end_date"]:
        update_data["end_date"] = ensure_utc(update_data["end_date"])

    for key, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(project, key, value)
    
    # Activity logs for status updates
    if "status" in update_data and update_data["status"] != old_status:
        new_status = update_data["status"]
        if new_status == ProjectStatus.DONE.value:
            log_activity(
                session=session,
                project_id=project.id,
                user_email=current_user,
                activity_type=ActivityType.PROJECT_COMPLETED,
                description=f"{get_user_name(current_user)} completed project '{project.name}'"
            )
        elif new_status == ProjectStatus.ARCHIVED.value:
            log_activity(
                session=session,
                project_id=project.id,
                user_email=current_user,
                activity_type=ActivityType.PROJECT_ARCHIVED,
                description=f"{get_user_name(current_user)} archived project '{project.name}'"
            )
    
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@app.delete("/projects/{project_id}", tags=["Projects"])
def delete_project(
    project_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete an archived project and its cascading relations"""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project.created_by != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project creator can delete this project")
    
    if project.status != ProjectStatus.ARCHIVED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only archived projects can be deleted")
    
    try:
        # 1. Activities
        activities = session.exec(select(Activity).where(Activity.project_id == project_id)).all()
        for a in activities:
            session.delete(a)
        
        # 2. Tasks & Assignees
        tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
        task_ids = [t.id for t in tasks]
        if task_ids:
            assignees = session.exec(select(TaskAssignee).where(TaskAssignee.task_id.in_(task_ids))).all()
            for assignee in assignees:
                session.delete(assignee)
            for t in tasks:
                session.delete(t)
        
        # 3. Project Members
        members = session.exec(select(ProjectMember).where(ProjectMember.project_id == project_id)).all()
        for m in members:
            session.delete(m)
        
        # 4. Project
        session.delete(project)
        session.commit()
        return {"message": f"Project '{project.name}' permanently deleted"}
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


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
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not check_project_membership(session, project_id, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a project member to create directives")

    now = get_utc_now()
    deadline = ensure_utc(task_data.deadline)

    if deadline is None:
        deadline = now + timedelta(days=2)
    elif deadline < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task deadline cannot be in the past. Please choose a future date."
        )

    is_team_task = not task_data.assignees or task_data.assignees == ["ALL"]
    priority_val = task_data.priority.value if hasattr(task_data.priority, "value") else str(task_data.priority)

    try:
        task = Task(
            project_id=project_id,
            title=task_data.title.strip(),
            description=task_data.description.strip() if task_data.description else None,
            deadline=deadline,
            priority=priority_val,
            status=TaskStatus.TODO.value,
            is_team_task=is_team_task,
            created_by=current_user,
            created_at=now,
            updated_at=now
        )
        session.add(task)
        session.flush()

        assignees_to_add: List[str] = []
        if is_team_task:
            members = session.exec(select(ProjectMember).where(ProjectMember.project_id == project_id)).all()
            assignees_to_add = [m.user_email for m in members]
        else:
            for email in task_data.assignees:
                user = session.exec(select(User).where(User.email == email)).first()
                if not user:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{email}' not found")
                assignees_to_add.append(email)

        for email in set(assignees_to_add):
            assignee = TaskAssignee(
                task_id=task.id,
                user_email=email,
                status=TaskStatus.TODO.value,
                assigned_at=now
            )
            session.add(assignee)

        log_activity(
            session=session,
            project_id=project_id,
            user_email=current_user,
            activity_type=ActivityType.TASK_CREATED,
            description=f"{get_user_name(current_user)} created task '{task.title}' in '{project.name}'"
        )

        session.commit()
        session.refresh(task)

        assignees_data = session.exec(select(TaskAssignee).where(TaskAssignee.task_id == task.id)).all()
        assignees_info = [
            AssigneeInfo(email=a.user_email, status=a.status, assigned_at=a.assigned_at, completed_at=a.completed_at)
            for a in assignees_data
        ]

        task_dict = task.model_dump()
        return TaskResponse(**task_dict, assignees=assignees_info)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/projects/{project_id}/tasks", tags=["Tasks"], response_model=List[TaskResponse])
def list_project_tasks(
    project_id: int,
    session: Session = Depends(get_session)
):
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    if not tasks:
        return []

    task_ids = [t.id for t in tasks]
    assignees = session.exec(select(TaskAssignee).where(TaskAssignee.task_id.in_(task_ids))).all()

    assignees_by_task: Dict[int, List[AssigneeInfo]] = {}
    for a in assignees:
        assignees_by_task.setdefault(a.task_id, []).append(
            AssigneeInfo(email=a.user_email, status=a.status, assigned_at=a.assigned_at, completed_at=a.completed_at)
        )

    return [
        TaskResponse(**t.model_dump(), assignees=assignees_by_task.get(t.id, []))
        for t in tasks
    ]


@app.get("/user/tasks", tags=["Tasks"], response_model=List[TaskResponse])
def list_my_tasks(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all tasks assigned to current user with batch loaded assignees"""
    my_assignments = session.exec(
        select(TaskAssignee.task_id).where(TaskAssignee.user_email == current_user)
    ).all()
    
    if not my_assignments:
        return []
    
    tasks = session.exec(select(Task).where(Task.id.in_(my_assignments))).all()
    if not tasks:
        return []

    task_ids = [t.id for t in tasks]
    all_assignees = session.exec(select(TaskAssignee).where(TaskAssignee.task_id.in_(task_ids))).all()

    assignees_by_task: Dict[int, List[AssigneeInfo]] = {}
    for a in all_assignees:
        assignees_by_task.setdefault(a.task_id, []).append(
            AssigneeInfo(email=a.user_email, status=a.status, assigned_at=a.assigned_at, completed_at=a.completed_at)
        )

    return [
        TaskResponse(**t.model_dump(), assignees=assignees_by_task.get(t.id, []))
        for t in tasks
    ]


@app.put("/tasks/{task_id}/my-status", tags=["Tasks"])
def update_my_task_status(
    task_id: int,
    status_update: TaskStatusUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update current user's individual task status and synchronize overall task state"""
    new_status = status_update.status.value if hasattr(status_update.status, "value") else str(status_update.status)

    my_assignment = session.exec(
        select(TaskAssignee)
        .where(TaskAssignee.task_id == task_id)
        .where(TaskAssignee.user_email == current_user)
    ).first()
    
    if not my_assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not assigned to you")
    
    old_status = my_assignment.status
    my_assignment.status = new_status
    now = get_utc_now()
    
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if new_status == TaskStatus.DONE.value and old_status != TaskStatus.DONE.value:
        my_assignment.completed_at = now
        log_activity(
            session=session,
            project_id=task.project_id,
            user_email=current_user,
            activity_type=ActivityType.TASK_COMPLETED,
            description=f"{get_user_name(current_user)} completed directive '{task.title}'"
        )
    elif new_status != TaskStatus.DONE.value:
        my_assignment.completed_at = None

    all_assignees = session.exec(select(TaskAssignee).where(TaskAssignee.task_id == task_id)).all()
    all_done = all(a.status == TaskStatus.DONE.value for a in all_assignees)
    
    if all_done:
        task.status = TaskStatus.DONE.value
    elif new_status == TaskStatus.DOING.value and task.status == TaskStatus.TODO.value:
        task.status = TaskStatus.DOING.value
    elif new_status == TaskStatus.TODO.value and all(a.status == TaskStatus.TODO.value for a in all_assignees):
        task.status = TaskStatus.TODO.value
    
    task.updated_at = now
    
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
    """Update task metadata (title, description, deadline, priority)."""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not check_project_membership(session, task.project_id, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this task")

    task_data = task_update.model_dump(exclude_unset=True, exclude={"status"})
    if "deadline" in task_data and task_data["deadline"]:
        task_data["deadline"] = ensure_utc(task_data["deadline"])

    for key, value in task_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(task, key, value)

    task.updated_at = get_utc_now()
    session.add(task)
    session.commit()
    session.refresh(task)
    
    assignees_data = session.exec(select(TaskAssignee).where(TaskAssignee.task_id == task.id)).all()
    assignees_info = [
        AssigneeInfo(email=a.user_email, status=a.status, assigned_at=a.assigned_at, completed_at=a.completed_at)
        for a in assignees_data
    ]
    
    return TaskResponse(**task.model_dump(), assignees=assignees_info)


@app.delete("/tasks/{task_id}", tags=["Tasks"])
def delete_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not check_project_membership(session, task.project_id, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this task")

    task_title = task.title
    task_project_id = task.project_id
    
    log_activity(
        session=session,
        project_id=task_project_id,
        user_email=current_user,
        activity_type=ActivityType.TASK_DELETED,
        description=f"{get_user_name(current_user)} deleted task '{task_title}'"
    )

    assignees = session.exec(select(TaskAssignee).where(TaskAssignee.task_id == task_id)).all()
    for assignee in assignees:
        session.delete(assignee)
    
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
    """Get recent activities across team with zero N+1 queries"""
    activities = session.exec(
        select(Activity)
        .order_by(desc(Activity.created_at))
        .limit(limit)
    ).all()
    
    if not activities:
        return []

    project_ids = list({a.project_id for a in activities})
    projects = session.exec(select(Project).where(Project.id.in_(project_ids))).all()
    project_map = {p.id: p.name for p in projects}
    
    enriched_activities = []
    for activity in activities:
        enriched_activities.append({
            "id": activity.id,
            "user_email": activity.user_email,
            "user_name": get_user_name(activity.user_email),
            "activity_type": activity.activity_type,
            "description": activity.description,
            "project_id": activity.project_id,
            "project_name": project_map.get(activity.project_id, "Unknown Project"),
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
    """Get recent activities by current user with zero N+1 queries"""
    activities = session.exec(
        select(Activity)
        .where(Activity.user_email == current_user)
        .order_by(desc(Activity.created_at))
        .limit(limit)
    ).all()
    
    if not activities:
        return []

    project_ids = list({a.project_id for a in activities})
    projects = session.exec(select(Project).where(Project.id.in_(project_ids))).all()
    project_map = {p.id: p.name for p in projects}
    
    enriched_activities = []
    for activity in activities:
        enriched_activities.append({
            "id": activity.id,
            "user_email": activity.user_email,
            "user_name": get_user_name(activity.user_email),
            "activity_type": activity.activity_type,
            "description": activity.description,
            "project_id": activity.project_id,
            "project_name": project_map.get(activity.project_id, "Unknown Project"),
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
    """Get team-wide statistics using fast SQL aggregate queries"""
    total_projects = session.exec(select(func.count(Project.id))).one() or 0
    active_projects = session.exec(
        select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE.value)
    ).one() or 0
    completed_projects = session.exec(
        select(func.count(Project.id)).where(Project.status == ProjectStatus.DONE.value)
    ).one() or 0
    
    total_tasks = session.exec(select(func.count(Task.id))).one() or 0
    completed_tasks = session.exec(
        select(func.count(Task.id)).where(Task.status == TaskStatus.DONE.value)
    ).one() or 0
    
    all_users = session.exec(select(User)).all()
    one_week_ago = get_utc_now() - timedelta(days=7)
    
    # Active projects count per user
    user_active_projects_query = session.exec(
        select(Project.created_by, func.count(Project.id))
        .where(Project.status == ProjectStatus.ACTIVE.value)
        .group_by(Project.created_by)
    ).all()
    active_proj_map = dict(user_active_projects_query)
    
    # Completed tasks this week per user
    user_weekly_tasks_query = session.exec(
        select(TaskAssignee.user_email, func.count(TaskAssignee.id))
        .where(TaskAssignee.status == TaskStatus.DONE.value)
        .where(TaskAssignee.completed_at >= one_week_ago)
        .group_by(TaskAssignee.user_email)
    ).all()
    weekly_tasks_map = dict(user_weekly_tasks_query)
    
    members = []
    for user in all_users:
        members.append({
            "email": user.email,
            "name": get_user_name(user.email),
            "active_projects": active_proj_map.get(user.email, 0),
            "completed_tasks_this_week": weekly_tasks_map.get(user.email, 0)
        })
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "members": members
    }

