import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import StudentSidebar from '../../components/student/StudentSidebar';
import MobileHeader from '../../components/student/MobileHeader';
import { FaPlus, FaTrash, FaPaperPlane } from 'react-icons/fa';
import api from '../../services/api';
import dailyLogService from '../../services/dailyLogService';
import { toast } from 'react-toastify';

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
    letter-spacing: -0.5px;
  }
  
  p {
    color: #64748b;
    margin: 0;
    font-size: 1.1rem;
  }
`;

const FormCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  max-width: 900px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 25px;

  label {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
  }

  input[type="text"],
  input[type="number"],
  input[type="date"],
  select,
  textarea {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    color: #1e293b;
    background: #f8fafc;
    transition: all 0.3s ease;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: #2440F0;
      background: white;
      box-shadow: 0 0 0 4px rgba(36, 64, 240, 0.1);
    }
  }
`;

const TaskContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  background: #fafafa;
  position: relative;
`;

const TrashButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fee2e2;
  }
`;

const FlexRow = styled.div`
  display: flex;
  gap: 15px;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e293b;
  margin: 30px 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #f1f5f9;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;

  &.primary {
    background: linear-gradient(135deg, #2440F0 0%, #0B1DC1 100%);
    color: white;
    width: 100%;
    justify-content: center;
    padding: 16px;
    font-size: 1.1rem;
    margin-top: 30px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(36, 64, 240, 0.2);
    }
  }

  &.secondary {
    background: #f1f5f9;
    color: #475569;
    
    &:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
  }
`;

const TotalHoursBanner = styled.div`
  background: ${props => props.isValid ? '#ecfdf5' : '#fef2f2'};
  color: ${props => props.isValid ? '#065f46' : '#991b1b'};
  border: 1px solid ${props => props.isValid ? '#10b981' : '#ef4444'};
  padding: 15px 20px;
  border-radius: 12px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
`;

const DailyLogFormPage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const [internship, setInternship] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tasks, setTasks] = useState([
        { description: '', hoursSpent: '', status: 'completed' }
    ]);
    const [learnings, setLearnings] = useState('');
    const [challenges, setChallenges] = useState('');
    const [tomorrowPlan, setTomorrowPlan] = useState('');

    useEffect(() => {
        const fetchInternship = async () => {
            try {
                const profileRes = await api.get('/students/profile');
                const currentInternshipId = profileRes.data.data.user.currentInternship;

                if (!currentInternshipId) {
                    toast.error("You don't have an active internship.");
                    navigate('/student/dashboard');
                    return;
                }

                const internshipRes = await api.get(`/internships/${currentInternshipId}`);
                setInternship(internshipRes.data.data.internship);
            } catch (error) {
                console.error("Error fetching internship", error);
                toast.error("Error loading form data");
            }
        };

        fetchInternship();
    }, [navigate]);

    const addTask = () => {
        setTasks([...tasks, { description: '', hoursSpent: '', status: 'completed' }]);
    };

    const removeTask = (index) => {
        if (tasks.length === 1) return;
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);
    };

    const handleTaskChange = (index, field, value) => {
        const newTasks = [...tasks];
        newTasks[index][field] = value;
        setTasks(newTasks);
    };

    const totalHours = tasks.reduce((sum, task) => sum + (parseFloat(task.hoursSpent) || 0), 0);
    const isHoursValid = totalHours >= 4 && totalHours <= 12;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!internship) return;

        if (!isHoursValid) {
            toast.error('Total hours must be between 4 and 12.');
            return;
        }

        if (tasks.some(t => !t.description || !t.hoursSpent)) {
            toast.error('Please fill in all task details.');
            return;
        }

        try {
            setSubmitting(true);

            const logData = {
                internshipId: internship._id,
                mentorId: internship.mentorId,
                date,
                tasksCompleted: tasks.map(t => ({
                    ...t,
                    hoursSpent: parseFloat(t.hoursSpent)
                })),
                totalHours,
                learnings,
                challenges,
                tomorrowPlan
            };

            await dailyLogService.submitDailyLog(logData);
            toast.success('Daily log submitted successfully!');
            navigate('/student/active-internship');

        } catch (error) {
            console.error("Submit error", error);
            toast.error(error.response?.data?.message || 'Error submitting log');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContainer>
            <StudentSidebar />
            <MobileHeader />

            <ContentWrapper>
                <PageHeader>
                    <h1>Submit Daily Log</h1>
                    <p>Document your work for {new Date(date).toLocaleDateString()}</p>
                </PageHeader>

                <FormCard>
                    <form onSubmit={handleSubmit}>
                        <FormGroup>
                            <label>Log Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]} // Can't log future dates
                                required
                            />
                        </FormGroup>

                        <SectionTitle>Tasks Completed Today</SectionTitle>

                        {tasks.map((task, index) => (
                            <TaskContainer key={index}>
                                {tasks.length > 1 && (
                                    <TrashButton type="button" onClick={() => removeTask(index)}>
                                        <FaTrash />
                                    </TrashButton>
                                )}

                                <FormGroup>
                                    <label>Task Description *</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Briefly describe what you worked on..."
                                        value={task.description}
                                        onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                                        required
                                    />
                                </FormGroup>

                                <FlexRow>
                                    <FormGroup style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Hours Spent *</label>
                                        <input
                                            type="number"
                                            min="0.5"
                                            step="0.5"
                                            placeholder="e.g., 2.5"
                                            value={task.hoursSpent}
                                            onChange={(e) => handleTaskChange(index, 'hoursSpent', e.target.value)}
                                            required
                                        />
                                    </FormGroup>

                                    <FormGroup style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Status</label>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleTaskChange(index, 'status', e.target.value)}
                                        >
                                            <option value="completed">Completed</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="blocked">Blocked</option>
                                        </select>
                                    </FormGroup>
                                </FlexRow>
                            </TaskContainer>
                        ))}

                        <Button type="button" className="secondary" onClick={addTask}>
                            <FaPlus /> Add Another Task
                        </Button>

                        <TotalHoursBanner isValid={isHoursValid}>
                            <span>Total Hours Logged:</span>
                            <span>{totalHours.toFixed(1)} hrs {isHoursValid ? '✓' : '(Must be 4-12 hrs)'}</span>
                        </TotalHoursBanner>

                        <SectionTitle>Reflections & Insights</SectionTitle>

                        <FormGroup>
                            <label>What did you learn today?</label>
                            <textarea
                                rows="3"
                                placeholder="New concepts, tools, or skills acquired..."
                                value={learnings}
                                onChange={(e) => setLearnings(e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Any challenges faced?</label>
                            <textarea
                                rows="3"
                                placeholder="Blockers, bugs, or difficulties..."
                                value={challenges}
                                onChange={(e) => setChallenges(e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Plan for tomorrow</label>
                            <textarea
                                rows="3"
                                placeholder="What are your goals for the next working day?"
                                value={tomorrowPlan}
                                onChange={(e) => setTomorrowPlan(e.target.value)}
                                required
                            />
                        </FormGroup>

                        <Button type="submit" className="primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : <><FaPaperPlane /> Submit Daily Log</>}
                        </Button>
                    </form>
                </FormCard>
            </ContentWrapper>
        </PageContainer>
    );
};

export default DailyLogFormPage;
