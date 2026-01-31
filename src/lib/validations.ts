import { z } from 'zod';

// Password validation schema with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ thường')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 số');

// Registration form schema
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được quá 100 ký tự'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .max(255, 'Email không được quá 255 ký tự'),
  password: passwordSchema,
});

// Checkout form schema
export const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(200, 'Họ tên không được quá 200 ký tự'),
  phone: z
    .string()
    .min(7, 'Số điện thoại phải có ít nhất 7 số')
    .max(20, 'Số điện thoại không được quá 20 ký tự')
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Số điện thoại không hợp lệ'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .max(255, 'Email không được quá 255 ký tự')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
    .max(500, 'Địa chỉ không được quá 500 ký tự'),
  notes: z
    .string()
    .max(1000, 'Ghi chú không được quá 1000 ký tự')
    .optional()
    .or(z.literal('')),
});

// Profile update schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .max(200, 'Họ tên không được quá 200 ký tự')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Số điện thoại không được quá 20 ký tự')
    .regex(/^[0-9+\-\s()]*$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Địa chỉ không được quá 500 ký tự')
    .optional()
    .or(z.literal('')),
});

// Product form schema (Admin)
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(300, 'Tên sản phẩm không được quá 300 ký tự'),
  description: z
    .string()
    .max(5000, 'Mô tả không được quá 5000 ký tự')
    .optional()
    .or(z.literal('')),
  category: z.string().min(1, 'Vui lòng chọn danh mục'),
  material: z.string().min(1, 'Vui lòng chọn chất liệu'),
  weight: z
    .string()
    .refine((val) => val === '' || (parseFloat(val) > 0 && parseFloat(val) <= 10000), {
      message: 'Trọng lượng phải từ 0 đến 10,000 gram',
    })
    .optional()
    .or(z.literal('')),
  price: z
    .string()
    .refine((val) => parseFloat(val) > 0, { message: 'Giá phải lớn hơn 0' })
    .refine((val) => parseFloat(val) <= 100000000000, { message: 'Giá không được quá 100 tỷ' }),
  original_price: z
    .string()
    .refine((val) => val === '' || parseFloat(val) > 0, { message: 'Giá gốc phải lớn hơn 0' })
    .optional()
    .or(z.literal('')),
  stock: z
    .string()
    .refine((val) => val === '' || (parseInt(val) >= 0 && parseInt(val) <= 100000), {
      message: 'Số lượng phải từ 0 đến 100,000',
    })
    .optional()
    .or(z.literal('')),
  images: z
    .string()
    .max(5000, 'Danh sách URL không được quá 5000 ký tự')
    .optional()
    .or(z.literal('')),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

// Password strength calculator
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: 'Yếu', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score, label: 'Trung bình', color: 'bg-yellow-500' };
  } else {
    return { score, label: 'Mạnh', color: 'bg-green-500' };
  }
}

export type RegisterFormData = z.infer<typeof registerSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
