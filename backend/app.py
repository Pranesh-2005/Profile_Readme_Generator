from flask import Flask, request, jsonify
from flask_cors import CORS
from generator import fetch_profile_readme_fast, generate_readme, cleanup_cache
import os
import time
import threading
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

# Background thread for cache cleanup
def periodic_cleanup():
    """Clean up expired cache entries every 10 minutes."""
    while True:
        time.sleep(600)  # 10 minutes
        cleanup_cache()

# Start cleanup thread
cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
cleanup_thread.start()

@app.route("/generate", methods=["POST"])
def gen():
    """Generate GitHub profile README with enhanced error handling."""
    try:
        # Validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON data required"}), 400
        
        username = data.get("username", "").strip()
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Basic username validation
        if len(username) > 39 or not username.replace("-", "").replace("_", "").isalnum():
            return jsonify({"error": "Invalid GitHub username format"}), 400
        
        # Generate README
        start_time = time.time()
        existing = fetch_profile_readme_fast(username)
        new_md = generate_readme(existing, username)
        generation_time = round(time.time() - start_time, 2)
        
        if not new_md or len(new_md.strip()) < 50:
            return jsonify({"error": "Failed to generate README content"}), 500
        
        return jsonify({
            "readme": new_md,
            "generation_time": generation_time,
            "cached": existing != "",
            "username": username
        })
        
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error occurred"}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    try:
        from generator import user_cache
        return jsonify({
            "status": "healthy",
            "timestamp": int(time.time()),
            "cache_size": len(user_cache)
        })
    except:
        return jsonify({
            "status": "healthy",
            "timestamp": int(time.time()),
            "cache_size": 0
        })

@app.route("/", methods=["GET"])
def root():
    """Root endpoint with API info."""
    return jsonify({
        "service": "GitHub Profile README Generator",
        "version": "2.0",
        "endpoints": {
            "POST /generate": "Generate README for GitHub user",
            "GET /health": "Service health check",
            "GET /": "API information"
        },
        "usage": {
            "method": "POST",
            "url": "/generate",
            "body": {"username": "github_username"},
            "response": {
                "readme": "Generated README content",
                "generation_time": "Time taken in seconds",
                "cached": "Whether existing README was found",
                "username": "Processed username"
            }
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    
    print(f"🚀 Starting Profile README Generator...")
    print(f"📍 Server: http://localhost:{port}")
    print(f"🔧 Debug mode: {debug}")
    
    app.run(host="0.0.0.0", port=port, debug=debug)