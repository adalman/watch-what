# app/models.py (SQLAlchemy models)
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # e.g., "ABCD12"
    status = Column(String, default="submission") # "submission", "voting", "revote", "finished"
    current_round = Column(Integer, default=1)
    winner_movie_id = Column(Integer, ForeignKey("movies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    movies = relationship("Movie", back_populates="session", foreign_keys="Movie.session_id", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="session", cascade="all, delete-orphan")
    winner = relationship("Movie", foreign_keys=[winner_movie_id], post_update=True)

class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    name = Column(String, nullable=False)
    # Add a unique identifier for the participant's connection if needed, e.g., a UUID or WebSocket ID
    # This might be more ephemeral and managed by the WebSocket manager.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="participants")
    submitted_movies = relationship("Movie", back_populates="submitter")
    votes = relationship("Vote", back_populates="voter", cascade="all, delete-orphan")


class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    title = Column(String, nullable=False)
    submitted_by_participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    eliminated_round = Column(Integer, nullable=True) # The round in which this movie was eliminated
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="movies", foreign_keys=[session_id])
    submitter = relationship("Participant", back_populates="submitted_movies")
    votes = relationship("Vote", back_populates="movie", cascade="all, delete-orphan")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False) # Redundant but useful for queries
    round = Column(Integer, nullable=False) # The voting round this vote belongs to
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    voter = relationship("Participant", back_populates="votes")
    movie = relationship("Movie", back_populates="votes")

    # Ensure a participant can only vote once per movie per round
    __table_args__ = (
        UniqueConstraint('participant_id', 'movie_id', 'round', name='_participant_movie_round_uc'),
    )