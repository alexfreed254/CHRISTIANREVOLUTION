"""
Entry point for Render deployment
Imports the Flask app from backend/app.py
"""
from backend.app import app, socketio

if __name__ == '__main__':
    # For local development
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
