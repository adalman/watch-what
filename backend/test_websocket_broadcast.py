#!/usr/bin/env python3
"""
Enhanced WebSocket test client for testing real-time vote broadcasting

HOW TO USE THIS TEST:
====================

1. START THE SERVER:
   ```bash
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. CREATE A TEST SESSION:
   ```bash
   # Create session
   curl -X POST "http://localhost:8000/sessions/" -H "Content-Type: application/json" -d '{"status": "submission", "current_round": 1}'
   
   # Add participants (replace SESSION_ID with the ID from step above)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/participants/" -H "Content-Type: application/json" -d '{"name": "Alice", "session_id": SESSION_ID}'
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/participants/" -H "Content-Type: application/json" -d '{"name": "Bob", "session_id": SESSION_ID}'
   
   # Add movies (replace SESSION_ID and PARTICIPANT_IDs)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/movies/" -H "Content-Type: application/json" -d '{"title": "Inception", "session_id": SESSION_ID, "submitted_by_participant_id": PARTICIPANT_ID}'
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/movies/" -H "Content-Type: application/json" -d '{"title": "The Matrix", "session_id": SESSION_ID, "submitted_by_participant_id": PARTICIPANT_ID}'
   
   # Start voting
   curl -X PUT "http://localhost:8000/sessions/SESSION_ID/status?status=voting"
   ```

3. UPDATE THE SESSION ID IN THIS FILE:
   - Find the line: `uri = "ws://localhost:8000/ws/9"`
   - Change "9" to your actual session ID

4. RUN THE TEST:
   ```bash
   python test_websocket_broadcast.py
   ```

5. TRIGGER EVENTS (in another terminal):
   ```bash
   # Cast votes (replace SESSION_ID, MOVIE_ID, PARTICIPANT_ID)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/votes/" -H "Content-Type: application/json" -d '{"movie_id": MOVIE_ID, "round": 1, "participant_id": PARTICIPANT_ID, "session_id": SESSION_ID}'
   
   # Advance round
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/next-round"
   ```

WHAT THIS TEST DOES:
- Connects to WebSocket and listens continuously
- Displays all vote_cast events with detailed information
- Shows timeout messages with helpful curl commands
- Keeps running until manually stopped (Ctrl+C)

EVENT TYPES YOU'LL SEE:
- vote_cast: When someone votes (with participant and movie names)

TROUBLESHOOTING:
- Make sure the server is running on port 8000
- Verify the session ID matches between the test file and your API calls
- Check that the session is in "voting" status before casting votes
- This test runs continuously - use Ctrl+C to stop it
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_websocket_broadcast():
    """Test the WebSocket connection and receive broadcast messages"""
    uri = "ws://localhost:8000/ws/9"  # Connect to session 9
    
    print(f"Connecting to {uri}...")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 60)
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            print("Listening for broadcast messages...")
            print("Cast a vote via REST API to see real-time updates!")
            print("-" * 60)
            
            # Keep listening for messages
            while True:
                try:
                    # Wait for messages from server
                    message = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    
                    # Parse and display the message
                    try:
                        data = json.loads(message)
                        print(f"Received broadcast at {datetime.now().strftime('%H:%M:%S')}:")
                        print(f"   Type: {data.get('type', 'unknown')}")
                        print(f"   Session: {data.get('session_id', 'unknown')}")
                        print(f"   Message: {data.get('message', 'No message')}")
                        
                        if 'vote' in data:
                            vote = data['vote']
                            print(f"   Vote Details:")
                            print(f"     - Movie ID: {vote.get('movie_id')}")
                            print(f"     - Participant ID: {vote.get('participant_id')}")
                            print(f"     - Round: {vote.get('round')}")
                        
                        print("-" * 60)
                        
                    except json.JSONDecodeError:
                        print(f"Received text message: {message}")
                        print("-" * 60)
                        
                except asyncio.TimeoutError:
                    print(f"No messages received in 30 seconds... (still listening)")
                    print("Try casting a vote via: curl -X POST 'http://localhost:8000/sessions/9/votes/' -H 'Content-Type: application/json' -d '{\"movie_id\": 17, \"round\": 1, \"participant_id\": 17, \"session_id\": 9}'")
                    print("-" * 60)
                    
    except KeyboardInterrupt:
        print("\nTest stopped by user")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Real-Time Vote Broadcasting")
    print("=" * 60)
    asyncio.run(test_websocket_broadcast())
    print("=" * 60)
    print("Test completed!") 