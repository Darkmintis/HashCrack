#!/usr/bin/env python3
# HashCrack - Web Interface
# Provides a simple web UI for the HashCrack tool

from flask import Flask, render_template, request, jsonify
import os
import tempfile
import logging
from hashcrack import HashCrack
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes with all origins, especially for Live Server
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Enable debug mode for development
app.config['DEBUG'] = True

# Increase maximum file upload size to 100MB
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

# Ensure the wordlists directory exists
os.makedirs('wordlists', exist_ok=True)

@app.route('/')
def index():
    """Render the main page"""
    # Get available wordlists
    wordlists = []
    for file in os.listdir('wordlists'):
        if os.path.isfile(os.path.join('wordlists', file)):
            wordlists.append(file)
    
    return render_template('index.html', wordlists=wordlists)

@app.route('/crack', methods=['POST', 'OPTIONS'])
def crack():
    """API endpoint to crack a hash"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
        
    # Get hash from request
    hash_value = request.form.get('hash')
    wordlist = request.form.get('wordlist')
    
    if not hash_value:
        response = jsonify({"success": False, "error": "No hash provided"})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 400
    
    if not wordlist:
        wordlist = "wordlists/rockyou.txt"
    else:
        wordlist = f"wordlists/{wordlist}"
    
    # Create a temporary file for the hash
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
        tmp.write(hash_value)
        tmp_path = tmp.name
    
    try:
        # Initialize and run the cracker
        cracker = HashCrack(
            input_file=tmp_path,
            wordlist=wordlist,
            single_hash=None,
            verbose=True
        )
        
        # Run the cracker and get results
        hash_type = cracker.identify_hash()
        results = cracker.crack_hash()
        
        response = jsonify({
            "success": True,
            "hash_type": hash_type,
            "john_format": cracker.john_format,
            "results": results
        })
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 200
    except Exception as e:
        response = jsonify({"success": False, "error": str(e)})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 500
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route('/upload_wordlist', methods=['POST', 'OPTIONS'])
def upload_wordlist():
    """API endpoint to upload a custom wordlist"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
        
    try:
        app.logger.info(f"Upload request received: {request.method}")
        app.logger.info(f"Request files: {request.files}")
        
        if 'wordlist' not in request.files:
            app.logger.error("No file part in request")
            response = jsonify({"success": False, "error": "No file part"})
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response, 400
        
        file = request.files['wordlist']
        
        if file.filename == '':
            app.logger.error("No selected file")
            response = jsonify({"success": False, "error": "No selected file"})
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response, 400
        
        if file:
            # Make sure the wordlists directory exists
            os.makedirs('wordlists', exist_ok=True)
            
            # Sanitize filename to prevent path traversal
            safe_filename = os.path.basename(file.filename)
            filepath = os.path.join('wordlists', safe_filename)
            
            # Save the file
            file.save(filepath)
            
            # Verify the file was saved correctly
            if os.path.exists(filepath):
                app.logger.info(f"File saved successfully: {filepath}")
                response = jsonify({"success": True, "filename": safe_filename})
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response, 200
            else:
                app.logger.error(f"Failed to save file: {filepath}")
                response = jsonify({"success": False, "error": "Failed to save file"})
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response, 500
        
        app.logger.error("Unknown error in file upload")
        response = jsonify({"success": False, "error": "Unknown error"})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 500
    except Exception as e:
        app.logger.error(f"Error uploading wordlist: {str(e)}")
        response = jsonify({"success": False, "error": f"Server error: {str(e)}"})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
