from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

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

# -------- Database Models --------

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    status: str = Field(default=ProjectStatus.ACTIVE)
    collaborators: str = "[]"  # Stored as JSON string
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")

    title: str
    description: Optional[str] = None

    status: str = Field(default=TaskStatus.TODO)
    priority: str = Field(default=TaskPriority.MEDIUM)
    deadline: Optional[datetime] = None

    created_by: str
    assigned_to: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# -------- Pydantic DTOs (Data Transfer Objects) --------

class ProjectCreate(SQLModel):
    name: str
    collaborators: List[str] = []

class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    status: Optional[ProjectStatus] = None
    collaborators: Optional[List[str]] = None

class TaskCreate(SQLModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
