from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from pydantic import BaseModel
from app.jwt_utils import create_access_token
from app.db import engine, get_session
from app.models import User
from app.security import hash_password, verify_password
from app.dependencies import get_current_user
from app.models import Project, Task
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FIXED_USERS = [
    "nikhil@nutmeg.com",
    "jayasree@nutmeg.com",
    "nandana@nutmeg.com",
    "hafeez@nutmeg.com",
]

DEFAULT_PASSWORD = "nutmeg123"


# -------- Request Models --------
class LoginRequest(BaseModel):
    email: str
    password: str


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

    # Seed fixed users if not present
    with Session(engine) as session:
        for email in FIXED_USERS:
            existing = session.exec(
                select(User).where(User.email == email)
            ).first()

            if not existing:
                user = User(
                    email=email,
                    password=hash_password(DEFAULT_PASSWORD)
                )
                session.add(user)
        session.commit()


@app.get("/")
def root():
    return {"status": "Nutmeg backend running"}


# -------- LOGIN --------
@app.post("/login")
def login(request: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(User.email == request.email)
    ).first()

    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Extract name from email for friendly greeting
    name = request.email.split("@")[0].capitalize()
    token = create_access_token({"email": request.email})

    return {
        "message": f"Welcome back, {name}",
        "email": request.email,
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/me")
def read_me(current_user: str = Depends(get_current_user)):
    return {
        "email": current_user,
        "status": "authenticated"
    }
class ProjectCreate(BaseModel):
    name: str


@app.post("/projects")
def create_project(
    project_data: ProjectCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    project = Project(
        name=project_data.name,
        created_by=current_user
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    return project

@app.get("/users")
def list_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    # return list of emails for privacy/simplicity
    return [u.email for u in users]

class ProjectCreate(BaseModel):
    name: str
    collaborators: list[str] = []


@app.post("/projects")
def create_project(
    project_data: ProjectCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    import json
    project = Project(
        name=project_data.name,
        collaborators=json.dumps(project_data.collaborators),
        created_by=current_user
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    return project

@app.get("/projects")
def list_projects(
    status: str | None = None,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Project)
    if status:
        query = query.where(Project.status == status)
    
    projects = session.exec(query).all()
    return projects

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    assigned_to: str | None = None
    deadline: datetime | None = None
    priority: str = "medium"


@app.post("/projects/{project_id}/tasks")
def add_task(
    project_id: int,
    task_data: TaskCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = Task(
        project_id=project_id,
        title=task_data.title,
        description=task_data.description,
        assigned_to=task_data.assigned_to,
        deadline=task_data.deadline,
        priority=task_data.priority,
        created_by=current_user
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return task

@app.get("/projects/{project_id}/tasks")
def list_tasks(
    project_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tasks = session.exec(
        select(Task).where(Task.project_id == project_id)
    ).all()

    return tasks

@app.get("/user/stats")
def get_user_stats(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    active_projects = session.exec(
        select(Project).where(Project.created_by == current_user, Project.status == "active")
    ).all()
    
    done_projects = session.exec(
        select(Project).where(Project.created_by == current_user, Project.status == "done")
    ).all()
    
    return {
        "active_count": len(active_projects),
        "done_count": len(done_projects),
        "total": len(active_projects) + len(done_projects)
    }

@app.get("/user/tasks")
def get_my_tasks(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Fetch tasks assigned to the current user
    tasks = session.exec(
        select(Task).where(Task.assigned_to == current_user)
    ).all()
    return tasks
@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    status: str | None = None,
    assigned_to: str | None = None,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if title is not None:
        task.title = title
    if description is not None:
        task.description = description
    if status is not None:
        task.status = status
    if assigned_to is not None:
        task.assigned_to = assigned_to

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task
@app.delete("/tasks/{task_id}")
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
