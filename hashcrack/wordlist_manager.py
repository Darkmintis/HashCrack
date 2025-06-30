#!/usr/bin/env python3
"""
Smart Wordlist Manager
Automatically downloads, manages, and selects optimal wordlists
"""

import os
import requests
import zipfile
import gzip
import shutil
from typing import List, Dict, Optional
from pathlib import Path
import json
from dataclasses import dataclass
from enum import Enum

class WordlistCategory(Enum):
    COMMON = "common"
    CTF = "ctf"
    PASSWORDS = "passwords"
    NAMES = "names"
    NUMBERS = "numbers"
    TECH = "tech"
    LANGUAGES = "languages"
    CUSTOM = "custom"

@dataclass
class WordlistInfo:
    name: str
    category: WordlistCategory
    url: str
    size_mb: float
    description: str
    local_path: Optional[str] = None
    downloaded: bool = False
    priority: int = 1  # 1-10, higher is better

class SmartWordlistManager:
    """Manages wordlists intelligently for optimal cracking"""
    
    def __init__(self, wordlist_dir: str = "wordlists"):
        self.wordlist_dir = Path(wordlist_dir)
        self.wordlist_dir.mkdir(exist_ok=True)
        self.available_wordlists = self._get_available_wordlists()
        self.local_wordlists = self._scan_local_wordlists()
    
    def _get_available_wordlists(self) -> List[WordlistInfo]:
        """Define available wordlists for download"""
        wordlists = [
            # Essential/Common
            WordlistInfo(
                name="rockyou.txt",
                category=WordlistCategory.COMMON,
                url="https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt",
                size_mb=133.0,
                description="Most common passwords (14M entries)",
                priority=10
            ),
            WordlistInfo(
                name="SecLists-common.txt",
                category=WordlistCategory.COMMON,
                url="https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-1000000.txt",
                size_mb=8.3,
                description="Top 1M passwords from SecLists",
                priority=9
            ),
            
            # CTF Specific
            WordlistInfo(
                name="ctf-passwords.txt",
                category=WordlistCategory.CTF,
                url="https://raw.githubusercontent.com/xajkep/wordlists/master/ctf_passwords.txt",
                size_mb=0.1,
                description="Common CTF passwords and flags",
                priority=8
            ),
            WordlistInfo(
                name="ctf-common.txt",
                category=WordlistCategory.CTF,
                url="https://raw.githubusercontent.com/kkrypt0nn/wordlists/main/wordlists/passwords/ctf.txt",
                size_mb=0.05,
                description="CTF-specific wordlist",
                priority=8
            ),
            
            # Technical/IT
            WordlistInfo(
                name="darkweb2017-top1000.txt",
                category=WordlistCategory.PASSWORDS,
                url="https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/darkweb2017-top1000.txt",
                size_mb=0.01,
                description="Top 1000 from darkweb data",
                priority=7
            ),
            WordlistInfo(
                name="probable-v2-top1575.txt",
                category=WordlistCategory.PASSWORDS,
                url="https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/probable-v2-top1575.txt",
                size_mb=0.02,
                description="Probable passwords top 1575",
                priority=7
            ),
            
            # Names and common words
            WordlistInfo(
                name="names.txt",
                category=WordlistCategory.NAMES,
                url="https://raw.githubusercontent.com/danielmiessler/SecLists/master/Usernames/Names/names.txt",
                size_mb=0.7,
                description="Common first names",
                priority=5
            ),
            
            # Numbers and dates
            WordlistInfo(
                name="numbers-0-10000.txt",
                category=WordlistCategory.NUMBERS,
                url="https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/4-digits-0000-9999.txt",
                size_mb=0.04,
                description="Numbers 0000-9999",
                priority=6
            ),
            
            # Technology specific
            WordlistInfo(
                name="tech-terms.txt",
                category=WordlistCategory.TECH,
                url="https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/directory-list-2.3-small.txt",
                size_mb=0.7,
                description="Technology and web terms",
                priority=4
            ),
        ]
        
        return wordlists
    
    def _scan_local_wordlists(self) -> List[str]:
        """Scan for existing local wordlists"""
        local_files = []
        for file_path in self.wordlist_dir.glob("*.txt"):
            local_files.append(str(file_path))
        return local_files
    
    def download_wordlist(self, wordlist_info: WordlistInfo, 
                         force: bool = False) -> bool:
        """Download a specific wordlist"""
        local_path = self.wordlist_dir / wordlist_info.name
        
        # Check if already exists
        if local_path.exists() and not force:
            print(f"✅ {wordlist_info.name} already exists")
            wordlist_info.local_path = str(local_path)
            wordlist_info.downloaded = True
            return True
        
        print(f"📥 Downloading {wordlist_info.name} ({wordlist_info.size_mb}MB)...")
        
        try:
            response = requests.get(wordlist_info.url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Handle compressed files
            if wordlist_info.url.endswith('.gz'):
                with gzip.open(response.raw, 'rt') as gz_file:
                    with open(local_path, 'w') as output_file:
                        shutil.copyfileobj(gz_file, output_file)
            elif wordlist_info.url.endswith('.zip'):
                zip_path = local_path.with_suffix('.zip')
                with open(zip_path, 'wb') as zip_file:
                    for chunk in response.iter_content(chunk_size=8192):
                        zip_file.write(chunk)
                
                # Extract zip
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(self.wordlist_dir)
                zip_path.unlink()  # Remove zip file
            else:
                with open(local_path, 'wb') as output_file:
                    for chunk in response.iter_content(chunk_size=8192):
                        output_file.write(chunk)
            
            wordlist_info.local_path = str(local_path)
            wordlist_info.downloaded = True
            print(f"✅ Downloaded {wordlist_info.name}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to download {wordlist_info.name}: {str(e)}")
            return False
    
    def download_essential_wordlists(self) -> bool:
        """Download essential wordlists for cracking"""
        essential = [wl for wl in self.available_wordlists if wl.priority >= 8]
        
        success_count = 0
        for wordlist in essential:
            if self.download_wordlist(wordlist):
                success_count += 1
        
        print(f"📦 Downloaded {success_count}/{len(essential)} essential wordlists")
        return success_count == len(essential)
    
    def get_optimal_wordlists(self, hash_type: str = None, 
                            context: str = None) -> List[str]:
        """Get optimal wordlist selection based on context"""
        wordlists = []
        
        # Always include rockyou if available
        rockyou_path = self.wordlist_dir / "rockyou.txt"
        if rockyou_path.exists():
            wordlists.append(str(rockyou_path))
        
        # Context-specific selections
        if context and "ctf" in context.lower():
            # Prioritize CTF wordlists
            ctf_lists = [wl for wl in self.available_wordlists 
                        if wl.category == WordlistCategory.CTF and wl.downloaded]
            wordlists.extend([wl.local_path for wl in ctf_lists if wl.local_path])
        
        # Hash-type specific
        if hash_type:
            if "ntlm" in hash_type.lower() or "windows" in hash_type.lower():
                # Add Windows-specific wordlists
                pass
            elif "mysql" in hash_type.lower() or "postgres" in hash_type.lower():
                # Add database-specific wordlists
                pass
        
        # Add other high-priority wordlists
        other_high_priority = [wl for wl in self.available_wordlists 
                              if wl.priority >= 7 and wl.downloaded 
                              and wl.local_path not in wordlists]
        wordlists.extend([wl.local_path for wl in other_high_priority if wl.local_path])
        
        # Add local custom wordlists
        custom_lists = [str(f) for f in self.wordlist_dir.glob("custom_*.txt")]
        wordlists.extend(custom_lists)
        
        return wordlists[:10]  # Limit to top 10 for performance
    
    def create_custom_wordlist(self, name: str, words: List[str]) -> bool:
        """Create a custom wordlist from provided words"""
        custom_path = self.wordlist_dir / f"custom_{name}.txt"
        
        try:
            with open(custom_path, 'w') as f:
                for word in words:
                    f.write(f"{word.strip()}\n")
            
            print(f"✅ Created custom wordlist: {custom_path}")
            return True
        except Exception as e:
            print(f"❌ Failed to create custom wordlist: {str(e)}")
            return False
    
    def generate_contextual_wordlist(self, context: Dict) -> bool:
        """Generate wordlist based on context (company, domain, etc.)"""
        words = set()
        
        # Extract from context
        if "company" in context:
            company = context["company"].lower()
            words.add(company)
            words.add(company.capitalize())
            words.add(company.upper())
            # Add variations
            words.add(f"{company}123")
            words.add(f"{company}2023")
            words.add(f"{company}!")
        
        if "domain" in context:
            domain = context["domain"].lower().replace(".com", "").replace(".org", "")
            words.add(domain)
            words.add(domain.capitalize())
        
        if "year" in context:
            year = str(context["year"])
            words.add(year)
            words.add(year[-2:])  # Last 2 digits
        
        # Common variations
        base_words = list(words)
        for word in base_words:
            words.add(f"{word}123")
            words.add(f"{word}1")
            words.add(f"{word}!")
            words.add(f"{word}@")
            words.add(f"123{word}")
        
        if words:
            return self.create_custom_wordlist("contextual", list(words))
        
        return False
    
    def get_wordlist_stats(self) -> Dict:
        """Get statistics about available wordlists"""
        stats = {
            "total_available": len(self.available_wordlists),
            "downloaded": len([wl for wl in self.available_wordlists if wl.downloaded]),
            "local_files": len(self.local_wordlists),
            "categories": {},
            "total_size_mb": 0
        }
        
        for wl in self.available_wordlists:
            category = wl.category.value
            if category not in stats["categories"]:
                stats["categories"][category] = {"count": 0, "downloaded": 0}
            
            stats["categories"][category]["count"] += 1
            if wl.downloaded:
                stats["categories"][category]["downloaded"] += 1
                stats["total_size_mb"] += wl.size_mb
        
        return stats
    
    def save_config(self):
        """Save wordlist configuration"""
        config = {
            "wordlists": [
                {
                    "name": wl.name,
                    "category": wl.category.value,
                    "downloaded": wl.downloaded,
                    "local_path": wl.local_path
                }
                for wl in self.available_wordlists
            ]
        }
        
        config_path = self.wordlist_dir / "config.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    def load_config(self):
        """Load wordlist configuration"""
        config_path = self.wordlist_dir / "config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Update downloaded status
            for item in config["wordlists"]:
                for wl in self.available_wordlists:
                    if wl.name == item["name"]:
                        wl.downloaded = item["downloaded"]
                        wl.local_path = item["local_path"]

# Example usage
if __name__ == "__main__":
    manager = SmartWordlistManager()
    manager.load_config()
    
    # Download essential wordlists
    manager.download_essential_wordlists()
    
    # Get optimal wordlists for CTF context
    optimal = manager.get_optimal_wordlists(context="ctf competition")
    print(f"Optimal wordlists: {optimal}")
    
    # Create contextual wordlist
    context = {"company": "acme", "year": 2023}
    manager.generate_contextual_wordlist(context)
    
    # Save configuration
    manager.save_config()
    
    # Print stats
    stats = manager.get_wordlist_stats()
    print(f"Wordlist stats: {stats}")
