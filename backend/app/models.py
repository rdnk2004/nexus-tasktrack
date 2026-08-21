from sqlmodel import SQLModel, Field, UniqueConstraint
from sqlalchemy import Index
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, ConfigDict

def get_utc_now() -> datetime:
    """Return timezone-aware current UTC datetime"""
    return datetime.now(timezone.utc)

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
    PROJECT_ARCHIVED = "project_archived"
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    MEMBER_ADDED = "member_added"

# -------- Database Models --------

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str

class Project(SQLModel, table=True):
    __table_args__ = (
        Index("ix_project_status", "status"),
        Index("ix_project_created_by", "created_by"),
        Index("ix_project_created_at", "created_at"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    status: str = Field(default=ProjectStatus.ACTIVE, index=True)
    created_by: str = Field(index=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    
    # Timeline fields for validation
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # Backward compatibility
    collaborators: str = Field(default="[]")

class ProjectMember(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("project_id", "user_email", name="uq_project_member"),
        Index("ix_project_member_user", "user_email"),
        Index("ix_project_member_project", "project_id"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    user_email: str = Field(index=True)
    role: str = Field(default="member")  # "owner" or "member"
    joined_at: datetime = Field(default_factory=get_utc_now)

class Task(SQLModel, table=True):
    __table_args__ = (
        Index("ix_task_project_id", "project_id"),
        Index("ix_task_status", "status"),
        Index("ix_task_created_by", "created_by"),
        Index("ix_task_deadline", "deadline"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)

    title: str
    description: Optional[str] = None

    status: str = Field(default=TaskStatus.TODO, index=True)
    priority: str = Field(default=TaskPriority.MEDIUM)
    deadline: Optional[datetime] = Field(default=None, index=True)

    created_by: str = Field(index=True)
    is_team_task: bool = Field(default=False)

    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

class TaskAssignee(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("task_id", "user_email", name="uq_task_assignee"),
        Index("ix_task_assignee_task", "task_id"),
        Index("ix_task_assignee_user", "user_email"),
        Index("ix_task_assignee_status", "status"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True)
    user_email: str = Field(index=True)
    status: str = Field(default=TaskStatus.TODO)
    assigned_at: datetime = Field(default_factory=get_utc_now)
    completed_at: Optional[datetime] = None

class Activity(SQLModel, table=True):
    __table_args__ = (
        Index("ix_activity_project_id", "project_id"),
        Index("ix_activity_user_email", "user_email"),
        Index("ix_activity_created_at", "created_at"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    user_email: str = Field(index=True)
    activity_type: str  # Use ActivityType enum values
    description: str
    extra_data: Optional[str] = None  # JSON string for additional metadata
    created_at: datetime = Field(default_factory=get_utc_now)

# -------- Pydantic DTOs (Data Transfer Objects) --------

class ProjectCreate(SQLModel):
    name: str
    description: Optional[str] = None
    members: List[str] = []
    start_date: datetime
    end_date: datetime

class PasswordChange(SQLModel):
    current_password: str
    new_password: str

class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class TaskCreate(SQLModel):
    title: str
    description: Optional[str] = None
    assignees: List[str] = []
    deadline: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriority] = None

class TaskStatusUpdate(SQLModel):
    status: TaskStatus

# -------- Response DTOs (for enriched API responses) --------

class MemberInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    email: str
    role: str
    joined_at: datetime

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_by: str
    created_at: datetime
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # Enriched data
    members: List[MemberInfo]
    total_tasks: int
    completed_tasks: int
    is_collaborative: bool

class AssigneeInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    email: str
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    deadline: Optional[datetime] = None
    created_by: str
    is_team_task: bool
    created_at: datetime
    updated_at: datetime
    
    # Enriched data
    assignees: List[AssigneeInfo]

