export const APP_NAME = "Manasa Upay Admin";
export const SHARE_DOMAIN = "https://manasaupay.vercel.app";
export const SUPPORT_PHONE = "8269692121";
export const SUPPORT_EMAIL = "manasaupay@gmail.com";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/businesses", label: "Businesses" },
  { href: "/services", label: "Services" },
  { href: "/auto-drivers", label: "Auto Drivers" },
  { href: "/jobs", label: "Jobs" },
  { href: "/categories", label: "Categories" },
  { href: "/ads", label: "Advertisements" },
  { href: "/popup-ads", label: "Popup Ads" },
  { href: "/sponsored-shops", label: "Sponsored Shops" },
  { href: "/notifications", label: "Notifications" },
  { href: "/updates", label: "City Updates" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/offers", label: "Offers" },
  { href: "/properties", label: "Properties" },
  { href: "/resale", label: "Resale" },
  { href: "/reviews", label: "Reviews" },
  { href: "/follows", label: "Follows" },
  { href: "/analytics", label: "Analytics" },
  { href: "/calls", label: "Calls" },
  { href: "/chats", label: "Chats" },
  { href: "/settings", label: "Settings" },
] as const;

export const NAV_GROUPS = [
  {
    title: "Content",
    items: [
      { href: "/news", label: "News" },
      { href: "/events", label: "Events" },
      { href: "/offers", label: "Offers" },
      { href: "/categories", label: "Categories" },
    ],
  },
  {
    title: "Businesses",
    items: [
      { href: "/businesses", label: "Shops" },
      { href: "/services", label: "Services" },
      { href: "/sponsored-shops", label: "Sponsored" },
    ],
  },
  {
    title: "Listings",
    items: [
      { href: "/jobs", label: "Jobs" },
      { href: "/properties", label: "Properties" },
      { href: "/resale", label: "Resale" },
      { href: "/auto-drivers", label: "Auto Drivers" },
    ],
  },
  {
    title: "Advertisements",
    items: [
      { href: "/ads", label: "Slider Ads" },
      { href: "/popup-ads", label: "Popup Ads" },
      { href: "/sponsored-shops", label: "Sponsored Placements" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/notifications", label: "Notifications" },
      { href: "/calls", label: "In-app Calls" },
      { href: "/chats", label: "Chats" },
    ],
  },
  {
    title: "Users",
    items: [
      { href: "/users", label: "Users" },
      { href: "/follows", label: "Follows" },
      { href: "/reviews", label: "Reviews" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/analytics", label: "Analytics" },
      { href: "/settings", label: "Settings" },
    ],
  },
] as const;
