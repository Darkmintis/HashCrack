#!/usr/bin/env python3
# HashCrack - All-in-One Hash Cracking Tool
# CLI version

import argparse
import subprocess
import os
import sys
import re
from typing import List, Dict, Optional, Tuple

class HashCrack:
    """Main class for the HashCrack tool"""
    
    def __init__(self, input_file: str, wordlist: str, output_file: Optional[str] = None,
                single_hash: Optional[str] = None, verbose: bool = False):
        """Initialize the HashCrack tool
        
        Args:
            input_file: Path to file containing hashes to crack
            wordlist: Path to wordlist file
            output_file: Path to output file (optional)
            single_hash: Single hash to crack instead of file (optional)
            verbose: Enable verbose output
        """
        self.input_file = input_file
        self.wordlist = wordlist
        self.output_file = output_file
        self.single_hash = single_hash
        self.verbose = verbose
        self.hash_type = None
        self.john_format = None
        
    def check_dependencies(self) -> bool:
        """Check if required dependencies are installed
        
        Returns:
            bool: True if all dependencies are installed, False otherwise
        """
        dependencies = ['john', 'hashid']
        missing = []
        
        for dep in dependencies:
            try:
                subprocess.run([dep, '--version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if self.verbose:
                    print(f"[OK] {dep} is installed")
            except FileNotFoundError:
                missing.append(dep)
                
        if missing:
            print(f"[ERROR] Missing dependencies: {', '.join(missing)}")
            print("Run setup script to install dependencies")
            return False
        
        return True
    
    def identify_hash(self) -> str:
        """Identify hash type using hashid
        
        Returns:
            str: Identified hash type
        """
        if self.single_hash:
            hash_to_identify = self.single_hash
        else:
            # Read first hash from file
            with open(self.input_file, 'r') as f:
                hash_to_identify = f.readline().strip()
        
        # Run hashid to identify hash
        result = subprocess.run(['hashid', hash_to_identify], 
                                capture_output=True, text=True)
        
        # Parse output to get hash type
        output = result.stdout
        
        # Try to find a match
        matches = re.findall(r'^\[+\] (.+?)[ \[:]', output, re.MULTILINE)
        
        if matches:
            self.hash_type = matches[0]
            self.map_to_john_format()
            return self.hash_type
        else:
            print("[WARNING] Could not identify hash type")
            return "Unknown"
    
    def map_to_john_format(self) -> str:
        """Map identified hash type to john format
        
        Returns:
            str: John format
        """
        # Mapping of hash types to john formats
        hash_to_john = {
            'MD5': 'raw-md5',
            'SHA1': 'raw-sha1',
            'SHA256': 'raw-sha256',
            'SHA512': 'raw-sha512',
            'NTLM': 'nt',
            'MySQL': 'mysql',
            # Add more mappings as needed
        }
        
        # Extract the base hash name (e.g., "MD5" from "MD5 [...]")
        base_hash = self.hash_type.split()[0]
        
        if base_hash in hash_to_john:
            self.john_format = hash_to_john[base_hash]
            return self.john_format
        else:
            print(f"[WARNING] No john format mapping for {base_hash}")
            return None
    
    def crack_hash(self) -> Dict:
        """Crack the hash using john
        
        Returns:
            dict: Results of cracking
        """
        if not self.john_format:
            print("[ERROR] Cannot crack hash: format unknown")
            return {"success": False, "error": "Unknown hash format"}
        
        print(f"[INFO] Hash identified: {self.hash_type}")
        print(f"[INFO] Cracking using: {self.john_format}")
        
        # Prepare the input for John
        input_path = self.input_file
        if self.single_hash:
            # Create a temporary file with the hash
            temp_file = "temp_hash.txt"
            with open(temp_file, 'w') as f:
                f.write(self.single_hash)
            input_path = temp_file
        
        # Run john to crack the hash
        cmd = [
            'john', 
            f'--format={self.john_format}', 
            f'--wordlist={self.wordlist}',
            input_path
        ]
        
        if self.verbose:
            print(f"Executing: {' '.join(cmd)}")
            
        process = subprocess.run(cmd, capture_output=True, text=True)
        
        # Check the output
        if process.returncode != 0:
            print(f"[ERROR] Error running john: {process.stderr}")
            return {"success": False, "error": process.stderr}
        
        # Show the cracked passwords
        show_cmd = ['john', '--show', f'--format={self.john_format}', input_path]
        show_process = subprocess.run(show_cmd, capture_output=True, text=True)
        
        results = {"success": True, "command": " ".join(cmd), "output": show_process.stdout}
        
        # Clean up temporary file if used
        if self.single_hash and os.path.exists(temp_file):
            os.remove(temp_file)
            
        return results
    
    def run(self) -> Dict:
        """Run the full hash cracking process
        
        Returns:
            dict: Results of the process
        """
        if not self.check_dependencies():
            return {"success": False, "error": "Missing dependencies"}
        
        self.identify_hash()
        results = self.crack_hash()
        
        if results["success"]:
            print("[SUCCESS] Cracking complete!")
            print(results["output"])
            
            # Save output if requested
            if self.output_file:
                with open(self.output_file, 'w') as f:
                    f.write(f"Hash identified: {self.hash_type}\n")
                    f.write(f"Cracking using: {self.john_format}\n")
                    f.write(f"Command: {results['command']}\n\n")
                    f.write(results["output"])
                print(f"[INFO] Results saved to {self.output_file}")
        
        return results


def main():
    """Main entry point for the CLI tool"""
    parser = argparse.ArgumentParser(description="HashCrack - All-in-One Hash Cracking Tool")
    
    # Input options (file or hash)
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--input', '-i', help='Input file containing hashes')
    input_group.add_argument('--hash', '-H', help='Single hash to crack')
    
    # Other options
    parser.add_argument('--wordlist', '-w', required=True, help='Path to wordlist file')
    parser.add_argument('--output', '-o', help='Output file for results')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Initialize and run the cracker
    cracker = HashCrack(
        input_file=args.input,
        wordlist=args.wordlist,
        output_file=args.output,
        single_hash=args.hash,
        verbose=args.verbose
    )
    
    cracker.run()


if __name__ == "__main__":
    main()
