import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  border-left: 4px solid ${props =>
        props.status === 'approved' ? '#10b981' :
            props.status === 'rejected' ? '#dc2626' :
                props.status === 'needs-revision' ? '#eab308' :
                    '#f59e0b'};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 12px;
`;

const DayInfo = styled.div`
  h3 {
    margin: 0 0 4px 0;
    color: #1f2937;
    font-size: 1.1rem;
  }
  span {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const Badge = styled.span`
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props =>
        props.status === 'approved' ? '#def7ec' :
            props.status === 'rejected' ? '#fde8e8' :
                props.status === 'needs-revision' ? '#fef3c7' :
                    '#fef3c7'};
  color: ${props =>
        props.status === 'approved' ? '#03543f' :
            props.status === 'rejected' ? '#9b1c1c' :
                props.status === 'needs-revision' ? '#92400e' :
                    '#92400e'};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const Section = styled.div`
  h4 {
    margin: 0 0 10px 0;
    color: #4b5563;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TaskList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TaskItem = styled.li`
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  
  &::before {
    content: '•';
    color: #2440F0;
    font-weight: bold;
  }
`;

const FeedbackBox = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  border-left: 3px solid #8b5cf6;
  
  h5 {
    margin: 0 0 8px 0;
    color: #4c1d95;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  p {
    margin: 0;
    color: #334155;
    font-size: 0.9rem;
  }
`;

const DailyLogCard = ({ log }) => {
    const date = new Date(log.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <Card status={log.status}>
            <Header>
                <DayInfo>
                    <h3>Day {log.dayNumber}</h3>
                    <span>{date} • {log.totalHours} hours logged</span>
                </DayInfo>
                <Badge status={log.status}>{log.status}</Badge>
            </Header>

            <ContentGrid>
                <div>
                    <Section>
                        <h4>Tasks Completed</h4>
                        <TaskList>
                            {log.tasksCompleted?.map((task, index) => (
                                <TaskItem key={index}>
                                    <div>
                                        {task.description}
                                        {task.hoursSpent && <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '6px' }}>({task.hoursSpent}h)</span>}
                                    </div>
                                </TaskItem>
                            ))}
                        </TaskList>
                    </Section>

                    {(log.learnings || log.challenges) && (
                        <Section style={{ marginTop: '20px' }}>
                            {log.learnings && (
                                <div style={{ marginBottom: '10px' }}>
                                    <h4>Learnings</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>{log.learnings}</p>
                                </div>
                            )}
                            {log.challenges && (
                                <div>
                                    <h4>Challenges</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>{log.challenges}</p>
                                </div>
                            )}
                        </Section>
                    )}
                </div>

                <div>
                    {log.tomorrowPlan && (
                        <Section>
                            <h4>Plan for Tomorrow</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>{log.tomorrowPlan}</p>
                        </Section>
                    )}

                    {log.mentorFeedback && log.mentorFeedback.comment && (
                        <FeedbackBox>
                            <h5>Mentor Feedback {log.mentorFeedback.rating && `• ${log.mentorFeedback.rating}/5`}</h5>
                            <p>{log.mentorFeedback.comment}</p>
                        </FeedbackBox>
                    )}
                </div>
            </ContentGrid>
        </Card>
    );
};

export default DailyLogCard;
