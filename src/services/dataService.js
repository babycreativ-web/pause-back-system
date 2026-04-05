import { supabase } from './supabaseClient';

export const dataService = {
  // --- AGENTS ---
  getAgents: async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
    return data;
  },

  saveAgent: async (agent) => {
    const { data, error } = await supabase
      .from('agents')
      .insert([{ name: agent.name, email: agent.email, password: agent.password || '123456' }])
      .select();
    
    if (error) {
      console.error('Error saving agent:', error);
      throw error;
    }
    return data[0];
  },

  deleteAgent: async (id) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .match({ id });
    
    if (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  },

  // --- LOGS ---
  getLogs: async (dateFrom, dateTo) => {
    let query = supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (dateFrom && dateTo) {
      query = query.gte('date', dateFrom).lte('date', dateTo);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    return data;
  },

  saveLog: async (logEntry) => {
    const { error } = await supabase
      .from('logs')
      .insert([{ 
        agent_id: logEntry.agentId, 
        agent_name: logEntry.agentName, 
        action: logEntry.action,
        date: logEntry.date,
        time: logEntry.time,
        timestamp: logEntry.timestamp 
      }]);
    
    if (error) {
      console.error('Error saving log:', error);
    }
  },

  // Auth: Check if an agent is registered
  verifyAgent: async (email, password) => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Exact password match
      .maybeSingle();

    if (error) {
      console.error('Error verifying agent:', error);
      return null;
    }
    return data;
  },

  // Auth: Check if a Manager is registered
  verifyManager: async (email, password) => {
    const { data, error } = await supabase
      .from('managers')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Exact password match
      .maybeSingle();

    if (error) {
      console.error('Error verifying manager:', error);
      return null;
    }
    return data;
  }
};
