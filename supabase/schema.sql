CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE member_role   AS ENUM ('owner', 'editor', 'viewer');

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

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
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
  amount NUMERIC(15,0) NOT NULL, note TEXT, receipt_url TEXT,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id    ON projects(user_id);
CREATE INDEX idx_tasks_project_id    ON tasks(project_id);
CREATE INDEX idx_tasks_status        ON tasks(status);
CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_members_project_id  ON project_members(project_id);

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses        ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_project_member(p UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM project_members WHERE project_id=p AND user_id=auth.uid())
      OR EXISTS(SELECT 1 FROM projects WHERE id=p AND user_id=auth.uid());
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_edit_project(p UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM projects WHERE id=p AND user_id=auth.uid())
      OR EXISTS(SELECT 1 FROM project_members WHERE project_id=p AND user_id=auth.uid() AND role IN ('owner','editor'));
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid()=id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid()=id);

CREATE POLICY "projects_select" ON projects FOR SELECT USING (user_id=auth.uid() OR is_project_member(id));
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (can_edit_project(id));
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (user_id=auth.uid());

CREATE POLICY "members_select" ON project_members FOR SELECT USING (is_project_member(project_id));
CREATE POLICY "members_insert" ON project_members FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM projects WHERE id=project_id AND user_id=auth.uid()));
CREATE POLICY "members_delete" ON project_members FOR DELETE USING (EXISTS(SELECT 1 FROM projects WHERE id=project_id AND user_id=auth.uid()));

CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (is_project_member(project_id));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (can_edit_project(project_id));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (can_edit_project(project_id));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (can_edit_project(project_id));

CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (is_project_member(project_id));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (can_edit_project(project_id));
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (can_edit_project(project_id));

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(id,full_name,avatar_url)
  VALUES(NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE VIEW project_summary AS
SELECT p.id, p.user_id, p.name, p.description, p.event_date, p.venue,
  p.budget_total, p.cover_url, p.created_at, p.updated_at,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status='done') AS completed_tasks,
  COALESCE(SUM(t.cost_estimate),0) AS total_estimated,
  COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id=p.id),0) AS total_spent
FROM projects p LEFT JOIN tasks t ON t.project_id=p.id GROUP BY p.id;
