from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn
from app.websocket_manager import manager
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect

# Import our modules
from .database import get_db, engine
from .models import Base, Vote
from . import crud
from .schemas import (
    SessionCreate, SessionResponse, SessionWithDetails, SessionStatus,
    ParticipantCreate, ParticipantResponse,
    MovieCreate, MovieResponse,
    VoteCreate, VoteResponse,
    RoundResults, VoteSummary
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Watch What - Movie Voting API",
    description="A real-time movie voting application where participants submit movies and vote to eliminate them round by round",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Watch What - Movie Voting API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Session endpoints
@app.post("/sessions/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    """Create a new voting session"""
    db_session = crud.create_session(db=db, session=session)
    return db_session

@app.get("/sessions/{session_id}", response_model=SessionWithDetails)
async def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get a session with all its participants and movies"""
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@app.get("/sessions/code/{session_code}", response_model=SessionWithDetails)
async def get_session_by_code(session_code: str, db: Session = Depends(get_db)):
    """Get a session by its unique code"""
    db_session = crud.get_session_by_code(db=db, session_code=session_code)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@app.get("/sessions/{session_id}/status", response_model=SessionStatus)
async def get_session_status(session_id: int, db: Session = Depends(get_db)):
    """Get current status and progress of a session"""
    status_summary = crud.get_session_status_summary(db=db, session_id=session_id)
    if status_summary is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return status_summary

# Participant endpoints
@app.post("/sessions/{session_id}/participants/", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
async def join_session(session_id: int, participant: ParticipantCreate, db: Session = Depends(get_db)):
    """Join a session as a participant"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Validate session is in submission phase
    if db_session.status != "submission":
        raise HTTPException(status_code=400, detail="Session is not accepting new participants")
    
    # Create participant
    db_participant = crud.create_participant(db=db, participant=participant)
    
    # Broadcast the participant join to all connected clients
    await manager.broadcast_to_session({
        "type": "participant_joined",
        "session_id": session_id,
        "participant": {
            "id": db_participant.id,
            "name": db_participant.name,
            "session_id": db_participant.session_id
        },
        "message": f"{db_participant.name} joined the session"
    }, session_id)
    
    return db_participant

@app.get("/sessions/{session_id}/participants/", response_model=List[ParticipantResponse])
async def get_session_participants(session_id: int, db: Session = Depends(get_db)):
    """Get all participants in a session"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    participants = crud.get_session_participants(db=db, session_id=session_id)
    return participants

# Movie endpoints
@app.post("/sessions/{session_id}/movies/", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def submit_movie(session_id: int, movie: MovieCreate, db: Session = Depends(get_db)):
    """Submit a movie to a session"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Validate session is in submission phase
    if db_session.status != "submission":
        raise HTTPException(status_code=400, detail="Session is not accepting movie submissions")
    
    # Validate participant exists
    db_participant = crud.get_participant(db=db, participant_id=movie.submitted_by_participant_id)
    if db_participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Create movie
    db_movie = crud.create_movie(db=db, movie=movie)
    
    # Broadcast the movie submission to all connected clients
    await manager.broadcast_to_session({
        "type": "movie_submitted",
        "session_id": session_id,
        "movie": {
            "id": db_movie.id,
            "title": db_movie.title,
            "session_id": db_movie.session_id,
            "submitted_by_participant_id": db_movie.submitted_by_participant_id,
            "eliminated_round": db_movie.eliminated_round,
            "created_at": db_movie.created_at.isoformat() if db_movie.created_at else None
        },
        "message": f"'{db_movie.title}' was submitted by {db_participant.name}"
    }, session_id)
    
    return db_movie

@app.get("/sessions/{session_id}/movies/", response_model=List[MovieResponse])
async def get_session_movies(session_id: int, db: Session = Depends(get_db)):
    """Get all movies in a session"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    movies = crud.get_session_movies(db=db, session_id=session_id)
    return movies

# Voting endpoints
@app.post("/sessions/{session_id}/votes/", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
async def cast_vote(session_id: int, vote: VoteCreate, db: Session = Depends(get_db)):
    """Cast a vote for a movie in a specific round"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Validate session is in voting phase
    if db_session.status not in ["voting", "revote"]:
        raise HTTPException(status_code=400, detail="Session is not in voting phase")
    
    # Validate participant exists
    db_participant = crud.get_participant(db=db, participant_id=vote.participant_id)
    if db_participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Validate movie exists and is active
    db_movie = crud.get_movie(db=db, movie_id=vote.movie_id)
    if db_movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    if db_movie.eliminated_round is not None:
        raise HTTPException(status_code=400, detail="Cannot vote for eliminated movie")
    
    # Check if participant already voted for this specific movie in this round
    from sqlalchemy import and_
    existing_vote = db.query(Vote).filter(
        and_(Vote.participant_id == vote.participant_id, 
             Vote.movie_id == vote.movie_id, 
             Vote.round == vote.round)
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="Participant already voted for this movie in this round")
    
    # Create vote
    db_vote = crud.create_vote(db=db, vote=vote)

    # Get round results
    round_results = get_round_results(db, session_id, vote.round)
    vote_summaries = [
        {"movie_id": v["movie_id"], "movie_title": v["movie_title"], "vote_count": v["vote_count"], "round": v["round"]}
        for v in round_results["votes"]
    ]

    # Broadcast the vote to all connected clients
    await manager.broadcast_to_session({
        "type": "vote_cast",
        "session_id": session_id,
        "vote": {
            "movie_id": vote.movie_id,
            "participant_id": vote.participant_id,
            "round": vote.round
        },
        "vote_summaries": vote_summaries,
        "message": f"{db_participant.name} voted for {db_movie.title}"
    }, session_id)
    
    return db_vote

@app.get("/sessions/{session_id}/votes/round/{round_number}", response_model=RoundResults)
async def get_round_results(session_id: int, round_number: int, db: Session = Depends(get_db)):
    """Get voting results for a specific round"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    results = crud.get_round_results(db=db, session_id=session_id, round_number=round_number)
    return results

@app.get("/sessions/{session_id}/votes/", response_model=List[VoteResponse])
async def get_session_votes(session_id: int, db: Session = Depends(get_db)):
    """Get all votes in a session"""
    # Validate session exists
    db_session = crud.get_session(db=db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    votes = crud.get_session_votes(db=db, session_id=session_id)
    return votes

# Session management endpoints
@app.put("/sessions/{session_id}/status")
async def update_session_status(session_id: int, status: str = Query(..., description="New session status"), db: Session = Depends(get_db)):
    """Update session status (submission -> voting -> revote -> finished)"""
    # Validate status values
    valid_statuses = ["submission", "voting", "revote", "finished"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Update session status
    db_session = crud.update_session_status(db=db, session_id=session_id, status=status)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Broadcast the status update to all connected clients
    await manager.broadcast_to_session({
        "type": "session_status_updated",
        "session_id": session_id,
        "status": status
    }, session_id)
    
    return {"message": f"Session status updated to {status}", "session_id": session_id}

@app.post("/sessions/{session_id}/next-round")
async def advance_to_next_round(session_id: int, db: Session = Depends(get_db)):
    """Advance session to the next voting round"""
    # Advance to next round
    result = crud.advance_session_round(db=db, session_id=session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db_session = result["session"]
    eliminated_movies = result["eliminated_movies"]
    old_round = result["old_round"]
    new_round = result["new_round"]
    winner = result["winner"]
    
    # Broadcast eliminated movies
    for movie in eliminated_movies:
        await manager.broadcast_to_session({
            "type": "movie_eliminated",
            "session_id": session_id,
            "movie": movie,
            "message": f"'{movie['title']}' was eliminated with {movie['vote_count']} vote(s) in round {old_round}"
        }, session_id)
    
    # Broadcast round advancement
    await manager.broadcast_to_session({
        "type": "round_advanced",
        "session_id": session_id,
        "old_round": old_round,
        "new_round": new_round,
        "eliminated_count": len(eliminated_movies),
        "message": f"Advanced to round {new_round}" + (f" - {len(eliminated_movies)} movie(s) eliminated" if eliminated_movies else "")
    }, session_id)
    
    # Broadcast session finished if there's a winner
    if winner:
        await manager.broadcast_to_session({
            "type": "session_finished",
            "session_id": session_id,
            "winner": winner,
            "message": f"'{winner['title']}' is the winner!"
        }, session_id)
    
    return {
        "message": f"Advanced to round {db_session.current_round}",
        "session_id": session_id,
        "current_round": db_session.current_round,
        "status": db_session.status,
        "eliminated_movies": eliminated_movies,
        "winner": winner
    }

# WebSocket endpoints
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    # Accept the WebSocket connection
    await manager.connect(websocket, session_id)

    try:
        while True:
            message = await websocket.receive_text()
            process_message(message)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client disconnected for session {session_id}")
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        manager.disconnect(websocket)

def process_message(message: str):
    """Process incoming messages from the WebSocket"""
    print(f"Received message: {message}")

# Error handlers
from fastapi.responses import JSONResponse

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found", "detail": str(exc)}
    )

@app.exception_handler(422)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "detail": str(exc)}
    )

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
