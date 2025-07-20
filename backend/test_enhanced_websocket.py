#!/usr/bin/env python3
"""
Enhanced WebSocket test client for testing all real-time events

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
   
   # Start voting
   curl -X PUT "http://localhost:8000/sessions/SESSION_ID/status?status=voting"
   ```

3. UPDATE THE SESSION ID IN THIS FILE:
   - Find the line: `uri = "ws://localhost:8000/ws/11"`
   - Change "11" to your actual session ID

4. RUN THE TEST:
   ```bash
   python test_enhanced_websocket.py
   ```

5. TRIGGER EVENTS (in another terminal):
   ```bash
   # Cast votes (replace SESSION_ID, MOVIE_ID, PARTICIPANT_ID)
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/votes/" -H "Content-Type: application/json" -d '{"movie_id": MOVIE_ID, "round": 1, "participant_id": PARTICIPANT_ID, "session_id": SESSION_ID}'
   
   # Advance round
   curl -X POST "http://localhost:8000/sessions/SESSION_ID/next-round"
   ```

EVENT TYPES YOU'LL SEE:
- participant_joined: When someone joins the session
- movie_submitted: When a movie is submitted
- vote_cast: When someone votes
- movie_eliminated: When a movie gets eliminated  
- round_advanced: When moving to next round
- session_finished: When a winner is determined

TROUBLESHOOTING:
- Make sure the server is running on port 8000
- Verify the session ID matches between the test file and your API calls
- Check that the session is in "voting" status before casting votes
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_enhanced_websocket():
    """Test the WebSocket connection and receive all types of broadcast messages"""
    uri = "ws://localhost:8000/ws/12"  # Connect to session 12
    
    print(f"Connecting to {uri}...")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 70)
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            print("Listening for enhanced broadcast messages...")
            print("Event types to watch for:")
            print("   • participant_joined - When someone joins the session")
            print("   • movie_submitted - When a movie is submitted")
            print("   • vote_cast - When someone votes")
            print("   • movie_eliminated - When a movie gets eliminated")
            print("   • round_advanced - When moving to next round")
            print("   • session_finished - When a winner is determined")
            print("-" * 70)
            
            # Keep listening for messages
            while True:
                try:
                    # Wait for messages from server
                    message = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    
                    # Parse and display the message
                    try:
                        data = json.loads(message)
                        event_type = data.get('type', 'unknown')
                        timestamp = datetime.now().strftime('%H:%M:%S')
                        
                        print(f"[{timestamp}] Received {event_type.upper()} event:")
                        print(f"   Session: {data.get('session_id', 'unknown')}")
                        print(f"   Message: {data.get('message', 'No message')}")
                        
                        # Handle different event types
                        if event_type == "participant_joined":
                            participant = data.get('participant', {})
                            print(f"   Participant Details:")
                            print(f"     - Name: {participant.get('name')}")
                            print(f"     - ID: {participant.get('id')}")
                            print(f"     - Session ID: {participant.get('session_id')}")
                            
                        elif event_type == "movie_submitted":
                            movie = data.get('movie', {})
                            print(f"   Movie Details:")
                            print(f"     - Title: {movie.get('title')}")
                            print(f"     - ID: {movie.get('id')}")
                            print(f"     - Submitted by Participant ID: {movie.get('submitted_by_participant_id')}")
                            
                        elif event_type == "vote_cast":
                            vote = data.get('vote', {})
                            print(f"   Vote Details:")
                            print(f"     - Movie ID: {vote.get('movie_id')}")
                            print(f"     - Participant ID: {vote.get('participant_id')}")
                            print(f"     - Round: {vote.get('round')}")
                            
                        elif event_type == "movie_eliminated":
                            movie = data.get('movie', {})
                            print(f"   Elimination Details:")
                            print(f"     - Movie: {movie.get('title')}")
                            print(f"     - Vote Count: {movie.get('vote_count')}")
                            print(f"     - Eliminated Round: {movie.get('eliminated_round')}")
                            
                        elif event_type == "round_advanced":
                            print(f"   Round Details:")
                            print(f"     - Old Round: {data.get('old_round')}")
                            print(f"     - New Round: {data.get('new_round')}")
                            print(f"     - Movies Eliminated: {data.get('eliminated_count')}")
                            
                        elif event_type == "session_finished":
                            winner = data.get('winner', {})
                            print(f"   Winner Details:")
                            print(f"     - Winner: {winner.get('title')}")
                            print(f"     - Movie ID: {winner.get('movie_id')}")
                            
                        print("-" * 70)
                        
                    except json.JSONDecodeError:
                        print(f"Received text message: {message}")
                        print("-" * 70)
                        
                except asyncio.TimeoutError:
                    print(f"No messages received in 30 seconds... (still listening)")
                    print("Try these actions to trigger events:")
                    print("   1. Cast a vote: curl -X POST 'http://localhost:8000/sessions/10/votes/' -H 'Content-Type: application/json' -d '{\"movie_id\": 18, \"round\": 1, \"participant_id\": 18, \"session_id\": 10}'")
                    print("   2. Advance round: curl -X POST 'http://localhost:8000/sessions/10/next-round'")
                    print("-" * 70)
                    
    except KeyboardInterrupt:
        print("\nTest stopped by user")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Enhanced WebSocket Events")
    print("=" * 70)
    asyncio.run(test_enhanced_websocket())
    print("=" * 70)
    print("Test completed!") 