import axios from 'axios';

// API service functions for communicating with the FastAPI backend
// This will contain axios calls to your session, participant, and movie endpoints

// Base URL for your FastAPI server
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Create a new session and add the first participant
  createSession: async (participantName: string) => {
    try {
      // Step 1: Create the session
      const sessionResponse = await api.post('/sessions/', {
        status: 'submission',
        current_round: 1
      });
      
      const session = sessionResponse.data;
      console.log('Session created:', session);
      
      // Step 2: Add the participant to the session
      const participantResponse = await api.post(`/sessions/${session.id}/participants/`, {
        name: participantName,
        session_id: session.id
      });
      
      const participant = participantResponse.data;
      console.log('Participant added:', participant);
      
      // Return both session and participant data
      return {
        session,
        participant
      };
    } catch (error) {
      console.error('Error creating session:', error);
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorCode = error.code;
        
        // Handle network errors first (when response is undefined)
        if (errorCode === 'ECONNREFUSED') {
          throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
        } else if (errorCode === 'NETWORK_ERROR' || errorCode === 'ERR_NETWORK') {
          throw new Error('Network error. Please check your internet connection and make sure the backend is running.');
        } else if (errorCode === 'ERR_BAD_REQUEST') {
          throw new Error('Invalid request. Please check your input and try again.');
        }
        
        // Handle HTTP status codes
        if (status === 400) {
          const detail = error.response?.data?.detail;
          if (detail && detail.includes('already exists')) {
            throw new Error('A session with this code already exists. Please try again.');
          }
          throw new Error(detail || 'Invalid request. Please check your input.');
        } else if (status && status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      // Generic error fallback
      throw new Error('Failed to create session. Please check your connection and try again.');
    }
  },
  
  // Join an existing session
  joinSession: async (sessionCode: string, participantName: string) => {
    try {
      // Step 1: Get session by code
      const url = `/sessions/code/${sessionCode}`;
      console.log('Making request to:', `${API_BASE_URL}${url}`);
      const sessionResponse = await api.get(url);
      const session = sessionResponse.data;
      console.log('Session found:', session);
      
      // Step 2: Add participant to the session
      const participantResponse = await api.post(`/sessions/${session.id}/participants/`, {
        name: participantName,
        session_id: session.id
      });
      
      const participant = participantResponse.data;
      console.log('Participant added:', participant);
      
      // Return both session and participant data
      return {
        session,
        participant
      };
    } catch (error) {
      console.error('Error joining session:', error);
      
      // Debug: Log the full error details
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code
        });
      }
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorCode = error.code;
        
        // Handle network errors first (when response is undefined)
        if (errorCode === 'ECONNREFUSED') {
          throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
        } else if (errorCode === 'NETWORK_ERROR' || errorCode === 'ERR_NETWORK') {
          throw new Error('Network error. Please check your internet connection and make sure the backend is running.');
        } else if (errorCode === 'ERR_BAD_REQUEST') {
          throw new Error('Invalid request. Please check your input and try again.');
        }
        
        // Handle HTTP status codes
        if (status === 404) {
          throw new Error(`Session "${sessionCode}" does not exist. Please check the session code and try again.`);
        } else if (status === 400) {
          const detail = error.response?.data?.detail;
          if (detail && detail.includes('not accepting new participants')) {
            throw new Error('This session is no longer accepting new participants. The voting may have already started.');
          }
          throw new Error(detail || 'Invalid request. Please check your input.');
        } else if (status && status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      // Generic error fallback
      throw new Error('Failed to join session. Please check your connection and try again.');
    }
  },

  // Submit a movie to a session
  submitMovie: async (sessionId: number, title: string, participantId: number) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/movies/`, {
        title,
        session_id: sessionId,
        submitted_by_participant_id: participantId
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting movie:', error);
      throw new Error('Failed to submit movie. Please try again.');
    }
  },

  // Cast votes for movies in a session round
  vote: async (sessionId: number, movieIds: number[], participantId: number, round: number) => {
    try {
      // The backend expects one vote per movie, so send multiple requests
      const votePromises = movieIds.map(movieId =>
        api.post(`/sessions/${sessionId}/votes/`, {
          movie_id: movieId,
          round,
          participant_id: participantId,
          session_id: sessionId
        })
      );
      const responses = await Promise.all(votePromises);
      return responses.map(res => res.data);
    } catch (error) {
      console.error('Error voting:', error);
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (detail) {
          throw new Error(detail);
        }
      }
      throw new Error('Failed to submit votes. Please try again.');
    }
  },

  // Update the session status (e.g., to 'voting')
  updateSessionStatus: async (sessionId: number, status: string) => {
    try {
      await api.put(`/sessions/${sessionId}/status?status=${encodeURIComponent(status)}`);
    } catch (error) {
      console.error('Error updating session status:', error);
      throw new Error('Failed to update session status.');
    }
  },

  // Get all votes by a participant in a specific round of a session
  getParticipantVotesForRound: async (sessionId: number, participantId: number, roundNumber: number) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/votes/participant/${participantId}/round/${roundNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant votes:', error);
      throw new Error('Failed to fetch participant votes.');
    }
  }
}