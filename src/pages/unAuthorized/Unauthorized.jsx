import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Unauthorized.css'; // optional: for styling

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container">
      <h1>403 - Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <button onClick={() => navigate('/')}>Go Back</button>
    </div>
  );
};

export default Unauthorized;
