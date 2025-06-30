#!/usr/bin/env python3
"""
Team Wordlist Sharing System
P2P wordlist distribution and management for collaborative hash cracking
"""

import os
import json
import hashlib
import asyncio
import websockets
import base64
import re
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import time
import threading
from urllib.parse import urlparse

@dataclass
class TeamWordlist:
    name: str
    size: int
    checksum: str
    upload_time: float
    uploader: str
    description: str = ""
    category: str = "custom"
    chunks: int = 0
    
@dataclass
class WordlistChunk:
    wordlist_id: str
    chunk_id: int
    data: str  # Base64 encoded
    total_chunks: int

class TeamWordlistManager:
    """Manages shared wordlists for team collaboration"""
    
    def __init__(self, team_id: str, user_id: str, storage_dir: str = "team_wordlists"):
        self.team_id = team_id
        self.user_id = user_id
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        
        self.shared_wordlists: Dict[str, TeamWordlist] = {}
        self.popular_wordlists = self._get_popular_wordlists()
        self.websocket_clients: Set = set()
        
        # Load existing wordlists
        self._load_team_wordlists()
    
    def _get_popular_wordlists(self) -> List[Dict[str, str]]:
        """Get list of most popular wordlists for CTF and security testing"""
        return [
            {
                "name": "rockyou.txt",
                "url": "https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt",
                "size_mb": 133,
                "description": "Most common passwords (14M entries)",
                "category": "passwords",
                "priority": 10
            },
            {
                "name": "SecLists-Passwords-Common.txt", 
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-1000000.txt",
                "size_mb": 8.3,
                "description": "Top 1M passwords from SecLists",
                "category": "passwords", 
                "priority": 9
            },
            {
                "name": "CTF-Passwords.txt",
                "url": "https://raw.githubusercontent.com/xajkep/wordlists/master/ctf_passwords.txt",
                "size_mb": 0.1,
                "description": "Common CTF passwords and flags",
                "category": "ctf",
                "priority": 8
            },
            {
                "name": "CTF-Common.txt",
                "url": "https://raw.githubusercontent.com/kkrypt0nn/wordlists/main/wordlists/passwords/ctf.txt", 
                "size_mb": 0.05,
                "description": "CTF-specific wordlist",
                "category": "ctf",
                "priority": 8
            },
            {
                "name": "darkweb2017-top1000.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/darkweb2017-top1000.txt",
                "size_mb": 0.01,
                "description": "Top 1000 from darkweb data breach",
                "category": "passwords",
                "priority": 7
            },
            {
                "name": "probable-v2-top1575.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/probable-v2-top1575.txt",
                "size_mb": 0.02,
                "description": "Statistically probable passwords",
                "category": "passwords",
                "priority": 7
            },
            {
                "name": "Common-Names.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Usernames/Names/names.txt",
                "size_mb": 0.7,
                "description": "Common first names worldwide",
                "category": "names",
                "priority": 6
            },
            {
                "name": "Years-1950-2030.txt", 
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/4-digits-0000-9999.txt",
                "size_mb": 0.04,
                "description": "Years and 4-digit numbers",
                "category": "numbers",
                "priority": 6
            },
            {
                "name": "Tech-Terms.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/directory-list-2.3-small.txt",
                "size_mb": 0.7,
                "description": "Technology and web-related terms",
                "category": "tech",
                "priority": 5
            },
            {
                "name": "Top-Passwords-2023.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/2020-200_most_used_passwords.txt",
                "size_mb": 0.01,
                "description": "Most used passwords in 2023",
                "category": "passwords",
                "priority": 9
            },
            {
                "name": "Gaming-Terms.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Miscellaneous/wordlists-misc/ps.txt",
                "size_mb": 0.1,
                "description": "Gaming and esports related terms",
                "category": "gaming",
                "priority": 4
            },
            {
                "name": "Corporate-Terms.txt",
                "url": "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/best110.txt",
                "size_mb": 0.01,
                "description": "Corporate and business passwords",
                "category": "corporate",
                "priority": 6
            }
        ]
    
    def upload_wordlist(self, file_path: str, name: str, description: str = "", 
                       category: str = "custom") -> Dict[str, str]:
        """Upload a wordlist to team shared storage"""
        try:
            if not os.path.exists(file_path):
                return {"success": False, "error": "File not found"}
            
            # Read and validate file
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Check file size (max 100MB)
            if len(content) > 100 * 1024 * 1024:
                return {"success": False, "error": "File too large (max 100MB)"}
            
            # Generate checksum
            checksum = hashlib.sha256(content).hexdigest()
            
            # Check if already exists
            if any(wl.checksum == checksum for wl in self.shared_wordlists.values()):
                return {"success": False, "error": "Wordlist already exists"}
            
            # Save to team storage
            wordlist_id = f"{self.team_id}_{int(time.time())}_{name}"
            safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', name)
            file_name = f"{safe_name}.txt"
            save_path = self.storage_dir / file_name
            
            with open(save_path, 'wb') as f:
                f.write(content)
            
            # Create wordlist info
            wordlist_info = TeamWordlist(
                name=name,
                size=len(content),
                checksum=checksum,
                upload_time=time.time(),
                uploader=self.user_id,
                description=description,
                category=category
            )
            
            self.shared_wordlists[wordlist_id] = wordlist_info
            self._save_team_wordlists()
            
            # Notify team members
            self._notify_team_wordlist_upload(wordlist_info)
            
            return {
                "success": True, 
                "wordlist_id": wordlist_id,
                "message": f"Wordlist '{name}' uploaded successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Upload failed: {str(e)}"}
    
    def download_popular_wordlist(self, wordlist_name: str) -> Dict[str, str]:
        """Download a popular wordlist for team use"""
        wordlist_info = next((wl for wl in self.popular_wordlists if wl["name"] == wordlist_name), None)
        
        if not wordlist_info:
            return {"success": False, "error": "Wordlist not found in popular list"}
        
        try:
            import requests
            
            print(f"[INFO] Downloading {wordlist_name} ({wordlist_info['size_mb']}MB)...")
            
            response = requests.get(wordlist_info["url"], stream=True, timeout=60)
            response.raise_for_status()
            
            # Save to team storage
            save_path = self.storage_dir / wordlist_name
            
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Calculate checksum
            with open(save_path, 'rb') as f:
                content = f.read()
            checksum = hashlib.sha256(content).hexdigest()
            
            # Add to shared wordlists
            wordlist_id = f"popular_{wordlist_name}"
            team_wordlist = TeamWordlist(
                name=wordlist_name,
                size=len(content),
                checksum=checksum,
                upload_time=time.time(),
                uploader="system",
                description=wordlist_info["description"],
                category=wordlist_info["category"]
            )
            
            self.shared_wordlists[wordlist_id] = team_wordlist
            self._save_team_wordlists()
            
            return {
                "success": True,
                "message": f"Downloaded {wordlist_name} successfully",
                "path": str(save_path)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Download failed: {str(e)}"}
    
    def get_team_wordlists(self) -> List[Dict[str, any]]:
        """Get all wordlists available to the team"""
        wordlists = []
        
        # Add shared wordlists
        for wordlist_id, wordlist in self.shared_wordlists.items():
            wordlists.append({
                "id": wordlist_id,
                "name": wordlist.name,
                "size": wordlist.size,
                "size_mb": round(wordlist.size / (1024 * 1024), 2),
                "uploader": wordlist.uploader,
                "upload_time": wordlist.upload_time,
                "description": wordlist.description,
                "category": wordlist.category,
                "status": "available",
                "path": str(self.storage_dir / f"{wordlist.name}.txt")
            })
        
        # Add popular wordlists not yet downloaded
        for popular in self.popular_wordlists:
            if not any(wl["name"] == popular["name"] for wl in wordlists):
                wordlists.append({
                    "id": f"popular_{popular['name']}",
                    "name": popular["name"],
                    "size": popular["size_mb"] * 1024 * 1024,
                    "size_mb": popular["size_mb"],
                    "uploader": "popular",
                    "description": popular["description"],
                    "category": popular["category"],
                    "priority": popular["priority"],
                    "status": "download_available",
                    "url": popular["url"]
                })
        
        return sorted(wordlists, key=lambda x: x.get("priority", 0), reverse=True)
    
    def generate_contextual_wordlist(self, context: Dict[str, str]) -> Dict[str, str]:
        """Generate a contextual wordlist based on team context"""
        words = set()
        
        # Extract from context
        if "company" in context:
            company = context["company"].lower()
            words.update([
                company, company.capitalize(), company.upper(),
                f"{company}123", f"{company}2023", f"{company}2024", f"{company}!",
                f"{company}1", f"{company}01", f"123{company}"
            ])
        
        if "domain" in context:
            domain = context["domain"].lower().replace(".com", "").replace(".org", "")
            words.update([
                domain, domain.capitalize(), domain.upper(),
                f"{domain}123", f"{domain}2023", f"{domain}!"
            ])
        
        if "ctf_name" in context:
            ctf = context["ctf_name"].lower()
            words.update([
                ctf, ctf.capitalize(), ctf.upper(),
                f"flag{{{ctf}}}", f"CTF{{{ctf}}}", f"{ctf}_flag",
                f"{ctf}2023", f"{ctf}2024"
            ])
        
        if "year" in context:
            year = str(context["year"])
            words.update([year, year[-2:], f"20{year[-2:]}", f"19{year[-2:]}"])
        
        # Add common variations
        base_words = list(words)
        for word in base_words:
            words.update([
                f"{word}123", f"{word}1", f"{word}!", f"{word}@", f"{word}#",
                f"123{word}", f"admin{word}", f"pass{word}", f"password{word}"
            ])
        
        # Add CTF-specific patterns
        if "ctf" in context.get("category", "").lower():
            words.update([
                "flag", "ctf", "challenge", "crypto", "forensics", "pwn", "web",
                "admin", "root", "password", "secret", "key", "hash", "crack",
                "solve", "answer", "solution", "hint", "clue"
            ])
        
        if words:
            name = f"contextual_{int(time.time())}"
            description = f"Generated from context: {', '.join(context.keys())}"
            
            # Create temporary file
            temp_path = self.storage_dir / f"{name}.txt"
            with open(temp_path, 'w') as f:
                for word in sorted(words):
                    f.write(f"{word}\n")
            
            # Upload to team
            result = self.upload_wordlist(str(temp_path), name, description, "contextual")
            
            return result
        
        return {"success": False, "error": "No context provided"}
    
    def get_optimal_wordlists_for_hash(self, hash_type: str, max_count: int = 5) -> List[str]:
        """Get optimal wordlists for specific hash type"""
        wordlists = self.get_team_wordlists()
        optimal = []
        
        # Priority mapping for different hash types
        type_priorities = {
            "ntlm": ["corporate", "passwords", "names"],
            "mysql": ["tech", "passwords", "corporate"],
            "wordpress": ["passwords", "corporate", "tech"],
            "md5": ["passwords", "ctf", "names"],
            "sha256": ["passwords", "ctf", "tech"],
            "bcrypt": ["passwords", "corporate"],
            "yescrypt": ["passwords", "corporate", "tech"]
        }
        
        preferred_categories = type_priorities.get(hash_type.lower(), ["passwords", "ctf"])
        
        # Sort by category preference and priority
        available_wordlists = [wl for wl in wordlists if wl["status"] == "available"]
        
        for category in preferred_categories:
            category_lists = [wl for wl in available_wordlists if wl["category"] == category]
            optimal.extend(sorted(category_lists, key=lambda x: x.get("priority", 0), reverse=True))
        
        # Add remaining wordlists
        remaining = [wl for wl in available_wordlists if wl not in optimal]
        optimal.extend(sorted(remaining, key=lambda x: x.get("priority", 0), reverse=True))
        
        # Return paths of top wordlists
        return [wl["path"] for wl in optimal[:max_count] if "path" in wl]
    
    def _load_team_wordlists(self):
        """Load team wordlists from storage"""
        config_file = self.storage_dir / "team_wordlists.json"
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    data = json.load(f)
                
                for wordlist_id, wordlist_data in data.items():
                    self.shared_wordlists[wordlist_id] = TeamWordlist(**wordlist_data)
                    
            except Exception as e:
                print(f"[WARNING] Failed to load team wordlists: {e}")
    
    def _save_team_wordlists(self):
        """Save team wordlists to storage"""
        config_file = self.storage_dir / "team_wordlists.json"
        try:
            data = {wl_id: asdict(wl) for wl_id, wl in self.shared_wordlists.items()}
            with open(config_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[WARNING] Failed to save team wordlists: {e}")
    
    def _notify_team_wordlist_upload(self, wordlist: TeamWordlist):
        """Notify team members of new wordlist"""
        notification = {
            "type": "wordlist_upload",
            "wordlist": asdict(wordlist),
            "timestamp": time.time()
        }
        
        # This would send via WebSocket to connected team members
        # Implementation depends on the WebSocket server setup
        print(f"[INFO] New wordlist available: {wordlist.name} by {wordlist.uploader}")

# Example usage
if __name__ == "__main__":
    # Test team wordlist manager
    manager = TeamWordlistManager("team_alpha", "user_123")
    
    # Get available wordlists
    wordlists = manager.get_team_wordlists()
    print(f"Available wordlists: {len(wordlists)}")
    
    for wl in wordlists[:5]:  # Show top 5
        print(f"  {wl['name']} ({wl['size_mb']}MB) - {wl['category']}")
    
    # Generate contextual wordlist
    context = {
        "company": "acme",
        "ctf_name": "hacktivity",
        "year": "2024",
        "category": "ctf"
    }
    
    result = manager.generate_contextual_wordlist(context)
    print(f"Contextual wordlist: {result}")
    
    # Get optimal wordlists for yescrypt
    optimal = manager.get_optimal_wordlists_for_hash("yescrypt")
    print(f"Optimal wordlists for yescrypt: {len(optimal)}")
