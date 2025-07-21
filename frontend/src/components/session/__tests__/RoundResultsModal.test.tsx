import React from 'react';
import { render, screen } from '@testing-library/react';
import RoundResultsModal from '../RoundResultsModal';
import { SessionResponse } from '../../../types/api';

describe('RoundResultsModal', () => {
  const session: SessionResponse = {
    id: 1,
    code: 'ABC123',
    status: 'voting',
    current_round: 2,
    winner_movie_id: null,
    created_at: '',
    updated_at: null,
    movies: [
      { id: 1, session_id: 1, title: 'Movie A', submitted_by_participant_id: 1, eliminated_round: null, created_at: '' },
      { id: 2, session_id: 1, title: 'Movie B', submitted_by_participant_id: 2, eliminated_round: null, created_at: '' }
    ],
    participants: [
      { id: 1, session_id: 1, name: 'Alice', created_at: '' },
      { id: 2, session_id: 1, name: 'Bob', created_at: '' }
    ],
    voteSummaries: []
  };

  const roundResults = {
    old_round: 1,
    new_round: 2,
    eliminated_count: 1,
    vote_counts: [
      { movie_id: 1, movie_title: 'Movie A', vote_count: 2, round: 1 },
      { movie_id: 2, movie_title: 'Movie B', vote_count: 0, round: 1 }
    ]
  };

  it('renders nothing if show is false', () => {
    render(<RoundResultsModal show={false} roundResults={roundResults} session={session} />);
    expect(screen.queryByText(/Round/)).not.toBeInTheDocument();
  });

  it('renders nothing if roundResults is null', () => {
    render(<RoundResultsModal show={true} roundResults={null} session={session} />);
    expect(screen.queryByText(/Round/)).not.toBeInTheDocument();
  });

  it('renders the correct round and vote counts', () => {
    render(<RoundResultsModal show={true} roundResults={roundResults} session={session} />);
    expect(screen.getByText('Round 1 Results')).toBeInTheDocument();
    expect(screen.getByText(/Movie A/)).toBeInTheDocument();
    expect(screen.getByText(/2 votes?/)).toBeInTheDocument();
    expect(screen.getByText(/Movie B/)).toBeInTheDocument();
    expect(screen.getByText(/0 votes?/)).toBeInTheDocument();
  });

  it('renders eliminated message if movies were eliminated', () => {
    render(<RoundResultsModal show={true} roundResults={{ ...roundResults, eliminated_count: 1 }} session={session} />);
    expect(screen.getByText(/Eliminated: 1 movie/)).toBeInTheDocument();
  });

  it('renders tie message if no movies were eliminated', () => {
    render(<RoundResultsModal show={true} roundResults={{ ...roundResults, eliminated_count: 0 }} session={session} />);
    expect(screen.getByText(/No movies eliminated/)).toBeInTheDocument();
  });

  it('falls back to session.movies for movie title if movie_title is missing', () => {
    const rr = {
      ...roundResults,
      vote_counts: [
        { movie_id: 1, vote_count: 2, round: 1 },
        { movie_id: 2, vote_count: 0, round: 1 }
      ]
    };
    render(<RoundResultsModal show={true} roundResults={rr} session={session} />);
    expect(screen.getByText(/Movie A/)).toBeInTheDocument();
    expect(screen.getByText(/Movie B/)).toBeInTheDocument();
  });
}); 