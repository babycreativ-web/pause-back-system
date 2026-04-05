import React, { useState, useEffect } from 'react';
import { Users, LayoutDashboard, FileText, Plus, Trash2, Calendar, Search, Download, TrendingUp, Clock, Sun, RefreshCw } from 'lucide-react';
import { dataService } from '../services/dataService';

// SUB-COMPONENT FOR REAL-TIME TICKING CLOCK
const RealTimeClock = ({ status, startedAt }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === 'idle' || !startedAt) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  if (status === 'idle') return <span style={{ color: 'var(--text-secondary)' }}>---</span>;

  return (
    <span style={{ fontWeight: '700', fontFamily: 'monospace', color: status === 'working' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
      {formatTime(elapsed)}
    </span>
  );
};

const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('monitoring'); 
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]); 
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchInitialData();
    
    // SUBSCRIBE TO REAL-TIME AGENT UPDATES
    const subscription = dataService.subscribeToAgents((updatedAgent) => {
      setAgents(prev => prev.map(a => a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a));
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [dateFrom, dateTo]);

  const fetchInitialData = async () => {
    const fetchedAgents = await dataService.getAgents();
    const fetchedLogs = await dataService.getLogs(dateFrom, dateTo);
    setAgents(fetchedAgents);
    setLogs(fetchedLogs);
  };

  const calculateMetrics = () => {
    if (logs.length === 0) return { avgWork: 0, totalPause: 0, totalPrayer: 0 };
    const totalWork = logs.reduce((acc, curr) => acc + (curr.workSeconds || 0), 0);
    const totalPause = logs.reduce((acc, curr) => acc + (curr.pauseSeconds || 0), 0);
    const totalPrayer = logs.reduce((acc, curr) => acc + (curr.prayerSeconds || 0), 0);
    const uniqueDays = [...new Set(logs.map(l => l.date))].length || 1;
    return {
      avgWork: ((totalWork / 3600) / uniqueDays).toFixed(1),
      totalPause: Math.floor(totalPause / 60),
      totalPrayer: Math.floor(totalPrayer / 60)
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} /> Manager / TL Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live Real-time Monitoring | {user.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
      </header>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        <button onClick={() => setActiveTab('monitoring')} className={activeTab === 'monitoring' ? 'tab-active' : 'tab-inactive'}>
          Real-time Monitoring
        </button>
        <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'tab-active' : 'tab-inactive'}>
          Reports & Analytics
        </button>
      </div>

      {activeTab === 'monitoring' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input" placeholder="Search..." style={{ marginBottom: 0, paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={fetchInitialData}><RefreshCw size={18} /> Refresh</button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Agent</button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th style={{ padding: '1.25rem 1.5rem' }}>Agent Name</th>
                  <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                  <th style={{ padding: '1.25rem 1.5rem' }}>Time in State</th>
                  <th style={{ padding: '1.25rem 1.5rem' }}>Email</th>
                  <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((agent) => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>{agent.name}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span className={`status-badge status-${agent.status || 'idle'}`} style={{ fontSize: '0.7rem' }}>
                        { (agent.status || 'IDLE').toUpperCase() }
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <RealTimeClock status={agent.status} startedAt={agent.status_started_at} />
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{agent.email}</td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <button onClick={() => setConfirmDeleteId(agent.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>AVG DAILY WORK</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{metrics.avgWork} hr</div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>TOTAL BREAKS</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-amber)' }}>{metrics.totalPause} m</div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>TOTAL PRAYER</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-blue)' }}>{metrics.totalPrayer} m</div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Cloud Persistence Reports</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="date" className="input" style={{ marginBottom: 0 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <input type="date" className="input" style={{ marginBottom: 0 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Agent</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Daily Avg</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Total Pause</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Total Prayer</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => {
                  const agentLogs = logs.filter(l => l.agent_id === agent.id);
                  const days = [...new Set(agentLogs.map(l => l.date))].length || 1;
                  const workHrs = (agentLogs.reduce((acc, c) => acc + (c.workSeconds || 0), 0) / 3600) / days;
                  const brkMins = agentLogs.reduce((acc, c) => acc + (c.pauseSeconds || 0), 0) / 60;
                  const pryMins = agentLogs.reduce((acc, c) => acc + (c.prayerSeconds || 0), 0) / 60;
                  return (
                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{agent.name}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{workHrs.toFixed(1)} hr</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-amber)' }}>{brkMins.toFixed(0)} m</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-blue)' }}>{pryMins.toFixed(0)} m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- ADD AGENT MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-card animate-fade-in modal-content">
            <h2>Add Agent Mailer</h2>
            {/* Form similar to previous version */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const added = await dataService.saveAgent({ ...newAgent, password: newAgent.password || 'agent123' });
              setAgents([...agents, added]);
              setShowAddModal(false);
              setNewAgent({ name: '', email: '', password: '' });
            }}>
              <label className="label">Full Name</label>
              <input className="input" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} required />
              <label className="label">Email Address</label>
              <input className="input" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} required />
              <label className="label">Password</label>
              <input className="input" value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} placeholder="agent123" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
