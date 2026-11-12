-- ============================================================
-- v5: Nhà cung cấp · Lịch trình ngày cưới
-- Chạy SAU 002_invitations_roles.sql. Idempotent — chạy lại nhiều lần vẫn an toàn.
-- ============================================================

-- ── Nhà cung cấp (nhà hàng, studio, trang điểm, xe hoa…) ────────
CREATE TABLE IF NOT EXISTS vendors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'Khác',
  contact_name TEXT,
  phone        TEXT,
  email        TEXT,
  website      TEXT,
  status       TEXT NOT NULL DEFAULT 'considering',
  total_cost   NUMERIC(15,0) NOT NULL DEFAULT 0,
  due_date     DATE,
  rating       SMALLINT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_status_check CHECK (status IN ('considering','booked','cancelled'));
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_rating_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_rating_check CHECK (rating IS NULL OR rating BETWEEN 0 AND 5);
CREATE INDEX IF NOT EXISTS vendors_project_idx ON vendors(project_id);
DROP TRIGGER IF EXISTS t_vendors ON vendors;
CREATE TRIGGER t_vendors BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Chi tiêu có thể gắn với nhà cung cấp → số tiền đã trả = tổng chi tiêu của nhà cung cấp đó
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS expenses_vendor_idx ON expenses(vendor_id);

-- ── Lịch trình ngày cưới (run-of-show) ────────────────────────
CREATE TABLE IF NOT EXISTS schedule_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  day        DATE,
  start_time TIME,
  end_time   TIME,
  title      TEXT NOT NULL,
  location   TEXT,
  owner      TEXT,
  notes      TEXT,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS schedule_project_idx ON schedule_items(project_id, day, start_time);

-- ── Phân quyền: xem theo quyền truy cập dự án, sửa khi là chủ / biên tập ──
ALTER TABLE vendors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('vendors','schedule_items')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename); END LOOP;
END $$;

CREATE POLICY vendors_select  ON vendors        FOR SELECT USING (can_access_project(project_id));
CREATE POLICY vendors_write   ON vendors        FOR ALL    USING (can_edit_project(project_id)) WITH CHECK (can_edit_project(project_id));
CREATE POLICY schedule_select ON schedule_items FOR SELECT USING (can_access_project(project_id));
CREATE POLICY schedule_write  ON schedule_items FOR ALL    USING (can_edit_project(project_id)) WITH CHECK (can_edit_project(project_id));

-- ── Realtime ──────────────────────────────────────────────────
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE vendors;        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE schedule_items; EXCEPTION WHEN others THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
