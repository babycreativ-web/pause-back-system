import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { dataService } from './services/dataService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('pb_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (loginData) => {
    const { email, password, role } = loginData;

    if (role === 'manager') {
      // STRICT Manager Login: Verify against Supabase "managers" table
      setLoading(true);
      const manager = await dataService.verifyManager(email, password);
      setLoading(false);

      if (manager) {
        const managerUser = { id: manager.id, name: manager.name, email: manager.email, role: 'manager' };
        setUser(managerUser);
        localStorage.setItem('pb_user', JSON.stringify(managerUser));
      } else {
        alert('Access Denied: Invalid Manager credentials.');
      }
    } else {
      // STRICT Agent Login: Verify both Email AND Password against Supabase
      setLoading(true);
      const agent = await dataService.verifyAgent(email, password);
      setLoading(false);

      if (agent) {
        const agentUser = { id: agent.id, name: agent.name, email: agent.email, role: 'agent' };
        setUser(agentUser);
        localStorage.setItem('pb_user', JSON.stringify(agentUser));
      } else {
        alert('Access Denied: This email is not registered as an Agent Mailer.');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pb_user');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--primary-bg)', color: 'white' }}>
      Connecting to Cloud...
    </div>
  );

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout" style={{ minHeight: '100vh' }}>
      {user.role === 'manager' ? (
        <AdminPanel user={user} onLogout={handleLogout} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
