// ============================================================================
// CORE ENTITY TYPES
// These match your SQLAlchemy models from the backend
// ============================================================================

export interface Session {
  id: number;
  code: string; // 6-character unique code like "ABCD12"
  status: SessionStatus;
  current_round: number;
  winner_movie_id: number | null;
  created_at: string; // ISO datetime string
  updated_at: string | null;
}

export interface Participant {
  id: number;
  session_id: number;
  name: string;
  created_at: string;
}

export interface Movie {
  id: number;
  session_id: number;
  title: string;
  submitted_by_participant_id: number;
  eliminated_round: number | null; // null if still active
  created_at: string;
}

export interface Vote {
  id: number;
  participant_id: number;
  movie_id: number;
  session_id: number;
  round: number;
  created_at: string;
}

// ============================================================================
// ENUM TYPES
// Define the possible values for status fields
// ============================================================================

export type SessionStatus = 'submission' | 'voting' | 'revote' | 'finished';

// ============================================================================
// API REQUEST TYPES
// Data you send TO the backend
// ============================================================================

export interface CreateSessionRequest {
  status?: SessionStatus; // Optional, defaults to "submission"
  current_round?: number; // Optional, defaults to 1
}

export interface JoinSessionRequest {
  session_code: string;
  participant_name: string;
}

export interface CreateParticipantRequest {
  name: string;
  session_id: number;
}

export interface CreateMovieRequest {
  title: string;
  session_id: number;
  submitted_by_participant_id: number;
}

export interface CreateVoteRequest {
  movie_id: number;
  round: number;
  participant_id: number;
  session_id: number;
}

// ============================================================================
// API RESPONSE TYPES
// Data you receive FROM the backend
// ============================================================================

export interface SessionResponse extends Session {
  participants: Participant[];
  movies: Movie[];
}

export interface SessionStatusResponse {
  session_id: number;
  code: string;
  status: SessionStatus;
  current_round: number;
  participant_count: number;
  movie_count: number;
  winner_movie_id: number | null;
}

export interface VoteSummary {
  movie_id: number;
  movie_title: string;
  vote_count: number;
  round: number;
}

export interface RoundResults {
  round: number;
  votes: VoteSummary[];
  eliminated_movies: number[]; // Array of movie IDs
}

// ============================================================================
// FRONTEND STATE TYPES
// State you manage in your React context
// ============================================================================

export interface SessionState {
  // Current session data
  session: Session | null;
  currentParticipant: Participant | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // UI state
  isConnected: boolean; // WebSocket connection status
}

export interface SessionContextType {
  // State
  sessionState: SessionState;
  
  // Actions
  createSession: (participantName: string) => Promise<void>;
  joinSession: (sessionCode: string, participantName: string) => Promise<void>;
  clearSession: () => void;
  updateSessionStatus: (status: SessionStatus) => void;
  
  // Utility
  isInSession: boolean;
  isSessionCreator: boolean;
}

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// For real-time communication
// ============================================================================

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface JoinSessionMessage {
  session_code: string;
  participant_name: string;
}

export interface SubmitMovieMessage {
  movie_title: string;
}

export interface VoteMessage {
  movie_id: number;
  round: number;
}

// ============================================================================
// UTILITY TYPES
// Helper types for common patterns
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
} 