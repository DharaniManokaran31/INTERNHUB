import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import StudentSidebar from '../../components/student/StudentSidebar';
import MobileHeader from '../../components/student/MobileHeader';
import { FaFlagCheckered, FaCheckCircle, FaClock } from 'react-icons/fa';
import api from '../../services/api';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f4f7fc;
`;

const ContentWrapper = styled.div`
  flex: 1;
  margin-left: 260px;
  padding: 40px;

  @media (max-width: 1024px) {
    margin-left: 0;
    padding: 20px;
    padding-top: 80px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 30px;

  h1 {
    font-size: 2.2rem;
    font-weight: 800;
    color: #1a1f36;
    margin: 0 0 10px 0;
  }
  
  p {
    color: #64748b;
    margin: 0;
    font-size: 1.1rem;
  }
`;

const MilestoneCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-left: 5px solid ${props =>
        props.status === 'completed' ? '#10b981' :
            props.status === 'overdue' ? '#dc2626' :
                '#2440F0'};
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  background: ${props =>
        props.status === 'completed' ? '#def7ec' :
            props.status === 'overdue' ? '#fde8e8' :
                '#eef1fe'};
  color: ${props =>
        props.status === 'completed' ? '#046c4e' :
            props.status === 'overdue' ? '#9b1c1c' :
                '#2440F0'};
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 8px 0;
    color: #1e293b;
    font-size: 1.25rem;
  }
  
  p {
    margin: 0 0 15px 0;
    color: #64748b;
    line-height: 1.5;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .due-date {
    color: ${props => props.status === 'overdue' ? '#dc2626' : '#64748b'};
  }
  
  .status-badge {
    padding: 4px 12px;
    border-radius: 50px;
    font-size: 0.8rem;
    text-transform: uppercase;
    background: ${props =>
        props.status === 'completed' ? '#def7ec' :
            props.status === 'overdue' ? '#fde8e8' :
                '#eef1fe'};
    color: ${props =>
        props.status === 'completed' ? '#046c4e' :
            props.status === 'overdue' ? '#9b1c1c' :
                '#2440F0'};
  }
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 20px;
  padding: 60px 20px;
  text-align: center;
  color: #64748b;

  .icon {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 20px;
  }

  h3 {
    margin: 0 0 10px 0;
    color: #1e293b;
    font-size: 1.5rem;
  }
`;

const MilestonesPage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMilestones = async () => {
            try {
                setLoading(true);
                const profileRes = await api.get('/students/profile');
                const internshipId = profileRes.data.data.user.currentInternship;

                if (internshipId) {
                    const internshipRes = await api.get(`/internships/${internshipId}`);
                    if (internshipRes.data.data.internship.milestones) {
                        setMilestones(internshipRes.data.data.internship.milestones);
                    }
                }
            } catch (error) {
                console.error("Error fetching milestones", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user._id) {
            fetchMilestones();
        }
    }, [user?._id]);

    return (
        <PageContainer>
            <StudentSidebar />
            <MobileHeader />

            <ContentWrapper>
                <PageHeader>
                    <h1>Project Milestones</h1>
                    <p>Track your key deliverables and deadlines.</p>
                </PageHeader>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading milestones...</div>
                ) : milestones.length > 0 ? (
                    <div>
                        {milestones.map((milestone, index) => (
                            <MilestoneCard key={index} status={milestone.status}>
                                <IconWrapper status={milestone.status}>
                                    {milestone.status === 'completed' ? <FaCheckCircle /> :
                                        milestone.status === 'overdue' ? <FaClock /> :
                                            <FaFlagCheckered />}
                                </IconWrapper>

                                <Content>
                                    <h3>{milestone.title}</h3>
                                    <p>{milestone.description}</p>

                                    <MetaInfo status={milestone.status}>
                                        <div className="status-badge">
                                            {milestone.status === 'pending' ? 'In Progress' : milestone.status}
                                        </div>
                                        {milestone.dueDate && (
                                            <div className="meta-item due-date">
                                                <FaClock /> Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        {milestone.completedDate && (
                                            <div className="meta-item" style={{ color: '#10b981' }}>
                                                <FaCheckCircle /> Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </MetaInfo>
                                </Content>
                            </MilestoneCard>
                        ))}
                    </div>
                ) : (
                    <EmptyState>
                        <div className="icon"><FaFlagCheckered /></div>
                        <h3>No Milestones Yet</h3>
                        <p>Your mentor hasn't assigned any specific milestones to your internship yet.<br />Focus on submitting your daily logs in the meantime!</p>
                    </EmptyState>
                )}

            </ContentWrapper>
        </PageContainer>
    );
};

export default MilestonesPage;
