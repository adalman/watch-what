import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionView from '../SessionView';
import { SessionContextType, SessionStatus } from '../../../types/api';
import { SessionProvider } from '../../../context/SessionContext';

const mockSession = {
  id: 1,
  code: 'ABC123',
  status: 'voting' as SessionStatus,
  current_round: 1,
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

const mockContext: Partial<SessionContextType> = {
  sessionState: {
    session: mockSession,
    currentParticipant: { id: 1, session_id: 1, name: 'Alice', created_at: '' },
    movies: mockSession.movies,
    participants: mockSession.participants,
    voteSummaries: [],
    isLoading: false,
    error: null,
    isConnected: true,
    roundResults: null,
    showRoundResultsModal: false
  },
  createSession: jest.fn(),
  joinSession: jest.fn(),
  clearSession: jest.fn(),
  updateSessionStatus: jest.fn(),
  isInSession: true,
  isSessionCreator: true,
  roundResults: null,
  showRoundResultsModal: false
};

jest.mock('../../../context/SessionContext', () => ({
  ...jest.requireActual('../../../context/SessionContext'),
  useSession: () => mockContext
}));

describe('SessionView Voting Logic', () => {
  it('shows voting UI and allows voting', () => {
    render(<SessionView />);
    expect(screen.getByText(/Vote for Movies/)).toBeInTheDocument();
    expect(screen.getByText(/Movie A/)).toBeInTheDocument();
    expect(screen.getByText(/Movie B/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vote for/ })).toBeEnabled();
  });

  it('shows confirmation after voting', () => {
    // Simulate hasVotedThisRound = true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    render(<SessionView />);
    expect(screen.getByText(/You've voted in this round/)).toBeInTheDocument();
  });

  it('disables movies and button after voting', () => {
    // Simulate hasVotedThisRound = true
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    render(<SessionView />);
    expect(screen.getByRole('button', { name: /Vote for/ })).toBeDisabled();
    expect(screen.getAllByText(/You voted/).length).toBeGreaterThan(0);
  });

  it('shows the winning movie when session is finished', () => {
    const finishedSession = { ...mockSession, status: 'finished' as SessionStatus, winner_movie_id: 1 };
    const finishedContext = { ...mockContext, sessionState: { ...mockContext.sessionState, session: finishedSession } };
    jest.mock('../../../context/SessionContext', () => ({
      ...jest.requireActual('../../../context/SessionContext'),
      useSession: () => finishedContext
    }));
    render(<SessionView />);
    expect(screen.getByText(/Winning Movie/)).toBeInTheDocument();
    expect(screen.getByText(/Movie A/)).toBeInTheDocument();
  });
}); 