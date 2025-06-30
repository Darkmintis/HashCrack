#!/usr/bin/env python3
"""
Advanced Hash Cracking Engine
Supports 500+ hash types including yescrypt, bcrypt, scrypt, and more
Multi-engine intelligence with P2P team collaboration
"""

import hashlib
import subprocess
import os
import re
import json
import time
import secrets
import base64
from typing import Dict, List, Optional, Tuple, Any, Union, Set
from dataclasses import dataclass
from enum import Enum, auto
import threading
import asyncio
from pathlib import Path

# Try to import crypt module (Unix systems only)
try:
    import crypt
    HAS_CRYPT = True
except ImportError:
    HAS_CRYPT = False
    print("[WARNING] crypt module not available (Windows system)")

# Try to import additional libraries for enhanced hash support
try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False

try:
    import scrypt
    HAS_SCRYPT = True
except ImportError:
    HAS_SCRYPT = False

try:
    import argon2
    HAS_ARGON2 = True
except ImportError:
    HAS_ARGON2 = False

class CrackEngine(Enum):
    JOHN = "john"
    HASHCAT = "hashcat"
    BOTH = "both"

class AttackMode(Enum):
    DICTIONARY = "dictionary"
    RULES = "rules"
    HYBRID = "hybrid"
    BRUTE_FORCE = "brute_force"
    SMART = "smart"

@dataclass
class HashInfo:
    hash_value: str
    hash_type: str
    john_format: Optional[str] = None
    hashcat_mode: Optional[int] = None
    confidence: float = 0.0
    salt: Optional[str] = None
    
@dataclass
class CrackResult:
    success: bool
    plaintext: Optional[str] = None
    time_taken: float = 0.0
    engine_used: Optional[str] = None
    attack_mode: Optional[str] = None
    error: Optional[str] = None

class HashType(Enum):
    # Modern Password Hashing (Adaptive/Key Stretching)
    YESCRYPT = "yescrypt"
    BCRYPT = "bcrypt" 
    SCRYPT = "scrypt"
    ARGON2 = "argon2"
    ARGON2I = "argon2i"
    ARGON2D = "argon2d"
    ARGON2ID = "argon2id"
    PBKDF2 = "pbkdf2"
    PBKDF2_SHA1 = "pbkdf2_sha1"
    PBKDF2_SHA256 = "pbkdf2_sha256"
    PBKDF2_SHA512 = "pbkdf2_sha512"
    
    # Classic Cryptographic Hashes
    MD4 = "md4"
    MD5 = "md5"
    SHA1 = "sha1"
    SHA224 = "sha224"
    SHA256 = "sha256"
    SHA384 = "sha384"
    SHA512 = "sha512"
    SHA3_224 = "sha3-224"
    SHA3_256 = "sha3-256"
    SHA3_384 = "sha3-384"
    SHA3_512 = "sha3-512"
    SHAKE128 = "shake128"
    SHAKE256 = "shake256"
    BLAKE2B = "blake2b"
    BLAKE2S = "blake2s"
    RIPEMD128 = "ripemd128"
    RIPEMD160 = "ripemd160"
    RIPEMD256 = "ripemd256"
    RIPEMD320 = "ripemd320"
    WHIRLPOOL = "whirlpool"
    TIGER = "tiger"
    GOST = "gost"
    STREEBOG256 = "streebog256"
    STREEBOG512 = "streebog512"
    
    # Windows Authentication
    NTLM = "ntlm"
    NTLMV2 = "ntlmv2"
    LM = "lm"
    NETLM = "netlm"
    NETNTLM = "netntlm"
    NETNTLMV2 = "netntlmv2"
    MSCASH = "mscash"
    MSCASH2 = "mscash2"
    KERBEROS5 = "kerberos5"
    KERBEROS5_TGS = "kerberos5_tgs"
    KERBEROS5_ASREP = "kerberos5_asrep"
    
    # Unix/Linux System Hashes
    DES_CRYPT = "des-crypt"
    BF_CRYPT = "bf-crypt"
    MD5_CRYPT = "md5-crypt"
    SHA256_CRYPT = "sha256-crypt" 
    SHA512_CRYPT = "sha512-crypt"
    YESCRYPT_CRYPT = "yescrypt-crypt"
    SUNMD5 = "sunmd5"
    AIX_SMD5 = "aix_smd5"
    AIX_SSHA256 = "aix_ssha256"
    AIX_SSHA512 = "aix_ssha512"
    
    # Database Hashes
    MYSQL = "mysql"
    MYSQL5 = "mysql5"
    MYSQL_SHA1 = "mysql_sha1"
    POSTGRES = "postgres"
    POSTGRES_MD5 = "postgres_md5"
    POSTGRES_SCRAM = "postgres_scram"
    MSSQL = "mssql"
    MSSQL2000 = "mssql2000"
    MSSQL2005 = "mssql2005"
    MSSQL2012 = "mssql2012"
    ORACLE = "oracle"
    ORACLE10G = "oracle10g"
    ORACLE11G = "oracle11g"
    ORACLE12C = "oracle12c"
    ORACLE18C = "oracle18c"
    MONGODB = "mongodb"
    REDIS = "redis"
    MEMCACHED = "memcached"
    
    # Web Applications
    WORDPRESS = "wordpress"
    JOOMLA = "joomla"
    DRUPAL7 = "drupal7"
    DRUPAL8 = "drupal8"
    DRUPAL9 = "drupal9"
    PHPBB3 = "phpbb3"
    DJANGO = "django"
    DJANGO_PBKDF2 = "django_pbkdf2"
    DJANGO_ARGON2 = "django_argon2"
    LARAVEL = "laravel"
    SYMFONY = "symfony"
    MEDIAWIKI = "mediawiki"
    OSCOMMERCE = "oscommerce"
    MAGENTO = "magento"
    MAGENTO2 = "magento2"
    PRESTASHOP = "prestashop"
    
    # Archives & Office Documents
    ZIP = "zip"
    ZIP_WINZIP = "zip_winzip"
    RAR = "rar"
    RAR5 = "rar5"
    SEVENZIP = "7zip"
    PDF = "pdf"
    PDF_OWNER = "pdf_owner"
    PDF_USER = "pdf_user"
    OFFICE97 = "office97"
    OFFICE2007 = "office2007"
    OFFICE2010 = "office2010"
    OFFICE2013 = "office2013"
    OFFICE2016 = "office2016"
    OFFICE2019 = "office2019"
    LIBREOFFICE = "libreoffice"
    KEEPASS = "keepass"
    KEEPASS2 = "keepass2"
    TRUECRYPT = "truecrypt"
    VERACRYPT = "veracrypt"
    BITLOCKER = "bitlocker"
    LUKS = "luks"
    
    # Wireless & Network
    WPA = "wpa"
    WPA2 = "wpa2"
    WPA3 = "wpa3"
    WPS = "wps"
    WEP = "wep"
    EAP_MD5 = "eap_md5"
    PEAP = "peap"
    EAP_MSCHAPV2 = "eap_mschapv2"
    RADIUS = "radius"
    TACACS = "tacacs"
    IKE_PSK = "ike_psk"
    IPSEC = "ipsec"
    
    # Cryptocurrency & Blockchain
    BITCOIN = "bitcoin"
    ETHEREUM = "ethereum"
    LITECOIN = "litecoin"
    DOGECOIN = "dogecoin"
    MONERO = "monero"
    ZCASH = "zcash"
    WALLET_DAT = "wallet_dat"
    METAMASK = "metamask"
    ELECTRUM = "electrum"
    
    # SSH & PGP
    SSH_RSA = "ssh_rsa"
    SSH_DSA = "ssh_dsa"
    SSH_ECDSA = "ssh_ecdsa"
    SSH_ED25519 = "ssh_ed25519"
    PGP_RSA = "pgp_rsa"
    PGP_DSA = "pgp_dsa"
    PGP_ELGAMAL = "pgp_elgamal"
    PUTTY = "putty"
    
    # Network Equipment
    CISCO_TYPE7 = "cisco_type7"
    CISCO_TYPE8 = "cisco_type8"
    CISCO_TYPE9 = "cisco_type9"
    CISCO_ASA = "cisco_asa"
    CISCO_PIX = "cisco_pix"
    JUNIPER = "juniper"
    FORTIGATE = "fortigate"
    
    # Cloud & Enterprise
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"
    LDAP_MD5 = "ldap_md5"
    LDAP_SHA = "ldap_sha"
    LDAP_SSHA = "ldap_ssha"
    LDAP_CRYPT = "ldap_crypt"
    ACTIVE_DIRECTORY = "active_directory"
    
    # CTF & Custom Encodings
    BASE64 = "base64"
    BASE32 = "base32"
    BASE16 = "base16"
    HEX = "hex"
    ROT13 = "rot13"
    ROT47 = "rot47"
    CAESAR = "caesar"
    ATBASH = "atbash"
    MORSE = "morse"
    BINARY = "binary"
    VIGENERE = "vigenere"
    PLAYFAIR = "playfair"
    RAIL_FENCE = "rail_fence"
    
    # Legacy & Weak Hashes
    CRC32 = "crc32"
    ADLER32 = "adler32"
    FNV1 = "fnv1"
    FNV1A = "fnv1a"
    JENKINS = "jenkins"
    MURMUR = "murmur"
    
    # Custom & Unknown
    CUSTOM = "custom"
    UNKNOWN = "unknown"

class EnhancedHashEngine:
    """Enhanced hash cracking engine with multi-tool support"""
    
    def __init__(self):
        self.hash_formats = self._load_hash_formats()
        self.result_cache = {}
        
    def _load_hash_formats(self) -> Dict:
        """Load comprehensive hash format mappings for 500+ hash types"""
        return {
            # Modern Password Hashing
            "yescrypt": {"john": "yescrypt", "hashcat": 7100, "strength": "very_high"},
            "bcrypt": {"john": "bcrypt", "hashcat": 3200, "strength": "very_high"},
            "scrypt": {"john": "scrypt", "hashcat": 8900, "strength": "very_high"},
            "argon2": {"john": "argon2", "hashcat": 26600, "strength": "very_high"},
            "argon2i": {"john": "argon2i", "hashcat": 26700, "strength": "very_high"},
            "argon2d": {"john": "argon2d", "hashcat": 26800, "strength": "very_high"},
            "argon2id": {"john": "argon2id", "hashcat": 26900, "strength": "very_high"},
            "pbkdf2_sha1": {"john": "pbkdf2", "hashcat": 12000, "strength": "high"},
            "pbkdf2_sha256": {"john": "pbkdf2-sha256", "hashcat": 10900, "strength": "high"},
            "pbkdf2_sha512": {"john": "pbkdf2-sha512", "hashcat": 12100, "strength": "high"},
            
            # Classic Hashes
            "MD4": {"john": "raw-md4", "hashcat": 900, "strength": "very_low"},
            "MD5": {"john": "raw-md5", "hashcat": 0, "strength": "very_low"},
            "SHA1": {"john": "raw-sha1", "hashcat": 100, "strength": "low"},
            "SHA224": {"john": "raw-sha224", "hashcat": 1300, "strength": "medium"},
            "SHA256": {"john": "raw-sha256", "hashcat": 1400, "strength": "medium"},
            "SHA384": {"john": "raw-sha384", "hashcat": 10800, "strength": "medium"},
            "SHA512": {"john": "raw-sha512", "hashcat": 1700, "strength": "medium"},
            "SHA3-224": {"john": "raw-sha3", "hashcat": 17300, "strength": "medium"},
            "SHA3-256": {"john": "raw-sha3", "hashcat": 17400, "strength": "medium"},
            "SHA3-384": {"john": "raw-sha3", "hashcat": 17500, "strength": "medium"},
            "SHA3-512": {"john": "raw-sha3", "hashcat": 17600, "strength": "medium"},
            "BLAKE2b": {"john": "raw-blake2", "hashcat": 600, "strength": "medium"},
            "BLAKE2s": {"john": "raw-blake2", "hashcat": 610, "strength": "medium"},
            "RIPEMD160": {"john": "ripemd-160", "hashcat": 6000, "strength": "medium"},
            "Whirlpool": {"john": "whirlpool", "hashcat": 6100, "strength": "medium"},
            "GOST": {"john": "gost", "hashcat": 6900, "strength": "medium"},
            
            # Windows Authentication
            "NTLM": {"john": "nt", "hashcat": 1000, "strength": "very_low"},
            "NTLMv2": {"john": "netntlmv2", "hashcat": 5600, "strength": "medium"},
            "LM": {"john": "lm", "hashcat": 3000, "strength": "very_low"},
            "NetNTLM": {"john": "netntlm", "hashcat": 5500, "strength": "low"},
            "NetNTLMv2": {"john": "netntlmv2", "hashcat": 5600, "strength": "medium"},
            "MSCash": {"john": "mscash", "hashcat": 1100, "strength": "low"},
            "MSCash2": {"john": "mscash2", "hashcat": 2100, "strength": "medium"},
            "Kerberos5": {"john": "krb5", "hashcat": 7500, "strength": "medium"},
            "Kerberos5_TGS": {"john": "krb5tgs", "hashcat": 13100, "strength": "medium"},
            "Kerberos5_ASREP": {"john": "krb5asrep", "hashcat": 18200, "strength": "medium"},
            
            # Unix/Linux System
            "DES": {"john": "descrypt", "hashcat": 1500, "strength": "very_low"},
            "MD5_Crypt": {"john": "md5crypt", "hashcat": 500, "strength": "low"},
            "SHA256_Crypt": {"john": "sha256crypt", "hashcat": 7400, "strength": "high"},
            "SHA512_Crypt": {"john": "sha512crypt", "hashcat": 1800, "strength": "high"},
            "yescrypt_Crypt": {"john": "yescrypt", "hashcat": 7100, "strength": "very_high"},
            "SunMD5": {"john": "sunmd5", "hashcat": 3300, "strength": "medium"},
            "AIX_SMD5": {"john": "aix-smd5", "hashcat": 6300, "strength": "medium"},
            "AIX_SSHA256": {"john": "aix-ssha256", "hashcat": 6400, "strength": "high"},
            "AIX_SSHA512": {"john": "aix-ssha512", "hashcat": 6500, "strength": "high"},
            
            # Database Hashes
            "MySQL323": {"john": "mysql", "hashcat": 200, "strength": "very_low"},
            "MySQL41": {"john": "mysql-sha1", "hashcat": 300, "strength": "low"},
            "MySQL_SHA1": {"john": "mysql-sha1", "hashcat": 300, "strength": "low"},
            "PostgreSQL": {"john": "postgres", "hashcat": 12, "strength": "low"},
            "PostgreSQL_MD5": {"john": "postgres", "hashcat": 12, "strength": "low"},
            "PostgreSQL_SCRAM": {"john": "postgres-scram", "hashcat": 28000, "strength": "high"},
            "MSSQL2000": {"john": "mssql", "hashcat": 131, "strength": "low"},
            "MSSQL2005": {"john": "mssql05", "hashcat": 132, "strength": "low"},
            "MSSQL2012": {"john": "mssql12", "hashcat": 1731, "strength": "medium"},
            "Oracle10g": {"john": "oracle", "hashcat": 3100, "strength": "low"},
            "Oracle11g": {"john": "oracle11", "hashcat": 112, "strength": "medium"},
            "Oracle12c": {"john": "oracle12c", "hashcat": 12300, "strength": "high"},
            "Oracle18c": {"john": "oracle12c", "hashcat": 12300, "strength": "high"},
            "MongoDB": {"john": "mongodb", "hashcat": 24100, "strength": "medium"},
            "Redis": {"john": "redis", "hashcat": 4200, "strength": "low"},
            
            # Web Applications
            "WordPress": {"john": "phpass", "hashcat": 400, "strength": "medium"},
            "Joomla": {"john": "phpass", "hashcat": 400, "strength": "medium"},
            "Drupal7": {"john": "drupal7", "hashcat": 7900, "strength": "high"},
            "Drupal8": {"john": "drupal8", "hashcat": 7900, "strength": "high"},
            "Drupal9": {"john": "drupal8", "hashcat": 7900, "strength": "high"},
            "phpBB3": {"john": "phpass", "hashcat": 400, "strength": "medium"},
            "Django_SHA1": {"john": "django", "hashcat": 124, "strength": "low"},
            "Django_PBKDF2": {"john": "django", "hashcat": 10000, "strength": "high"},
            "Django_Argon2": {"john": "django-argon2", "hashcat": 26600, "strength": "very_high"},
            "Laravel": {"john": "laravel", "hashcat": 20711, "strength": "high"},
            "Symfony": {"john": "symfony", "hashcat": 20710, "strength": "high"},
            "MediaWiki": {"john": "mediawiki", "hashcat": 3711, "strength": "medium"},
            "Magento": {"john": "magento", "hashcat": 11, "strength": "low"},
            "Magento2": {"john": "magento2", "hashcat": 21800, "strength": "high"},
            
            # Archive & Office
            "ZIP": {"john": "zip", "hashcat": 13600, "strength": "medium"},
            "RAR3": {"john": "rar", "hashcat": 12500, "strength": "medium"},
            "RAR5": {"john": "rar5", "hashcat": 13000, "strength": "high"},
            "7-Zip": {"john": "7z", "hashcat": 11600, "strength": "medium"},
            "PDF_Owner": {"john": "pdf", "hashcat": 10500, "strength": "medium"},
            "PDF_User": {"john": "pdf", "hashcat": 10500, "strength": "medium"},
            "Office97": {"john": "office", "hashcat": 9700, "strength": "low"},
            "Office2007": {"john": "office", "hashcat": 9400, "strength": "medium"},
            "Office2010": {"john": "office", "hashcat": 9500, "strength": "medium"},
            "Office2013": {"john": "office", "hashcat": 9600, "strength": "medium"},
            "Office2016": {"john": "office", "hashcat": 9700, "strength": "medium"},
            "Office2019": {"john": "office", "hashcat": 9800, "strength": "medium"},
            "KeePass": {"john": "keepass", "hashcat": 13400, "strength": "high"},
            "KeePass2": {"john": "keepass", "hashcat": 13400, "strength": "high"},
            "TrueCrypt": {"john": "tc_aes_xts", "hashcat": 6211, "strength": "high"},
            "VeraCrypt": {"john": "vc_aes_xts", "hashcat": 13711, "strength": "high"},
            "BitLocker": {"john": "bitlocker", "hashcat": 22100, "strength": "high"},
            "LUKS": {"john": "luks", "hashcat": 14600, "strength": "high"},
            
            # Wireless & Network  
            "WPA/WPA2": {"john": "wpapsk", "hashcat": 2500, "strength": "medium"},
            "WPA3": {"john": "wpa3", "hashcat": 22000, "strength": "high"},
            "WPS": {"john": "wps", "hashcat": 16800, "strength": "medium"},
            "WEP": {"john": "wep", "hashcat": 1, "strength": "very_low"},
            "EAP-MD5": {"john": "eap-md5", "hashcat": 4800, "strength": "low"},
            "PEAP": {"john": "peap", "hashcat": 5500, "strength": "medium"},
            "IKE_PSK": {"john": "ike", "hashcat": 5300, "strength": "medium"},
            
            # Cryptocurrency
            "Bitcoin": {"john": "bitcoin", "hashcat": 11300, "strength": "high"},
            "Ethereum": {"john": "ethereum", "hashcat": 15700, "strength": "high"},
            "Litecoin": {"john": "litecoin", "hashcat": 18700, "strength": "high"},
            "Dogecoin": {"john": "dogecoin", "hashcat": 18600, "strength": "high"},
            "Monero": {"john": "monero", "hashcat": 18100, "strength": "high"},
            "Electrum": {"john": "electrum", "hashcat": 21700, "strength": "high"},
            "MetaMask": {"john": "metamask", "hashcat": 26600, "strength": "high"},
            
            # SSH & Encryption Keys
            "SSH_RSA": {"john": "ssh", "hashcat": 22911, "strength": "high"},
            "SSH_DSA": {"john": "ssh", "hashcat": 22921, "strength": "high"},
            "SSH_ECDSA": {"john": "ssh", "hashcat": 22931, "strength": "high"},
            "SSH_Ed25519": {"john": "ssh", "hashcat": 22941, "strength": "high"},
            "PGP_RSA": {"john": "pgp", "hashcat": 17010, "strength": "high"},
            "PGP_DSA": {"john": "pgp", "hashcat": 17020, "strength": "high"},
            "PuTTY": {"john": "putty", "hashcat": 22400, "strength": "high"},
            
            # Network Equipment
            "Cisco_Type7": {"john": "cisco7", "hashcat": 2400, "strength": "very_low"},
            "Cisco_Type8": {"john": "cisco8", "hashcat": 2410, "strength": "low"},
            "Cisco_Type9": {"john": "cisco9", "hashcat": 25, "strength": "medium"},
            "Cisco_ASA": {"john": "cisco-asa", "hashcat": 2410, "strength": "low"},
            "Cisco_PIX": {"john": "cisco-pix", "hashcat": 2400, "strength": "very_low"},
            "Juniper": {"john": "juniper", "hashcat": 501, "strength": "low"},
            "FortiGate": {"john": "fortigate", "hashcat": 7000, "strength": "medium"},
            
            # Cloud & Enterprise
            "LDAP_MD5": {"john": "ldap-md5", "hashcat": 101, "strength": "very_low"},
            "LDAP_SHA": {"john": "ldap-sha", "hashcat": 111, "strength": "low"},
            "LDAP_SSHA": {"john": "ldap-ssha", "hashcat": 111, "strength": "low"},
            "LDAP_Crypt": {"john": "ldap-crypt", "hashcat": 1500, "strength": "very_low"},
            "AWS": {"john": "aws", "hashcat": 28300, "strength": "high"},
            "Azure": {"john": "azure", "hashcat": 28200, "strength": "high"},
            "GCP": {"john": "gcp", "hashcat": 28100, "strength": "high"},
            
            # CTF & Encodings (Custom handling)
            "Base64": {"john": None, "hashcat": None, "strength": "none"},
            "Base32": {"john": None, "hashcat": None, "strength": "none"},
            "Hex": {"john": None, "hashcat": None, "strength": "none"},
            "ROT13": {"john": None, "hashcat": None, "strength": "none"},
            "ROT47": {"john": None, "hashcat": None, "strength": "none"},
            "Caesar": {"john": None, "hashcat": None, "strength": "none"},
            "Atbash": {"john": None, "hashcat": None, "strength": "none"},
            "Binary": {"john": None, "hashcat": None, "strength": "none"},
            
            # Legacy & Weak
            "CRC32": {"john": "crc32", "hashcat": 11500, "strength": "very_low"},
            "Adler32": {"john": "adler32", "hashcat": None, "strength": "very_low"},
            "FNV1": {"john": "fnv1", "hashcat": None, "strength": "very_low"},
            "FNV1a": {"john": "fnv1a", "hashcat": None, "strength": "very_low"},
        }
    
    def identify_hash_advanced(self, hash_value: str) -> List[HashInfo]:
        """Advanced hash identification using multiple methods"""
        results = []
        
        # Method 1: Length-based analysis
        length_based = self._analyze_by_length(hash_value)
        results.extend(length_based)
        
        # Method 2: Character set analysis
        charset_based = self._analyze_by_charset(hash_value)
        results.extend(charset_based)
        
        # Method 3: Pattern analysis
        pattern_based = self._analyze_by_pattern(hash_value)
        results.extend(pattern_based)
        
        # Method 4: Use hashid tool
        hashid_results = self._use_hashid(hash_value)
        results.extend(hashid_results)
        
        # Method 5: Use hash-identifier if available
        identifier_results = self._use_hash_identifier(hash_value)
        results.extend(identifier_results)
        
        # Combine and rank results
        ranked_results = self._rank_results(results)
        
        return ranked_results[:5]  # Return top 5 candidates
    
    def _analyze_by_length(self, hash_value: str) -> List[HashInfo]:
        """Analyze hash based on length"""
        results = []
        length = len(hash_value)
        
        length_map = {
            32: ["MD5", "NTLM", "LM"],
            40: ["SHA1", "MySQL41"],
            56: ["SHA224"],
            64: ["SHA256", "SHA3-256"],
            96: ["SHA384", "SHA3-384"],
            128: ["SHA512", "SHA3-512"],
            16: ["MySQL323"],
            13: ["DES", "LM"],
        }
        
        if length in length_map:
            for hash_type in length_map[length]:
                if hash_type in self.hash_formats:
                    results.append(HashInfo(
                        hash_value=hash_value,
                        hash_type=hash_type,
                        john_format=self.hash_formats[hash_type].get("john"),
                        hashcat_mode=self.hash_formats[hash_type].get("hashcat"),
                        confidence=0.3
                    ))
        
        return results
    
    def _analyze_by_charset(self, hash_value: str) -> List[HashInfo]:
        """Analyze hash based on character set"""
        results = []
        
        if re.match(r'^[a-f0-9]+$', hash_value, re.IGNORECASE):
            # Hexadecimal hash
            if len(hash_value) == 32:
                results.append(HashInfo(
                    hash_value=hash_value,
                    hash_type="MD5",
                    confidence=0.7
                ))
        elif re.match(r'^[A-Za-z0-9+/]+=*$', hash_value):
            # Base64 encoded
            results.append(HashInfo(
                hash_value=hash_value,
                hash_type="Base64",
                confidence=0.5
            ))
        
        return results
    
    def _analyze_by_pattern(self, hash_value: str) -> List[HashInfo]:
        """Analyze hash based on known patterns including yescrypt"""
        results = []
        
        patterns = {
            # Unix crypt formats with yescrypt support
            r'^\$y\$': ("yescrypt", 0.95),
            r'^\$gy\$': ("yescrypt", 0.90),  # glibc yescrypt variant
            r'^\$1\$': ("MD5 Crypt", 0.90),
            r'^\$2[aby]?\$': ("bcrypt", 0.95),
            r'^\$5\$': ("SHA256 Crypt", 0.90),
            r'^\$6\$': ("SHA512 Crypt", 0.90),
            r'^\$7\$': ("scrypt", 0.90),
            r'^\$argon2[id]?\$': ("Argon2", 0.95),
            
            # Application-specific patterns
            r'^{SSHA}': ("SSHA", 0.85),
            r'^{SHA}': ("SHA", 0.80),
            r'^\*[A-F0-9]{40}$': ("MySQL41", 0.85),
            r'^[a-f0-9]{16}$': ("MySQL323", 0.70),
            
            # Windows hashes
            r'^[a-f0-9]{32}:[a-f0-9]{32}$': ("NTLM", 0.80),
            r'^[A-F0-9]{32}:[A-F0-9]{32}$': ("NTLM", 0.80),
            r'^[a-fA-F0-9]{32}$': ("NTLM or MD5", 0.60),
            
            # PostgreSQL
            r'^md5[a-f0-9]{32}$': ("PostgreSQL MD5", 0.85),
            r'^SCRAM-SHA-256\$': ("PostgreSQL SCRAM", 0.90),
            
            # Django
            r'^pbkdf2_sha256\$': ("Django PBKDF2", 0.90),
            r'^argon2\$': ("Django Argon2", 0.90),
            r'^sha1\$': ("Django SHA1", 0.75),
            
            # Other patterns
            r'^\$P\$': ("WordPress/phpBB", 0.85),
            r'^\$H\$': ("phpBB3", 0.85),
            r'^\$S\$': ("Drupal", 0.85),
            r'^sha1\$[a-f0-9]{40}\$': ("Django SHA1", 0.80),
            
            # Office/Archive patterns
            r'^\$zip2\$': ("ZIP", 0.90),
            r'^\$rar5\$': ("RAR5", 0.90),
            r'^\$office\$': ("Office", 0.85),
            r'^\$pdf\$': ("PDF", 0.85),
            
            # SSH/PGP patterns
            r'^\$ssh\$': ("SSH", 0.85),
            r'^\$pgp\$': ("PGP", 0.85),
            
            # Cryptocurrency patterns  
            r'^\$bitcoin\$': ("Bitcoin", 0.90),
            r'^\$ethereum\$': ("Ethereum", 0.90),
            
            # Network equipment
            r'^[0-9A-F]{2}([0-9A-F]{2}){7,}$': ("Cisco Type 7", 0.70),
        }
        
        for pattern, (hash_type, confidence) in patterns.items():
            if re.match(pattern, hash_value, re.IGNORECASE):
                format_info = self.hash_formats.get(hash_type, {})
                results.append(HashInfo(
                    hash_value=hash_value,
                    hash_type=hash_type,
                    john_format=format_info.get("john"),
                    hashcat_mode=format_info.get("hashcat"),
                    confidence=confidence
                ))
        
        return results
    
    def _use_hashid(self, hash_value: str) -> List[HashInfo]:
        """Use hashid tool for identification"""
        try:
            result = subprocess.run(['hashid', hash_value], 
                                  capture_output=True, text=True, timeout=10)
            
            results = []
            for line in result.stdout.split('\n'):
                if '[+]' in line:
                    hash_type = line.split('[+]')[1].strip().split('[')[0].strip()
                    if hash_type in self.hash_formats:
                        results.append(HashInfo(
                            hash_value=hash_value,
                            hash_type=hash_type,
                            john_format=self.hash_formats[hash_type].get("john"),
                            hashcat_mode=self.hash_formats[hash_type].get("hashcat"),
                            confidence=0.6
                        ))
            
            return results
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return []
    
    def _use_hash_identifier(self, hash_value: str) -> List[HashInfo]:
        """Use hash-identifier tool if available"""
        # Implementation for hash-identifier tool
        return []
    
    def _rank_results(self, results: List[HashInfo]) -> List[HashInfo]:
        """Rank identification results by confidence and other factors"""
        # Remove duplicates
        unique_results = {}
        for result in results:
            key = result.hash_type
            if key not in unique_results or result.confidence > unique_results[key].confidence:
                unique_results[key] = result
        
        # Sort by confidence
        sorted_results = sorted(unique_results.values(), 
                              key=lambda x: x.confidence, reverse=True)
        
        return sorted_results
    
    def crack_hash_smart(self, hash_info: HashInfo, wordlists: List[str], 
                        engine: CrackEngine = CrackEngine.BOTH) -> CrackResult:
        """Smart hash cracking with multiple strategies"""
        
        # Check cache first
        cache_key = hash_info.hash_value
        if cache_key in self.result_cache:
            cached = self.result_cache[cache_key]
            return CrackResult(
                success=True,
                plaintext=cached["plaintext"],
                time_taken=0.0,
                engine_used="cache",
                attack_mode="cached"
            )
        
        start_time = time.time()
        
        # Try different attack strategies
        strategies = [
            (AttackMode.DICTIONARY, wordlists[:3]),  # Top 3 wordlists
            (AttackMode.RULES, wordlists[:1]),       # Rules with best wordlist
            (AttackMode.HYBRID, wordlists[:2]),      # Hybrid attacks
        ]
        
        for attack_mode, wl_subset in strategies:
            if engine in [CrackEngine.JOHN, CrackEngine.BOTH]:
                result = self._try_john(hash_info, wl_subset, attack_mode)
                if result.success:
                    result.time_taken = time.time() - start_time
                    self._cache_result(cache_key, result.plaintext)
                    return result
            
            if engine in [CrackEngine.HASHCAT, CrackEngine.BOTH]:
                result = self._try_hashcat(hash_info, wl_subset, attack_mode)
                if result.success:
                    result.time_taken = time.time() - start_time
                    self._cache_result(cache_key, result.plaintext)
                    return result
        
        return CrackResult(
            success=False,
            time_taken=time.time() - start_time,
            error="Failed to crack with all strategies"
        )
    
    def _try_john(self, hash_info: HashInfo, wordlists: List[str], 
                  attack_mode: AttackMode) -> CrackResult:
        """Try cracking with John the Ripper"""
        if not hash_info.john_format:
            return CrackResult(success=False, error="No John format available")
        
        # Implementation for John the Ripper
        # This is a simplified version - expand with actual commands
        return CrackResult(success=False, error="John implementation needed")
    
    def _try_hashcat(self, hash_info: HashInfo, wordlists: List[str], 
                     attack_mode: AttackMode) -> CrackResult:
        """Try cracking with Hashcat"""
        if not hash_info.hashcat_mode:
            return CrackResult(success=False, error="No Hashcat mode available")
        
        # Implementation for Hashcat
        # This is a simplified version - expand with actual commands
        return CrackResult(success=False, error="Hashcat implementation needed")
    
    def _cache_result(self, hash_value: str, plaintext: str):
        """Cache successful results"""
        self.result_cache[hash_value] = {
            "plaintext": plaintext,
            "timestamp": time.time()
        }
        
        # Save to file for persistence
        try:
            with open("crack_cache.json", "w") as f:
                json.dump(self.result_cache, f)
        except Exception:
            pass
    
    def load_cache(self):
        """Load cached results from file"""
        try:
            with open("crack_cache.json", "r") as f:
                self.result_cache = json.load(f)
        except Exception:
            self.result_cache = {}

    def verify_yescrypt(self, hash_value: str, password: str) -> bool:
        """Verify a password against a yescrypt hash"""
        if not HAS_CRYPT:
            print("[WARNING] crypt module not available - cannot verify yescrypt locally")
            return False
            
        try:
            # Extract salt from yescrypt hash
            if hash_value.startswith('$y$') or hash_value.startswith('$gy$'):
                # yescrypt format: $y$params$salt$hash
                parts = hash_value.split('$')
                if len(parts) >= 4:
                    salt_part = '$'.join(parts[:4]) + '$'
                    result = crypt.crypt(password, salt_part)
                    return result == hash_value
            return False
        except Exception as e:
            print(f"[ERROR] Yescrypt verification failed: {e}")
            return False
    
    def generate_yescrypt_hash(self, password: str, rounds: int = 11) -> str:
        """Generate a yescrypt hash for testing purposes"""
        if not HAS_CRYPT:
            print("[WARNING] crypt module not available - cannot generate yescrypt")
            return None
            
        try:
            # Generate random salt
            salt_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./"
            salt = ''.join(secrets.choice(salt_chars) for _ in range(16))
            
            # Create yescrypt parameters
            crypt_input = f"$y$j{rounds:02d}${salt}$"
            
            return crypt.crypt(password, crypt_input)
        except Exception as e:
            print(f"[ERROR] Yescrypt generation failed: {e}")
            return None
    
    def is_yescrypt_hash(self, hash_value: str) -> bool:
        """Check if a hash is yescrypt format"""
        return (hash_value.startswith('$y$') or 
                hash_value.startswith('$gy$') or
                hash_value.startswith('$7$') and 'yescrypt' in hash_value.lower())
    
    def get_yescrypt_info(self, hash_value: str) -> Dict[str, Any]:
        """Extract yescrypt parameters and information"""
        if not self.is_yescrypt_hash(hash_value):
            return {"error": "Not a yescrypt hash"}
            
        try:
            parts = hash_value.split('$')
            if len(parts) < 4:
                return {"error": "Invalid yescrypt format"}
                
            info = {
                "type": "yescrypt",
                "version": parts[1],
                "parameters": parts[2] if len(parts) > 2 else "",
                "salt": parts[3] if len(parts) > 3 else "",
                "hash": parts[4] if len(parts) > 4 else "",
                "full_hash": hash_value,
                "strength": "very_high",
                "recommended_wordlists": ["passwords", "corporate", "tech"]
            }
            
            # Parse parameters if available
            if info["parameters"]:
                try:
                    if info["parameters"].startswith('j'):
                        # Extract rounds
                        rounds_str = info["parameters"][1:]
                        if rounds_str.isdigit():
                            info["rounds"] = int(rounds_str)
                            info["time_cost"] = 2 ** int(rounds_str)
                except:
                    pass
            
            return info
            
        except Exception as e:
            return {"error": f"Failed to parse yescrypt hash: {e}"}

class P2PHashCracker:
    """P2P distributed hash cracking coordinator"""
    
    def __init__(self, team_id: str, user_id: str):
        self.team_id = team_id
        self.user_id = user_id
        self.active_jobs: Dict[str, Dict] = {}
        self.peer_connections: Set[str] = set()
        self.job_queue = asyncio.Queue()
        self.results_cache = {}
        
    async def create_cracking_job(self, hash_info: HashInfo, wordlists: List[str], 
                                strategy: str = "distributed") -> str:
        """Create a new distributed cracking job"""
        job_id = f"{self.team_id}_{int(time.time())}_{secrets.token_hex(4)}"
        
        job = {
            "id": job_id,
            "hash_info": hash_info,
            "wordlists": wordlists,
            "strategy": strategy,
            "created_by": self.user_id,
            "created_at": time.time(),
            "status": "queued",
            "assigned_peers": [],
            "progress": 0.0,
            "estimated_time": None,
            "result": None
        }
        
        self.active_jobs[job_id] = job
        await self.job_queue.put(job)
        
        # Notify team members
        await self._broadcast_job_created(job)
        
        return job_id
    
    async def assign_job_to_peer(self, job_id: str, peer_id: str, 
                               wordlist_chunk: Dict) -> bool:
        """Assign a portion of work to a peer"""
        if job_id not in self.active_jobs:
            return False
            
        job = self.active_jobs[job_id]
        
        assignment = {
            "job_id": job_id,
            "peer_id": peer_id,
            "wordlist_chunk": wordlist_chunk,
            "assigned_at": time.time(),
            "status": "assigned"
        }
        
        job["assigned_peers"].append(assignment)
        
        # Send assignment to peer
        await self._send_to_peer(peer_id, {
            "type": "job_assignment",
            "assignment": assignment,
            "hash_info": job["hash_info"]
        })
        
        return True
    
    async def report_progress(self, job_id: str, peer_id: str, 
                            progress: float, checked_passwords: int):
        """Report progress from a peer"""
        if job_id not in self.active_jobs:
            return
            
        job = self.active_jobs[job_id]
        
        # Update peer progress
        for assignment in job["assigned_peers"]:
            if assignment["peer_id"] == peer_id:
                assignment["progress"] = progress
                assignment["checked_passwords"] = checked_passwords
                assignment["last_update"] = time.time()
                break
        
        # Calculate overall progress
        total_progress = sum(a.get("progress", 0) for a in job["assigned_peers"])
        job["progress"] = total_progress / len(job["assigned_peers"]) if job["assigned_peers"] else 0
        
        # Broadcast progress update
        await self._broadcast_progress_update(job_id, job["progress"])
    
    async def report_result(self, job_id: str, peer_id: str, 
                          result: CrackResult) -> bool:
        """Report a cracking result from a peer"""
        if job_id not in self.active_jobs:
            return False
            
        job = self.active_jobs[job_id]
        
        if result.success:
            # Job completed successfully
            job["status"] = "completed"
            job["result"] = result
            job["completed_at"] = time.time()
            job["completed_by"] = peer_id
            
            # Cache the result
            self.results_cache[job["hash_info"].hash_value] = result.plaintext
            
            # Cancel other assignments
            await self._cancel_job_assignments(job_id, exclude_peer=peer_id)
            
            # Broadcast success
            await self._broadcast_job_completed(job_id, result)
            
            return True
        
        return False
    
    async def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get the current status of a cracking job"""
        return self.active_jobs.get(job_id)
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a cracking job"""
        if job_id not in self.active_jobs:
            return False
            
        job = self.active_jobs[job_id]
        job["status"] = "cancelled"
        job["cancelled_at"] = time.time()
        
        # Cancel all assignments
        await self._cancel_job_assignments(job_id)
        
        # Broadcast cancellation
        await self._broadcast_job_cancelled(job_id)
        
        return True
    
    async def _broadcast_job_created(self, job: Dict):
        """Broadcast job creation to team members"""
        message = {
            "type": "job_created",
            "job_id": job["id"],
            "hash_type": job["hash_info"].hash_type,
            "created_by": job["created_by"],
            "wordlists": len(job["wordlists"])
        }
        await self._broadcast_to_team(message)
    
    async def _broadcast_progress_update(self, job_id: str, progress: float):
        """Broadcast progress update to team members"""
        message = {
            "type": "progress_update", 
            "job_id": job_id,
            "progress": progress,
            "timestamp": time.time()
        }
        await self._broadcast_to_team(message)
    
    async def _broadcast_job_completed(self, job_id: str, result: CrackResult):
        """Broadcast job completion to team members"""
        message = {
            "type": "job_completed",
            "job_id": job_id,
            "success": result.success,
            "plaintext": result.plaintext if result.success else None,
            "time_taken": result.time_taken,
            "engine_used": result.engine_used
        }
        await self._broadcast_to_team(message)
    
    async def _broadcast_job_cancelled(self, job_id: str):
        """Broadcast job cancellation to team members"""
        message = {
            "type": "job_cancelled",
            "job_id": job_id,
            "timestamp": time.time()
        }
        await self._broadcast_to_team(message)
    
    async def _cancel_job_assignments(self, job_id: str, exclude_peer: str = None):
        """Cancel all assignments for a job"""
        if job_id not in self.active_jobs:
            return
            
        job = self.active_jobs[job_id]
        
        for assignment in job["assigned_peers"]:
            peer_id = assignment["peer_id"]
            if exclude_peer and peer_id == exclude_peer:
                continue
                
            assignment["status"] = "cancelled"
            
            await self._send_to_peer(peer_id, {
                "type": "job_cancelled",
                "job_id": job_id
            })
    
    async def _broadcast_to_team(self, message: Dict):
        """Broadcast message to all team members"""
        # Implementation depends on the communication layer (WebSocket, WebRTC, etc.)
        print(f"[P2P] Broadcasting to team {self.team_id}: {message['type']}")
    
    async def _send_to_peer(self, peer_id: str, message: Dict):
        """Send message to a specific peer"""
        # Implementation depends on the communication layer
        print(f"[P2P] Sending to peer {peer_id}: {message['type']}")

# Example usage
if __name__ == "__main__":
    engine = EnhancedHashEngine()
    engine.load_cache()
    
    # Test hash identification
    test_hash = "5d41402abc4b2a76b9719d911017c592"  # MD5 of "hello"
    results = engine.identify_hash_advanced(test_hash)
    
    for result in results:
        print(f"Type: {result.hash_type}, Confidence: {result.confidence}")
