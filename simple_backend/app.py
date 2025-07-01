#!/usr/bin/env python3
"""
HashCrack Simple Backend
Minimal Flask app for team coordination only - no heavy computation
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import uuid
import time
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

# Enable CORS for GitHub Pages
CORS(app, origins=["*"])
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage (no database needed)
active_teams = {}
team_members = {}

@app.route('/')
def home():
    """Simple health check"""
    return jsonify({
        'status': 'HashCrack Backend Running',
        'purpose': 'Team coordination only - hash cracking happens on client',
        'active_teams': len(active_teams)
    })

@app.route('/api/create_team', methods=['POST'])
def create_team():
    """Create a new team room"""
    data = request.get_json()
    team_name = data.get('team_name', '').strip()
    user_name = data.get('user_name', '').strip()
    
    if not team_name or not user_name:
        return jsonify({'error': 'Team name and user name required'}), 400
    
    # Generate team ID
    team_id = f"team_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Store team
    active_teams[team_id] = {
        'name': team_name,
        'created_at': datetime.now().isoformat(),
        'creator': user_name,
        'member_count': 1
    }
    
    # Store team member
    if team_id not in team_members:
        team_members[team_id] = {}
    
    team_members[team_id][user_id] = {
        'name': user_name,
        'joined_at': datetime.now().isoformat(),
        'status': 'online'
    }
    
    return jsonify({
        'success': True,
        'team_id': team_id,
        'user_id': user_id,
        'message': f'Team "{team_name}" created successfully'
    })

@app.route('/api/join_team', methods=['POST'])
def join_team():
    """Join an existing team"""
    data = request.get_json()
    team_id = data.get('team_id', '').strip()
    user_name = data.get('user_name', '').strip()
    
    if not team_id or not user_name:
        return jsonify({'error': 'Team ID and user name required'}), 400
    
    if team_id not in active_teams:
        return jsonify({'error': 'Team not found'}), 404
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Add member to team
    if team_id not in team_members:
        team_members[team_id] = {}
    
    team_members[team_id][user_id] = {
        'name': user_name,
        'joined_at': datetime.now().isoformat(),
        'status': 'online'
    }
    
    active_teams[team_id]['member_count'] = len(team_members[team_id])
    
    return jsonify({
        'success': True,
        'team_id': team_id,
        'user_id': user_id,
        'team_name': active_teams[team_id]['name'],
        'message': f'Joined team "{active_teams[team_id]["name"]}"'
    })

@app.route('/api/team/<team_id>/members')
def get_team_members(team_id):
    """Get team members"""
    if team_id not in active_teams:
        return jsonify({'error': 'Team not found'}), 404
    
    members = team_members.get(team_id, {})
    return jsonify({
        'team_name': active_teams[team_id]['name'],
        'members': list(members.values())
    })

# WebSocket events for real-time team coordination
@socketio.on('join_team_room')
def handle_join_team(data):
    """Join team WebSocket room"""
    team_id = data.get('team_id')
    user_id = data.get('user_id')
    
    if team_id and user_id:
        join_room(team_id)
        emit('user_joined', {
            'user_id': user_id,
            'message': f'User {user_id} joined the team'
        }, room=team_id)

@socketio.on('leave_team_room')
def handle_leave_team(data):
    """Leave team WebSocket room"""
    team_id = data.get('team_id')
    user_id = data.get('user_id')
    
    if team_id and user_id:
        leave_room(team_id)
        emit('user_left', {
            'user_id': user_id,
            'message': f'User {user_id} left the team'
        }, room=team_id)

@socketio.on('hash_cracked')
def handle_hash_cracked(data):
    """Share cracked hash with team"""
    team_id = data.get('team_id')
    hash_value = data.get('hash')
    password = data.get('password')
    user_name = data.get('user_name', 'Anonymous')
    
    if team_id and hash_value and password:
        emit('team_hash_cracked', {
            'hash': hash_value,
            'password': password,
            'cracked_by': user_name,
            'timestamp': datetime.now().isoformat()
        }, room=team_id)

@socketio.on('team_chat')
def handle_team_chat(data):
    """Team chat message"""
    team_id = data.get('team_id')
    message = data.get('message')
    user_name = data.get('user_name', 'Anonymous')
    
    if team_id and message:
        emit('chat_message', {
            'user_name': user_name,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, room=team_id)

if __name__ == '__main__':
    # For development
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
    
    # For production (Render will use this)
    # socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
