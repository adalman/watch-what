// Session Context for managing session state across the app
// This will contain your SessionProvider and useSession hook 

import { 
  Participant, 
  Session, 
  SessionContextType, 
  SessionStatus,
  SessionState,
  VoteSummary
} from "../types/api";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiService } from "../services/api";
import { useRef } from "react";

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function SessionProvider({ children }: { children: ReactNode }) {
  // State management
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    currentParticipant: null,
    movies: [],
    participants: [],
    voteSummaries: [],
    isLoading: false,
    error: null,
    isConnected: false,
    roundResults: null,
    showRoundResultsModal: false
  });

  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection effect for real-time updates
  useEffect(() => {
    if (!sessionState.session?.id) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionState.session.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setSessionState(prev => ({ ...prev, isConnected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // If the backend sends the full session object, update it
        if (data.session) {
          setSessionState(prev => ({
            ...prev,
            session: data.session
          }));
        }
        switch (data.type) {
            case 'participant_joined':
                setSessionState(prev => {
                    if (!prev.session) return prev;
                    const newParticipant = data.participant;
                    return {
                        ...prev,
                        session: {
                            ...prev.session,
                            participants: [...prev.session.participants, newParticipant]
                        }
                    };
                });
                break;
            case 'movie_submitted':
                setSessionState(prev => {
                    if (!prev.session) return prev;
                    const newMovie = data.movie;
                    return {
                        ...prev,
                        session: {
                            ...prev.session,
                            movies: [...prev.session.movies, newMovie]
                        }
                    };
                });
                break;
            case 'movie_eliminated':
                setSessionState(prev => {
                    if (!prev.session) return prev;
                    const eliminatedMovieId = data.movie_id;
                    const eliminatedRound = data.eliminated_round ?? prev.session.current_round;
                    const updatedMovies = prev.session.movies.map(movie =>
                        movie.id === eliminatedMovieId
                            ? { ...movie, eliminated_round: eliminatedRound }
                            : movie
                    );
                    return {
                        ...prev,
                        session: {
                            ...prev.session,
                            movies: updatedMovies
                        }
                    };
                });
                break;
            case 'round_advanced':
                setSessionState(prev => ({
                    ...prev,
                    roundResults: data,
                    showRoundResultsModal: true,
                    session: prev.session ? {
                        ...prev.session,
                        current_round: data.new_round
                    } : prev.session
                }));
                break;
            case 'vote_cast':
                setSessionState(prev => {
                    if (!prev.session) return prev;
                    return {
                        ...prev,
                        voteSummaries: data.vote_summaries
                    };
                });
                break;
            case 'session_finished':
                setSessionState(prev => {
                    if (!prev.session) return prev;
                    return {
                        ...prev,
                        session: {
                            ...prev.session,
                            status: 'finished',
                            winner_movie_id: data.winner?.id ?? prev.session.winner_movie_id
                        }
                    };
                });
                break;
            case 'session_status_updated':
                setSessionState(prev => {
                    if (!prev.session) return prev;
                    return {
                        ...prev,
                        session: {
                            ...prev.session,
                            status: data.status
                        }
                    };
                });
                break;
        }
      } catch (err) {
        // Optionally handle JSON parse errors
      }
    };

    ws.onclose = () => {
      setSessionState(prev => ({ ...prev, isConnected: false }));
    };

    return () => {
      ws.close();
    };
  }, [sessionState.session?.id]);

  // Hide the round results modal after 4 seconds when it is shown
  useEffect(() => {
    if (sessionState.showRoundResultsModal) {
      const timeout = setTimeout(() => {
        setSessionState(prev => ({ ...prev, showRoundResultsModal: false }));
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [sessionState.showRoundResultsModal]);

  // Action functions
  const createSession = async (participantName: string) => {
    setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Call the real API
      const result = await apiService.createSession(participantName);
      
      setSessionState(prev => ({ 
        ...prev, 
        isLoading: false,
        session: {
          ...result.session,
          participants: [...(result.session.participants || []), result.participant]
        },
        currentParticipant: result.participant,
        movies: result.session.movies || [],
        participants: [...(result.session.participants || []), result.participant]
      }));
    } catch (error) {
      setSessionState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to create session' 
      }));
    }
  };

  const joinSession = async (sessionCode: string, participantName: string) => {
    setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Call the real API
      const result = await apiService.joinSession(sessionCode, participantName);
      
      setSessionState(prev => ({ 
        ...prev, 
        isLoading: false,
        session: {
          ...result.session,
          participants: [...(result.session.participants || []), result.participant]
        },
        currentParticipant: result.participant,
        movies: result.session.movies || [],
        participants: [...(result.session.participants || []), result.participant]
      }));
    } catch (error) {
      setSessionState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to join session' 
      }));
    }
  };

  const clearSession = () => {
    setSessionState({
      session: null,
      currentParticipant: null,
      movies: [],
      participants: [],
      voteSummaries: [],
      isLoading: false,
      error: null,
      isConnected: false,
      roundResults: null,
      showRoundResultsModal: false
    });
  };

  const updateSessionStatus = (status: SessionStatus) => {
    if (sessionState.session) {
      setSessionState(prev => ({
        ...prev,
        session: {
          ...prev.session!,
          status
        }
      }));
    }
  };

  // Keep movies and participants in sync with session updates (e.g., from WebSocket)
  useEffect(() => {
    if (sessionState.session) {
      const sessionMovies = sessionState.session.movies || [];
      const sessionParticipants = sessionState.session.participants || [];
      // Only update if different to avoid infinite loop
      if (
        sessionMovies.length !== sessionState.movies.length ||
        sessionParticipants.length !== sessionState.participants.length
      ) {
        setSessionState(prev => ({
          ...prev,
          movies: sessionMovies,
          participants: sessionParticipants
        }));
      }
    } else {
      if (sessionState.movies.length > 0 || sessionState.participants.length > 0) {
        setSessionState(prev => ({ ...prev, movies: [], participants: [] }));
      }
    }
  }, [sessionState.session]);

  // Context value
  const contextValue: SessionContextType = {
    sessionState,
    createSession,
    joinSession,
    clearSession,
    updateSessionStatus,
    isInSession: !!sessionState.session,
    isSessionCreator: false, // TODO: Implement proper session creator logic when we have participants data
    roundResults: sessionState.roundResults,
    showRoundResultsModal: sessionState.showRoundResultsModal
  };

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
}

// 3. Create custom hook
function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}

// 4. Export
export { SessionProvider, useSession };