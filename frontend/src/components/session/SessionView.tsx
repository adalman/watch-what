import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStatus, Movie, Participant, SessionResponse } from '../../types/api';
import './SessionView.css';

function SessionView() {
  const { sessionState } = useSession();
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isSubmittingMovie, setIsSubmittingMovie] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  const session = sessionState.session as SessionResponse;
  const currentParticipant = sessionState.currentParticipant;

  if (!session || !currentParticipant) {
    return <div className="session-view-error">Session data not available</div>;
  }

  // Get active movies (not eliminated)
  const activeMovies = session.movies?.filter(movie => movie.eliminated_round === null) || [];
  
  // Get eliminated movies
  const eliminatedMovies = session.movies?.filter(movie => movie.eliminated_round !== null) || [];

  // Check if current participant has submitted a movie
  const hasSubmittedMovie = session.movies?.some(
    movie => movie.submitted_by_participant_id === currentParticipant.id
  ) || false;

  // Check if current participant has voted in current round
  // TODO: Implement vote checking when votes are available in session data
  const hasVoted = false;

  const handleSubmitMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle.trim()) return;

    setIsSubmittingMovie(true);
    try {
      // TODO: Implement movie submission API call
      console.log('Submitting movie:', newMovieTitle);
      setNewMovieTitle('');
    } catch (error) {
      console.error('Error submitting movie:', error);
    } finally {
      setIsSubmittingMovie(false);
    }
  };

  const handleVote = async () => {
    if (selectedMovies.length === 0) return;

    setIsVoting(true);
    try {
      // TODO: Implement voting API call
      console.log('Voting for movies:', selectedMovies);
      setSelectedMovies([]);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const toggleMovieSelection = (movieId: number) => {
    setSelectedMovies(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const getStatusDisplay = (status: SessionStatus) => {
    switch (status) {
      case 'submission':
        return { text: 'Movie Submission', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'voting':
        return { text: 'Voting Round', color: '#059669', bgColor: '#d1fae5' };
      case 'revote':
        return { text: 'Revote Round', color: '#d97706', bgColor: '#fed7aa' };
      case 'finished':
        return { text: 'Session Finished', color: '#dc2626', bgColor: '#fee2e2' };
      default:
        return { text: status, color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const statusDisplay = getStatusDisplay(session.status);

  return (
    <div className="session-view">
      {/* Session Header */}
      <div className="session-header">
        <div className="session-info">
          <h2>Session: {session.code}</h2>
          <div 
            className="session-status"
            style={{ 
              backgroundColor: statusDisplay.bgColor,
              color: statusDisplay.color
            }}
          >
            {statusDisplay.text}
          </div>
          <p className="session-round">Round {session.current_round}</p>
        </div>
        <div className="participant-info">
          <p>Welcome, <strong>{currentParticipant.name}</strong>!</p>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="session-stats">
        <div className="stat-card">
          <h3>{session.participants?.length || 0}</h3>
          <p>Participants</p>
        </div>
        <div className="stat-card">
          <h3>{session.movies?.length || 0}</h3>
          <p>Movies</p>
        </div>
        <div className="stat-card">
          <h3>{activeMovies.length}</h3>
          <p>Active</p>
        </div>
        <div className="stat-card">
          <h3>{eliminatedMovies.length}</h3>
          <p>Eliminated</p>
        </div>
      </div>

      {/* Movie Submission Section */}
      {session.status === 'submission' && (
        <div className="section">
          <h3>Submit a Movie</h3>
          {!hasSubmittedMovie ? (
            <form onSubmit={handleSubmitMovie} className="movie-submission-form">
              <div className="form-group">
                <input
                  type="text"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder="Enter movie title..."
                  disabled={isSubmittingMovie}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingMovie || !newMovieTitle.trim()}
                className="submit-button"
              >
                {isSubmittingMovie ? 'Submitting...' : 'Submit Movie'}
              </button>
            </form>
          ) : (
            <div className="submission-complete">
              <p>✅ You've submitted a movie for this session!</p>
            </div>
          )}
        </div>
      )}

      {/* Voting Section */}
      {session.status === 'voting' && (
        <div className="section">
          <h3>Vote for Movies</h3>
          {!hasVoted ? (
            <div className="voting-interface">
              <p className="voting-instructions">
                Select the movies you want to vote for in this round:
              </p>
              <div className="movie-grid">
                {activeMovies.map(movie => (
                  <div 
                    key={movie.id}
                    className={`movie-card ${selectedMovies.includes(movie.id) ? 'selected' : ''}`}
                    onClick={() => toggleMovieSelection(movie.id)}
                  >
                    <h4>{movie.title}</h4>
                    <p>Submitted by: {session.participants?.find(p => p.id === movie.submitted_by_participant_id)?.name || 'Unknown'}</p>
                    {selectedMovies.includes(movie.id) && (
                      <div className="selected-indicator">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={handleVote}
                disabled={isVoting || selectedMovies.length === 0}
                className="vote-button"
              >
                {isVoting ? 'Submitting Votes...' : `Vote for ${selectedMovies.length} Movie${selectedMovies.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          ) : (
            <div className="voting-complete">
              <p>✅ You've voted in this round!</p>
            </div>
          )}
        </div>
      )}

      {/* Active Movies Section */}
      <div className="section">
        <h3>Active Movies ({activeMovies.length})</h3>
        {activeMovies.length > 0 ? (
          <div className="movie-list">
            {activeMovies.map(movie => (
              <div key={movie.id} className="movie-item">
                <h4>{movie.title}</h4>
                <p>Submitted by: {session.participants?.find(p => p.id === movie.submitted_by_participant_id)?.name || 'Unknown'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-movies">No active movies yet.</p>
        )}
      </div>

      {/* Eliminated Movies Section */}
      {eliminatedMovies.length > 0 && (
        <div className="section">
          <h3>Eliminated Movies ({eliminatedMovies.length})</h3>
          <div className="movie-list eliminated">
            {eliminatedMovies.map(movie => (
              <div key={movie.id} className="movie-item eliminated">
                <h4>{movie.title}</h4>
                <p>Eliminated in Round {movie.eliminated_round}</p>
                <p>Submitted by: {session.participants?.find(p => p.id === movie.submitted_by_participant_id)?.name || 'Unknown'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants Section */}
      <div className="section">
        <h3>Participants ({session.participants?.length || 0})</h3>
        <div className="participants-list">
          {session.participants?.map(participant => (
            <div key={participant.id} className="participant-item">
              <span className="participant-name">{participant.name}</span>
              {participant.id === currentParticipant.id && (
                <span className="current-participant">(You)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Session Actions */}
      <div className="session-actions">
        <button 
          onClick={() => window.location.reload()}
          className="refresh-button"
        >
          Refresh Session
        </button>
        <button 
          onClick={() => {
            // TODO: Implement leave session
            console.log('Leave session');
          }}
          className="leave-button"
        >
          Leave Session
        </button>
      </div>
    </div>
  );
}

export default SessionView; 