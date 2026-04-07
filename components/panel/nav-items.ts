import {
  Bike,
  Calculator,
  CreditCard,
  Headset,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  PackageSearch,
  Plug,
  ShoppingCart,
  User,
  Users,
  Wallet,
  Settings,
} from "lucide-react";

export const panelNavItems = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/panel/gonderi-olustur", label: "Gönderi Oluştur", icon: PackagePlus },
  { href: "/panel/gonderilerim", label: "Gönderilerim", icon: PackageSearch },
  { href: "/panel/sepetim", label: "Sepetim", icon: ShoppingCart },
  { href: "/panel/entegrasyon", label: "Entegrasyon", icon: Plug },
  { href: "/panel/fiyat-hesaplama", label: "Fiyat Hesaplama", icon: Calculator },
  { href: "/panel/kurye-cagir", label: "Kurye Çağır", icon: Bike },
  { href: "/panel/destek-talebi", label: "Destek Talebi", icon: Headset },
  {
    href: "/panel/fatura-odeme",
    label: "Fatura ve Ödeme Bilgileri",
    icon: CreditCard,
  },
  { href: "/panel/profilim", label: "Profilim", icon: User },
  { href: "/panel/cikis", label: "Çıkış", icon: LogOut },
] as const;

// Bayi (Reseller) menü öğeleri — sadece role='reseller' olan kullanıcılara gösterilir
export const resellerNavItems = [
  { href: "/panel/bayi/dashboard", label: "Bayi Paneli", icon: Wallet },
  { href: "/panel/bayi/musterilerim", label: "Müşterilerim", icon: Users },
  { href: "/panel/bayi/ayarlar", label: "Bayi Ayarları", icon: Settings },
] as const;
