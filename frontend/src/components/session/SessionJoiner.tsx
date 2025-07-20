import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import './SessionJoiner.css';

function SessionJoiner() {
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [errors, setErrors] = useState<{ sessionCode?: string; participantName?: string }>({});
  
  const { joinSession, sessionState } = useSession();

  const validateForm = () => {
    const newErrors: { sessionCode?: string; participantName?: string } = {};

    // Validate session code
    if (!sessionCode.trim()) {
      newErrors.sessionCode = 'Session code is required';
    } else if (sessionCode.trim().length !== 6) {
      newErrors.sessionCode = 'Session code must be 6 characters';
    }

    // Validate participant name
    if (!participantName.trim()) {
      newErrors.participantName = 'Name is required';
    } else if (participantName.trim().length < 2) {
      newErrors.participantName = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await joinSession(sessionCode.trim().toUpperCase(), participantName.trim());
      } catch (error) {
        // Error is handled by the context
        console.error('Failed to join session:', error);
      }
    }
  };

  const handleSessionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSessionCode(value);
    // Clear error when user starts typing
    if (errors.sessionCode) {
      setErrors(prev => ({ ...prev, sessionCode: undefined }));
    }
  };

  const handleParticipantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParticipantName(e.target.value);
    // Clear error when user starts typing
    if (errors.participantName) {
      setErrors(prev => ({ ...prev, participantName: undefined }));
    }
  };

  return (
    <div className="session-joiner">
      <h3>Join Existing Session</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sessionCode">Session Code:</label>
          <input
            type="text"
            id="sessionCode"
            value={sessionCode}
            onChange={handleSessionCodeChange}
            placeholder="Enter 6-character code"
            maxLength={6}
            required
            disabled={sessionState.isLoading}
            className={errors.sessionCode ? 'error' : ''}
          />
          {errors.sessionCode && (
            <div className="error-message">{errors.sessionCode}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="participantName">Your Name:</label>
          <input
            type="text"
            id="participantName"
            value={participantName}
            onChange={handleParticipantNameChange}
            placeholder="Enter your name"
            required
            disabled={sessionState.isLoading}
            className={errors.participantName ? 'error' : ''}
          />
          {errors.participantName && (
            <div className="error-message">{errors.participantName}</div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={!sessionCode.trim() || !participantName.trim() || sessionState.isLoading}
        >
          {sessionState.isLoading ? 'Joining...' : 'Join Session'}
        </button>
      </form>
    </div>
  );
}

export default SessionJoiner; 