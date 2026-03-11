import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaUsers, FaTasks, FaChartLine, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';

const SidebarContainer = styled.div`
  width: 260px;
  background: linear-gradient(180deg, #0B1DC1 0%, #2440F0 100%);
  color: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 20%);
    pointer-events: none;
  }
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const Logo = styled.div`
  padding: 24px 20px;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NavLinks = styled.div`
  flex: 1;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StyledNavLink = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.3s;
  border-left: 3px solid transparent;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, rgba(36, 64, 240, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  &:hover::before {
    transform: translateX(0);
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
    padding-left: 24px;
  }

  &.active {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    border-left-color: #ffffff;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px;
  background: transparent;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
    padding-left: 24px;
  }
`;

const RecruiterSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <SidebarContainer>
      <Logo>Zoyaraa Mentor</Logo>
      <NavLinks>
        <StyledNavLink to="/recruiter/dashboard"><FaHome /> Dashboard</StyledNavLink>
        <StyledNavLink to="/recruiter/mentor-dashboard"><FaChartLine /> Mentor Dashboard</StyledNavLink>
        <StyledNavLink to="/recruiter/review-logs"><FaClipboardList /> Review Logs</StyledNavLink>
        <StyledNavLink to="/recruiter/mentees"><FaUsers /> My Mentees</StyledNavLink>
        <StyledNavLink to="/recruiter/internships"><FaTasks /> Manage Internships</StyledNavLink>
      </NavLinks>
      <LogoutButton onClick={handleLogout}><FaSignOutAlt /> Logout</LogoutButton>
    </SidebarContainer>
  );
};

export default RecruiterSidebar;
