import { z } from "zod";

export const repairSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  brand: z.string().min(1, "กรุณากรอกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณากรอกรุ่นรถ"),
  plate_letters: z.string().min(1, "กรุณากรอกทะเบียนตัวอักษร"),
  plate_numbers: z.string().min(1, "กรุณากรอกทะเบียนตัวเลข"),
  province: z.string().min(1, "กรุณากรอกจังหวัด"),
  description: z.string().optional(),
});
