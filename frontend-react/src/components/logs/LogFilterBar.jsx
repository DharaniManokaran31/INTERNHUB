import React from 'react';
import styled from 'styled-components';

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 5px;
  
  /* Scrollbar hide */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const FilterTab = styled.button`
  padding: 8px 16px;
  border-radius: 50px;
  border: 1px solid ${props => props.active ? '#2440F0' : '#e5e7eb'};
  background: ${props => props.active ? '#2440F0' : 'white'};
  color: ${props => props.active ? 'white' : '#4b5563'};
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.active ? '#1e30c0' : '#f3f4f6'};
  }
`;

const LogFilterBar = ({ currentFilter, onFilterChange }) => {
    const filters = [
        { id: 'all', label: 'All Logs' },
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Needs Revision' }
    ];

    return (
        <FilterContainer>
            {filters.map(filter => (
                <FilterTab
                    key={filter.id}
                    active={currentFilter === filter.id}
                    onClick={() => onFilterChange(filter.id)}
                >
                    {filter.label}
                </FilterTab>
            ))}
        </FilterContainer>
    );
};

export default LogFilterBar;
