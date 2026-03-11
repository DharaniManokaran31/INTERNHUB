import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import StudentSidebar from '../../components/student/StudentSidebar';
import MobileHeader from '../../components/student/MobileHeader';
import DailyLogCard from '../../components/logs/DailyLogCard';
import LogFilterBar from '../../components/logs/LogFilterBar';
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

const PageHeader = styled.div`
  margin-bottom: 30px;

  h1 {
    font-size: 2rem;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  
  h4 {
    margin: 0 0 10px 0;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .val {
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.color || '#1e293b'};
  }
`;

const MyLogsPage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?._id) return;
            try {
                setLoading(true);
                const [logsRes, statsRes] = await Promise.all([
                    dailyLogService.getMyLogs(),
                    dailyLogService.getStats()
                ]);

                if (logsRes && logsRes.logs) {
                    setLogs(logsRes.logs);
                    setFilteredLogs(logsRes.logs);
                }

                if (statsRes && statsRes.stats) {
                    setStats(statsRes.stats);
                }
            } catch (error) {
                console.error("Error fetching logs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (filter === 'all') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(log => log.status === filter));
        }
    }, [filter, logs]);

    return (
        <PageContainer>
            <StudentSidebar />
            <MobileHeader />

            <ContentWrapper>
                <PageHeader>
                    <h1>My Daily Logs</h1>
                    <p>Track your internship progress and mentor feedback.</p>
                </PageHeader>

                {stats && (
                    <StatsGrid>
                        <StatCard color="#2440F0">
                            <h4>Total Submissions</h4>
                            <div className="val">{stats.totalLogs}</div>
                        </StatCard>
                        <StatCard color="#10b981">
                            <h4>Approved Logs</h4>
                            <div className="val">{stats.approvedLogs}</div>
                        </StatCard>
                        <StatCard color="#f59e0b">
                            <h4>Pending Review</h4>
                            <div className="val">{stats.pendingLogs}</div>
                        </StatCard>
                        <StatCard color="#dc2626">
                            <h4>Needs Revision</h4>
                            <div className="val">{stats.rejectedLogs}</div>
                        </StatCard>
                    </StatsGrid>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <LogFilterBar currentFilter={filter} onFilterChange={setFilter} />
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading logs...</div>
                ) : filteredLogs.length > 0 ? (
                    <div>
                        {filteredLogs.map(log => (
                            <DailyLogCard key={log._id} log={log} />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        background: 'white',
                        padding: '50px 20px',
                        textAlign: 'center',
                        borderRadius: '12px',
                        color: '#64748b'
                    }}>
                        <p>No logs found matching your criteria.</p>
                    </div>
                )}
            </ContentWrapper>
        </PageContainer>
    );
};

export default MyLogsPage;
