#!/usr/bin/env python3
"""
Simple test to verify WebSocket broadcasting works

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
   
   # Add participant (replace SESSION_ID with the ID from step above)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/participants/" -H "Content-Type: application/json" -d '{"name": "Alice", "session_id": SESSION_ID}'
   
   # Add movie (replace SESSION_ID and PARTICIPANT_ID)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/movies/" -H "Content-Type: application/json" -d '{"title": "Inception", "session_id": SESSION_ID, "submitted_by_participant_id": PARTICIPANT_ID}'
   
   # Start voting
   curl -X PUT "http://localhost:8000/sessions/SESSION_ID/status?status=voting"
   ```

3. UPDATE THE SESSION ID IN THIS FILE:
   - Find the line: `uri = "ws://localhost:8000/ws/10"`
   - Change "10" to your actual session ID

4. RUN THE TEST:
   ```bash
   python test_simple_broadcast.py
   ```

5. TRIGGER A VOTE (in another terminal):
   ```bash
   # Cast a vote (replace SESSION_ID, MOVIE_ID, PARTICIPANT_ID)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/votes/" -H "Content-Type: application/json" -d '{"movie_id": MOVIE_ID, "round": 1, "participant_id": PARTICIPANT_ID, "session_id": SESSION_ID}'
   ```

WHAT THIS TEST DOES:
- Connects to WebSocket
- Waits for a vote_cast event
- Displays the broadcast message
- Exits after receiving one event

TROUBLESHOOTING:
- Make sure the server is running on port 8000
- Verify the session ID matches between the test file and your API calls
- Check that the session is in "voting" status before casting votes
"""

import asyncio
import websockets
import json
import time

async def test_broadcast():
    """Test WebSocket broadcasting"""
    uri = "ws://localhost:8000/ws/10"
    
    print("🔌 Connecting to WebSocket...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Waiting for broadcasts...")
            
            # Wait a moment, then cast a vote
            await asyncio.sleep(2)
            
            print("Casting a vote to trigger broadcast...")
            # We'll cast a vote via REST API in another terminal
            
            # Listen for the broadcast
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                print(f"Received broadcast: {message}")
                
                # Parse the JSON
                data = json.loads(message)
                print(f"Broadcast received!")
                print(f"   Type: {data.get('type')}")
                print(f"   Message: {data.get('message')}")
                
            except asyncio.TimeoutError:
                print("⏰ No broadcast received in 10 seconds")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("🧪 Simple Broadcast Test")
    print("=" * 40)
    asyncio.run(test_broadcast())
    print("=" * 40) 