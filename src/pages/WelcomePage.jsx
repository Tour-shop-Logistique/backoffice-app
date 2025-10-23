import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_blanc_shop.jpg';
import './WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000); // 3-second delay

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-container">
      <img src={logo} alt="logo" className="welcome-logo" />
    </div>
  );
};

export default WelcomePage;
