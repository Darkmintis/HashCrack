#!/usr/bin/env python3
# Run script for HashCrack web interface

import os
import sys
import subprocess
import shutil
import time

def clean_test_files():
    """Remove test files"""
    print("[INFO] Cleaning test files...")
    
    # Remove temp files
    test_files = ["temp_hash.txt", "test_wordlist.txt"]
    for file in test_files:
        if os.path.exists(file):
            try:
                os.remove(file)
                print(f"[OK] Removed: {file}")
            except Exception as e:
                print(f"[WARNING] Failed to remove {file}: {str(e)}")
    
    return True

def install_dependencies():
    """Install required Python dependencies"""
    print("[INFO] Installing dependencies...")
    
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                       check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("[OK] Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to install dependencies: {e.stderr.decode()}")
        return False

def run_web_interface():
    """Run the web interface"""
    print("[INFO] Starting web interface...")
    print("Visit http://127.0.0.1:5000 in your browser")
    print("Press Ctrl+C to stop the server")
    
    try:
        # Check if the wordlists directory exists
        if not os.path.exists("wordlists"):
            os.makedirs("wordlists")
            print("[OK] Created wordlists directory")
        
        # Run the web interface
        subprocess.run([sys.executable, "web_interface.py"], check=True)
    except KeyboardInterrupt:
        print("\n[STOP] Server stopped")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Error running web interface: {str(e)}")

def main():
    """Main function"""
    print("HashCrack Web Interface Runner")
    print("================================")
    
    # Clean test files
    clean_test_files()
    
    # Install dependencies
    install_dependencies()
    
    # Run the web interface
    run_web_interface()

if __name__ == "__main__":
    main()
