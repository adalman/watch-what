"""
WebSocket Connection Manager

This module manages WebSocket connections for real-time updates
in the movie voting application.
"""

import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates.
    
    This class handles:
    - Storing active connections
    - Broadcasting messages to all connections
    - Broadcasting messages to specific sessions
    - Handling connection/disconnection
    """
    
    def __init__(self):
        # Store all active connections
        self.active_connections: List[WebSocket] = []
        
        # Store connections by session (session_id -> set of connections)
        self.session_connections: Dict[int, Set[WebSocket]] = {}
        
        # Store session info for each connection
        self.connection_sessions: Dict[WebSocket, int] = {}
    
    async def connect(self, websocket: WebSocket, session_id: int):
        """
        Accept a new WebSocket connection and associate it with a session.
        
        Args:
            websocket: The WebSocket connection
            session_id: The session ID this connection belongs to
        """
        await websocket.accept()
        
        # Add to active connections
        self.active_connections.append(websocket)
        
        # Add to session connections
        if session_id not in self.session_connections:
            self.session_connections[session_id] = set()
        self.session_connections[session_id].add(websocket)
        
        # Store session info for this connection
        self.connection_sessions[websocket] = session_id
        
        logger.info(f"WebSocket connected for session {session_id}. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from all tracking.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        # Remove from active connections
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from session connections
        session_id = self.connection_sessions.get(websocket)
        if session_id and session_id in self.session_connections:
            self.session_connections[session_id].discard(websocket)
            
            # Clean up empty session
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
        
        # Remove session info
        if websocket in self.connection_sessions:
            del self.connection_sessions[websocket]
        
        logger.info(f"WebSocket disconnected from session {session_id}. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.
        
        Args:
            message: The message to send (will be converted to JSON)
            websocket: The target WebSocket connection
        """
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """
        Send a message to all active WebSocket connections.
        
        Args:
            message: The message to broadcast (will be converted to JSON)
        """
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_to_session(self, message: dict, session_id: int):
        """
        Send a message to all connections in a specific session.
        
        Args:
            message: The message to broadcast (will be converted to JSON)
            session_id: The session ID to broadcast to
        """
        if session_id not in self.session_connections:
            return
        
        disconnected = []
        
        for connection in self.session_connections[session_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to session {session_id}: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    def get_session_connection_count(self, session_id: int) -> int:
        """
        Get the number of active connections for a session.
        
        Args:
            session_id: The session ID to check
            
        Returns:
            Number of active connections for the session
        """
        return len(self.session_connections.get(session_id, set()))
    
    def get_total_connection_count(self) -> int:
        """
        Get the total number of active connections.
        
        Returns:
            Total number of active connections
        """
        return len(self.active_connections)

# Create a global instance of the connection manager
manager = ConnectionManager() 