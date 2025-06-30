"""
HashCrack - Next-Generation Hash Cracking Tool

A revolutionary hash cracking tool that combines the power of multiple engines
with intelligent automation and modern UX design.

Author: Darkmintis
License: MIT
Repository: https://github.com/Darkmintis/HashCrack
"""

__version__ = "2.0.0"
__author__ = "Darkmintis"
__email__ = "hashcrack@darkmintis.com"
__license__ = "MIT"
__url__ = "https://github.com/Darkmintis/HashCrack"

# Import main modules for easy access
from .engine import HashEngine
from .wordlist_manager import SmartWordlistManager
from .progress_tracker import RealTimeTracker

__all__ = [
    "HashEngine",
    "SmartWordlistManager", 
    "RealTimeTracker",
    "__version__",
    "__author__",
    "__email__",
    "__license__",
    "__url__",
]
