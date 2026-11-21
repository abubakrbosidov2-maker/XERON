// Sahifalar ro'yxati. ready:false bo'lganlari hali yaratilmagan va menyuda ko'rinmaydi.
export interface NavItem { href: string; label: string; icon: string; ready: boolean; adminOnly?: boolean }

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: "home", ready: true },
  { href: "/profile", label: "Profil", icon: "user", ready: false },
  { href: "/character", label: "Qahramon", icon: "shirt", ready: true },
  { href: "/inventory", label: "Inventar", icon: "package", ready: true },
  { href: "/store", label: "Do'kon", icon: "bag", ready: true },
  { href: "/missions", label: "Missiyalar", icon: "target", ready: true },
  { href: "/arena", label: "Arena", icon: "swords", ready: true },
  { href: "/leaderboard", label: "Reyting", icon: "trophy", ready: true },
  { href: "/countries", label: "Davlatlar", icon: "globe", ready: true },
  { href: "/teams", label: "Jamoalar", icon: "users", ready: true },
  { href: "/friends", label: "Do'stlar", icon: "friends", ready: true },
  { href: "/community", label: "Hamjamiyat", icon: "chat", ready: true },
  { href: "/world", label: "Virtual dunyo", icon: "castle", ready: false },
  { href: "/notifications", label: "Bildirishnomalar", icon: "bell", ready: false },
  { href: "/settings", label: "Sozlamalar", icon: "settings", ready: false },
  { href: "/admin", label: "Admin", icon: "shield", ready: false, adminOnly: true },
];