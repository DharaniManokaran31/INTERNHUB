import React from 'react';
import styled from 'styled-components';
import { FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HeaderContainer = styled.div`
  display: none;
  
  @media (max-width: 1024px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 15px 20px;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 99;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
`;

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #2440F0;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #1e293b;
  cursor: pointer;
`;

const MobileHeader = () => {
    const navigate = useNavigate();

    return (
        <HeaderContainer>
            <Logo onClick={() => navigate('/recruiter/dashboard')}>Zoyaraa Mentor</Logo>
            <MenuButton onClick={() => navigate('/recruiter/dashboard')}>
                <FaBars />
            </MenuButton>
        </HeaderContainer>
    );
};

export default MobileHeader;
