-- Run this in Supabase SQL Editor
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
  name TEXT NOT NULL, description TEXT, event_date DATE, venue TEXT,
  budget_total NUMERIC(15,0) NOT NULL DEFAULT 0, cover_url TEXT,
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
  deadline DATE, cost_estimate NUMERIC(15,0) DEFAULT 0,
  cost_actual NUMERIC(15,0) DEFAULT 0, position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(15,0) NOT NULL, note TEXT, spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX ON projects(user_id);
CREATE INDEX ON tasks(project_id);
CREATE INDEX ON tasks(status);
CREATE INDEX ON expenses(project_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_projects_upd BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_tasks_upd    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"   ON profiles  FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_projects"  ON projects  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "project_tasks" ON tasks     FOR ALL USING (EXISTS(SELECT 1 FROM projects WHERE id=project_id AND user_id=auth.uid()));
CREATE POLICY "project_exp"   ON expenses  FOR ALL USING (EXISTS(SELECT 1 FROM projects WHERE id=project_id AND user_id=auth.uid()));

-- Auto-create profile
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(id,full_name) VALUES(NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Summary view (used in project list)
CREATE VIEW project_summary AS
SELECT p.*,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status='done') AS completed_tasks,
  COALESCE(SUM(t.cost_estimate),0) AS total_estimated,
  COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id=p.id),0) AS total_spent
FROM projects p LEFT JOIN tasks t ON t.project_id=p.id
GROUP BY p.id;
