import React, { useState, useEffect } from 'react';
import { Users, LayoutDashboard, FileText, Plus, Trash2, Calendar, Search, Download, TrendingUp, Clock, Sun, RefreshCw, Activity, Coffee, Moon } from 'lucide-react';
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
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}min ${secs}s`;
  };

  if (status === 'idle') return <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Paused / Offline</span>;

  return (
    <span style={{ fontWeight: '700', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px', color: status === 'working' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
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
    const subscription = dataService.subscribeToAgents((updatedAgent) => {
      setAgents(prev => prev.map(a => a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a));
    });
    return () => { if (subscription) subscription.unsubscribe(); };
  }, [dateFrom, dateTo]);

  const fetchInitialData = async () => {
    const fetchedAgents = await dataService.getAgents();
    const fetchedLogs = await dataService.getLogs(dateFrom, dateTo);
    setAgents(fetchedAgents);
    setLogs(fetchedLogs);
  };

  const calculateMetrics = () => {
    const totalWorking = agents.filter(a => a.status === 'working').length;
    const totalPaused = agents.filter(a => a.status === 'pause' || a.status === 'prayer').length;
    const totalOffline = agents.filter(a => !a.status || a.status === 'idle').length;

    if (logs.length === 0) return { avgWork: 0, totalPause: 0, totalPrayer: 0, totalWorking, totalPaused, totalOffline };
    
    const totalWork = logs.reduce((acc, curr) => acc + (curr.workSeconds || 0), 0);
    const totalPause = logs.reduce((acc, curr) => acc + (curr.pauseSeconds || 0), 0);
    const totalPrayer = logs.reduce((acc, curr) => acc + (curr.prayerSeconds || 0), 0);
    const uniqueDays = [...new Set(logs.map(l => l.date))].length || 1;
    
    return {
      avgWork: ((totalWork / 3600) / uniqueDays).toFixed(1),
      totalPause: Math.floor(totalPause / 60),
      totalPrayer: Math.floor(totalPrayer / 60),
      totalWorking,
      totalPaused,
      totalOffline
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Control Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} className="pulse" /> Live Monitoring Hub | {user.name}
          </p>
        </div>
        <button className="btn btn-secondary" style={{ borderRadius: '12px' }} onClick={onLogout}>Logout</button>
      </header>

      {/* QUICK STATUS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>WORKING NOW</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{metrics.totalWorking}</div>
          </div>
          <Activity size={32} color="var(--accent-emerald)" opacity={0.5} />
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ON BREAK</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{metrics.totalPaused}</div>
          </div>
          <Coffee size={32} color="var(--accent-amber)" opacity={0.5} />
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OFFLINE / IDLE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{metrics.totalOffline}</div>
          </div>
          <Moon size={32} color="#666" opacity={0.5} />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <button onClick={() => setActiveTab('monitoring')} style={{ padding: '1rem 0', background: 'none', border: 'none', color: activeTab === 'monitoring' ? 'var(--accent-emerald)' : 'var(--text-secondary)', borderBottom: activeTab === 'monitoring' ? '2px solid var(--accent-emerald)' : 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: '0.3s' }}>
          Live Tracking
        </button>
        <button onClick={() => setActiveTab('reports')} style={{ padding: '1rem 0', background: 'none', border: 'none', color: activeTab === 'reports' ? 'var(--accent-emerald)' : 'var(--text-secondary)', borderBottom: activeTab === 'reports' ? '2px solid var(--accent-emerald)' : 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: '0.3s' }}>
          Historical Reports
        </button>
      </div>

      {activeTab === 'monitoring' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '350px' }}>
              <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input" placeholder="Find agent..." style={{ marginBottom: 0, paddingLeft: '45px', borderRadius: '15px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ borderRadius: '12px' }} onClick={fetchInitialData}><RefreshCw size={18} /> Refresh</button>
              <button className="btn btn-primary" style={{ borderRadius: '12px' }} onClick={() => setShowAddModal(true)}><Plus size={18} /> New Agent</button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Agent</th>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Live Status</th>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Time in State</th>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((agent) => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: '0.2s hover', cursor: 'default' }}>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{agent.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{agent.email}</div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div className={`status-badge status-${agent.status || 'idle'}`} style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.3rem 0.8rem', 
                        boxShadow: agent.status === 'working' ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none' 
                      }}>
                        { (agent.status === 'working' ? '● WORKING' : agent.status === 'idle' ? 'OFFLINE' : agent.status?.toUpperCase() || 'OFFLINE') }
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <RealTimeClock status={agent.status} startedAt={agent.status_started_at} />
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                      <button onClick={() => setConfirmDeleteId(agent.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6, padding: '0.5rem' }}>
                        <Trash2 size={20} />
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
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>AVERAGE WORK DAY</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{metrics.avgWork} <span style={{ fontSize: '1rem', fontWeight: '400' }}>hr</span></div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>GENERAL BREAKS</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-amber)' }}>{metrics.totalPause} <span style={{ fontSize: '1rem', fontWeight: '400' }}>min</span></div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>TOTAL PRAYER</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{metrics.totalPrayer} <span style={{ fontSize: '1rem', fontWeight: '400' }}>min</span></div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: '2rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Historical Persistence</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="date" className="input" style={{ marginBottom: 0, borderRadius: '10px' }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <span style={{ color: 'var(--text-secondary)' }}>to</span>
                <input type="date" className="input" style={{ marginBottom: 0, borderRadius: '10px' }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Agent Name</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Weekly Average</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Total Break</th>
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
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>{agent.name}</td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>{workHrs.toFixed(1)} h</td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--accent-amber)', fontWeight: '600' }}>{brkMins.toFixed(0)} min</td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--accent-blue)', fontWeight: '600' }}>{pryMins.toFixed(0)} min</td>
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
          <div className="glass-card animate-fade-in modal-content" style={{ borderRadius: '25px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Add New Agent</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const added = await dataService.saveAgent({ ...newAgent, password: newAgent.password || 'agent123' });
              setAgents([...agents, added]);
              setShowAddModal(false);
              setNewAgent({ name: '', email: '', password: '' });
            }}>
              <label className="label">Full Name</label>
              <input className="input" placeholder="e.g. John Doe" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} required />
              <label className="label">Email Address</label>
              <input className="input" placeholder="e.g. name@company.com" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} required />
              <label className="label">Initial Password</label>
              <input className="input" value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} placeholder="Default: agent123" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, borderRadius: '12px' }} onClick={() => setShowAddModal(false)}>Discard</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '12px' }}>Enable Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
