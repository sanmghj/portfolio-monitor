from fastapi import APIRouter, HTTPException, status

from app.schemas import User, UserCreate, UserEnterRequest
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/users", tags=["users"])
store = CsvStore()


@router.get("", response_model=list[User])
def list_users() -> list[User]:
    return store.read_users()


@router.post("", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate) -> User:
    existing_user = store.find_user_by_profile(payload.name, payload.birth_date.isoformat())
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="A user with the same name and birth date already exists")
    return store.create_user(payload)


@router.post("/enter", response_model=User)
def enter_user(payload: UserEnterRequest) -> User:
    user = store.find_user_by_profile(payload.name, payload.birth_date.isoformat())
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
