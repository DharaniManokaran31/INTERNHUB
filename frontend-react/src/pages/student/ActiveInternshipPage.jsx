import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import StudentSidebar from '../../components/student/StudentSidebar';
import MobileHeader from '../../components/student/MobileHeader';
import { FaPlay, FaCalendarCheck, FaClock, FaTasks, FaTrophy, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
import progressService from '../../services/progressService';
import dailyLogService from '../../services/dailyLogService';

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

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, #2440F0 0%, #0B1DC1 100%);
  border-radius: 20px;
  padding: 40px;
  color: white;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(36, 64, 240, 0.2);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: url('/pattern-bg.png') repeat;
    opacity: 0.1;
    pointer-events: none;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 10px 0;
    letter-spacing: -1px;
  }
  
  p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const SubmitButton = styled.button`
  background: white;
  color: #2440F0;
  border: none;
  padding: 16px 32px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba(0,0,0,0.15);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const ProgressCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #1a1f36;
    font-size: 1.3rem;
  }

  span {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2440F0;
    background: #eef1fe;
    padding: 8px 16px;
    border-radius: 50px;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 12px;
  background: #f1f5f9;
  border-radius: 50px;
  overflow: hidden;
  margin-bottom: 30px;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #2440F0, #60a5fa);
  width: ${props => props.percentage}%;
  border-radius: 50px;
  position: relative;
  transition: width 1s ease-out;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.2) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.2) 75%,
      transparent 75%,
      transparent
    );
    background-size: 20px 20px;
    animation: moveStripes 1s linear infinite;
  }

  @keyframes moveStripes {
    0% { background-position: 0 0; }
    100% { background-position: 20px 0; }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    background: ${props => props.color}20;
    color: ${props => props.color};
  }

  .details {
    span {
      display: block;
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }
    strong {
      display: block;
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 700;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #1a1f36;
      font-size: 1.2rem;
    }

    a {
      color: #2440F0;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;

      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const MentorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;

  img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }

  .details {
    h4 {
      margin: 0 0 5px 0;
      color: #1e293b;
    }
    p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }
  }
`;

const LogStatusItem = styled.div`
  padding: 15px;
  border-radius: 12px;
  background: ${props =>
    props.status === 'approved' ? '#f0fdf4' :
      props.status === 'pending' ? '#fffbeb' : '#f8fafc'};
  border: 1px solid ${props =>
    props.status === 'approved' ? '#bbf7d0' :
      props.status === 'pending' ? '#fef08a' : '#e2e8f0'};
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .date {
    font-weight: 500;
    color: #1e293b;
  }
  
  .status {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${props =>
    props.status === 'approved' ? '#166534' :
      props.status === 'pending' ? '#854d0e' : '#64748b'};
    display: flex;
    align-items: center;
    gap: 6px;
    
    &::before {
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
  }
`;

const ActiveInternshipPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [internship, setInternship] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Ensure student has active internship
        const appsRes = await api.get('/applications/me');
        const acceptedApp = appsRes.data.data.applications?.find(app => app.status === 'accepted');

        if (!acceptedApp) {
          // If no active internship, redirect to dashboard
          navigate('/student/dashboard');
          return;
        }

        const activeInternshipId = acceptedApp.internship._id || acceptedApp.internship;

        const dataPromises = [
          progressService.getInternProgress(user.id || user._id),
          dailyLogService.getStats(),
          dailyLogService.getMyLogs()
        ];

        const [progressRes, statsRes, logsRes] = await Promise.all(dataPromises.map(p => p.catch(e => e)));
        

        if (progressRes && progressRes.progress) {
          setProgress(progressRes.progress);
        }

        if (statsRes && statsRes.stats) {
          setStats(statsRes.stats);
        }

        if (logsRes && logsRes.logs && logsRes.logs.length > 0) {
          setRecentLogs(logsRes.logs.slice(0, 3));
          setInternship(logsRes.logs[0].internshipId);
        } else {
          // Fallback if no logs yet, fetch basic internship info
          const internshipRes = await api.get(`/internships/${activeInternshipId}`);
          setInternship(internshipRes.data.data.internship);
        }
      } catch (error) {
        console.error("Error fetching active internship data", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.id || user._id)) {
      fetchData();
    }
  }, [user?.id, user?._id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <StudentSidebar />
        <ContentWrapper>
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div className="spinner">Loading...</div>
          </div>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // Check if today's log is already submitted
  const todayStr = new Date().toLocaleDateString();
  const hasLoggedToday = recentLogs.length > 0 &&
    new Date(recentLogs[0].date).toLocaleDateString() === todayStr;

  return (
    <PageContainer>
      <StudentSidebar />
      <MobileHeader />

      <ContentWrapper>
        <HeaderContainer>
          <HeaderContent>
            <TitleSection>
              <h1>Active Internship</h1>
              <p>
                <span>{internship?.title || 'Loading Role...'} at {internship?.company?.companyName || internship?.companyName || 'Company'}</span>
                •
                <span>{internship?.department || 'Department'}</span>
              </p>
            </TitleSection>

            <SubmitButton onClick={() => navigate('/student/daily-log')} disabled={hasLoggedToday}>
              <FaPlay />
              {hasLoggedToday ? "Today's Log Submitted" : "Submit Today's Log"}
            </SubmitButton>
          </HeaderContent>
        </HeaderContainer>

        <ProgressCard>
          <ProgressHeader>
            <h3>Program Progress</h3>
            <span>{progress?.percentage || 0}% Completed</span>
          </ProgressHeader>

          <ProgressBarContainer>
            <ProgressBar percentage={progress?.percentage || 0} />
          </ProgressBarContainer>

          <StatsGrid>
            <StatItem color="#2440F0">
              <div className="icon"><FaCalendarCheck /></div>
              <div className="details">
                <span>Days Completed</span>
                <strong>{progress?.completedDays || 0} / {progress?.totalDays || 60}</strong>
              </div>
            </StatItem>
            <StatItem color="#10b981">
              <div className="icon"><FaClock /></div>
              <div className="details">
                <span>Total Hours Logs</span>
                <strong>{progress?.totalHours || 0} hrs</strong>
              </div>
            </StatItem>
            <StatItem color="#f59e0b">
              <div className="icon"><FaTasks /></div>
              <div className="details">
                <span>Pending Reviews</span>
                <strong>{stats?.pendingLogs || 0} logs</strong>
              </div>
            </StatItem>
            <StatItem color="#8b5cf6">
              <div className="icon"><FaTrophy /></div>
              <div className="details">
                <span>Current Streak</span>
                <strong>{hasLoggedToday ? 1 : 0} Days</strong>
              </div>
            </StatItem>
          </StatsGrid>
        </ProgressCard>

        <Grid>
          <Card>
            <div className="header">
              <h3>Recent Logs Activity</h3>
              <a href="/student/my-logs">View All History <FaArrowRight /></a>
            </div>

            {recentLogs.length > 0 ? (
              <div>
                {recentLogs.map((log) => (
                  <LogStatusItem key={log._id} status={log.status}>
                    <div>
                      <div className="date">
                        {new Date(log.date).toLocaleDateString('en-US', {
                          weekday: 'long', month: 'short', day: 'numeric'
                        })}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                        {log.totalHours} hours • {log.tasksCompleted?.length || 0} tasks
                      </div>
                    </div>
                    <div className="status">{log.status}</div>
                  </LogStatusItem>
                ))}
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                <FaCalendarCheck style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '10px' }} />
                <p style={{ margin: 0 }}>No logs submitted yet.</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>Submit your first log today to start tracking your progress!</p>
              </div>
            )}
          </Card>

          <Card>
            <div className="header">
              <h3>Your Mentor</h3>
            </div>

            {internship?.mentorId ? (
              <MentorInfo>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%',
                  background: '#2440F0', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold'
                }}>
                  {internship.mentorId.fullName ? internship.mentorId.fullName.charAt(0) : 'M'}
                </div>
                <div className="details">
                  <h4>{internship.mentorId.fullName || 'Recruiter'}</h4>
                  <p>{internship.mentorId.email || 'Mentor'}</p>
                </div>
              </MentorInfo>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                Mentor information loading or unavailable.
              </div>
            )}

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Important Rules</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <li>Submit your log before <strong>8 PM</strong> daily.</li>
                <li>Minimum of <strong>4 hours</strong> of work is required.</li>
                <li>Logs must be approved to count towards progress.</li>
                <li>Missing 3 consecutive days may affect your internship status.</li>
              </ul>
            </div>
          </Card>
        </Grid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ActiveInternshipPage;
