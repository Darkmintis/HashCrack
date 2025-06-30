#!/usr/bin/env python3
"""
Real-time Progress Tracker for Hash Cracking
WebSocket-based progress updates with ETA calculation
"""

import asyncio
import websockets
import json
import time
import threading
from typing import Dict, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import re

class CrackStatus(Enum):
    IDLE = "idle"
    IDENTIFYING = "identifying"
    CRACKING = "cracking"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class ProgressUpdate:
    hash_id: str
    status: CrackStatus
    progress_percent: float = 0.0
    current_wordlist: Optional[str] = None
    attempted_passwords: int = 0
    total_passwords: int = 0
    passwords_per_second: float = 0.0
    eta_seconds: Optional[int] = None
    engine: Optional[str] = None
    message: str = ""
    timestamp: float = 0.0

class RealTimeTracker:
    """Real-time progress tracking for hash cracking operations"""
    
    def __init__(self):
        self.active_sessions: Dict[str, ProgressUpdate] = {}
        self.websocket_clients = set()
        self.update_callbacks: Dict[str, Callable] = {}
    
    async def register_client(self, websocket, path):
        """Register a new WebSocket client"""
        self.websocket_clients.add(websocket)
        
        # Send current status to new client
        for session_id, progress in self.active_sessions.items():
            await self.send_to_client(websocket, progress)
        
        try:
            await websocket.wait_closed()
        finally:
            self.websocket_clients.remove(websocket)
    
    async def send_to_client(self, websocket, progress: ProgressUpdate):
        """Send progress update to a specific client"""
        try:
            message = json.dumps(asdict(progress))
            await websocket.send(message)
        except websockets.exceptions.ConnectionClosed:
            pass
    
    async def broadcast_update(self, progress: ProgressUpdate):
        """Broadcast progress update to all connected clients"""
        if self.websocket_clients:
            progress.timestamp = time.time()
            message = json.dumps(asdict(progress))
            
            # Remove disconnected clients
            disconnected = set()
            for websocket in self.websocket_clients:
                try:
                    await websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(websocket)
            
            self.websocket_clients -= disconnected
    
    def start_session(self, hash_id: str, hash_value: str) -> str:
        """Start a new cracking session"""
        progress = ProgressUpdate(
            hash_id=hash_id,
            status=CrackStatus.IDENTIFYING,
            message=f"Starting crack for hash: {hash_value[:16]}...",
            timestamp=time.time()
        )
        
        self.active_sessions[hash_id] = progress
        
        # Broadcast to all clients (async)
        asyncio.create_task(self.broadcast_update(progress))
        
        return hash_id
    
    def update_session(self, hash_id: str, **kwargs):
        """Update session progress"""
        if hash_id in self.active_sessions:
            progress = self.active_sessions[hash_id]
            
            # Update fields
            for key, value in kwargs.items():
                if hasattr(progress, key):
                    setattr(progress, key, value)
            
            # Calculate ETA if we have enough info
            if (progress.attempted_passwords > 0 and 
                progress.total_passwords > 0 and 
                progress.passwords_per_second > 0):
                
                remaining = progress.total_passwords - progress.attempted_passwords
                progress.eta_seconds = int(remaining / progress.passwords_per_second)
                progress.progress_percent = (progress.attempted_passwords / progress.total_passwords) * 100
            
            progress.timestamp = time.time()
            
            # Broadcast update
            asyncio.create_task(self.broadcast_update(progress))
            
            # Call registered callback if exists
            if hash_id in self.update_callbacks:
                self.update_callbacks[hash_id](progress)
    
    def complete_session(self, hash_id: str, success: bool, result: str = ""):
        """Mark session as completed"""
        if hash_id in self.active_sessions:
            progress = self.active_sessions[hash_id]
            progress.status = CrackStatus.COMPLETED if success else CrackStatus.FAILED
            progress.progress_percent = 100.0 if success else progress.progress_percent
            progress.message = result if success else "Cracking failed"
            progress.timestamp = time.time()
            
            # Broadcast final update
            asyncio.create_task(self.broadcast_update(progress))
    
    def cancel_session(self, hash_id: str):
        """Cancel a cracking session"""
        if hash_id in self.active_sessions:
            progress = self.active_sessions[hash_id]
            progress.status = CrackStatus.CANCELLED
            progress.message = "Cracking cancelled by user"
            progress.timestamp = time.time()
            
            # Broadcast cancellation
            asyncio.create_task(self.broadcast_update(progress))
            
            # Clean up
            if hash_id in self.update_callbacks:
                del self.update_callbacks[hash_id]
    
    def register_callback(self, hash_id: str, callback: Callable):
        """Register a callback for session updates"""
        self.update_callbacks[hash_id] = callback
    
    def get_session_status(self, hash_id: str) -> Optional[ProgressUpdate]:
        """Get current status of a session"""
        return self.active_sessions.get(hash_id)
    
    def get_all_sessions(self) -> Dict[str, ProgressUpdate]:
        """Get all active sessions"""
        return self.active_sessions.copy()

class JohnProgressParser:
    """Parse progress from John the Ripper output"""
    
    @staticmethod
    def parse_output(output: str) -> Dict:
        """Parse John output for progress information"""
        info = {}
        
        # Parse different John output patterns
        patterns = {
            'guesses': r'(\d+)g ',
            'time': r'(\d+:\d+:\d+:\d+)',
            'progress': r'(\d+\.\d+)%',
            'p/s': r'(\d+\.?\d*)p/s',
            'current': r'current:\s*(.+)',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, output)
            if match:
                if key == 'guesses':
                    info['cracked_count'] = int(match.group(1))
                elif key == 'progress':
                    info['progress_percent'] = float(match.group(1))
                elif key == 'p/s':
                    info['passwords_per_second'] = float(match.group(1))
                elif key == 'current':
                    info['current_password'] = match.group(1).strip()
        
        return info

class HashcatProgressParser:
    """Parse progress from Hashcat output"""
    
    @staticmethod
    def parse_output(output: str) -> Dict:
        """Parse Hashcat output for progress information"""
        info = {}
        
        # Hashcat status line parsing
        if "Status" in output:
            lines = output.strip().split('\n')
            for line in lines:
                if 'Progress' in line:
                    # Extract progress percentage
                    match = re.search(r'(\d+\.\d+)%', line)
                    if match:
                        info['progress_percent'] = float(match.group(1))
                
                elif 'Speed' in line:
                    # Extract speed
                    match = re.search(r'(\d+\.?\d*)\s*[kMG]?H/s', line)
                    if match:
                        speed = float(match.group(1))
                        # Convert to H/s if needed
                        if 'kH/s' in line:
                            speed *= 1000
                        elif 'MH/s' in line:
                            speed *= 1000000
                        elif 'GH/s' in line:
                            speed *= 1000000000
                        info['passwords_per_second'] = speed
                
                elif 'Time.Estimated' in line:
                    # Extract ETA
                    match = re.search(r'(\d+) days, (\d+):(\d+):(\d+)', line)
                    if match:
                        days, hours, minutes, seconds = map(int, match.groups())
                        total_seconds = days * 86400 + hours * 3600 + minutes * 60 + seconds
                        info['eta_seconds'] = total_seconds
        
        return info

class ProgressMonitor:
    """Monitor cracking process and update progress in real-time"""
    
    def __init__(self, tracker: RealTimeTracker):
        self.tracker = tracker
        self.active_processes: Dict[str, subprocess.Popen] = {}
    
    def monitor_john_process(self, hash_id: str, process: subprocess.Popen, 
                           wordlist_name: str):
        """Monitor John the Ripper process"""
        def monitor():
            try:
                self.tracker.update_session(
                    hash_id,
                    status=CrackStatus.CRACKING,
                    engine="john",
                    current_wordlist=wordlist_name,
                    message=f"Cracking with John using {wordlist_name}"
                )
                
                while process.poll() is None:
                    try:
                        # Send status signal to John
                        process.send_signal(1)  # SIGUSR1 for status
                        time.sleep(2)
                        
                        # Read any available output
                        if process.stderr:
                            output = process.stderr.read(1024).decode('utf-8', errors='ignore')
                            if output:
                                progress_info = JohnProgressParser.parse_output(output)
                                if progress_info:
                                    self.tracker.update_session(hash_id, **progress_info)
                    
                    except Exception:
                        pass
                    
                    time.sleep(5)  # Update every 5 seconds
                
                # Process completed
                return_code = process.returncode
                if return_code == 0:
                    self.tracker.complete_session(hash_id, True, "Hash cracked successfully!")
                else:
                    self.tracker.complete_session(hash_id, False, "Cracking process failed")
                    
            except Exception as e:
                self.tracker.complete_session(hash_id, False, f"Monitor error: {str(e)}")
        
        thread = threading.Thread(target=monitor)
        thread.daemon = True
        thread.start()
    
    def monitor_hashcat_process(self, hash_id: str, process: subprocess.Popen, 
                              wordlist_name: str):
        """Monitor Hashcat process"""
        def monitor():
            try:
                self.tracker.update_session(
                    hash_id,
                    status=CrackStatus.CRACKING,
                    engine="hashcat",
                    current_wordlist=wordlist_name,
                    message=f"Cracking with Hashcat using {wordlist_name}"
                )
                
                while process.poll() is None:
                    try:
                        # Send status signal to Hashcat
                        process.send_signal(12)  # SIGUSR2 for status
                        time.sleep(2)
                        
                        # Read status output
                        if process.stdout:
                            output = process.stdout.read(1024).decode('utf-8', errors='ignore')
                            if output:
                                progress_info = HashcatProgressParser.parse_output(output)
                                if progress_info:
                                    self.tracker.update_session(hash_id, **progress_info)
                    
                    except Exception:
                        pass
                    
                    time.sleep(5)  # Update every 5 seconds
                
                # Process completed
                return_code = process.returncode
                if return_code == 0:
                    self.tracker.complete_session(hash_id, True, "Hash cracked successfully!")
                else:
                    self.tracker.complete_session(hash_id, False, "Cracking process failed")
                    
            except Exception as e:
                self.tracker.complete_session(hash_id, False, f"Monitor error: {str(e)}")
        
        thread = threading.Thread(target=monitor)
        thread.daemon = True
        thread.start()

# WebSocket server
async def start_websocket_server(tracker: RealTimeTracker, port: int = 8765):
    """Start WebSocket server for real-time updates"""
    print(f"🌐 Starting WebSocket server on port {port}")
    
    async with websockets.serve(tracker.register_client, "localhost", port):
        await asyncio.Future()  # Run forever

# Example usage
if __name__ == "__main__":
    # Create tracker
    tracker = RealTimeTracker()
    
    # Start WebSocket server in background
    def run_websocket_server():
        asyncio.run(start_websocket_server(tracker))
    
    websocket_thread = threading.Thread(target=run_websocket_server)
    websocket_thread.daemon = True
    websocket_thread.start()
    
    # Simulate a cracking session
    hash_id = tracker.start_session("test123", "5d41402abc4b2a76b9719d911017c592")
    
    # Simulate progress updates
    for i in range(101):
        tracker.update_session(
            hash_id,
            progress_percent=i,
            attempted_passwords=i * 1000,
            total_passwords=100000,
            passwords_per_second=1500.0,
            message=f"Cracking in progress... {i}%"
        )
        time.sleep(0.1)
    
    tracker.complete_session(hash_id, True, "password123")
    
    print("Simulation complete. WebSocket server running...")
