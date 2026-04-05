-- TABLE: agents
-- Stores Agent Mailer information and their simple password
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT '123456', -- Managers can change this in the Table Editor
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE: logs
-- Stores every work event
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL, 
  date DATE DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  timestamp BIGINT, 
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE: managers
-- Stores Manager/TL information and their simple password
CREATE TABLE IF NOT EXISTS managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin123', 
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SEED DATA (Optional, password is 'agent123' for agents)
INSERT INTO agents (name, email, password) VALUES 
('John Doe', 'john@test.com', 'agent123'),
('Alice Smith', 'alice@test.com', 'agent123'),
('Bob Wilson', 'bob@test.com', 'agent123')
ON CONFLICT (email) DO NOTHING;

-- SEED MANAGER (Optional, password is 'admin123' for managers)
INSERT INTO managers (name, email, password) VALUES 
('Main Admin', 'admin@test.com', 'admin123')
ON CONFLICT (email) DO NOTHING;
