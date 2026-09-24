-- ============================================================
-- v4: Tài khoản · Phân quyền · Thiệp cưới online
-- Chạy SAU schema.sql. Script idempotent — có thể chạy lại nhiều lần.
-- ============================================================

-- ── 1. Vai trò người dùng ──────────────────────────────────────
-- Vai trò lưu dạng TEXT (không dùng enum) để không xung đột với kiểu dữ liệu
-- cùng tên có thể đã tồn tại từ script cũ.

-- Xóa TOÀN BỘ policy cũ trên các bảng do migration này quản lý. Policy trong
-- Postgres cộng dồn quyền, nên policy cũ còn sót có thể mở rộng quyền truy cập
-- ngoài ý muốn; bộ policy đầy đủ được tạo lại ở phía dưới.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','projects','tasks','expenses','project_members','invitations','guests','rsvps','wishes')
  LOOP
    RAISE NOTICE 'Xóa policy cũ "%" trên %', r.policyname, r.tablename;
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Xóa các hàm cùng tên đã có từ phiên bản / script cũ (có thể khác tên tham số
-- hoặc kiểu trả về, khiến CREATE OR REPLACE báo lỗi 42P13). Các policy phụ thuộc
-- bị xóa theo (CASCADE) và được tạo lại đầy đủ ở phía dưới.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'is_admin','project_role','can_access_project','can_edit_project','add_project_member','list_project_members',
      'owns_invitation','invitation_is_public','get_invitation_guest','increment_invitation_view',
      'submit_rsvp','submit_wish','admin_stats','admin_list_users')
  LOOP
    RAISE NOTICE 'Xóa hàm cũ %', r.sig;
    EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
  END LOOP;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'user';
-- Bản migration trước dùng enum app_role → chuẩn hóa về TEXT
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';
UPDATE profiles SET role = 'user' WHERE role IS NULL OR role NOT IN ('user','admin');
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user','admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active  BOOLEAN  NOT NULL DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Đồng bộ email cho các tài khoản đã có
UPDATE profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON profiles (lower(email));

-- Hàm kiểm tra quyền quản trị (SECURITY DEFINER để tránh đệ quy RLS)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active);
$$;

-- Tài khoản đăng ký đầu tiên (khi hệ thống chưa có admin) tự động là admin
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles(id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN 'user' ELSE 'admin' END
  );
  RETURN NEW;
END; $$;

-- Người dùng thường không được tự đổi vai trò / trạng thái khóa
CREATE OR REPLACE FUNCTION protect_profile_fields() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    NEW.role      := OLD.role;
    NEW.is_active := OLD.is_active;
    NEW.email     := OLD.email;
  END IF;
  IF auth.uid() = OLD.id AND NEW.role <> 'admin' AND OLD.role = 'admin'
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin' AND id <> OLD.id) THEN
    RAISE EXCEPTION 'Không thể gỡ quyền quản trị viên cuối cùng';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_profile ON profiles;
CREATE TRIGGER protect_profile BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_fields();

DROP POLICY IF EXISTS p1 ON profiles;
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_delete ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- ── 2. Thành viên dự án (cộng tác) ─────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
-- Bảng có thể đã tồn tại từ script cũ với cấu trúc khác → bổ sung cột còn thiếu
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'viewer';
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- Chuẩn hóa kiểu cột role về TEXT (bản trước dùng enum member_role)
ALTER TABLE project_members ALTER COLUMN role DROP DEFAULT;
ALTER TABLE project_members ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'viewer';
DELETE FROM project_members a USING project_members b
  WHERE a.ctid < b.ctid AND a.project_id = b.project_id AND a.user_id = b.user_id;
CREATE UNIQUE INDEX IF NOT EXISTS project_members_project_user_key ON project_members(project_id, user_id);
CREATE INDEX IF NOT EXISTS project_members_user_idx ON project_members(user_id);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION project_role(pid UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM projects WHERE id = pid AND user_id = auth.uid()) THEN 'owner'
    WHEN is_admin() THEN 'admin'
    ELSE (SELECT role::text FROM project_members WHERE project_id = pid AND user_id = auth.uid())
  END;
$$;
CREATE OR REPLACE FUNCTION can_access_project(pid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_role(pid) IS NOT NULL;
$$;
CREATE OR REPLACE FUNCTION can_edit_project(pid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_role(pid) IN ('owner','admin','editor');
$$;

DROP POLICY IF EXISTS p2 ON projects;
DROP POLICY IF EXISTS p3 ON tasks;
DROP POLICY IF EXISTS p4 ON expenses;
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;
CREATE POLICY projects_select ON projects FOR SELECT USING (can_access_project(id));
CREATE POLICY projects_insert ON projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY projects_update ON projects FOR UPDATE USING (can_edit_project(id));
CREATE POLICY projects_delete ON projects FOR DELETE USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_write  ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT USING (can_access_project(project_id));
CREATE POLICY tasks_write  ON tasks FOR ALL    USING (can_edit_project(project_id)) WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS expenses_select ON expenses;
DROP POLICY IF EXISTS expenses_write  ON expenses;
CREATE POLICY expenses_select ON expenses FOR SELECT USING (can_access_project(project_id));
CREATE POLICY expenses_write  ON expenses FOR ALL    USING (can_edit_project(project_id)) WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS members_select ON project_members;
DROP POLICY IF EXISTS members_manage ON project_members;
DROP POLICY IF EXISTS members_leave  ON project_members;
CREATE POLICY members_select ON project_members FOR SELECT USING (can_access_project(project_id));
CREATE POLICY members_manage ON project_members FOR ALL USING (project_role(project_id) IN ('owner','admin'))
  WITH CHECK (project_role(project_id) IN ('owner','admin'));
CREATE POLICY members_leave  ON project_members FOR DELETE USING (user_id = auth.uid());

-- Thêm thành viên theo email (chỉ chủ dự án / admin)
CREATE OR REPLACE FUNCTION add_project_member(p_project_id UUID, p_email TEXT, p_role TEXT DEFAULT 'viewer')
RETURNS TABLE(user_id UUID, full_name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE target profiles%ROWTYPE;
BEGIN
  IF project_role(p_project_id) NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Bạn không có quyền quản lý thành viên dự án này';
  END IF;
  IF p_role NOT IN ('editor','viewer') THEN RAISE EXCEPTION 'Vai trò không hợp lệ: %', p_role; END IF;
  SELECT * INTO target FROM profiles WHERE lower(profiles.email) = lower(trim(p_email));
  IF target.id IS NULL THEN RAISE EXCEPTION 'Không tìm thấy tài khoản với email %', p_email; END IF;
  IF EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND projects.user_id = target.id) THEN
    RAISE EXCEPTION 'Người này là chủ dự án';
  END IF;
  INSERT INTO project_members(project_id, user_id, role) VALUES (p_project_id, target.id, p_role::text)
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  RETURN QUERY SELECT target.id, target.full_name, target.email, p_role::text;
END; $$;

-- Danh sách thành viên kèm tên / email (profiles bị RLS chặn giữa các user)
CREATE OR REPLACE FUNCTION list_project_members(p_project_id UUID)
RETURNS TABLE(user_id UUID, full_name TEXT, email TEXT, avatar_url TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.email, p.avatar_url, 'owner', pr.created_at
  FROM projects pr JOIN profiles p ON p.id = pr.user_id
  WHERE pr.id = p_project_id AND can_access_project(p_project_id)
  UNION ALL
  SELECT p.id, p.full_name, p.email, p.avatar_url, m.role::text, m.created_at
  FROM project_members m JOIN profiles p ON p.id = m.user_id
  WHERE m.project_id = p_project_id AND can_access_project(p_project_id);
$$;

-- View tổng hợp phải tôn trọng RLS của người gọi (trước đây lộ dữ liệu giữa các user)
ALTER VIEW project_summary SET (security_invoker = on);

-- ── 3. Thiệp cưới online ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  slug         TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,60}$' AND slug <> 'demo'),
  title        TEXT NOT NULL,
  event_date   TIMESTAMPTZ,
  content      JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  view_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS project_id   UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS title        TEXT NOT NULL DEFAULT '';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS event_date   TIMESTAMPTZ;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS content      JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS theme        JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS view_count   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS invitations_user_idx ON invitations(user_id);
DROP TRIGGER IF EXISTS t_inv ON invitations;
CREATE TRIGGER t_inv BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS guests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  salutation    TEXT,
  phone         TEXT,
  side          TEXT NOT NULL DEFAULT 'both' CHECK (side IN ('groom','bride','both')),
  group_name    TEXT,
  invited_count INTEGER NOT NULL DEFAULT 1 CHECK (invited_count BETWEEN 1 AND 50),
  code          TEXT NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  is_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitation_id, code)
);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS salutation    TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS side          TEXT NOT NULL DEFAULT 'both';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_name    TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS invited_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS code          TEXT NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 8);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_sent       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS note          TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS guests_inv_code_key ON guests(invitation_id, code);
CREATE INDEX IF NOT EXISTS guests_inv_idx ON guests(invitation_id);

CREATE TABLE IF NOT EXISTS rsvps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_id      UUID REFERENCES guests(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  attending     TEXT NOT NULL CHECK (attending IN ('yes','no','maybe')),
  guest_count   INTEGER NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 0 AND 50),
  side          TEXT CHECK (side IN ('groom','bride','both')),
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_id    UUID REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS phone       TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS attending   TEXT NOT NULL DEFAULT 'yes';
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS side        TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS message     TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS rsvps_inv_idx ON rsvps(invitation_id);

CREATE TABLE IF NOT EXISTS wishes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  message       TEXT NOT NULL,
  is_hidden     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS is_hidden  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS wishes_inv_idx ON wishes(invitation_id, created_at DESC);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes      ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION owns_invitation(iid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT is_admin() OR EXISTS (SELECT 1 FROM invitations WHERE id = iid AND user_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION invitation_is_public(iid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM invitations WHERE id = iid AND is_published);
$$;

DROP POLICY IF EXISTS inv_select ON invitations;
DROP POLICY IF EXISTS inv_insert ON invitations;
DROP POLICY IF EXISTS inv_update ON invitations;
DROP POLICY IF EXISTS inv_delete ON invitations;
CREATE POLICY inv_select ON invitations FOR SELECT USING (is_published OR user_id = auth.uid() OR is_admin());
CREATE POLICY inv_insert ON invitations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY inv_update ON invitations FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY inv_delete ON invitations FOR DELETE USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS guests_all ON guests;
CREATE POLICY guests_all ON guests FOR ALL USING (owns_invitation(invitation_id)) WITH CHECK (owns_invitation(invitation_id));

DROP POLICY IF EXISTS rsvps_owner ON rsvps;
CREATE POLICY rsvps_owner ON rsvps FOR ALL USING (owns_invitation(invitation_id)) WITH CHECK (owns_invitation(invitation_id));

DROP POLICY IF EXISTS wishes_public ON wishes;
DROP POLICY IF EXISTS wishes_owner  ON wishes;
CREATE POLICY wishes_public ON wishes FOR SELECT USING (NOT is_hidden AND invitation_is_public(invitation_id));
CREATE POLICY wishes_owner  ON wishes FOR ALL USING (owns_invitation(invitation_id)) WITH CHECK (owns_invitation(invitation_id));

-- Khách xem thiệp: lấy tên khách mời từ mã cá nhân hóa (?g=code)
CREATE OR REPLACE FUNCTION get_invitation_guest(p_invitation_id UUID, p_code TEXT)
RETURNS TABLE(name TEXT, salutation TEXT, invited_count INTEGER, side TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.name, g.salutation, g.invited_count, g.side FROM guests g
  JOIN invitations i ON i.id = g.invitation_id
  WHERE g.invitation_id = p_invitation_id AND g.code = p_code
    AND (i.is_published OR i.user_id = auth.uid() OR is_admin())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION increment_invitation_view(p_invitation_id UUID) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE invitations SET view_count = view_count + 1 WHERE id = p_invitation_id AND is_published;
$$;

-- Gửi xác nhận tham dự (khách không cần đăng nhập)
CREATE OR REPLACE FUNCTION submit_rsvp(
  p_invitation_id UUID, p_name TEXT, p_attending TEXT, p_guest_count INTEGER DEFAULT 1,
  p_phone TEXT DEFAULT NULL, p_side TEXT DEFAULT NULL, p_message TEXT DEFAULT NULL, p_guest_code TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gid UUID; rid UUID;
BEGIN
  IF NOT invitation_is_public(p_invitation_id) THEN RAISE EXCEPTION 'Thiệp chưa được phát hành'; END IF;
  IF coalesce(length(trim(p_name)),0) = 0 OR length(p_name) > 120 THEN RAISE EXCEPTION 'Tên không hợp lệ'; END IF;
  IF length(coalesce(p_message,'')) > 1000 THEN RAISE EXCEPTION 'Lời nhắn quá dài'; END IF;
  IF p_guest_code IS NOT NULL THEN
    SELECT id INTO gid FROM guests WHERE invitation_id = p_invitation_id AND code = p_guest_code;
  END IF;
  -- Khách được mời riêng gửi lại → cập nhật phản hồi cũ
  IF gid IS NOT NULL THEN
    SELECT id INTO rid FROM rsvps WHERE guest_id = gid ORDER BY created_at DESC LIMIT 1;
  END IF;
  IF rid IS NOT NULL THEN
    UPDATE rsvps SET name = trim(p_name), phone = p_phone, attending = p_attending,
      guest_count = CASE WHEN p_attending = 'no' THEN 0 ELSE greatest(1, least(p_guest_count, 50)) END,
      side = p_side, message = p_message, created_at = NOW()
    WHERE id = rid;
    RETURN rid;
  END IF;
  INSERT INTO rsvps(invitation_id, guest_id, name, phone, attending, guest_count, side, message)
  VALUES (p_invitation_id, gid, trim(p_name), p_phone, p_attending,
          CASE WHEN p_attending = 'no' THEN 0 ELSE greatest(1, least(p_guest_count, 50)) END, p_side, p_message)
  RETURNING id INTO rid;
  RETURN rid;
END; $$;

-- Gửi lời chúc (sổ lưu bút)
CREATE OR REPLACE FUNCTION submit_wish(p_invitation_id UUID, p_name TEXT, p_message TEXT)
RETURNS wishes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w wishes;
BEGIN
  IF NOT invitation_is_public(p_invitation_id) THEN RAISE EXCEPTION 'Thiệp chưa được phát hành'; END IF;
  IF coalesce(length(trim(p_name)),0) = 0 OR length(p_name) > 120 THEN RAISE EXCEPTION 'Tên không hợp lệ'; END IF;
  IF coalesce(length(trim(p_message)),0) = 0 OR length(p_message) > 1000 THEN RAISE EXCEPTION 'Lời chúc không hợp lệ'; END IF;
  INSERT INTO wishes(invitation_id, name, message) VALUES (p_invitation_id, trim(p_name), trim(p_message))
  RETURNING * INTO w;
  RETURN w;
END; $$;

GRANT EXECUTE ON FUNCTION get_invitation_guest(UUID, TEXT)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_invitation_view(UUID)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_rsvp(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_wish(UUID, TEXT, TEXT)               TO anon, authenticated;

-- ── 4. Thống kê cho trang quản trị ─────────────────────────────
CREATE OR REPLACE FUNCTION admin_stats() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên'; END IF;
  RETURN jsonb_build_object(
    'users',            (SELECT count(*) FROM profiles),
    'admins',           (SELECT count(*) FROM profiles WHERE role = 'admin'),
    'locked',           (SELECT count(*) FROM profiles WHERE NOT is_active),
    'projects',         (SELECT count(*) FROM projects),
    'invitations',      (SELECT count(*) FROM invitations),
    'published',        (SELECT count(*) FROM invitations WHERE is_published),
    'views',            (SELECT coalesce(sum(view_count),0) FROM invitations),
    'rsvps',            (SELECT count(*) FROM rsvps),
    'attending_guests', (SELECT coalesce(sum(guest_count),0) FROM rsvps WHERE attending = 'yes'),
    'wishes',           (SELECT count(*) FROM wishes),
    'new_users_7d',     (SELECT count(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days')
  );
END; $$;

CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, phone TEXT, avatar_url TEXT, role TEXT, is_active BOOLEAN,
              created_at TIMESTAMPTZ, last_seen_at TIMESTAMPTZ, project_count BIGINT, invitation_count BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Chỉ quản trị viên'; END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.phone, p.avatar_url, p.role::text, p.is_active, p.created_at, p.last_seen_at,
    (SELECT count(*) FROM projects pr WHERE pr.user_id = p.id),
    (SELECT count(*) FROM invitations i WHERE i.user_id = p.id)
  FROM profiles p ORDER BY p.created_at DESC;
END; $$;

-- ── 5. Lưu trữ ảnh thiệp ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('invitation-media', 'invitation-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "inv media read"   ON storage.objects;
DROP POLICY IF EXISTS "inv media write"  ON storage.objects;
DROP POLICY IF EXISTS "inv media delete" ON storage.objects;
CREATE POLICY "inv media read"   ON storage.objects FOR SELECT USING (bucket_id = 'invitation-media');
CREATE POLICY "inv media write"  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invitation-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "inv media delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'invitation-media' AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin()));

-- ── 6. Realtime cho phản hồi khách ────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE rsvps;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wishes;
EXCEPTION WHEN others THEN NULL; END $$;

-- ── 7. Yêu cầu Supabase API (PostgREST) nạp lại schema ────────
NOTIFY pgrst, 'reload schema';
