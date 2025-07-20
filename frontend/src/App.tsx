import React from 'react';
import './App.css';
import { SessionProvider } from './context/SessionContext';
import { useSession } from './context/SessionContext';
import SessionCreator from './components/session/SessionCreator';
import SessionJoiner from './components/session/SessionJoiner';
import SessionView from './components/session/SessionView';

// Main app content that uses the session context
function AppContent() {
  const { sessionState, isInSession } = useSession();

  return (
    <div className="App">
      <header className="App-header">
        <h1>What Should We Watch?</h1>
      </header>
      
      <main>
        
        {isInSession ? (
          <SessionView />
        ) : (
          <div>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
              Join or Create a Movie Voting Session
            </h2>
            {sessionState.error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto 2rem auto'
              }}>
                {sessionState.error}
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              <SessionCreator />
              <SessionJoiner />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Main App component that provides the session context
function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
