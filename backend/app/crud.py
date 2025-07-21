from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
import random
import string

from .models import Session as SessionModel, Participant, Movie, Vote
from .schemas import SessionCreate, ParticipantCreate, MovieCreate, VoteCreate

# Session CRUD operations
def create_session(db: Session, session: SessionCreate) -> SessionModel:
    """Create a new session with a unique code"""
    # Generate a unique 6-character code
    code = generate_session_code()
    
    db_session = SessionModel(
        code=code,
        status=session.status,
        current_round=session.current_round
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session(db: Session, session_id: int) -> Optional[SessionModel]:
    """Get a session by ID"""
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()

def get_session_by_code(db: Session, session_code: str) -> Optional[SessionModel]:
    """Get a session by its unique code"""
    return db.query(SessionModel).filter(SessionModel.code == session_code).first()

def get_sessions(db: Session, skip: int = 0, limit: int = 100) -> List[SessionModel]:
    """Get all sessions with pagination"""
    return db.query(SessionModel).offset(skip).limit(limit).all()

def update_session_status(db: Session, session_id: int, status: str) -> Optional[SessionModel]:
    """Update session status"""
    db_session = get_session(db, session_id)
    if db_session:
        db_session.status = status
        db.commit()
        db.refresh(db_session)
    return db_session

def advance_session_round(db: Session, session_id: int) -> Optional[dict]:
    """Advance session to next round and eliminate movies with most votes. Returns detailed results."""
    db_session = get_session(db, session_id)
    if not db_session:
        return None
    
    # Get current round votes
    current_round_votes = db.query(Vote).filter(
        and_(Vote.session_id == session_id, Vote.round == db_session.current_round)
    ).all()
    
    # Get all movies in the session (including those with 0 votes)
    all_movies = get_session_movies(db, session_id)
    
    # Initialize vote counts for all movies with 0
    vote_counts = {}
    for movie in all_movies:
        vote_counts[movie.id] = {
            "movie_id": movie.id,
            "movie_title": movie.title,
            "vote_count": 0,
            "round": db_session.current_round
        }
    
    # Count actual votes
    for vote in current_round_votes:
        if vote.movie_id in vote_counts:
            vote_counts[vote.movie_id]["vote_count"] += 1
    
    # Track eliminated movies for broadcasting
    eliminated_movies = []
    
    # Find movies with the LEAST votes (to eliminate) - keep movies with most votes
    if vote_counts:
        min_votes = min(vc["vote_count"] for vc in vote_counts.values())
        movies_to_eliminate = [movie_id for movie_id, vc in vote_counts.items() if vc["vote_count"] == min_votes]
        if movies_to_eliminate:
            # Mark movies as eliminated and collect info for broadcasting
            for movie_id in movies_to_eliminate:
                movie = db.query(Movie).filter(Movie.id == movie_id).first()
                if movie:
                    movie.eliminated_round = db_session.current_round
                    eliminated_movies.append({
                        "movie_id": movie.id,
                        "title": movie.title,
                        "vote_count": vote_counts[movie_id]["vote_count"],
                        "eliminated_round": db_session.current_round
                    })
                    db.commit()
    
    # Advance to next round
    old_round = db_session.current_round
    db_session.current_round += 1
    
    # Check if game is finished (only one movie left)
    active_movies = db.query(Movie).filter(
        and_(Movie.session_id == session_id, Movie.eliminated_round.is_(None))
    ).count()
    
    winner_info = None
    if active_movies <= 1:
        db_session.status = "finished"
        # Set winner if only one movie left
        if active_movies == 1:
            winner = db.query(Movie).filter(
                and_(Movie.session_id == session_id, Movie.eliminated_round.is_(None))
            ).first()
            if winner:
                db_session.winner_movie_id = winner.id
                winner_info = {
                    "movie_id": winner.id,
                    "title": winner.title
                }
                db.commit()
    
    db.commit()
    db.refresh(db_session)
    
    # Return detailed results for broadcasting
    return {
        "session": db_session,
        "eliminated_movies": eliminated_movies,
        "old_round": old_round,
        "new_round": db_session.current_round,
        "winner": winner_info,
        "vote_counts": list(vote_counts.values())
    }

# Participant CRUD operations
def create_participant(db: Session, participant: ParticipantCreate) -> Participant:
    """Create a new participant"""
    db_participant = Participant(
        name=participant.name,
        session_id=participant.session_id
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

def get_participant(db: Session, participant_id: int) -> Optional[Participant]:
    """Get a participant by ID"""
    return db.query(Participant).filter(Participant.id == participant_id).first()

def get_session_participants(db: Session, session_id: int) -> List[Participant]:
    """Get all participants in a session"""
    return db.query(Participant).filter(Participant.session_id == session_id).all()

def update_participant(db: Session, participant_id: int, name: str) -> Optional[Participant]:
    """Update participant name"""
    db_participant = get_participant(db, participant_id)
    if db_participant:
        db_participant.name = name
        db.commit()
        db.refresh(db_participant)
    return db_participant

# Movie CRUD operations
def create_movie(db: Session, movie: MovieCreate) -> Movie:
    """Create a new movie submission"""
    db_movie = Movie(
        title=movie.title,
        session_id=movie.session_id,
        submitted_by_participant_id=movie.submitted_by_participant_id
    )
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

def get_movie(db: Session, movie_id: int) -> Optional[Movie]:
    """Get a movie by ID"""
    return db.query(Movie).filter(Movie.id == movie_id).first()

def get_session_movies(db: Session, session_id: int) -> List[Movie]:
    """Get all movies in a session"""
    return db.query(Movie).filter(Movie.session_id == session_id).all()

def get_active_movies(db: Session, session_id: int) -> List[Movie]:
    """Get movies that haven't been eliminated yet"""
    return db.query(Movie).filter(
        and_(Movie.session_id == session_id, Movie.eliminated_round.is_(None))
    ).all()

def update_movie(db: Session, movie_id: int, title: str = None, eliminated_round: int = None) -> Optional[Movie]:
    """Update movie details"""
    db_movie = get_movie(db, movie_id)
    if db_movie:
        if title is not None:
            db_movie.title = title
        if eliminated_round is not None:
            db_movie.eliminated_round = eliminated_round
        db.commit()
        db.refresh(db_movie)
    return db_movie

# Vote CRUD operations
def create_vote(db: Session, vote: VoteCreate) -> Vote:
    """Create a new vote"""
    db_vote = Vote(
        movie_id=vote.movie_id,
        round=vote.round,
        participant_id=vote.participant_id,
        session_id=vote.session_id
    )
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    return db_vote

def get_vote(db: Session, vote_id: int) -> Optional[Vote]:
    """Get a vote by ID"""
    return db.query(Vote).filter(Vote.id == vote_id).first()

def get_session_votes(db: Session, session_id: int) -> List[Vote]:
    """Get all votes in a session"""
    return db.query(Vote).filter(Vote.session_id == session_id).all()

def get_round_votes(db: Session, session_id: int, round_number: int) -> List[Vote]:
    """Get all votes for a specific round"""
    return db.query(Vote).filter(
        and_(Vote.session_id == session_id, Vote.round == round_number)
    ).all()

def get_participant_votes(db: Session, participant_id: int, round_number: int) -> List[Vote]:
    """Get all votes by a participant in a specific round"""
    return db.query(Vote).filter(
        and_(Vote.participant_id == participant_id, Vote.round == round_number)
    ).all()

def has_participant_voted(db: Session, participant_id: int, round_number: int) -> bool:
    """Check if a participant has already voted in a round"""
    vote_count = db.query(Vote).filter(
        and_(Vote.participant_id == participant_id, Vote.round == round_number)
    ).count()
    return vote_count > 0

# Utility functions
def generate_session_code() -> str:
    """Generate a unique 6-character session code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(6))

def get_session_status_summary(db: Session, session_id: int) -> dict:
    """Get a summary of session status and progress"""
    session = get_session(db, session_id)
    if not session:
        return None
    
    participant_count = db.query(Participant).filter(Participant.session_id == session_id).count()
    movie_count = db.query(Movie).filter(Movie.session_id == session_id).count()
    active_movie_count = db.query(Movie).filter(
        and_(Movie.session_id == session_id, Movie.eliminated_round.is_(None))
    ).count()
    
    return {
        "session_id": session.id,
        "code": session.code,
        "status": session.status,
        "current_round": session.current_round,
        "participant_count": participant_count,
        "movie_count": movie_count,
        "active_movie_count": active_movie_count,
        "winner_movie_id": session.winner_movie_id
    }

def get_round_results(db: Session, session_id: int, round_number: int) -> dict:
    """Get detailed results for a specific voting round"""
    votes = get_round_votes(db, session_id, round_number)
    
    # Get all movies in the session (including those with 0 votes)
    all_movies = get_session_movies(db, session_id)
    
    # Initialize vote counts for all movies with 0
    vote_counts = {}
    for movie in all_movies:
        vote_counts[movie.id] = {
            "movie_id": movie.id,
            "movie_title": movie.title,
            "vote_count": 0,
            "round": round_number
        }
    
    # Count actual votes
    for vote in votes:
        if vote.movie_id in vote_counts:
            vote_counts[vote.movie_id]["vote_count"] += 1
    
    # Find eliminated movies (those with least votes) - movies with most votes advance
    eliminated_movies = []
    if vote_counts:
        min_votes = min(vc["vote_count"] for vc in vote_counts.values())
        max_votes = max(vc["vote_count"] for vc in vote_counts.values())
        
        # Only eliminate movies with least votes if there are multiple movies with different vote counts
        if min_votes < max_votes:
            eliminated_movies = [movie_id for movie_id, vc in vote_counts.items() if vc["vote_count"] == min_votes]
    
    return {
        "round": round_number,
        "votes": list(vote_counts.values()),
        "eliminated_movies": eliminated_movies
    } 