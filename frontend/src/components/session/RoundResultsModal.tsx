import React from 'react';
import { SessionResponse } from '../../types/api';

interface RoundResultsModalProps {
  show: boolean;
  roundResults: any;
  session: SessionResponse;
  onClose?: () => void;
}

const RoundResultsModal: React.FC<RoundResultsModalProps> = ({ show, roundResults, session }) => {
  if (!show || !roundResults) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem 3rem',
        minWidth: '350px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
        textAlign: 'center',
        maxWidth: '90vw'
      }}>
        <h2 style={{ color: '#059669', fontSize: '2rem', marginBottom: '1rem' }}>Round {roundResults.old_round} Results</h2>
        <h3 style={{ color: '#1f2937', fontSize: '1.2rem', marginBottom: '1rem' }}>Vote Counts</h3>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
          {Object.values(roundResults.vote_counts).map((vc: any) => (
            <li key={vc.movie_id} style={{ marginBottom: '0.5rem' }}>
              <strong>{vc.movie_title || session.movies.find(m => m.id === vc.movie_id)?.title || 'Unknown Movie'}:</strong> {vc.vote_count} vote{vc.vote_count !== 1 ? 's' : ''}
            </li>
          ))}
        </ul>
        {roundResults.eliminated_count > 0 ? (
          <div style={{ color: '#dc2626', fontWeight: 600, fontSize: '1.1rem' }}>
            Eliminated: {roundResults.eliminated_count} movie{roundResults.eliminated_count !== 1 ? 's' : ''}
          </div>
        ) : (
          <div style={{ color: '#059669', fontWeight: 600, fontSize: '1.1rem' }}>
            No movies eliminated (tie)
          </div>
        )}
      </div>
    </div>
  );
};

export default RoundResultsModal; 