// src/components/modals/FeedbackModal.jsx
import React, { useState } from 'react';

const FeedbackModal = ({ interview, round, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    roundNumber: round.roundNumber,
    result: 'pass',
    score: '',
    percentage: '',
    feedback: {
      rating: 3,
      strengths: '',
      weaknesses: '',
      technicalSkills: 3,
      communicationSkills: 3,
      problemSolving: 3,
      overallImpression: '',
      detailedNotes: '',
      recommendedNextRound: true
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isLastRound = interview && interview.rounds ? round.roundNumber === interview.rounds.length : false;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>
          {round.roundType} - Round {round.roundNumber} Result
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Result Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Result
            </label>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="result"
                  value="pass"
                  checked={formData.result === 'pass'}
                  onChange={handleChange}
                />
                <span style={{ color: '#10b981', fontWeight: '600' }}>PASS ✓</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="result"
                  value="fail"
                  checked={formData.result === 'fail'}
                  onChange={handleChange}
                />
                <span style={{ color: '#dc2626', fontWeight: '600' }}>FAIL ✗</span>
              </label>
            </div>
          </div>

          {/* Score (if applicable) */}
          {(round.roundType.includes('Test') || round.roundType.includes('Interview') || round.roundType.includes('Assignment')) && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Score (0-100)
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.9375rem'
                }}
              />
            </div>
          )}

          {/* Ratings */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ratings (1-5)</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Technical Skills</label>
              <input
                type="range"
                name="feedback.technicalSkills"
                value={formData.feedback.technicalSkills}
                onChange={handleChange}
                min="1"
                max="5"
                step="1"
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Poor</span>
                <span>Average</span>
                <span>Excellent</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Communication Skills</label>
              <input
                type="range"
                name="feedback.communicationSkills"
                value={formData.feedback.communicationSkills}
                onChange={handleChange}
                min="1"
                max="5"
                step="1"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Problem Solving</label>
              <input
                type="range"
                name="feedback.problemSolving"
                value={formData.feedback.problemSolving}
                onChange={handleChange}
                min="1"
                max="5"
                step="1"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Feedback Text */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Strengths
            </label>
            <textarea
              name="feedback.strengths"
              value={formData.feedback.strengths}
              onChange={handleChange}
              rows="2"
              placeholder="What did the candidate do well?"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Areas for Improvement
            </label>
            <textarea
              name="feedback.weaknesses"
              value={formData.feedback.weaknesses}
              onChange={handleChange}
              rows="2"
              placeholder="What could be improved?"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Detailed Notes
            </label>
            <textarea
              name="feedback.detailedNotes"
              value={formData.feedback.detailedNotes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional comments..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Next Round Recommendation - Only show if not last round and result is pass */}
          {formData.result === 'pass' && !isLastRound && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="feedback.recommendedNextRound"
                  checked={formData.feedback.recommendedNextRound}
                  onChange={handleChange}
                />
                <span>Recommend for next round</span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                background: '#2440F0',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Submit Result
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#1f2937',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;