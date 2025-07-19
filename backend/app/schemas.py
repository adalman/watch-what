from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Base schemas (common fields)
class SessionBase(BaseModel):
    code: str = Field(..., description="Unique session code (e.g., 'ABCD12')")
    status: str = Field(default="submission", description="Session status: submission, voting, revote, finished")
    current_round: int = Field(default=1, description="Current voting round")

class ParticipantBase(BaseModel):
    name: str = Field(..., description="Participant's display name")
    session_id: int = Field(..., description="ID of the session to join")

class MovieBase(BaseModel):
    title: str = Field(..., description="Movie title")
    session_id: int = Field(..., description="ID of the session")
    submitted_by_participant_id: int = Field(..., description="ID of the participant who submitted the movie")

class VoteBase(BaseModel):
    movie_id: int = Field(..., description="ID of the movie being voted for")
    round: int = Field(..., description="Voting round number")
    participant_id: int = Field(..., description="ID of the participant casting the vote")
    session_id: int = Field(..., description="ID of the session")

# Create schemas (for creating new records)
class SessionCreate(BaseModel):
    status: str = Field(default="submission", description="Session status: submission, voting, revote, finished")
    current_round: int = Field(default=1, description="Current voting round")

class ParticipantCreate(ParticipantBase):
    pass

class MovieCreate(MovieBase):
    pass

class VoteCreate(VoteBase):
    pass

# Response schemas (for API responses)
class ParticipantResponse(ParticipantBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MovieResponse(MovieBase):
    id: int
    session_id: int
    submitted_by_participant_id: int
    eliminated_round: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VoteResponse(VoteBase):
    id: int
    participant_id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SessionResponse(SessionBase):
    id: int
    winner_movie_id: Optional[int] = None  # Temporarily kept for compatibility
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: List[ParticipantResponse] = []
    movies: List[MovieResponse] = []

    class Config:
        from_attributes = True

# Update schemas (for partial updates)
class SessionUpdate(BaseModel):
    status: Optional[str] = None
    current_round: Optional[int] = None
    winner_movie_id: Optional[int] = None

class ParticipantUpdate(BaseModel):
    name: Optional[str] = None

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    eliminated_round: Optional[int] = None

# Specialized schemas for specific use cases
class SessionWithDetails(SessionResponse):
    """Session with full details including participants and movies"""
    participants: List[ParticipantResponse] = []
    movies: List[MovieResponse] = []

class VoteSummary(BaseModel):
    """Summary of votes for a movie in a specific round"""
    movie_id: int
    movie_title: str
    vote_count: int
    round: int

class RoundResults(BaseModel):
    """Results for a specific voting round"""
    round: int
    votes: List[VoteSummary]
    eliminated_movies: List[int]  # List of movie IDs that were eliminated

class SessionStatus(BaseModel):
    """Current status and progress of a session"""
    session_id: int
    code: str
    status: str
    current_round: int
    participant_count: int
    movie_count: int
    winner_movie_id: Optional[int] = None

# WebSocket message schemas
class WebSocketMessage(BaseModel):
    """Base WebSocket message structure"""
    type: str = Field(..., description="Message type: join, submit_movie, vote, etc.")
    data: dict = Field(..., description="Message payload")

class JoinSessionMessage(BaseModel):
    """Message for joining a session via WebSocket"""
    session_code: str
    participant_name: str

class SubmitMovieMessage(BaseModel):
    """Message for submitting a movie via WebSocket"""
    movie_title: str

class VoteMessage(BaseModel):
    """Message for casting a vote via WebSocket"""
    movie_id: int
    round: int
