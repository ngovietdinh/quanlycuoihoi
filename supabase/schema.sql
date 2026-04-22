-- ============================================================
-- Sự kiện - Full Schema v3
-- FIXED: total_spent calculation uses ONLY expenses table
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE task_status   AS ENUM ('todo','in_progress','done');
CREATE TYPE task_priority AS ENUM ('low','medium','high');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, avatar_url TEXT, phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  event_date DATE, venue TEXT,
  budget_total NUMERIC(15,0) NOT NULL DEFAULT 0,
  cover_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL, description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  deadline DATE,
  cost_estimate NUMERIC(15,0) DEFAULT 0,
  cost_actual   NUMERIC(15,0) DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- expenses: SINGLE SOURCE OF TRUTH for money spent
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(15,0) NOT NULL CHECK (amount > 0),
  note TEXT,
  category TEXT DEFAULT 'khác',
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX ON projects(user_id);
CREATE INDEX ON tasks(project_id);
CREATE INDEX ON tasks(status);
CREATE INDEX ON expenses(project_id);
CREATE INDEX ON expenses(task_id);
CREATE INDEX ON expenses(spent_at);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER t1 BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t2 BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t3 BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses  ENABLE ROW LEVEL SECURITY;

CREATE POLICY p1 ON profiles  FOR ALL USING (auth.uid() = id);
CREATE POLICY p2 ON projects  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY p3 ON tasks     FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
CREATE POLICY p4 ON expenses  FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(id, full_name)
  VALUES(NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PROJECT SUMMARY VIEW
-- total_spent = SUM of expenses (NOT tasks.cost_actual)
-- total_estimated = SUM of tasks.cost_estimate (kế hoạch)
-- ============================================================
CREATE OR REPLACE VIEW project_summary AS
SELECT
  p.*,
  COUNT(DISTINCT t.id)                                          AS total_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')        AS completed_tasks,
  COALESCE(SUM(DISTINCT t.cost_estimate) FILTER (WHERE t.id IS NOT NULL), 0) AS total_estimated,
  -- FIXED: total_spent comes ONLY from expenses table
  COALESCE((
    SELECT SUM(e.amount)
    FROM expenses e
    WHERE e.project_id = p.id
  ), 0) AS total_spent
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id;
