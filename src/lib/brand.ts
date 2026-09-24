// Thông tin thương hiệu & bản quyền — sửa tại đây để cập nhật toàn bộ ứng dụng
export const APP_NAME = 'Hỷ Sự'
export const AUTHOR = 'Ngô Viết Định'
export const COPYRIGHT_YEAR_START = 2026
export const copyright = () => {
  const y = new Date().getFullYear()
  return `© ${y > COPYRIGHT_YEAR_START ? `${COPYRIGHT_YEAR_START}–${y}` : y} ${AUTHOR}. Bảo lưu mọi quyền.`
}
