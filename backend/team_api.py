from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime
import uuid

router = APIRouter()

# In-memory storage (replace with DB in production)
active_teams: Dict[str, dict] = {}
team_members: Dict[str, Dict[str, dict]] = {}

class CreateTeamRequest(BaseModel):
    team_name: str
    user_name: str

class JoinTeamRequest(BaseModel):
    team_id: str
    user_name: str

@router.post("/api/create_team")
def create_team(req: CreateTeamRequest):
    team_id = f"team_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    active_teams[team_id] = {
        'name': req.team_name,
        'created_at': datetime.now().isoformat(),
        'creator': req.user_name,
        'member_count': 1
    }
    if team_id not in team_members:
        team_members[team_id] = {}
    team_members[team_id][user_id] = {
        'name': req.user_name,
        'joined_at': datetime.now().isoformat(),
        'status': 'online'
    }
    return {
        'success': True,
        'team_id': team_id,
        'user_id': user_id,
        'message': f'Team "{req.team_name}" created successfully'
    }

@router.post("/api/join_team")
def join_team(req: JoinTeamRequest):
    team_id = req.team_id
    user_name = req.user_name
    if team_id not in active_teams:
        return {'error': 'Team not found'}, 404
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    if team_id not in team_members:
        team_members[team_id] = {}
    team_members[team_id][user_id] = {
        'name': user_name,
        'joined_at': datetime.now().isoformat(),
        'status': 'online'
    }
    active_teams[team_id]['member_count'] = len(team_members[team_id])
    return {
        'success': True,
        'team_id': team_id,
        'user_id': user_id,
        'team_name': active_teams[team_id]['name'],
        'message': f'Joined team "{active_teams[team_id]["name"]}"'
    }

@router.get("/api/team/{team_id}/members")
def get_team_members(team_id: str):
    if team_id not in active_teams:
        return {'error': 'Team not found'}, 404
    members = team_members.get(team_id, {})
    return {
        'team_name': active_teams[team_id]['name'],
        'members': list(members.values())
    }
