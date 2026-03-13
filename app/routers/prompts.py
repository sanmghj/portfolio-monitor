from fastapi import APIRouter, HTTPException, Response, status

from app.schemas import Prompt, PromptCreate, PromptUpdate
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/users/{user_id}/prompts", tags=["prompts"])
store = CsvStore()


@router.get("", response_model=list[Prompt])
def list_prompts(user_id: int) -> list[Prompt]:
    if not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return store.read_prompts(user_id=user_id)


@router.post("", response_model=Prompt, status_code=status.HTTP_201_CREATED)
def create_prompt(user_id: int, payload: PromptCreate) -> Prompt:
    if not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    if payload.portfolio_id is not None and store.get_portfolio(user_id=user_id, portfolio_id=payload.portfolio_id) is None:
        raise HTTPException(status_code=400, detail="Portfolio does not belong to the user")
    return store.create_prompt(user_id=user_id, payload=payload)


@router.put("/{prompt_id}", response_model=Prompt)
def update_prompt(user_id: int, prompt_id: int, payload: PromptUpdate) -> Prompt:
    if payload.portfolio_id is not None and store.get_portfolio(user_id=user_id, portfolio_id=payload.portfolio_id) is None:
        raise HTTPException(status_code=400, detail="Portfolio does not belong to the user")
    updated = store.update_prompt(user_id=user_id, prompt_id=prompt_id, payload=payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return updated


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(user_id: int, prompt_id: int) -> Response:
    deleted = store.delete_prompt(user_id=user_id, prompt_id=prompt_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
