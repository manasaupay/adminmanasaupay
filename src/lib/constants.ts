export const APP_NAME = "Manasa Upay Admin";
export const SHARE_DOMAIN = "https://manasaupay.vercel.app";
export const SUPPORT_PHONE = "8269692121";
export const SUPPORT_EMAIL = "manasaupay@gmail.com";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/add-new", label: "Add New" },
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
    title: "Overview",
    items: [
      { href: "/", label: "Operations Dashboard" },
      { href: "/add-new", label: "Create New Entry" },
    ],
  },
  {
    title: "Hyperlocal Directory",
    items: [
      { href: "/businesses", label: "Shops & Businesses" },
      { href: "/services", label: "Local Services" },
      { href: "/auto-drivers", label: "Auto Drivers" },
      { href: "/jobs", label: "Job Openings" },
      { href: "/properties", label: "Real Estate" },
      { href: "/resale", label: "Resale Market" },
    ],
  },
  {
    title: "Marketing & Campaigns",
    items: [
      { href: "/ads", label: "Slider Banners" },
      { href: "/popup-ads", label: "App Popup Ads" },
      { href: "/sponsored-shops", label: "Sponsored Shops" },
      { href: "/offers", label: "Deals & Offers" },
    ],
  },
  {
    title: "System Operations",
    items: [
      { href: "/users", label: "User Management" },
      { href: "/notifications", label: "Push Notifications" },
      { href: "/categories", label: "App Categories" },
      { href: "/reviews", label: "Reviews & Ratings" },
      { href: "/calls", label: "Call History" },
      { href: "/chats", label: "Chat Support" },
      { href: "/settings", label: "Platform Settings" },
    ],
  },
] as const;
