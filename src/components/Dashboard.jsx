import React, { useState, useEffect } from 'react';
import { Play, Pause, Sun, RotateCcw, LogOut, Clock, Calendar } from 'lucide-react';
import { dataService } from '../services/dataService';

const Dashboard = ({ user, onLogout }) => {
  const [status, setStatus] = useState(() => localStorage.getItem(`pb_status_${user.id}`) || 'idle');
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem(`pb_seconds_${user.id}`)) || 0);
  const [logs, setLogs] = useState([]);
  const [startTime, setStartTime] = useState(() => localStorage.getItem(`pb_start_${user.id}`) || null);

  useEffect(() => {
    // Load historical logs for this agent from Supabase
    const fetchLogs = async () => {
      const allLogs = await dataService.getLogs();
      const myLogs = allLogs.filter(l => l.agent_id === user.id);
      setLogs(myLogs);
    };
    fetchLogs();
  }, [user.id]);

  useEffect(() => {
    localStorage.setItem(`pb_status_${user.id}`, status);
    localStorage.setItem(`pb_seconds_${user.id}`, seconds.toString());
    if (startTime) localStorage.setItem(`pb_start_${user.id}`, startTime);
  }, [status, seconds, startTime, user.id]);

  useEffect(() => {
    let interval = null;
    if (status === 'working') {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addLog = async (action) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const logEntry = { 
      agentId: user.id, 
      agentName: user.name, 
      action, 
      time: timeStr, 
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime() 
    };
    
    // Optimistic UI update
    setLogs((prev) => [{...logEntry, agent_id: user.id, agent_name: user.name}, ...prev]);
    
    // Save to Cloud
    await dataService.saveLog(logEntry);
  };

  const handleStartWork = () => {
    setStatus('working');
    if (!startTime) {
      const now = new Date().toLocaleTimeString();
      setStartTime(now);
    }
    addLog('Start Work');
  };

  const handlePause = () => {
    setStatus('pause');
    addLog('General Pause');
  };

  const handlePrayer = () => {
    setStatus('prayer');
    addLog('Pause Prayer');
  };

  const handleBack = () => {
    setStatus('working');
    addLog('Back to Work');
  };

  const handleEndDay = () => {
    setStatus('idle');
    addLog('End Day');
    // Reset local session
    setSeconds(0);
    setStartTime(null);
    localStorage.removeItem(`pb_start_${user.id}`);
    localStorage.removeItem(`pb_seconds_${user.id}`);
  };

  return (
    <div className="container animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Agent: {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Today is {new Date().toLocaleDateString()}</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span className={`status-badge status-${status}`}>
              {status.toUpperCase()}
            </span>
          </div>
          
          <h2 style={{ fontSize: '5rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '4px', margin: '1rem 0' }}>
            {formatTime(seconds)}
          </h2>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            {startTime ? `Shift started at ${startTime}` : 'Ready to start your shift?'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            {status === 'idle' && (
              <button className="btn btn-primary" style={{ padding: '1rem 3rem' }} onClick={handleStartWork}>
                <Play size={20} /> Start Work
              </button>
            )}

            {status === 'working' && (
              <>
                <button className="btn btn-warning" onClick={handlePause}>
                  <Pause size={20} /> Pause
                </button>
                <button className="btn btn-secondary" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }} onClick={handlePrayer}>
                  <Sun size={20} /> Pause Prayer
                </button>
                <button className="btn btn-danger" onClick={handleEndDay}>
                  <RotateCcw size={20} /> End Day
                </button>
              </>
            )}

            {(status === 'pause' || status === 'prayer') && (
              <button className="btn btn-primary" style={{ padding: '1rem 3rem' }} onClick={handleBack}>
                <RotateCcw size={20} /> Back
              </button>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} /> My Cloud Activity Log
          </h3>
          <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
            <ul style={{ listStyle: 'none' }}>
              {logs.slice(0, 15).map((log, i) => (
                <li key={i} style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{log.action}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.time}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>{log.date}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
