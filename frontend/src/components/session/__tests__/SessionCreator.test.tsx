import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from '../../../context/SessionContext';
import SessionCreator from '../SessionCreator';

// Mock the API service
jest.mock('../../../services/api', () => ({
  apiService: {
    createSession: jest.fn(),
    joinSession: jest.fn(),
  }
}));

import { apiService } from '../../../services/api';

const mockCreateSession = apiService.createSession as jest.MockedFunction<typeof apiService.createSession>;

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SessionProvider>
      {component}
    </SessionProvider>
  );
};

describe('SessionCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the create session form', () => {
      renderWithProvider(<SessionCreator />);

      expect(screen.getByText('Create New Session')).toBeInTheDocument();
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument();
    });

    it('should have correct form structure', () => {
      renderWithProvider(<SessionCreator />);

      // Note: Form role is not automatically detected by testing library
      // We can test the form element exists by checking for the form tag
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      
      const input = screen.getByLabelText(/your name/i);
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Enter your name');
      expect(input).toBeRequired();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when input is empty', () => {
      renderWithProvider(<SessionCreator />);

      const submitButton = screen.getByRole('button', { name: /create session/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when input has value', async () => {
      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, 'John Doe');

      expect(submitButton).toBeEnabled();
    });

    it('should disable submit button when input only has whitespace', async () => {
      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, '   ');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with your name', async () => {
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

      mockCreateSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, 'John Doe');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalledWith('John Doe');
      });
    });

    it('should show loading state during submission', async () => {
      mockCreateSession.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, 'John Doe');
      await userEvent.click(submitButton);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should not clear input after successful submission (component behavior)', async () => {
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

      mockCreateSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, 'John Doe');
      await userEvent.click(submitButton);

      // Note: The component doesn't clear input after successful submission
      // This is the actual behavior of the component
      await waitFor(() => {
        expect(input).toHaveValue('John Doe');
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

      mockCreateSession.mockResolvedValue(mockResponse);

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);

      await userEvent.type(input, 'John Doe');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalledWith('John Doe');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API call failure gracefully', async () => {
      const errorMessage = 'Failed to create session';
      mockCreateSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, 'John Doe');
      await userEvent.click(submitButton);

      // Note: The component doesn't display errors directly
      // Errors are handled by the SessionContext
      // We just verify the component doesn't crash
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });

    it('should allow user to retry after error', async () => {
      const errorMessage = 'Failed to create session';
      mockCreateSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      // First submission fails
      await userEvent.type(input, 'John Doe');
      await userEvent.click(submitButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      // User can modify input and try again
      await userEvent.clear(input);
      await userEvent.type(input, 'Jane Doe');

      // Button should still be enabled
      expect(submitButton).toBeEnabled();
    });

    it('should re-enable submit button after error', async () => {
      const errorMessage = 'Failed to create session';
      mockCreateSession.mockRejectedValue(new Error(errorMessage));

      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      const submitButton = screen.getByRole('button', { name: /create session/i });

      await userEvent.type(input, 'John Doe');
      await userEvent.click(submitButton);

      // Button should be enabled again after error
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProvider(<SessionCreator />);

      const input = screen.getByLabelText(/your name/i);
      expect(input).toBeInTheDocument();
    });

    it('should have proper button text', () => {
      renderWithProvider(<SessionCreator />);

      const submitButton = screen.getByRole('button', { name: /create session/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      renderWithProvider(<SessionCreator />);

      // Note: Form role is not automatically detected by testing library
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
}); 