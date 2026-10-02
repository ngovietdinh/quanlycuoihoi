/** Chuẩn hóa cấu hình Supabase: bỏ dấu nháy, khoảng trắng và mọi đường dẫn thừa
 *  (vd. dán nhầm `https://xxx.supabase.co/rest/v1/`) — nguyên nhân lỗi "Invalid path specified in request URL". */
const clean = (v?: string) => (v ?? '').trim().replace(/^['"]|['"]$/g, '').trim()

export function supabaseUrl() {
  const raw = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  try { return new URL(raw.includes('://') ? raw : `https://${raw}`).origin } catch { return raw }
}
export const supabaseKey = () => clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
