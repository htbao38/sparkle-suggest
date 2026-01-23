export const CATEGORIES = {
  nhan: { label: 'Nhẫn', slug: 'nhan' },
  day_chuyen: { label: 'Dây chuyền', slug: 'day-chuyen' },
  vong_tay: { label: 'Vòng tay', slug: 'vong-tay' },
  bong_tai: { label: 'Bông tai', slug: 'bong-tai' },
  lac: { label: 'Lắc', slug: 'lac' },
  charm: { label: 'Charm', slug: 'charm' },
  nhan_cuoi: { label: 'Nhẫn cưới', slug: 'nhan-cuoi' },
  trang_suc_cuoi: { label: 'Trang sức cưới', slug: 'trang-suc-cuoi' },
} as const;

export const MATERIALS = {
  gold_24k: { label: 'Vàng 24K', slug: 'vang-24k' },
  gold_18k: { label: 'Vàng 18K', slug: 'vang-18k' },
  gold_14k: { label: 'Vàng 14K', slug: 'vang-14k' },
  silver: { label: 'Bạc', slug: 'bac' },
  platinum: { label: 'Bạch kim', slug: 'bach-kim' },
  diamond: { label: 'Kim cương', slug: 'kim-cuong' },
  pearl: { label: 'Ngọc trai', slug: 'ngoc-trai' },
  gemstone: { label: 'Đá quý', slug: 'da-quy' },
} as const;

export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
} as const;

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
