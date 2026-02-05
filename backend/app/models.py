from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

# -------- Enums for strict validation --------

class ProjectStatus(str, Enum):
    ACTIVE = "active"
    DONE = "done"
    ARCHIVED = "archived"

class TaskStatus(str, Enum):
    TODO = "todo"
    DOING = "doing"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ActivityType(str, Enum):
    PROJECT_CREATED = "project_created"
    PROJECT_COMPLETED = "project_completed"
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    MEMBER_ADDED = "member_added"

# -------- Database Models --------

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None  # Project description (optional)
    status: str = Field(default=ProjectStatus.ACTIVE)
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # NEW: Timeline fields for validation
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # DEPRECATED: Old collaborators field (kept for backward compatibility)
    collaborators: str = "[]"

# NEW: Junction table for many-to-many Project-User relationship
class ProjectMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    user_email: str
    role: str = Field(default="member")  # "owner" or "member"
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")

    title: str
    description: Optional[str] = None

    status: str = Field(default=TaskStatus.TODO)
    priority: str = Field(default=TaskPriority.MEDIUM)
    deadline: Optional[datetime] = None

    created_by: str
    
    # Flag to indicate if this is a team-wide task
    is_team_task: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# NEW: Junction table for many-to-many Task-User assignment
class TaskAssignee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    user_email: str
    status: str = Field(default=TaskStatus.TODO)  # Individual status for this assignee
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# NEW: Activity tracking for dashboard/feed
class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    user_email: str
    activity_type: str  # Use ActivityType enum values
    description: str
    extra_data: Optional[str] = None  # JSON string for additional data
    created_at: datetime = Field(default_factory=datetime.utcnow)

# -------- Pydantic DTOs (Data Transfer Objects) --------

class ProjectCreate(SQLModel):
    name: str
    description: Optional[str] = None  # Optional project description
    members: List[str] = []  # List of collaborator emails (creator auto-added)
    start_date: datetime  # Required for timeline validation
    end_date: datetime    # Required for timeline validation

class PasswordChange(SQLModel):
    current_password: str
    new_password: str

class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class TaskCreate(SQLModel):
    title: str
    description: Optional[str] = None
    assignees: List[str] = []  # List of email addresses, or ["ALL"] for all members
    deadline: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriority] = None

class TaskStatusUpdate(SQLModel):
    """DTO for updating individual assignee status"""
    status: TaskStatus

# -------- Response DTOs (for enriched API responses) --------

class MemberInfo(BaseModel):
    """Member information for project response"""
    email: str
    role: str  # "owner" or "member"
    joined_at: datetime

class ProjectResponse(BaseModel):
    """Enriched project response with members and task stats"""
    id: int
    name: str
    description: Optional[str] = None  # Project description
    status: str
    created_by: str
    created_at: datetime
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    
    # Enriched data
    members: List[MemberInfo]
    total_tasks: int
    completed_tasks: int
    is_collaborative: bool  # True if has members beyond creator
    
    class Config:
        from_attributes = True

class AssigneeInfo(BaseModel):
    """Assignee information for task response"""
    email: str
    status: str  # Individual status for this assignee
    assigned_at: datetime
    completed_at: Optional[datetime]

class TaskResponse(BaseModel):
    """Enriched task response with assignee information"""
    id: int
    project_id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    deadline: Optional[datetime]
    created_by: str
    is_team_task: bool
    created_at: datetime
    updated_at: datetime
    
    # Enriched data
    assignees: List[AssigneeInfo]
    
    class Config:
        from_attributes = True
