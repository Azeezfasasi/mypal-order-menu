import { hashStringToNumber } from "@/lib/utils";

export const salonSpaImages: string[] = [
  // Spa scene with candles and towels
  "https://images.pexels.com/photos/7319129/pexels-photo-7319129.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Massage therapy session
  "https://images.pexels.com/photos/161477/treatment-finger-keep-hand-161477.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Modern hair salon interior
  "https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Manicure station with nail polish display
  "https://images.pexels.com/photos/939836/pexels-photo-939836.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Aromatherapy setup with essential oils
  "https://images.pexels.com/photos/932577/pexels-photo-932577.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Hair stylist working on a client
  "https://images.pexels.com/photos/6487882/pexels-photo-6487882.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Spa room with massage table and candles
  "https://images.pexels.com/photos/10521232/pexels-photo-10521232.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Facial treatment with skincare products
  "https://images.pexels.com/photos/7479705/pexels-photo-7479705.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Relaxing spa ambiance with soft lighting
  "https://images.pexels.com/photos/6724529/pexels-photo-6724529.jpeg?auto=compress&cs=tinysrgb&w=800",
];

export function getImageForCategory(id: string): string {
  const num = hashStringToNumber(id);
  const idx = num % salonSpaImages.length;
  return salonSpaImages[idx];
}
