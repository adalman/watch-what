import { apiService } from '../api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

import axios from 'axios';

// Mock axios.create to return a mocked instance
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

(axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const mockSessionResponse = {
        data: {
          id: 1,
          code: 'ABC123',
          status: 'submission',
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null
        }
      };

      const mockParticipantResponse = {
        data: {
          id: 1,
          name: 'John Doe',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockAxiosInstance.post
        .mockResolvedValueOnce(mockSessionResponse)
        .mockResolvedValueOnce(mockParticipantResponse);

      const result = await apiService.createSession('John Doe');

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      expect(mockAxiosInstance.post).toHaveBeenNthCalledWith(1, '/sessions/', {
        status: 'submission',
        current_round: 1
      });
      expect(mockAxiosInstance.post).toHaveBeenNthCalledWith(2, '/sessions/1/participants/', {
        name: 'John Doe',
        session_id: 1
      });

      expect(result).toEqual({
        session: mockSessionResponse.data,
        participant: mockParticipantResponse.data
      });
    });

    it('should handle network connection refused error', async () => {
      const networkError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        response: undefined,
        message: 'connect ECONNREFUSED 127.0.0.1:8000'
      };

      mockAxiosInstance.post.mockRejectedValue(networkError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'Cannot connect to server. Please make sure the backend is running on http://localhost:8000'
      );
    });

    it('should handle network error', async () => {
      const networkError = {
        isAxiosError: true,
        code: 'NETWORK_ERROR',
        response: undefined,
        message: 'Network Error'
      };

      mockAxiosInstance.post.mockRejectedValue(networkError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'Network error. Please check your internet connection and make sure the backend is running.'
      );
    });

    it('should handle bad request error', async () => {
      const badRequestError = {
        isAxiosError: true,
        code: 'ERR_BAD_REQUEST',
        response: undefined,
        message: 'Bad Request'
      };

      mockAxiosInstance.post.mockRejectedValue(badRequestError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'Invalid request. Please check your input and try again.'
      );
    });

    it('should handle 400 status error with detail', async () => {
      const badRequestError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            detail: 'Session already exists'
          }
        },
        message: 'Bad Request'
      };

      mockAxiosInstance.post.mockRejectedValue(badRequestError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'Session already exists'
      );
    });

    it('should handle 400 status error with "already exists" message', async () => {
      const badRequestError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            detail: 'A session with this code already exists'
          }
        },
        message: 'Bad Request'
      };

      mockAxiosInstance.post.mockRejectedValue(badRequestError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'A session with this code already exists. Please try again.'
      );
    });

    it('should handle 500 status error', async () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            detail: 'Internal server error'
          }
        },
        message: 'Internal Server Error'
      };

      mockAxiosInstance.post.mockRejectedValue(serverError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should handle generic error', async () => {
      const genericError = new Error('Something went wrong');

      mockAxiosInstance.post.mockRejectedValue(genericError);

      await expect(apiService.createSession('John Doe')).rejects.toThrow(
        'Failed to create session. Please check your connection and try again.'
      );
    });
  });

  describe('joinSession', () => {
    it('should join a session successfully', async () => {
      const mockSessionResponse = {
        data: {
          id: 1,
          code: 'ABC123',
          status: 'submission',
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        }
      };

      const mockParticipantResponse = {
        data: {
          id: 1,
          name: 'John Doe',
          session_id: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockSessionResponse);
      mockAxiosInstance.post.mockResolvedValueOnce(mockParticipantResponse);

      const result = await apiService.joinSession('ABC123', 'John Doe');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sessions/code/ABC123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions/1/participants/', {
        name: 'John Doe',
        session_id: 1
      });

      expect(result).toEqual({
        session: mockSessionResponse.data,
        participant: mockParticipantResponse.data
      });
    });

    it('should handle 404 session not found error', async () => {
      const notFoundError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            detail: 'Session not found'
          }
        },
        message: 'Not Found'
      };

      mockAxiosInstance.get.mockRejectedValue(notFoundError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'Session "ABC123" does not exist. Please check the session code and try again.'
      );
    });

    it('should handle 400 status error with "not accepting new participants"', async () => {
      const badRequestError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            detail: 'Session is not accepting new participants'
          }
        },
        message: 'Bad Request'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: 1,
          code: 'ABC123',
          status: 'voting',
          current_round: 1,
          winner_movie_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
          participants: [],
          movies: []
        }
      });
      mockAxiosInstance.post.mockRejectedValue(badRequestError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'This session is no longer accepting new participants. The voting may have already started.'
      );
    });

    it('should handle network connection refused error', async () => {
      const networkError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        response: undefined,
        message: 'connect ECONNREFUSED 127.0.0.1:8000'
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'Cannot connect to server. Please make sure the backend is running on http://localhost:8000'
      );
    });

    it('should handle network error', async () => {
      const networkError = {
        isAxiosError: true,
        code: 'NETWORK_ERROR',
        response: undefined,
        message: 'Network Error'
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'Network error. Please check your internet connection and make sure the backend is running.'
      );
    });

    it('should handle bad request error', async () => {
      const badRequestError = {
        isAxiosError: true,
        code: 'ERR_BAD_REQUEST',
        response: undefined,
        message: 'Bad Request'
      };

      mockAxiosInstance.get.mockRejectedValue(badRequestError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'Invalid request. Please check your input and try again.'
      );
    });

    it('should handle 500 status error', async () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            detail: 'Internal server error'
          }
        },
        message: 'Internal Server Error'
      };

      mockAxiosInstance.get.mockRejectedValue(serverError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should handle generic error', async () => {
      const genericError = new Error('Something went wrong');

      mockAxiosInstance.get.mockRejectedValue(genericError);

      await expect(apiService.joinSession('ABC123', 'John Doe')).rejects.toThrow(
        'Failed to join session. Please check your connection and try again.'
      );
    });

    it('should log debug information for axios errors', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Session not found' }
        },
        message: 'Request failed with status code 404',
        code: undefined
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await apiService.joinSession('ABC123', 'John Doe');
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Axios error details:', {
        status: 404,
        statusText: 'Not Found',
        data: { detail: 'Session not found' },
        message: 'Request failed with status code 404',
        code: undefined
      });

      consoleSpy.mockRestore();
    });
  });
}); 