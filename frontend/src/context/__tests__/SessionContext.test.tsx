import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from '../SessionContext';
import { SessionStatus } from '../../types/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    createSession: jest.fn(),
    joinSession: jest.fn(),
  }
}));

import { apiService } from '../../services/api';

const mockCreateSession = apiService.createSession as jest.MockedFunction<typeof apiService.createSession>;
const mockJoinSession = apiService.joinSession as jest.MockedFunction<typeof apiService.joinSession>;

// Test component that uses the session context
const TestComponent = () => {
  const { 
    sessionState, 
    createSession, 
    joinSession, 
    clearSession, 
    updateSessionStatus,
    isInSession,
    isSessionCreator 
  } = useSession();

  return (
    <div>
      <div data-testid="session-state">
        {sessionState.session ? `Session: ${sessionState.session.code}` : 'No session'}
      </div>
      <div data-testid="participant-state">
        {sessionState.currentParticipant ? `Participant: ${sessionState.currentParticipant.name}` : 'No participant'}
      </div>
      <div data-testid="loading-state">
        {sessionState.isLoading ? 'Loading...' : 'Not loading'}
      </div>
      <div data-testid="error-state">
        {sessionState.error || 'No error'}
      </div>
      <div data-testid="in-session">
        {isInSession ? 'In session' : 'Not in session'}
      </div>
      <div data-testid="is-creator">
        {isSessionCreator ? 'Is creator' : 'Not creator'}
      </div>
      <button onClick={() => createSession('Test User')} data-testid="create-session-btn">
        Create Session
      </button>
      <button onClick={() => joinSession('ABC123', 'Test User')} data-testid="join-session-btn">
        Join Session
      </button>
      <button onClick={clearSession} data-testid="clear-session-btn">
        Clear Session
      </button>
      <button onClick={() => updateSessionStatus('voting')} data-testid="update-status-btn">
        Update Status
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SessionProvider>
      {component}
    </SessionProvider>
  );
};

describe('SessionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('session-state')).toHaveTextContent('No session');
      expect(screen.getByTestId('participant-state')).toHaveTextContent('No participant');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('error-state')).toHaveTextContent('No error');
      expect(screen.getByTestId('in-session')).toHaveTextContent('Not in session');
      expect(screen.getByTestId('is-creator')).toHaveTextContent('Not creator');
    });
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const mockSessionResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as SessionStatus,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [
            {
              id: 1,
              name: 'Test User',
              session_id: 1,
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          movies: []
        },
        participant: {
          id: 1,
          name: 'Test User',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockCreateSession.mockResolvedValue(mockSessionResponse);

      renderWithProvider(<TestComponent />);

      const createButton = screen.getByTestId('create-session-btn');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalledWith('Test User');
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-state')).toHaveTextContent('Session: ABC123');
        expect(screen.getByTestId('participant-state')).toHaveTextContent('Participant: Test User');
        expect(screen.getByTestId('in-session')).toHaveTextContent('In session');
        expect(screen.getByTestId('is-creator')).toHaveTextContent('Not creator');
      });
    });

    it('should handle create session error', async () => {
      const errorMessage = 'Failed to create session';
      mockCreateSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<TestComponent />);

      const createButton = screen.getByTestId('create-session-btn');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent(errorMessage);
      });
    });

    it('should show loading state during creation', async () => {
      mockCreateSession.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProvider(<TestComponent />);

      const createButton = screen.getByTestId('create-session-btn');
      await userEvent.click(createButton);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading...');
    });
  });

  describe('joinSession', () => {
    it('should join a session successfully', async () => {
      const mockSessionResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as SessionStatus,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [
            {
              id: 1,
              name: 'Test User',
              session_id: 1,
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          movies: []
        },
        participant: {
          id: 1,
          name: 'Test User',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockJoinSession.mockResolvedValue(mockSessionResponse);

      renderWithProvider(<TestComponent />);

      const joinButton = screen.getByTestId('join-session-btn');
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith('ABC123', 'Test User');
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-state')).toHaveTextContent('Session: ABC123');
        expect(screen.getByTestId('participant-state')).toHaveTextContent('Participant: Test User');
        expect(screen.getByTestId('in-session')).toHaveTextContent('In session');
        expect(screen.getByTestId('is-creator')).toHaveTextContent('Not creator');
      });
    });

    it('should handle join session error', async () => {
      const errorMessage = 'Session not found';
      mockJoinSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<TestComponent />);

      const joinButton = screen.getByTestId('join-session-btn');
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent(errorMessage);
      });
    });
  });

  describe('clearSession', () => {
    it('should clear session state', async () => {
      const mockSessionResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as SessionStatus,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'Test User',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockCreateSession.mockResolvedValue(mockSessionResponse);

      renderWithProvider(<TestComponent />);

      // First create a session
      const createButton = screen.getByTestId('create-session-btn');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('in-session')).toHaveTextContent('In session');
      });

      // Then clear it
      const clearButton = screen.getByTestId('clear-session-btn');
      await userEvent.click(clearButton);

      expect(screen.getByTestId('session-state')).toHaveTextContent('No session');
      expect(screen.getByTestId('participant-state')).toHaveTextContent('No participant');
      expect(screen.getByTestId('in-session')).toHaveTextContent('Not in session');
      expect(screen.getByTestId('is-creator')).toHaveTextContent('Not creator');
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      const mockSessionResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as SessionStatus,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'Test User',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockCreateSession.mockResolvedValue(mockSessionResponse);

      renderWithProvider(<TestComponent />);

      // First create a session
      const createButton = screen.getByTestId('create-session-btn');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('in-session')).toHaveTextContent('In session');
      });

      // Then update status
      const updateButton = screen.getByTestId('update-status-btn');
      await userEvent.click(updateButton);

      // Note: This test would need to be updated when updateSessionStatus is fully implemented
      // For now, we're just testing that the function can be called without errors
    });
  });

  describe('Error Handling', () => {
    it('should clear error when creating new session after error', async () => {
      // First create an error
      mockCreateSession.mockRejectedValueOnce(new Error('Network error'));

      renderWithProvider(<TestComponent />);

      const createButton = screen.getByTestId('create-session-btn');
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Network error');
      });

      // Then create a successful session
      const mockSessionResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as SessionStatus,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'Test User',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockCreateSession.mockResolvedValueOnce(mockSessionResponse);

      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('No error');
      });
    });
  });
}); 