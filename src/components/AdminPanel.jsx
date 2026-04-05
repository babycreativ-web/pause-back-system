import React, { useState, useEffect } from 'react';
import { Users, LayoutDashboard, FileText, Plus, Trash2, Calendar, Search, Download, TrendingUp, Clock, Sun } from 'lucide-react';
import { dataService } from '../services/dataService';

const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('monitoring'); 
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // Date Range for Reports
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); 
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchInitialData();
  }, [dateFrom, dateTo]);

  const fetchInitialData = async () => {
    const fetchedAgents = await dataService.getAgents();
    const fetchedLogs = await dataService.getLogs(dateFrom, dateTo);
    setAgents(fetchedAgents);
    setLogs(fetchedLogs);
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.email) return alert('Please fill in all fields');
    
    try {
      const added = await dataService.saveAgent({ ...newAgent, password: newAgent.password || 'agent123' });
      setAgents([...agents, added]);
      setShowAddModal(false);
      setNewAgent({ name: '', email: '', password: '' });
    } catch (err) {
      alert('Error adding agent. Ensure email is unique.');
    }
  };

  const handleRemoveAgent = async (id) => {
    try {
      await dataService.deleteAgent(id);
      setAgents(agents.filter(a => a.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      alert('Error deleting agent from cloud.');
    }
  };

  // --- ANALYTICS LOGIC ---
  const calculateMetrics = () => {
    if (logs.length === 0) return { avgWork: 0, totalPause: 0, totalPrayer: 0 };
    
    const totalWork = logs.reduce((acc, curr) => acc + (curr.workSeconds || 0), 0);
    const totalPause = logs.reduce((acc, curr) => acc + (curr.pauseSeconds || 0), 0);
    const totalPrayer = logs.reduce((acc, curr) => acc + (curr.prayerSeconds || 0), 0);
    
    const uniqueDays = [...new Set(logs.map(l => l.date))].length || 1;
    const avgWork = (totalWork / 3600) / uniqueDays;
    
    return {
      avgWork: avgWork.toFixed(1),
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
          <p style={{ color: 'var(--text-secondary)' }}>Cloud Dashboard | Logged in as {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => setActiveTab('monitoring')}
          style={{ padding: '1rem', background: 'none', border: 'none', color: activeTab === 'monitoring' ? 'var(--accent-emerald)' : 'var(--text-secondary)', borderBottom: activeTab === 'monitoring' ? '2px solid var(--accent-emerald)' : 'none', cursor: 'pointer', fontWeight: '600' }}
        >
          Real-time Monitoring
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{ padding: '1rem', background: 'none', border: 'none', color: activeTab === 'reports' ? 'var(--accent-emerald)' : 'var(--text-secondary)', borderBottom: activeTab === 'reports' ? '2px solid var(--accent-emerald)' : 'none', cursor: 'pointer', fontWeight: '600' }}
        >
          Reports & Analytics
        </button>
      </div>

      {activeTab === 'monitoring' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input" 
                placeholder="Search agent..." 
                style={{ marginBottom: 0, paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Agent
            </button>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Agent Name</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((agent) => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>{agent.name}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{agent.email}</td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => setConfirmDeleteId(agent.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7, padding: '0.5rem' }}
                      >
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} /> Avg. Daily Work
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{metrics.avgWork} <span style={{ fontSize: '1rem', fontWeight: '400' }}>hrs</span></div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Total Pauses
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-amber)' }}>{metrics.totalPause} <span style={{ fontSize: '1rem', fontWeight: '400' }}>mins</span></div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sun size={16} /> Total Prayer
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-blue)' }}>{metrics.totalPrayer} <span style={{ fontSize: '1rem', fontWeight: '400' }}>mins</span></div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Period Analytics (Cloud)</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="date" className="input" style={{ marginBottom: 0 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <span style={{ color: 'var(--text-secondary)' }}>to</span>
                <input type="date" className="input" style={{ marginBottom: 0 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Agent</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Avg. Work/Day</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Total Break</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Total Prayer</th>
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
                      <td style={{ padding: '1rem 1.5rem' }}>{agent.name}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{workHrs.toFixed(1)} hrs</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-amber)' }}>{brkMins.toFixed(0)} mins</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-blue)' }}>{pryMins.toFixed(0)} mins</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODALS remain similar with async logic */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-card animate-fade-in modal-content">
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Agent Mailer</h2>
            <form onSubmit={handleAddAgent}>
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Doe" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} />
              <label className="label">Email Address</label>
              <input className="input" placeholder="john@company.com" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} />
              <label className="label">Login Password</label>
              <input className="input" type="text" placeholder="agent123" value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-overlay">
          <div className="glass-card animate-fade-in modal-content" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Remove Agent?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This action will remove the agent from the cloud.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleRemoveAgent(confirmDeleteId)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
