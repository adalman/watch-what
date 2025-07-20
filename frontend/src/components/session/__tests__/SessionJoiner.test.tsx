import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from '../../../context/SessionContext';
import SessionJoiner from '../SessionJoiner';

// Mock the API service
jest.mock('../../../services/api', () => ({
  apiService: {
    createSession: jest.fn(),
    joinSession: jest.fn(),
  }
}));

import { apiService } from '../../../services/api';

const mockJoinSession = apiService.joinSession as jest.MockedFunction<typeof apiService.joinSession>;

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SessionProvider>
      {component}
    </SessionProvider>
  );
};

describe('SessionJoiner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the join session form', () => {
      renderWithProvider(<SessionJoiner />);

      expect(screen.getByText('Join Existing Session')).toBeInTheDocument();
      expect(screen.getByLabelText(/session code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /join session/i })).toBeInTheDocument();
    });

    it('should have correct form structure', () => {
      renderWithProvider(<SessionJoiner />);

      // Note: Form role is not automatically detected by testing library
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      
      const sessionCodeInput = screen.getByLabelText(/session code/i);
      expect(sessionCodeInput).toHaveAttribute('type', 'text');
      expect(sessionCodeInput).toHaveAttribute('placeholder', 'Enter 6-character code');
      expect(sessionCodeInput).toBeRequired();

      const participantNameInput = screen.getByLabelText(/your name/i);
      expect(participantNameInput).toHaveAttribute('type', 'text');
      expect(participantNameInput).toHaveAttribute('placeholder', 'Enter your name');
      expect(participantNameInput).toBeRequired();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when inputs are empty', () => {
      renderWithProvider(<SessionJoiner />);

      const submitButton = screen.getByRole('button', { name: /join session/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when only session code is filled', async () => {
      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');

      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when only your name is filled', async () => {
      renderWithProvider(<SessionJoiner />);

      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(participantNameInput, 'John Doe');

      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when both inputs have values', async () => {
      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');

      expect(submitButton).toBeEnabled();
    });

    it('should disable submit button when inputs only have whitespace', async () => {
      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, '   ');
      await userEvent.type(participantNameInput, '   ');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with session code and your name', async () => {
      const mockResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as const,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'John Doe',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockJoinSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith('ABC123', 'John Doe');
      });
    });

    it('should show loading state during submission', async () => {
      mockJoinSession.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      expect(screen.getByText('Joining...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should not clear inputs after successful submission (component behavior)', async () => {
      const mockResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as const,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'John Doe',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockJoinSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      // Note: The component doesn't clear inputs after successful submission
      // This is the actual behavior of the component
      await waitFor(() => {
        expect(sessionCodeInput).toHaveValue('ABC123');
        expect(participantNameInput).toHaveValue('John Doe');
      });
    });

    it('should handle form submission with Enter key', async () => {
      const mockResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as const,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'John Doe',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockJoinSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith('ABC123', 'John Doe');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API call failure gracefully', async () => {
      const errorMessage = 'Session not found';
      mockJoinSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      // Note: The component doesn't display errors directly
      // Errors are handled by the SessionContext
      // We just verify the component doesn't crash
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });

    it('should allow user to retry after error', async () => {
      const errorMessage = 'Session not found';
      mockJoinSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      // First submission fails
      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      // User can modify inputs and try again
      await userEvent.clear(sessionCodeInput);
      await userEvent.clear(participantNameInput);
      await userEvent.type(sessionCodeInput, 'XYZ789');
      await userEvent.type(participantNameInput, 'Jane Doe');

      // Button should still be enabled
      expect(submitButton).toBeEnabled();
    });

    it('should re-enable submit button after error', async () => {
      const errorMessage = 'Session not found';
      mockJoinSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      // Button should be enabled again after error
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Input Validation', () => {
    it('should handle session code with mixed case', async () => {
      const mockResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as const,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'John Doe',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockJoinSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'abc123');
      await userEvent.type(participantNameInput, 'John Doe');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith('ABC123', 'John Doe');
      });
    });

    it('should handle your name with special characters', async () => {
      const mockResponse = {
        session: {
          id: 1,
          code: 'ABC123',
          status: 'submission' as const,
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        },
        participant: {
          id: 1,
          name: 'John-Doe Jr.',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockJoinSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /join session/i });

      await userEvent.type(sessionCodeInput, 'ABC123');
      await userEvent.type(participantNameInput, 'John-Doe Jr.');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith('ABC123', 'John-Doe Jr.');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProvider(<SessionJoiner />);

      const sessionCodeInput = screen.getByLabelText(/session code/i);
      const participantNameInput = screen.getByLabelText(/your name/i);
      
      expect(sessionCodeInput).toBeInTheDocument();
      expect(participantNameInput).toBeInTheDocument();
    });

    it('should have proper button text', () => {
      renderWithProvider(<SessionJoiner />);

      const submitButton = screen.getByRole('button', { name: /join session/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      renderWithProvider(<SessionJoiner />);

      // Note: Form role is not automatically detected by testing library
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
}); 