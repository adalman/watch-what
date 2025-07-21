import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStatus, Movie, Participant, SessionResponse } from '../../types/api';
import './SessionView.css';
import { apiService } from '../../services/api';

function SessionView() {
  const { sessionState } = useSession();
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isSubmittingMovie, setIsSubmittingMovie] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  const session = sessionState.session as SessionResponse;
  const currentParticipant = sessionState.currentParticipant;

  // Determine if the current participant is the session creator (first participant)
  const isSessionCreator = session.participants && session.participants.length > 0 && currentParticipant && session.participants[0].id === currentParticipant.id;

  // State for start voting button
  const [isStartingVoting, setIsStartingVoting] = useState(false);
  const [startVotingError, setStartVotingError] = useState<string | null>(null);

  const handleStartVoting = async () => {
    setIsStartingVoting(true);
    setStartVotingError(null);
    try {
      await apiService.updateSessionStatus(session.id, 'voting');
    } catch (error) {
      setStartVotingError((error as Error).message || 'Failed to start voting');
    } finally {
      setIsStartingVoting(false);
    }
  };

  if (!session || !currentParticipant) {
    return <div className="session-view-error">Session data not available</div>;
  }

  // Get active movies (not eliminated)
  const activeMovies = session.movies?.filter(movie => movie.eliminated_round === null) || [];
  
  // Get eliminated movies
  const eliminatedMovies = session.movies?.filter(movie => movie.eliminated_round !== null) || [];

  // Get vote summaries for the current round
  const currentRoundVoteSummaries = sessionState.voteSummaries?.filter(vs => vs.round === session.current_round) || [];

  // Get IDs of movies the current participant has already voted for in this round
  const votedMovieIds = currentRoundVoteSummaries
    .filter(vs => sessionState.currentParticipant && vs.movie_id && sessionState.currentParticipant.id)
    .map(vs => vs.movie_id);

  // Check if the user has already voted for all active movies
  const hasVotedAll = activeMovies.every(movie => votedMovieIds.includes(movie.id));

  // Check if the user has voted for any movie in this round
  const hasVoted = votedMovieIds.length > 0;

  // Get vote count for a movie
  const getVoteCount = (movieId: number) => {
    const summary = currentRoundVoteSummaries.find(vs => vs.movie_id === movieId);
    return summary ? summary.vote_count : 0;
  };

  // Check if current participant has submitted a movie
  const hasSubmittedMovie = session.movies?.some(
    movie => movie.submitted_by_participant_id === currentParticipant.id
  ) || false;

  // Check for duplicate movie title (case-insensitive)
  const isDuplicateTitle = session.movies.some(
    movie => movie.title.trim().toLowerCase() === newMovieTitle.trim().toLowerCase()
  );

  const handleSubmitMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle.trim()) return;

    setIsSubmittingMovie(true);
    try {
      await apiService.submitMovie(session.id, newMovieTitle, currentParticipant.id);
      setNewMovieTitle('');
    } catch (error) {
      alert((error as Error).message || 'Error submitting movie');
    } finally {
      setIsSubmittingMovie(false);
    }
  };

  const handleVote = async () => {
    if (selectedMovies.length === 0) return;

    setIsVoting(true);
    try {
      await apiService.vote(session.id, selectedMovies, currentParticipant.id, session.current_round);
      setSelectedMovies([]);
    } catch (error) {
      alert((error as Error).message || 'Error voting');
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
              color: statusDisplay.color,
              display: 'inline-block',
              marginRight: '1rem'
            }}
          >
            {statusDisplay.text}
          </div>
          {/* Start Voting button in header for session creator during submission phase */}
          {session.status === 'submission' && isSessionCreator && (
            <button
              onClick={async () => {
                setIsStartingVoting(true);
                setStartVotingError(null);
                try {
                  await apiService.updateSessionStatus(session.id, 'voting');
                  // Optimistically update UI
                  session.status = 'voting';
                  setIsStartingVoting(false);
                } catch (error) {
                  setStartVotingError((error as Error).message || 'Failed to start voting');
                  setIsStartingVoting(false);
                }
              }}
              disabled={isStartingVoting}
              className="vote-button"
              style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}
            >
              {isStartingVoting ? 'Starting Voting...' : 'Start Voting'}
            </button>
          )}
          {startVotingError && (
            <div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{startVotingError}</div>
          )}
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
            {isDuplicateTitle && newMovieTitle.trim() && (
              <div style={{ color: '#dc2626', marginBottom: '0.5rem' }}>
                A movie with this title has already been submitted.
              </div>
            )}
            <button 
              type="submit" 
              disabled={isSubmittingMovie || !newMovieTitle.trim() || isDuplicateTitle}
              className="submit-button"
            >
              {isSubmittingMovie ? 'Submitting...' : 'Submit Movie'}
            </button>
          </form>
          {/* Show a list of movies submitted by this participant */}
          {session.movies.filter(m => m.submitted_by_participant_id === currentParticipant.id).length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Your Submitted Movies:</h4>
              <ul>
                {session.movies
                  .filter(m => m.submitted_by_participant_id === currentParticipant.id)
                  .map(m => <li key={m.id}>{m.title}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Voting Section */}
      {session.status === 'voting' && (
        <div className="section">
          <h3>Vote for Movies</h3>
          {!hasVotedAll ? (
            <div className="voting-interface">
              <p className="voting-instructions">
                Select the movies you want to vote for in this round:
              </p>
              <div className="movie-grid">
                {activeMovies.map(movie => {
                  const alreadyVoted = votedMovieIds.includes(movie.id);
                  return (
                    <div 
                      key={movie.id}
                      className={`movie-card ${selectedMovies.includes(movie.id) ? 'selected' : ''} ${alreadyVoted ? 'already-voted' : ''}`}
                      onClick={() => !alreadyVoted && toggleMovieSelection(movie.id)}
                      style={{ opacity: alreadyVoted ? 0.5 : 1, cursor: alreadyVoted ? 'not-allowed' : 'pointer' }}
                    >
                      <h4>{movie.title}</h4>
                      <p>Submitted by: {session.participants?.find(p => p.id === movie.submitted_by_participant_id)?.name || 'Unknown'}</p>
                      <p>Votes: {getVoteCount(movie.id)}</p>
                      {alreadyVoted && <div className="already-voted-indicator">You voted</div>}
                      {selectedMovies.includes(movie.id) && !alreadyVoted && (
                        <div className="selected-indicator">✓ Selected</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={handleVote}
                disabled={isVoting || selectedMovies.length === 0 || hasVotedAll}
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