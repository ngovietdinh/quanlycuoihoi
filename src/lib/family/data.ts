// Dữ liệu tham khảo cho phân hệ Gia đình. Các mốc y tế/chế độ chỉ mang tính tham khảo —
// luôn theo chỉ định của bác sĩ, trung tâm tiêm chủng và quy định hiện hành.

// ── Thu chi ───────────────────────────────────────────────────────────────────
export const EXPENSE_CATS: { name: string; icon: string }[] = [
  { name: 'Ăn uống', icon: '🍚' }, { name: 'Chợ & siêu thị', icon: '🛒' }, { name: 'Nhà ở', icon: '🏠' },
  { name: 'Điện nước & internet', icon: '💡' }, { name: 'Đi lại & xăng xe', icon: '🛵' }, { name: 'Con cái', icon: '🧸' },
  { name: 'Học phí & học thêm', icon: '🎒' }, { name: 'Sức khỏe & thuốc', icon: '💊' }, { name: 'Thai sản', icon: '🤰' },
  { name: 'Mua sắm', icon: '🛍️' }, { name: 'Hiếu hỉ', icon: '🎎' }, { name: 'Biếu bố mẹ', icon: '👵' },
  { name: 'Giải trí & du lịch', icon: '🏖️' }, { name: 'Bảo hiểm', icon: '🛡️' }, { name: 'Trả nợ & trả góp', icon: '🏦' },
  { name: 'Làm đẹp & cá nhân', icon: '💇' }, { name: 'Khác', icon: '📦' },
]
export const INCOME_CATS: { name: string; icon: string }[] = [
  { name: 'Lương', icon: '💼' }, { name: 'Thưởng', icon: '🎁' }, { name: 'Kinh doanh', icon: '🏪' },
  { name: 'Đầu tư & lãi', icon: '📈' }, { name: 'Tiền mừng', icon: '🧧' }, { name: 'Trợ cấp & BHXH', icon: '🏛️' },
  { name: 'Thu nhập khác', icon: '💰' },
]
export const catIcon = (name: string) => [...EXPENSE_CATS, ...INCOME_CATS].find(c => c.name === name)?.icon ?? '📦'

export const WALLET_TYPES: Record<string, { label: string; icon: string }> = {
  cash: { label: 'Tiền mặt', icon: '💵' }, bank: { label: 'Tài khoản ngân hàng', icon: '🏦' }, credit: { label: 'Thẻ tín dụng', icon: '💳' },
  ewallet: { label: 'Ví điện tử', icon: '📱' }, saving: { label: 'Sổ tiết kiệm', icon: '🐷' },
}

// Bảng màu phân loại đã kiểm định (thứ tự cố định, không xoay vòng; quá 8 → gộp "Khác")
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
export const OTHER_COLOR = '#a8a29e'

// ── Thai sản ──────────────────────────────────────────────────────────────────
export const addDays = (d: string, n: number) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
export const dueFromLmp = (lmp: string) => addDays(lmp, 280)
export const lmpFromDue = (due: string) => addDays(due, -280)
/** Tuổi thai (tuần + ngày) tính từ ngày dự sinh */
export function gestation(due: string, on = new Date()) {
  const lmp = new Date(lmpFromDue(due) + 'T00:00:00'); const t = new Date(on); t.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.round((t.getTime() - lmp.getTime()) / 864e5))
  return { weeks: Math.floor(days / 7), days: days % 7, totalDays: days, trimester: days < 98 ? 1 : days < 196 ? 2 : 3 }
}

/** Kích thước thai nhi ước tính theo tuần (chiều dài cm, cân nặng g, so sánh) */
export const FETAL: Record<number, [number, number, string]> = {
  4: [0.1, 0, 'hạt anh túc'], 5: [0.2, 0, 'hạt vừng'], 6: [0.6, 0, 'hạt đậu lăng'], 7: [1, 0, 'quả việt quất'],
  8: [1.6, 1, 'quả mâm xôi'], 9: [2.3, 2, 'quả nho'], 10: [3.1, 4, 'quả quất'], 11: [4.1, 7, 'quả sung'], 12: [5.4, 14, 'quả chanh'],
  13: [7.4, 23, 'quả đào nhỏ'], 14: [8.7, 43, 'quả chanh vàng'], 15: [10.1, 70, 'quả táo'], 16: [11.6, 100, 'quả bơ'],
  17: [13, 140, 'củ hành tây'], 18: [14.2, 190, 'quả ớt chuông'], 19: [15.3, 240, 'quả xoài'], 20: [25.6, 300, 'quả chuối'],
  21: [26.7, 360, 'củ cà rốt'], 22: [27.8, 430, 'quả đu đủ nhỏ'], 23: [28.9, 501, 'quả bưởi nhỏ'], 24: [30, 600, 'bắp ngô'],
  25: [34.6, 660, 'cây súp lơ'], 26: [35.6, 760, 'cây xà lách'], 27: [36.6, 875, 'bắp cải'], 28: [37.6, 1005, 'quả cà tím'],
  29: [38.6, 1153, 'quả bí ngô nhỏ'], 30: [39.9, 1319, 'bắp cải lớn'], 31: [41.1, 1502, 'quả dừa'], 32: [42.4, 1702, 'quả dứa nhỏ'],
  33: [43.7, 1918, 'quả dứa'], 34: [45, 2146, 'quả dưa lưới'], 35: [46.2, 2383, 'quả dưa lê'], 36: [47.4, 2622, 'quả đu đủ lớn'],
  37: [48.6, 2859, 'bó cải chíp lớn'], 38: [49.8, 3083, 'quả bí đỏ'], 39: [50.7, 3288, 'quả dưa hấu nhỏ'], 40: [51.2, 3462, 'quả dưa hấu'],
}

/** Các mốc khám thai quan trọng (tuần bắt đầu → kết thúc) */
export const PRENATAL_MILESTONES: { from: number; to: number; title: string; detail: string }[] = [
  { from: 6, to: 8, title: 'Khám thai lần đầu', detail: 'Siêu âm xác định thai trong tử cung, tim thai; xét nghiệm máu, nước tiểu cơ bản; bắt đầu uống axit folic' },
  { from: 11, to: 14, title: 'Đo độ mờ da gáy + sàng lọc', detail: 'Siêu âm đo độ mờ da gáy; Double test hoặc NIPT sàng lọc dị tật nhiễm sắc thể' },
  { from: 15, to: 20, title: 'Triple test (nếu chưa NIPT)', detail: 'Khám định kỳ, bổ sung sắt + canxi' },
  { from: 20, to: 24, title: 'Siêu âm hình thái học', detail: 'Siêu âm 4D khảo sát hình thái thai nhi — mốc rất quan trọng' },
  { from: 24, to: 28, title: 'Tầm soát tiểu đường thai kỳ', detail: 'Nghiệm pháp dung nạp đường (OGTT 75g); tiêm uốn ván mũi 1 nếu chưa tiêm' },
  { from: 28, to: 32, title: 'Siêu âm tăng trưởng', detail: 'Đánh giá cân nặng thai, nước ối; tiêm uốn ván mũi 2 (cách mũi 1 ≥ 4 tuần)' },
  { from: 32, to: 34, title: 'Siêu âm Doppler', detail: 'Doppler động mạch rốn, đánh giá ngôi thai, chuẩn bị kế hoạch sinh' },
  { from: 35, to: 37, title: 'Xét nghiệm liên cầu khuẩn nhóm B', detail: 'Cấy GBS; đo monitor tim thai; chuẩn bị đồ đi sinh' },
  { from: 37, to: 41, title: 'Khám hằng tuần', detail: 'Monitor tim thai, kiểm tra cổ tử cung; theo dõi dấu hiệu chuyển dạ' },
]

export const VISIT_TYPES = ['Khám định kỳ', 'Siêu âm', 'Xét nghiệm', 'Tiêm phòng', 'Cấp cứu / bất thường']

export const PREGNANCY_COST_TEMPLATE: [string, number][] = [
  ['Khám thai định kỳ (~10 lần)', 5_000_000], ['Siêu âm 4D, NIPT & xét nghiệm sàng lọc', 8_000_000],
  ['Vitamin, sắt, canxi, DHA', 4_000_000], ['Gói sinh (thường / mổ)', 15_000_000], ['Phòng dịch vụ & nằm viện', 5_000_000],
  ['Đồ đi sinh & đồ sơ sinh', 10_000_000], ['Quần áo bầu', 2_000_000], ['Tiêm chủng năm đầu cho bé', 15_000_000], ['Dự phòng phát sinh', 5_000_000],
]

export const BABY_ITEMS: { grp: string; items: [string, number, number, boolean][] }[] = [
  // [tên, số lượng, đơn giá tham khảo, thiết yếu]
  { grp: 'Đồ đi sinh cho mẹ', items: [['Giấy tờ: CCCD, BHYT, sổ khám thai, kết quả xét nghiệm', 1, 0, true], ['Bỉm / băng vệ sinh cho mẹ sau sinh', 2, 120_000, true], ['Quần lót giấy', 2, 50_000, true], ['Bộ đồ sau sinh mở cúc trước', 3, 150_000, true], ['Áo choàng / khăn quàng, tất', 1, 150_000, true], ['Miếng lót thấm sữa', 1, 120_000, true], ['Khăn sữa, khăn tắm', 1, 100_000, true], ['Đồ vệ sinh cá nhân, dép', 1, 150_000, true]] },
  { grp: 'Đồ đi sinh cho bé', items: [['Bộ quần áo sơ sinh', 5, 80_000, true], ['Mũ, bao tay, bao chân', 3, 40_000, true], ['Tã dán sơ sinh (size NB)', 2, 200_000, true], ['Khăn quấn / chũn', 3, 90_000, true], ['Khăn sữa', 10, 15_000, true], ['Bình sữa + sữa công thức dự phòng', 1, 350_000, false], ['Bông, gạc, nước muối sinh lý', 1, 100_000, true]] },
  { grp: 'Đồ dùng hằng ngày', items: [['Máy hâm sữa / tiệt trùng bình', 1, 900_000, false], ['Máy hút sữa', 1, 2_000_000, false], ['Chậu tắm, sữa tắm, khăn tắm', 1, 400_000, true], ['Nhiệt kế điện tử', 1, 300_000, true], ['Dụng cụ hút mũi, cắt móng', 1, 150_000, true], ['Nước giặt đồ sơ sinh', 1, 150_000, true]] },
  { grp: 'Phòng & di chuyển', items: [['Cũi / nôi', 1, 2_500_000, false], ['Đệm, chăn, gối chống bẹp đầu', 1, 700_000, true], ['Màn chống muỗi', 1, 200_000, true], ['Xe đẩy', 1, 3_000_000, false], ['Địu em bé', 1, 800_000, false], ['Ghế ngồi ô tô cho bé', 1, 3_000_000, false]] },
]

/** Ước tính chế độ thai sản BHXH (Luật BHXH 2024, hiệu lực 1/7/2025) — chỉ tham khảo */
export function maternityBenefit(avgSalary: number, baseSalary: number, months = 6, twins = 1, fatherDays = 5) {
  const oneTime = 2 * baseSalary * twins                    // trợ cấp một lần mỗi con = 2 lần mức tham chiếu/lương cơ sở
  const leave = avgSalary * (months + (twins - 1))          // nghỉ 6 tháng, thêm 1 tháng mỗi con từ con thứ 2 (sinh đôi trở lên)
  const father = Math.round((avgSalary / 24) * fatherDays)  // chồng nghỉ 5–14 ngày làm việc
  return { oneTime, leave, father, total: oneTime + leave }
}

// ── Con cái ───────────────────────────────────────────────────────────────────
/** Lịch tiêm chủng tham khảo (tháng tuổi). epi = Tiêm chủng mở rộng (miễn phí), service = tiêm dịch vụ */
export const VACCINE_SCHEDULE: { m: number; vaccine: string; dose: string; program: 'epi' | 'service' }[] = [
  { m: 0, vaccine: 'Viêm gan B sơ sinh', dose: 'Trong 24 giờ đầu', program: 'epi' },
  { m: 0, vaccine: 'Lao (BCG)', dose: 'Trong tháng đầu', program: 'epi' },
  { m: 2, vaccine: '6 trong 1 (Bạch hầu–Ho gà–Uốn ván–Bại liệt–Hib–Viêm gan B)', dose: 'Mũi 1', program: 'service' },
  { m: 2, vaccine: 'Phế cầu', dose: 'Mũi 1', program: 'service' },
  { m: 2, vaccine: 'Rota virus (uống)', dose: 'Liều 1', program: 'service' },
  { m: 3, vaccine: '6 trong 1', dose: 'Mũi 2', program: 'service' },
  { m: 3, vaccine: 'Phế cầu', dose: 'Mũi 2', program: 'service' },
  { m: 3, vaccine: 'Rota virus (uống)', dose: 'Liều 2', program: 'service' },
  { m: 4, vaccine: '6 trong 1', dose: 'Mũi 3', program: 'service' },
  { m: 4, vaccine: 'Phế cầu', dose: 'Mũi 3', program: 'service' },
  { m: 6, vaccine: 'Cúm', dose: 'Mũi 1', program: 'service' },
  { m: 7, vaccine: 'Cúm', dose: 'Mũi 2 (cách 1 tháng)', program: 'service' },
  { m: 9, vaccine: 'Sởi', dose: 'Mũi 1', program: 'epi' },
  { m: 9, vaccine: 'Viêm não Nhật Bản (dịch vụ)', dose: 'Mũi 1', program: 'service' },
  { m: 12, vaccine: 'Sởi–Quai bị–Rubella (MMR)', dose: 'Mũi 1', program: 'service' },
  { m: 12, vaccine: 'Thủy đậu', dose: 'Mũi 1', program: 'service' },
  { m: 12, vaccine: 'Viêm gan A', dose: 'Mũi 1', program: 'service' },
  { m: 12, vaccine: 'Phế cầu', dose: 'Mũi nhắc', program: 'service' },
  { m: 12, vaccine: 'Viêm não Nhật Bản (TCMR)', dose: 'Mũi 1 + Mũi 2 sau 1–2 tuần', program: 'epi' },
  { m: 18, vaccine: '6 trong 1 / 4 trong 1', dose: 'Mũi nhắc', program: 'service' },
  { m: 18, vaccine: 'Sởi–Rubella (TCMR)', dose: '1 mũi', program: 'epi' },
  { m: 18, vaccine: 'Viêm gan A', dose: 'Mũi 2', program: 'service' },
  { m: 24, vaccine: 'Viêm não Nhật Bản (TCMR)', dose: 'Mũi 3', program: 'epi' },
  { m: 24, vaccine: 'Thương hàn', dose: '1 mũi (nhắc mỗi 3 năm)', program: 'service' },
  { m: 48, vaccine: 'Sởi–Quai bị–Rubella (MMR)', dose: 'Mũi 2', program: 'service' },
  { m: 48, vaccine: 'Thủy đậu', dose: 'Mũi 2', program: 'service' },
  { m: 48, vaccine: 'Bạch hầu–Ho gà–Uốn ván–Bại liệt', dose: 'Mũi nhắc', program: 'service' },
  { m: 108, vaccine: 'HPV (ung thư cổ tử cung)', dose: 'Từ 9 tuổi', program: 'service' },
]
export const addMonths = (d: string, m: number) => { const x = new Date(d + 'T12:00:00'); x.setMonth(x.getMonth() + m); return x.toISOString().slice(0, 10) }
export function ageText(dob: string, on = new Date()) {
  const b = new Date(dob + 'T00:00:00')
  let months = (on.getFullYear() - b.getFullYear()) * 12 + (on.getMonth() - b.getMonth()) - (on.getDate() < b.getDate() ? 1 : 0)
  if (months < 0) return 'Chưa sinh'
  if (months < 1) return `${Math.floor((on.getTime() - b.getTime()) / 864e5)} ngày tuổi`
  if (months < 24) return `${months} tháng tuổi`
  const y = Math.floor(months / 12); months %= 12
  return `${y} tuổi${months ? ` ${months} tháng` : ''}`
}
export const ageMonths = (dob: string, on: string | Date = new Date()) => {
  const b = new Date(dob + 'T00:00:00'), t = typeof on === 'string' ? new Date(on + 'T00:00:00') : on
  return Math.max(0, (t.getTime() - b.getTime()) / (864e5 * 30.4375))
}

/** Trung vị chuẩn tăng trưởng WHO (0–60 tháng) — gần đúng, dùng để tham khảo
 *  [tháng, cân nặng kg, chiều cao cm]; dải ±2SD ước tính theo hệ số biến thiên */
export const WHO: Record<'male' | 'female', [number, number, number][]> = {
  male:   [[0, 3.3, 49.9], [1, 4.5, 54.7], [2, 5.6, 58.4], [3, 6.4, 61.4], [4, 7.0, 63.9], [6, 7.9, 67.6], [9, 8.9, 72.0], [12, 9.6, 75.7], [18, 10.9, 82.3], [24, 12.2, 87.8], [36, 14.3, 96.1], [48, 16.3, 103.3], [60, 18.3, 110.0]],
  female: [[0, 3.2, 49.1], [1, 4.2, 53.7], [2, 5.1, 57.1], [3, 5.8, 59.8], [4, 6.4, 62.1], [6, 7.3, 65.7], [9, 8.2, 70.1], [12, 8.9, 74.0], [18, 10.2, 80.7], [24, 11.5, 86.4], [36, 13.9, 95.1], [48, 16.1, 102.7], [60, 18.2, 109.4]],
}
export const WHO_CV = { weight: 0.12, height: 0.037 }
export function whoMedian(gender: 'male' | 'female', month: number, idx: 1 | 2) {
  const t = WHO[gender]
  if (month <= 0) return t[0][idx]
  for (let i = 1; i < t.length; i++) {
    if (month <= t[i][0]) { const [m0, a] = [t[i - 1][0], t[i - 1][idx]], [m1, b] = [t[i][0], t[i][idx]]; return a + ((b - a) * (month - m0)) / (m1 - m0) }
  }
  return t[t.length - 1][idx]
}
/** Đánh giá: z ≈ (giá trị − trung vị) / (trung vị × CV) */
export function growthStatus(kind: 'weight' | 'height', gender: 'male' | 'female', month: number, value: number) {
  const med = whoMedian(gender, month, kind === 'weight' ? 1 : 2)
  const z = (value - med) / (med * WHO_CV[kind])
  if (z < -3) return { z, label: kind === 'weight' ? 'Suy dinh dưỡng nặng' : 'Thấp còi nặng', tone: 'bad' as const }
  if (z < -2) return { z, label: kind === 'weight' ? 'Nhẹ cân' : 'Thấp còi', tone: 'warn' as const }
  if (z > 3 && kind === 'weight') return { z, label: 'Béo phì', tone: 'bad' as const }
  if (z > 2) return { z, label: kind === 'weight' ? 'Thừa cân' : 'Cao vượt trội', tone: kind === 'weight' ? 'warn' as const : 'good' as const }
  return { z, label: 'Bình thường', tone: 'good' as const }
}

export const MILESTONE_IDEAS = ['Biết lẫy', 'Mọc chiếc răng đầu tiên', 'Biết ngồi', 'Biết bò', 'Đứng vững', 'Bước đi đầu tiên', 'Gọi "bố" / "mẹ"', 'Ăn dặm bữa đầu', 'Thôi nôi', 'Đi nhà trẻ ngày đầu']

// ── Tiết kiệm & vay ───────────────────────────────────────────────────────────
export const GOAL_IDEAS: [string, string][] = [['🏠', 'Mua nhà'], ['🚗', 'Mua xe'], ['🆘', 'Quỹ khẩn cấp (6 tháng chi tiêu)'], ['🎓', 'Quỹ học vấn cho con'], ['✈️', 'Du lịch gia đình'], ['👶', 'Quỹ sinh con']]
export const ASSET_TYPES = ['Bất động sản', 'Xe cộ', 'Vàng & trang sức', 'Sổ tiết kiệm', 'Chứng khoán & quỹ', 'Thiết bị gia đình', 'Khác']
export const DOC_TYPES = ['CCCD', 'Hộ chiếu', 'Giấy khai sinh', 'Đăng ký kết hôn', 'Sổ đỏ / sổ hồng', 'Đăng ký xe', 'Bằng lái xe', 'Bảo hiểm y tế', 'Bảo hiểm nhân thọ', 'Bảo hiểm xe', 'Hợp đồng', 'Khác']
export const GIFT_EVENTS = ['Đám cưới', 'Đầy tháng', 'Thôi nôi', 'Tân gia', 'Mừng thọ', 'Đám hiếu', 'Ốm đau', 'Khác']

export interface LoanRow { period: number; date: string; principal: number; interest: number; payment: number; balance: number }
/** Lịch trả nợ: 'declining' = gốc đều, lãi trên dư nợ giảm dần; 'annuity' = tổng trả đều mỗi tháng */
export function loanSchedule(principal: number, annualRate: number, months: number, start: string, method: 'declining' | 'annuity'): LoanRow[] {
  const r = annualRate / 100 / 12
  const rows: LoanRow[] = []
  let bal = principal
  const annuity = r ? (principal * r) / (1 - Math.pow(1 + r, -months)) : principal / months
  for (let k = 1; k <= months; k++) {
    const interest = Math.round(bal * r)
    const prin = method === 'declining' ? (k === months ? bal : Math.round(principal / months)) : (k === months ? bal : Math.round(annuity - interest))
    bal = Math.max(0, bal - prin)
    rows.push({ period: k, date: addMonths(start, k), principal: prin, interest, payment: prin + interest, balance: bal })
  }
  return rows
}

// ── Khoản định kỳ ─────────────────────────────────────────────────────────────
import type { Bill } from '@/types'
/** Kỳ hạn của khoản định kỳ trong tháng m: trả về ngày đến hạn hoặc null nếu tháng đó không có kỳ */
export function billDue(b: Bill, m: string): string | null {
  const [y, mo] = m.split('-').map(Number)
  if (b.frequency !== 'monthly') {
    const s = (b.start_month ?? m).split('-').map(Number)
    const diff = (y - s[0]) * 12 + (mo - s[1])
    if (diff < 0 || diff % (b.frequency === 'quarterly' ? 3 : 12) !== 0) return null
  }
  const last = new Date(y, mo, 0).getDate()
  return `${m}-${String(Math.min(b.day_of_month, last)).padStart(2, '0')}`
}

