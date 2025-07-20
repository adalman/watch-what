#!/usr/bin/env python3
"""
Simple WebSocket test client for testing the movie voting WebSocket endpoint

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
   - Find the line: `uri = "ws://localhost:8000/ws/8"`
   - Change "8" to your actual session ID

4. RUN THE TEST:
   ```bash
   python test_websocket.py
   ```

WHAT THIS TEST DOES:
- Basic WebSocket connection test
- Sends test messages to the server
- Receives and displays any response
- Good for testing basic connectivity

TROUBLESHOOTING:
- Make sure the server is running on port 8000
- Verify the session ID matches between the test file and your API calls
- This is a basic connectivity test - use other test files for full event testing
"""

import asyncio
import websockets
import json

async def test_websocket():
    """Test the WebSocket connection"""
    uri = "ws://localhost:8000/ws/8"  # Connect to session 8
    
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            
            # Send a test message
            test_message = "Hello from test client!"
            print(f"Sending: {test_message}")
            await websocket.send(test_message)
            
            # Wait for any response (optional)
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received: {response}")
            except asyncio.TimeoutError:
                print("No response received (this is normal)")
            
            # Send another message
            test_message2 = "This is another test message!"
            print(f"Sending: {test_message2}")
            await websocket.send(test_message2)
            
            # Wait a bit before closing
            await asyncio.sleep(1)
            print("Closing connection...")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing WebSocket Connection")
    print("=" * 40)
    asyncio.run(test_websocket())
    print("=" * 40)
    print("Test completed!") 