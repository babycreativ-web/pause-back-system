import React, { useState } from 'react';
import { LogIn, User, Shield } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent'); // agent (Agent Mailer) or manager (Manager/TL)

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please fill in all fields');
    onLogin({ name: email.split('@')[0], email, password, role });
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pause & Back</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, please login</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
          <input 
            type="email" 
            className="input" 
            placeholder="agent@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
          <input 
            type="password" 
            className="input" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '2rem 0', background: 'var(--secondary-bg)', padding: '0.5rem', borderRadius: '999px' }}>
            <span 
              onClick={() => setRole('agent')}
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '0.5rem 1rem', 
                cursor: 'pointer',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                background: role === 'agent' ? 'var(--accent-emerald)' : 'transparent',
                color: role === 'agent' ? 'white' : 'var(--text-secondary)'
              }}
            >
              Agent Mailer
            </span>
            <span 
              onClick={() => setRole('manager')}
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '0.5rem 1rem', 
                cursor: 'pointer',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                background: role === 'manager' ? 'var(--accent-emerald)' : 'transparent',
                color: role === 'manager' ? 'white' : 'var(--text-secondary)'
              }}
            >
              Manager/TL
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
            <LogIn size={20} /> Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
