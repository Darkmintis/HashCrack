#!/usr/bin/env python3
"""
HashCrack Enhanced Web Interface
Professional team collaboration interface with P2P support
"""

from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os
import json
import tempfile
import logging
import asyncio
import threading
import time
import secrets
from pathlib import Path
from typing import Dict, List, Optional

# Import our modules
from hashcrack import HashCrack
from hashcrack.engine import EnhancedHashEngine, HashInfo, P2PHashCracker
from team_wordlists import TeamWordlistManager
from wordlist_manager import WordlistManager

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['DEBUG'] = True
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# Enable CORS and SocketIO
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global instances
hash_engine = EnhancedHashEngine()
active_teams: Dict[str, P2PHashCracker] = {}
active_sessions: Dict[str, Dict] = {}

# Ensure directories exist
os.makedirs('wordlists', exist_ok=True)
os.makedirs('team_wordlists', exist_ok=True)
os.makedirs('sessions', exist_ok=True)

@app.route('/')
def index():
    """Render the enhanced main page"""
    return render_template('enhanced_index.html')

@app.route('/api/create_team', methods=['POST'])
def create_team():
    """Create a new team room"""
    try:
        data = request.get_json()
        team_name = data.get('team_name', '').strip()
        user_name = data.get('user_name', '').strip()
        
        if not team_name or not user_name:
            return jsonify({"success": False, "error": "Team name and user name are required"}), 400
        
        # Generate team ID
        team_id = f"team_{int(time.time())}_{secrets.token_hex(4)}"
        user_id = f"user_{secrets.token_hex(6)}"
        
        # Create team session
        session_data = {
            "team_id": team_id,
            "team_name": team_name,
            "user_id": user_id,
            "user_name": user_name,
            "role": "admin",
            "created_at": time.time(),
            "members": [{"user_id": user_id, "user_name": user_name, "role": "admin", "joined_at": time.time()}]
        }
        
        # Initialize team components
        team_cracker = P2PHashCracker(team_id, user_id)
        team_wordlists = TeamWordlistManager(team_id, user_id)
        
        active_teams[team_id] = team_cracker
        active_sessions[user_id] = session_data
        
        # Save session data
        session_file = Path('sessions') / f"{team_id}.json"
        with open(session_file, 'w') as f:
            json.dump(session_data, f, indent=2)
        
        logger.info(f"[TEAM] Created team '{team_name}' (ID: {team_id}) by {user_name}")
        
        return jsonify({
            "success": True,
            "team_id": team_id,
            "user_id": user_id,
            "team_name": team_name,
            "user_name": user_name,
            "role": "admin"
        })
        
    except Exception as e:
        logger.error(f"Error creating team: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/join_team', methods=['POST'])
def join_team():
    """Join an existing team room"""
    try:
        data = request.get_json()
        team_id = data.get('team_id', '').strip()
        user_name = data.get('user_name', '').strip()
        
        if not team_id or not user_name:
            return jsonify({"success": False, "error": "Team ID and user name are required"}), 400
        
        # Check if team exists
        session_file = Path('sessions') / f"{team_id}.json"
        if not session_file.exists():
            return jsonify({"success": False, "error": "Team not found"}), 404
        
        # Load team data
        with open(session_file, 'r') as f:
            team_data = json.load(f)
        
        # Generate user ID
        user_id = f"user_{secrets.token_hex(6)}"
        
        # Add user to team
        new_member = {
            "user_id": user_id, 
            "user_name": user_name, 
            "role": "member", 
            "joined_at": time.time()
        }
        team_data["members"].append(new_member)
        
        # Update session
        user_session = {
            "team_id": team_id,
            "team_name": team_data["team_name"],
            "user_id": user_id,
            "user_name": user_name,
            "role": "member",
            "joined_at": time.time()
        }
        
        active_sessions[user_id] = user_session
        
        # Save updated team data
        with open(session_file, 'w') as f:
            json.dump(team_data, f, indent=2)
        
        # Initialize team cracker if not exists
        if team_id not in active_teams:
            active_teams[team_id] = P2PHashCracker(team_id, user_id)
        
        logger.info(f"[TEAM] User '{user_name}' joined team '{team_data['team_name']}' (ID: {team_id})")
        
        return jsonify({
            "success": True,
            "team_id": team_id,
            "user_id": user_id,
            "team_name": team_data["team_name"],
            "user_name": user_name,
            "role": "member",
            "members": team_data["members"]
        })
        
    except Exception as e:
        logger.error(f"Error joining team: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/team_wordlists/<team_id>')
def get_team_wordlists(team_id):
    """Get wordlists available to a team"""
    try:
        # Get user session
        user_id = request.args.get('user_id')
        if not user_id or user_id not in active_sessions:
            return jsonify({"success": False, "error": "Invalid session"}), 401
        
        session_data = active_sessions[user_id]
        if session_data['team_id'] != team_id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Get team wordlists
        wordlist_manager = TeamWordlistManager(team_id, user_id)
        wordlists = wordlist_manager.get_team_wordlists()
        
        return jsonify({
            "success": True,
            "wordlists": wordlists
        })
        
    except Exception as e:
        logger.error(f"Error getting team wordlists: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/upload_team_wordlist', methods=['POST'])
def upload_team_wordlist():
    """Upload a wordlist to team storage"""
    try:
        # Get form data
        team_id = request.form.get('team_id')
        user_id = request.form.get('user_id')
        name = request.form.get('name', '')
        description = request.form.get('description', '')
        category = request.form.get('category', 'custom')
        
        # Validate session
        if not user_id or user_id not in active_sessions:
            return jsonify({"success": False, "error": "Invalid session"}), 401
        
        session_data = active_sessions[user_id]
        if session_data['team_id'] != team_id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Check file
        if 'wordlist' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['wordlist']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        # Save file temporarily
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as tmp:
                file.save(tmp.name)
                temp_path = tmp.name
            
            # Upload to team storage
            wordlist_manager = TeamWordlistManager(team_id, user_id)
            result = wordlist_manager.upload_wordlist(
                temp_path, 
                name or file.filename, 
                description, 
                category
            )
            
            # Notify team members via WebSocket
            if result["success"]:
                socketio.emit('wordlist_uploaded', {
                    "wordlist_name": name or file.filename,
                    "uploader": session_data["user_name"],
                    "category": category,
                    "description": description
                }, room=team_id)
            
            return jsonify(result)
            
        finally:
            # Clean up temp file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except Exception as e:
        logger.error(f"Error uploading team wordlist: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/identify_hash', methods=['POST'])
def identify_hash():
    """Enhanced hash identification with yescrypt support"""
    try:
        data = request.get_json()
        hash_value = data.get('hash', '').strip()
        
        if not hash_value:
            return jsonify({"success": False, "error": "No hash provided"}), 400
        
        # Use enhanced engine for identification
        hash_engine.load_cache()
        results = hash_engine.identify_hash_advanced(hash_value)
        
        identification_data = []
        for result in results[:5]:  # Top 5 results
            identification_data.append({
                "hash_type": result.hash_type,
                "confidence": result.confidence,
                "john_format": result.john_format,
                "hashcat_mode": result.hashcat_mode,
                "strength": hash_engine.hash_formats.get(result.hash_type, {}).get("strength", "unknown")
            })
        
        # Special handling for yescrypt
        yescrypt_info = None
        if hash_engine.is_yescrypt_hash(hash_value):
            yescrypt_info = hash_engine.get_yescrypt_info(hash_value)
        
        return jsonify({
            "success": True,
            "hash_value": hash_value,
            "identifications": identification_data,
            "yescrypt_info": yescrypt_info,
            "is_yescrypt": hash_engine.is_yescrypt_hash(hash_value)
        })
        
    except Exception as e:
        logger.error(f"Error identifying hash: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/crack_hash', methods=['POST'])
def crack_hash():
    """Enhanced hash cracking with team collaboration"""
    try:
        data = request.get_json()
        hash_value = data.get('hash', '').strip()
        team_id = data.get('team_id')
        user_id = data.get('user_id')
        selected_wordlists = data.get('wordlists', [])
        crack_mode = data.get('mode', 'solo')  # solo, team, or distributed
        
        if not hash_value:
            return jsonify({"success": False, "error": "No hash provided"}), 400
        
        # Validate session for team mode
        if crack_mode in ['team', 'distributed'] and team_id:
            if not user_id or user_id not in active_sessions:
                return jsonify({"success": False, "error": "Invalid session"}), 401
            
            session_data = active_sessions[user_id]
            if session_data['team_id'] != team_id:
                return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        # Identify hash first
        hash_results = hash_engine.identify_hash_advanced(hash_value)
        if not hash_results:
            return jsonify({"success": False, "error": "Could not identify hash type"}), 400
        
        best_match = hash_results[0]
        
        # Get optimal wordlists
        if team_id and selected_wordlists:
            wordlist_manager = TeamWordlistManager(team_id, user_id)
            wordlist_paths = []
            for wl_id in selected_wordlists:
                team_wordlists = wordlist_manager.get_team_wordlists()
                for wl in team_wordlists:
                    if wl['id'] == wl_id and wl.get('path'):
                        wordlist_paths.append(wl['path'])
        else:
            # Use default wordlists
            wordlist_paths = ['wordlists/common.txt']
        
        if crack_mode == 'distributed' and team_id in active_teams:
            # Create distributed cracking job
            team_cracker = active_teams[team_id]
            job_id = asyncio.run(team_cracker.create_cracking_job(
                best_match, wordlist_paths, "distributed"
            ))
            
            # Notify team via WebSocket
            socketio.emit('job_created', {
                "job_id": job_id,
                "hash_type": best_match.hash_type,
                "created_by": session_data["user_name"]
            }, room=team_id)
            
            return jsonify({
                "success": True,
                "mode": "distributed",
                "job_id": job_id,
                "hash_type": best_match.hash_type,
                "message": "Distributed cracking job created"
            })
        else:
            # Solo cracking
            result = hash_engine.crack_hash_smart(best_match, wordlist_paths)
            
            return jsonify({
                "success": result.success,
                "mode": "solo",
                "hash_type": best_match.hash_type,
                "plaintext": result.plaintext,
                "time_taken": result.time_taken,
                "engine_used": result.engine_used,
                "error": result.error
            })
        
    except Exception as e:
        logger.error(f"Error cracking hash: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"[WEBSOCKET] Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to HashCrack server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"[WEBSOCKET] Client disconnected: {request.sid}")

@socketio.on('join_team_room')
def handle_join_team(data):
    """Handle joining team room"""
    try:
        team_id = data.get('team_id')
        user_id = data.get('user_id')
        
        if user_id in active_sessions:
            session_data = active_sessions[user_id]
            if session_data['team_id'] == team_id:
                join_room(team_id)
                emit('joined_team', {
                    'team_id': team_id,
                    'team_name': session_data['team_name'],
                    'user_name': session_data['user_name']
                })
                
                # Notify other team members
                emit('member_joined', {
                    'user_name': session_data['user_name'],
                    'user_id': user_id
                }, room=team_id, include_self=False)
                
                logger.info(f"[WEBSOCKET] User {session_data['user_name']} joined team room {team_id}")
            else:
                emit('error', {'message': 'Unauthorized team access'})
        else:
            emit('error', {'message': 'Invalid session'})
            
    except Exception as e:
        logger.error(f"Error joining team room: {e}")
        emit('error', {'message': str(e)})

@socketio.on('leave_team_room')
def handle_leave_team(data):
    """Handle leaving team room"""
    try:
        team_id = data.get('team_id')
        user_id = data.get('user_id')
        
        if user_id in active_sessions:
            session_data = active_sessions[user_id]
            leave_room(team_id)
            
            # Notify other team members
            emit('member_left', {
                'user_name': session_data['user_name'],
                'user_id': user_id
            }, room=team_id)
            
            logger.info(f"[WEBSOCKET] User {session_data['user_name']} left team room {team_id}")
            
    except Exception as e:
        logger.error(f"Error leaving team room: {e}")

if __name__ == '__main__':
    print("[INFO] Starting HashCrack Enhanced Web Interface")
    print(f"[INFO] Server will be available at: http://localhost:5000")
    print(f"[INFO] Features: Team collaboration, P2P cracking, yescrypt support")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
