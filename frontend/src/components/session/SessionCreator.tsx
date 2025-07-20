import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import './SessionCreator.css';

function SessionCreator() {
  const [participantName, setParticipantName] = useState('');
  const { createSession, sessionState } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participantName.trim()) {
      await createSession(participantName.trim());
    }
  };

  return (
    <div className="session-creator">
      <h3>Create New Session</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="participantName">Your Name:</label>
          <input
            type="text"
            id="participantName"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
            required
            disabled={sessionState.isLoading}
          />
        </div>
        <button 
          type="submit" 
          disabled={!participantName.trim() || sessionState.isLoading}
        >
          {sessionState.isLoading ? 'Creating...' : 'Create Session'}
        </button>
      </form>
    </div>
  );
}

export default SessionCreator; 