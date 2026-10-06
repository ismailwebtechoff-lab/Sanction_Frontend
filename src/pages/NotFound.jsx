// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404 - Page Not Found</h1>
      <p style={styles.text}>Sorry, the page you are looking for does not exist.</p>
      <button style={styles.button} onClick={() => navigate('/')}>Go to Dashboard</button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '3rem',
    marginTop: '10vh',
  },
  title: {
    fontSize: '3rem',
    color: '#e74c3c',
  },
  text: {
    fontSize: '1.2rem',
    margin: '1rem 0',
  },
  button: {
    padding: '0.6rem 1.2rem',
    fontSize: '1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};

export default NotFound;