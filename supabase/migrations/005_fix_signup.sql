-- ============================================================
-- v7: Sửa lỗi 500 khi đăng ký ("Database error saving new user")
-- Chạy SAU 004_family.sql. Idempotent — chạy lại nhiều lần vẫn an toàn.
--
-- Nguyên nhân thường gặp trên DB đã có từ script cũ:
--   • Có 2 trigger trên auth.users cùng tạo hồ sơ → trùng khóa chính profiles.id
--   • Bảng profiles cũ có cột NOT NULL không có giá trị mặc định (username…)
--   • Ràng buộc CHECK / kiểu enum cũ trên profiles.role
-- Khi trigger lỗi, Supabase từ chối tạo tài khoản và trả về HTTP 500.
-- ============================================================

-- 1. Hàm tạo hồ sơ: không bao giờ làm hỏng việc đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
  v_role TEXT := CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN 'user' ELSE 'admin' END;
BEGIN
  BEGIN
    INSERT INTO public.profiles(id, full_name, email, role)
    VALUES (NEW.id, v_name, NEW.email, v_role)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  EXCEPTION WHEN others THEN
    -- Thử lại với tối thiểu cột; nếu vẫn lỗi thì chỉ ghi cảnh báo, KHÔNG chặn đăng ký
    BEGIN
      INSERT INTO public.profiles(id, email) VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'handle_new_user: không tạo được hồ sơ cho % — %', NEW.email, SQLERRM;
    END;
  END;
  RETURN NEW;
END; $$;

-- 2. Chỉ giữ MỘT trigger tạo hồ sơ trên auth.users (xóa các trigger cũ gọi handle_new_user hoặc hàm tạo profile khác)
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'auth.users'::regclass AND NOT t.tgisinternal
      AND (p.proname = 'handle_new_user' OR t.tgname IN ('on_auth_user_created', 'on_signup', 'on_new_user', 'create_profile_on_signup'))
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
  END LOOP;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Cột NOT NULL không có mặc định (từ script cũ) → cho phép trống để insert không lỗi
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND is_nullable = 'NO' AND column_default IS NULL
      AND column_name NOT IN ('id')
  LOOP
    EXECUTE format('ALTER TABLE public.profiles ALTER COLUMN %I DROP NOT NULL', r.column_name);
  END LOOP;
END $$;

-- 4. Bỏ ràng buộc CHECK cũ trên role (002 đã chuẩn hóa role là TEXT 'user' | 'admin')
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN
    SELECT c.conname FROM pg_constraint c
    WHERE c.conrelid = 'public.profiles'::regclass AND c.contype = 'c' AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT TRUE;

-- 5. Tạo bù hồ sơ cho tài khoản đã đăng ký trong lúc trigger bị lỗi
INSERT INTO public.profiles(id, full_name, email, role)
SELECT u.id, COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)), u.email, 'user'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- Kiểm tra: phải còn đúng 1 dòng 'on_auth_user_created'
-- SELECT tgname, tgfoid::regproc FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
