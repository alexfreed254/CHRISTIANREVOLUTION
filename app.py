"""
Entry point for Render / gunicorn.
Exposes the Flask app (SocketIO attached via threading mode).
"""
from backend.app import app, socketio

if __name__ == '__main__':
    port = int(__import__('os').environ.get('PORT', 8000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)
