from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from typing import List
from pydantic import BaseModel
import json
from datetime import datetime

# Local Imports
from app.jwt_utils import create_access_token
from app.db import engine, get_session

from app.security import hash_password, verify_password
from app.dependencies import get_current_user
from app.models import (
    User, 
    Project, ProjectStatus, ProjectCreate, ProjectUpdate,
    Task, TaskStatus, TaskPriority, TaskCreate, TaskUpdate
)

app = FastAPI(
    title="Nutmeg Backend",
    description="API for Nutmeg Project Management",
    version="1.0.0"
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


# -------- Request Models (Local) --------
class LoginRequest(BaseModel):
    email: str
    password: str


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

@app.get("/user/tasks", tags=["Users"])
def get_my_tasks(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Fetch tasks assigned to current user OR 'ALL'
    tasks = session.exec(
        select(Task).where((Task.assigned_to == current_user) | (Task.assigned_to == "ALL"))
    ).all()
    return tasks


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
        # Serialize collaborators list to JSON string for DB
        collabs_json = json.dumps(project_data.collaborators)
        print(f"DTO Received: {project_data}")
        print(f"JSON Collaborators: {collabs_json}")
        
        project = Project(
            name=project_data.name,
            collaborators=collabs_json,
            created_by=current_user,
            status=ProjectStatus.ACTIVE
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        return project
    except Exception as e:
        print(f"❌ Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects", tags=["Projects"], response_model=list[Project])
def list_projects(
    status: ProjectStatus | None = None,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Project)
    if status:
        query = query.where(Project.status == status)
    
    projects = session.exec(query).all()
    return projects


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

    project_data = project_update.dict(exclude_unset=True)
    for key, value in project_data.items():
        setattr(project, key, value)
    
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


# ==========================================
# TASK ENDPOINTS
# ==========================================

@app.post("/projects/{project_id}/tasks", tags=["Tasks"], response_model=List[Task])
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

    created_tasks = []

    # 1. Handle "ALL" Assignment (Clone Strategy)
    if task_data.assigned_to == "ALL":
        # Get collaborators
        import json
        try:
            collabs = json.loads(project.collaborators)
        except:
            collabs = []
        
        # If no collabs, maybe it means "Everyone in the system" or just Creator?
        # Let's assume it means Collaborators + Creator
        assignees = set(collabs)
        assignees.add(project.created_by)
        
        for email in assignees:
            task = Task(
                project_id=project_id,
                title=task_data.title,
                description=task_data.description,
                assigned_to=email, # Assign clone to individual
                deadline=task_data.deadline,
                priority=task_data.priority,
                status=TaskStatus.TODO,
                created_by=current_user
            )
            session.add(task)
            created_tasks.append(task)
            
    # 2. Handle Specific Assignment
    else:
        task = Task(
            project_id=project_id,
            title=task_data.title,
            description=task_data.description,
            assigned_to=task_data.assigned_to,
            deadline=task_data.deadline,
            priority=task_data.priority,
            status=TaskStatus.TODO,
            created_by=current_user
        )
        session.add(task)
        created_tasks.append(task)

    session.commit()
    for t in created_tasks:
        session.refresh(t)
        
    return created_tasks

@app.get("/projects/{project_id}/tasks", tags=["Tasks"], response_model=list[Task])
def list_tasks(
    project_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tasks = session.exec(
        select(Task).where(Task.project_id == project_id)
    ).all()
    return tasks

@app.put("/tasks/{task_id}", tags=["Tasks"], response_model=Task)
def update_task(
    task_id: int,
    task_update: TaskUpdate, 
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # PERMISSION CHECK:
    # Only allow status update if assigned to user OR created by user
    if task_update.status:
        if task.assigned_to and task.assigned_to != current_user and task.created_by != current_user:
             raise HTTPException(status_code=403, detail="You can only move your own tasks")

    # Update only provided fields
    task_data = task_update.dict(exclude_unset=True)
    for key, value in task_data.items():
        setattr(task, key, value)

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@app.delete("/tasks/{task_id}", tags=["Tasks"])
def delete_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()
    return {"message": "Task removed 🌱"}
