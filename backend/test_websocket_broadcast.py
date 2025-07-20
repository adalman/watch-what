#!/usr/bin/env python3
"""
Enhanced WebSocket test client for testing real-time vote broadcasting
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_websocket_broadcast():
    """Test the WebSocket connection and receive broadcast messages"""
    uri = "ws://localhost:8000/ws/9"  # Connect to session 9
    
    print(f"🔌 Connecting to {uri}...")
    print(f"⏰ Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 60)
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected successfully!")
            print("📡 Listening for broadcast messages...")
            print("💡 Cast a vote via REST API to see real-time updates!")
            print("-" * 60)
            
            # Keep listening for messages
            while True:
                try:
                    # Wait for messages from server
                    message = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    
                    # Parse and display the message
                    try:
                        data = json.loads(message)
                        print(f"📨 Received broadcast at {datetime.now().strftime('%H:%M:%S')}:")
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
                        print(f"📨 Received text message: {message}")
                        print("-" * 60)
                        
                except asyncio.TimeoutError:
                    print(f"⏰ No messages received in 30 seconds... (still listening)")
                    print("💡 Try casting a vote via: curl -X POST 'http://localhost:8000/sessions/9/votes/' -H 'Content-Type: application/json' -d '{\"movie_id\": 17, \"round\": 1, \"participant_id\": 17, \"session_id\": 9}'")
                    print("-" * 60)
                    
    except KeyboardInterrupt:
        print("\n🛑 Test stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing Real-Time Vote Broadcasting")
    print("=" * 60)
    asyncio.run(test_websocket_broadcast())
    print("=" * 60)
    print("Test completed!") 