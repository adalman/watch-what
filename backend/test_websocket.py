#!/usr/bin/env python3
"""
Simple WebSocket test client for testing the movie voting WebSocket endpoint
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
            print("✅ Connected successfully!")
            
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
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing WebSocket Connection")
    print("=" * 40)
    asyncio.run(test_websocket())
    print("=" * 40)
    print("Test completed!") 