// Session Context for managing session state across the app
// This will contain your SessionProvider and useSession hook 

import { 
  Participant, 
  Session, 
  SessionContextType, 
  SessionStatus,
  SessionState
} from "../types/api";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiService } from "../services/api";

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function SessionProvider({ children }: { children: ReactNode }) {
  // State management
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    currentParticipant: null,
    isLoading: false,
    error: null,
    isConnected: false
  });

  // Action functions
  const createSession = async (participantName: string) => {
    setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Call the real API
      const result = await apiService.createSession(participantName);
      
      setSessionState(prev => ({ 
        ...prev, 
        isLoading: false,
        session: result.session,
        currentParticipant: result.participant
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
        session: result.session,
        currentParticipant: result.participant
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
      isLoading: false,
      error: null,
      isConnected: false
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

  // Context value
  const contextValue: SessionContextType = {
    sessionState,
    createSession,
    joinSession,
    clearSession,
    updateSessionStatus,
    isInSession: !!sessionState.session,
    isSessionCreator: false // TODO: Implement proper session creator logic when we have participants data
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