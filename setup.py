#!/usr/bin/env python3
"""
HashCrack Setup Script
Professional installation and dependency management
"""

import os
import sys
import platform
import subprocess
import shutil
from pathlib import Path
import urllib.request
import zipfile
import tarfile
from setuptools import setup, find_packages

# Read version from __init__.py
def get_version():
    """Get version from package __init__.py"""
    version_file = Path(__file__).parent / "hashcrack" / "__init__.py"
    if version_file.exists():
        with open(version_file, 'r') as f:
            for line in f:
                if line.startswith('__version__'):
                    return line.split('=')[1].strip().strip('\'"')
    return "2.0.0"

# Read long description from README
def get_long_description():
    """Get long description from README.md"""
    readme_file = Path(__file__).parent / "README.md"
    if readme_file.exists():
        with open(readme_file, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

def check_os():
    """Check operating system and return appropriate commands"""
    system = platform.system().lower()
    
    if system == "linux":
        return {
            "pkg_manager": "apt-get" if shutil.which("apt-get") else "apt" if shutil.which("apt") else "yum" if shutil.which("yum") else None,
            "install_cmd": "install -y",
            "packages": {
                "john": "john",
                "hashcat": "hashcat",
                "hashid": "hashid"
            }
        }
    elif system == "darwin":  # macOS
        if not shutil.which("brew"):
            print("[ERROR] Homebrew is required for macOS. Please install it first.")
            print("Run: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            return None
        return {
            "pkg_manager": "brew",
            "install_cmd": "install",
            "packages": {
                "john": "john-jumbo",
                "hashcat": "hashcat",
                "hashid": "hashid"
            }
        }
    elif system == "windows":
        print("[WARNING] Windows support is limited. Consider using WSL (Windows Subsystem for Linux)")
        print("Installing Python packages via pip...")
        return {
            "pkg_manager": "pip",
            "install_cmd": "install",
            "packages": {
                "hashid": "hashid"
            }
        }
    else:
        print(f"[ERROR] Unsupported OS: {system}")
        return None

def install_dependencies(os_config):
    """Install required dependencies"""
    if not os_config:
        return False
    
    pkg_mgr = os_config["pkg_manager"]
    install_cmd = os_config["install_cmd"]
    packages = os_config["packages"]
    
    success = True
    
    print("[INFO] Installing dependencies...")
    
    # Install Python packages via pip
    py_packages = ["hashid", "requests", "flask", "flask-cors", "websockets"]
    try:
        subprocess.run([sys.executable, "-m", "pip", "install"] + py_packages, check=True)
        print("[OK] Python packages installed")
    except subprocess.CalledProcessError:
        print("[ERROR] Failed to install Python packages")
        success = False
    
    # Install OS packages
    if pkg_mgr in ["apt-get", "apt", "yum"]:
        try:
            subprocess.run(["sudo", pkg_mgr, "update"], check=False)
        except:
            pass
        
    for name, pkg in packages.items():
        if pkg_mgr == "pip":
            if name == "hashid":
                continue  # Already installed with Python packages
        print(f"[INFO] Installing {name}...")
        try:
            if pkg_mgr in ["apt-get", "apt", "yum"]:
                subprocess.run(["sudo", pkg_mgr, install_cmd, pkg], check=True)
            else:
                subprocess.run([pkg_mgr, install_cmd, pkg], check=True)
            print(f"[OK] {name} installed")
        except subprocess.CalledProcessError:
            print(f"[ERROR] Failed to install {name}")
            success = False
    
    return success

def download_wordlist():
    """Download common wordlists"""
    wordlists_dir = Path("wordlists")
    wordlists_dir.mkdir(exist_ok=True)
    
    print("[INFO] Downloading wordlists...")
    
    # Download rockyou.txt
    rockyou_path = wordlists_dir / "rockyou.txt"
    
    if rockyou_path.exists():
        print("[OK] rockyou.txt already exists")
    else:
        print("[INFO] Downloading rockyou.txt (this may take a while)...")
        try:
            # URL for rockyou.txt
            rockyou_url = "https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt"
            urllib.request.urlretrieve(rockyou_url, rockyou_path)
            print("[OK] rockyou.txt downloaded")
        except Exception as e:
            print(f"[ERROR] Failed to download rockyou.txt: {str(e)}")
    
    return True

def setup_environment():
    """Set up HashCrack environment"""
    print("[INFO] Setting up HashCrack environment...")
    
    # Create necessary directories
    directories = ["wordlists", "cache", "results", "logs", "config"]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"[OK] Created directory: {directory}")
    
    # Create default config
    config_file = Path("config") / "settings.json"
    if not config_file.exists():
        default_config = '''{
    "engines": {
        "john": {
            "path": "john",
            "threads": "auto"
        },
        "hashcat": {
            "path": "hashcat",
            "gpu": true,
            "workload": 3
        }
    },
    "wordlists": {
        "auto_download": true,
        "max_size_gb": 10,
        "priority": ["rockyou", "seclist", "ctf"]
    },
    "web": {
        "host": "0.0.0.0",
        "port": 5000,
        "debug": false
    },
    "ctf": {
        "hint_level": "medium",
        "time_pressure": false,
        "team_mode": true
    }
}'''
        with open(config_file, 'w') as f:
            f.write(default_config)
        print("[OK] Created default configuration")

def main():
    """Main setup function"""
    print("� HashCrack Professional Setup")
    print("=" * 50)
    
    # Parse command line arguments
    full_install = "--full" in sys.argv
    skip_deps = "--skip-deps" in sys.argv
    
    # Setup environment
    setup_environment()
    
    if not skip_deps:
        # Check OS and get appropriate commands
        os_config = check_os()
        
        # Install dependencies
        if not install_dependencies(os_config):
            print("[WARNING] Some dependencies could not be installed")
            print("Please install them manually:")
            print("- John the Ripper: https://www.openwall.com/john/")
            print("- Hashcat: https://hashcat.net/hashcat/")
    
    if full_install:
        # Download wordlists
        download_wordlist()
    
    print("\n[SUCCESS] HashCrack setup completed!")
    print("\n🚀 Quick Start:")
    print("  Web Interface: python web_interface.py")
    print("  CLI: python hashcrack.py --help")
    print("\n📖 Documentation: https://github.com/Darkmintis/HashCrack")
    print("💬 Support: https://github.com/Darkmintis/HashCrack/discussions")

# Package configuration for pip installation
if len(sys.argv) > 1 and sys.argv[1] in ['sdist', 'bdist_wheel', 'install', 'develop']:
    setup(
        name="hashcrack",
        version=get_version(),
        author="Darkmintis",
        author_email="hashcrack@darkmintis.com",
        description="Next-Generation Hash Cracking Tool",
        long_description=get_long_description(),
        long_description_content_type="text/markdown",
        url="https://github.com/Darkmintis/HashCrack",
        packages=find_packages(),
        classifiers=[
            "Development Status :: 5 - Production/Stable",
            "Intended Audience :: Information Technology",
            "Intended Audience :: System Administrators",
            "License :: OSI Approved :: MIT License",
            "Operating System :: OS Independent",
            "Programming Language :: Python :: 3",
            "Programming Language :: Python :: 3.8",
            "Programming Language :: Python :: 3.9",
            "Programming Language :: Python :: 3.10",
            "Programming Language :: Python :: 3.11",
            "Topic :: Security",
            "Topic :: Security :: Cryptography",
            "Topic :: System :: Systems Administration",
        ],
        python_requires=">=3.8",
        install_requires=[
            "flask>=2.0.1",
            "flask-cors>=3.0.10",
            "requests>=2.26.0",
            "hashid>=3.1.4",
            "websockets>=10.4",
        ],
        extras_require={
            "dev": [
                "pytest>=7.0.0",
                "pytest-cov>=4.0.0",
                "black>=23.0.0",
                "isort>=5.12.0",
                "flake8>=6.0.0",
                "mypy>=1.0.0",
            ]
        },
        entry_points={
            "console_scripts": [
                "hashcrack=hashcrack:main",
                "hashcrack-web=web_interface:main",
            ],
        },
        include_package_data=True,
        package_data={
            "hashcrack": ["templates/*", "static/*"],
        },
        project_urls={
            "Bug Reports": "https://github.com/Darkmintis/HashCrack/issues",
            "Source": "https://github.com/Darkmintis/HashCrack",
            "Documentation": "https://github.com/Darkmintis/HashCrack#readme",
            "Funding": "https://github.com/sponsors/Darkmintis",
        },
    )
else:
    # Run setup when called directly
    if __name__ == "__main__":
        main()
