-- ============================================================
-- v6: Quản lý gia đình — Thu chi · Thai sản · Con cái · Tiết kiệm/Nợ/Tài sản
-- Chạy SAU 003_vendors_schedule.sql. Idempotent — chạy lại nhiều lần vẫn an toàn.
-- ============================================================

-- ── 1. Hộ gia đình & thành viên ───────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor','viewer')),
  relation     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);
CREATE INDEX IF NOT EXISTS household_members_user_idx ON household_members(user_id);
ALTER TABLE households ADD COLUMN IF NOT EXISTS owner_relation TEXT;

CREATE OR REPLACE FUNCTION household_role(hid UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM households WHERE id = hid AND owner_id = auth.uid()) THEN 'owner'
    ELSE (SELECT role FROM household_members WHERE household_id = hid AND user_id = auth.uid())
  END;
$$;
CREATE OR REPLACE FUNCTION can_access_household(hid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT household_role(hid) IS NOT NULL; $$;
CREATE OR REPLACE FUNCTION can_edit_household(hid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT household_role(hid) IN ('owner','editor'); $$;

ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('households','household_members')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename); END LOOP;
END $$;
-- Dữ liệu gia đình là riêng tư: kể cả quản trị viên hệ thống cũng không xem được
CREATE POLICY households_select ON households FOR SELECT USING (can_access_household(id));
CREATE POLICY households_insert ON households FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY households_update ON households FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY households_delete ON households FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY hm_select ON household_members FOR SELECT USING (can_access_household(household_id));
CREATE POLICY hm_manage ON household_members FOR ALL USING (household_role(household_id) = 'owner') WITH CHECK (household_role(household_id) = 'owner');
CREATE POLICY hm_leave  ON household_members FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION add_household_member(p_household_id UUID, p_email TEXT, p_role TEXT DEFAULT 'editor', p_relation TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE target UUID;
BEGIN
  IF household_role(p_household_id) IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Chỉ chủ gia đình mới mời được thành viên'; END IF;
  IF p_role NOT IN ('editor','viewer') THEN RAISE EXCEPTION 'Vai trò không hợp lệ'; END IF;
  SELECT id INTO target FROM profiles WHERE lower(email) = lower(trim(p_email));
  IF target IS NULL THEN RAISE EXCEPTION 'Không tìm thấy tài khoản với email %', p_email; END IF;
  IF EXISTS (SELECT 1 FROM households WHERE id = p_household_id AND owner_id = target) THEN RAISE EXCEPTION 'Người này là chủ gia đình'; END IF;
  INSERT INTO household_members(household_id, user_id, role, relation) VALUES (p_household_id, target, p_role, p_relation)
  ON CONFLICT (household_id, user_id) DO UPDATE SET role = EXCLUDED.role, relation = COALESCE(EXCLUDED.relation, household_members.relation);
END; $$;

CREATE OR REPLACE FUNCTION list_household_members(p_household_id UUID)
RETURNS TABLE(user_id UUID, full_name TEXT, email TEXT, avatar_url TEXT, role TEXT, relation TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.email, p.avatar_url, 'owner', h.owner_relation
  FROM households h JOIN profiles p ON p.id = h.owner_id
  WHERE h.id = p_household_id AND can_access_household(p_household_id)
  UNION ALL
  SELECT p.id, p.full_name, p.email, p.avatar_url, m.role, m.relation
  FROM household_members m JOIN profiles p ON p.id = m.user_id
  WHERE m.household_id = p_household_id AND can_access_household(p_household_id);
$$;

-- ── 2. Thu chi ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'cash' CHECK (type IN ('cash','bank','credit','ewallet','saving')),
  owner_user      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opening_balance NUMERIC(15,0) NOT NULL DEFAULT 0,
  color           TEXT,
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS children (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  nickname     TEXT,
  dob          DATE NOT NULL,
  gender       TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male','female')),
  blood_type   TEXT,
  allergies    TEXT,
  avatar_url   TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS recurring_bills (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('income','expense')),
  amount       NUMERIC(15,0) NOT NULL DEFAULT 0,
  category     TEXT NOT NULL DEFAULT 'Khác',
  wallet_id    UUID REFERENCES wallets(id) ON DELETE SET NULL,
  child_id     UUID REFERENCES children(id) ON DELETE SET NULL,
  frequency    TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','quarterly','yearly')),
  day_of_month SMALLINT NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
  start_month  TEXT,  -- 'YYYY-MM' tháng bắt đầu (dùng cho quý/năm)
  remind_days  SMALLINT NOT NULL DEFAULT 3,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('income','expense','transfer')),
  amount       NUMERIC(15,0) NOT NULL CHECK (amount > 0),
  category     TEXT NOT NULL DEFAULT 'Khác',
  wallet_id    UUID REFERENCES wallets(id) ON DELETE SET NULL,
  to_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  member_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  child_id     UUID REFERENCES children(id) ON DELETE SET NULL,
  bill_id      UUID REFERENCES recurring_bills(id) ON DELETE SET NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  note         TEXT,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_hh_date_idx ON transactions(household_id, date DESC);
CREATE TABLE IF NOT EXISTS fin_budgets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  amount       NUMERIC(15,0) NOT NULL DEFAULT 0,
  UNIQUE (household_id, category)
);

-- ── 3. Thai sản ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  mother_name  TEXT,
  lmp          DATE,          -- ngày đầu kỳ kinh cuối
  due_date     DATE NOT NULL, -- ngày dự sinh
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','born','ended')),
  baby_name    TEXT,
  hospital     TEXT,
  doctor       TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pregnancy_visits (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id   UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pregnancy_id   UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  type           TEXT NOT NULL DEFAULT 'Khám định kỳ',
  place          TEXT,
  mom_weight     NUMERIC(5,1),
  blood_pressure TEXT,
  fetal_weight   INTEGER,   -- gram
  notes          TEXT,
  cost           NUMERIC(15,0) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pregnancy_costs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  item         TEXT NOT NULL,
  estimate     NUMERIC(15,0) NOT NULL DEFAULT 0,
  actual       NUMERIC(15,0) NOT NULL DEFAULT 0,
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS baby_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
  grp          TEXT NOT NULL DEFAULT 'Cho bé',
  name         TEXT NOT NULL,
  qty          INTEGER NOT NULL DEFAULT 1,
  price        NUMERIC(15,0) NOT NULL DEFAULT 0,
  bought       BOOLEAN NOT NULL DEFAULT FALSE,
  essential    BOOLEAN NOT NULL DEFAULT TRUE,
  position     INTEGER NOT NULL DEFAULT 0
);

-- ── 4. Con cái ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaccinations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  vaccine      TEXT NOT NULL,
  dose         TEXT,
  program      TEXT NOT NULL DEFAULT 'service' CHECK (program IN ('epi','service')),
  due_date     DATE NOT NULL,
  done_date    DATE,
  place        TEXT,
  note         TEXT
);
CREATE TABLE IF NOT EXISTS growth_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  weight_kg    NUMERIC(5,2),
  height_cm    NUMERIC(5,1),
  head_cm      NUMERIC(4,1),
  note         TEXT
);
CREATE TABLE IF NOT EXISTS child_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL DEFAULT 'milestone' CHECK (kind IN ('milestone','medical')),
  date         DATE NOT NULL,
  title        TEXT NOT NULL,
  note         TEXT,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Tiết kiệm · Nợ · Hiếu hỉ · Tài sản ─────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  icon         TEXT,
  target       NUMERIC(15,0) NOT NULL DEFAULT 0,
  deadline     DATE,
  done         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS goal_contributions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  goal_id      UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount       NUMERIC(15,0) NOT NULL,   -- âm = rút ra
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  note         TEXT
);
CREATE TABLE IF NOT EXISTS loans (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  lender       TEXT,
  principal    NUMERIC(15,0) NOT NULL,
  annual_rate  NUMERIC(6,3) NOT NULL DEFAULT 0,   -- % / năm
  term_months  INTEGER NOT NULL CHECK (term_months > 0),
  start_date   DATE NOT NULL,
  method       TEXT NOT NULL DEFAULT 'declining' CHECK (method IN ('declining','annuity')),
  closed       BOOLEAN NOT NULL DEFAULT FALSE,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS loan_payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  loan_id      UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  period       INTEGER,              -- kỳ thứ mấy
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  principal    NUMERIC(15,0) NOT NULL DEFAULT 0,
  interest     NUMERIC(15,0) NOT NULL DEFAULT 0,
  note         TEXT
);
CREATE TABLE IF NOT EXISTS debts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  person       TEXT NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('lent','borrowed')),
  amount       NUMERIC(15,0) NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date     DATE,
  settled      BOOLEAN NOT NULL DEFAULT FALSE,
  settled_date DATE,
  note         TEXT
);
CREATE TABLE IF NOT EXISTS gift_book (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  person       TEXT NOT NULL,
  relation     TEXT,
  event        TEXT NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('received','given')),
  amount       NUMERIC(15,0) NOT NULL DEFAULT 0,
  gift         TEXT,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  note         TEXT
);
CREATE TABLE IF NOT EXISTS assets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Khác',
  value         NUMERIC(15,0) NOT NULL DEFAULT 0,
  acquired_date DATE,
  note          TEXT
);
CREATE TABLE IF NOT EXISTS family_documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'Khác',
  number       TEXT,
  holder       TEXT,
  issued_date  DATE,
  expiry_date  DATE,
  note         TEXT
);

-- ── 6. Phân quyền chung cho mọi bảng dữ liệu gia đình ──────────
DO $$
DECLARE t TEXT; r RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['wallets','children','recurring_bills','transactions','fin_budgets','pregnancies','pregnancy_visits',
    'pregnancy_costs','baby_items','vaccinations','growth_records','child_events','savings_goals','goal_contributions',
    'loans','loan_payments','debts','gift_book','assets','family_documents']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(household_id)', t || '_hh_idx', t);
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, t); END LOOP;
    EXECUTE format('CREATE POLICY fam_select ON public.%I FOR SELECT USING (can_access_household(household_id))', t);
    EXECUTE format('CREATE POLICY fam_write  ON public.%I FOR ALL USING (can_edit_household(household_id)) WITH CHECK (can_edit_household(household_id))', t);
    BEGIN EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t); EXCEPTION WHEN others THEN NULL; END;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
