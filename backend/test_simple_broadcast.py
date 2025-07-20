#!/usr/bin/env python3
"""
Simple test to verify WebSocket broadcasting works
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
            print("✅ Connected! Waiting for broadcasts...")
            
            # Wait a moment, then cast a vote
            await asyncio.sleep(2)
            
            print("🎯 Casting a vote to trigger broadcast...")
            # We'll cast a vote via REST API in another terminal
            
            # Listen for the broadcast
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                print(f"📨 Received broadcast: {message}")
                
                # Parse the JSON
                data = json.loads(message)
                print(f"✅ Broadcast received!")
                print(f"   Type: {data.get('type')}")
                print(f"   Message: {data.get('message')}")
                
            except asyncio.TimeoutError:
                print("⏰ No broadcast received in 10 seconds")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Simple Broadcast Test")
    print("=" * 40)
    asyncio.run(test_broadcast())
    print("=" * 40) 