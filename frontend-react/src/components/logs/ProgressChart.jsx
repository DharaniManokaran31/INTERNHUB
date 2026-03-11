import React from 'react';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.1rem;
  }
`;

const BarsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 10px;
  padding-bottom: 30px;
  position: relative;
  border-bottom: 1px solid #e5e7eb;
`;

const BarWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  position: relative;
`;

const BarAmount = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
`;

const Bar = styled.div`
  width: 100%;
  max-width: 40px;
  background: linear-gradient(to top, #2440F0, #60a5fa);
  border-radius: 4px 4px 0 0;
  height: ${props => `${Math.max(props.height, 2)}%`};
  transition: height 0.5s ease;
`;

const BarLabel = styled.span`
  position: absolute;
  bottom: -25px;
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
`;

const ProgressChart = ({ data }) => {
    if (!data || !data.categories || data.categories.length === 0) {
        return (
            <ChartContainer>
                <ChartHeader>
                    <h3>Weekly Hours Logged</h3>
                </ChartHeader>
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    No data available yet
                </div>
            </ChartContainer>
        );
    }

    // Find max hours for scaling
    const maxHours = Math.max(...data.hours, 40); // Base scale on 40 hours max or actual max if higher

    return (
        <ChartContainer>
            <ChartHeader>
                <h3>Weekly Hours Logged</h3>
            </ChartHeader>

            <BarsContainer>
                {data.categories.map((category, index) => {
                    const height = (data.hours[index] / maxHours) * 100;
                    return (
                        <BarWrapper key={category}>
                            <BarAmount>{data.hours[index]}h</BarAmount>
                            <Bar height={height} />
                            <BarLabel>{category.replace('Week ', 'W')}</BarLabel>
                        </BarWrapper>
                    );
                })}
            </BarsContainer>
        </ChartContainer>
    );
};

export default ProgressChart;
