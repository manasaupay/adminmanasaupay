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
  { href: "/sponsored-shops", label: "Sponsored Shops" },
  { href: "/notifications", label: "Notifications" },
  { href: "/updates", label: "City Updates" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/offers", label: "Offers" },
  { href: "/products", label: "Products" },
  { href: "/properties", label: "Properties" },
  { href: "/resale", label: "Resale" },
  { href: "/reviews", label: "Reviews" },
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
      { href: "/ai-assistant", label: "AI Operations Copilot" },
    ],
  },
  {
    title: "Content Engine",
    items: [
      { href: "/homepage-builder", label: "Homepage & Layout" },
      { href: "/categories", label: "App Categories" },
    ],
  },
  {
    title: "Marketing OS",
    items: [
      { href: "/ads-os", label: "Advertisement OS" },
      { href: "/sponsorship-os", label: "Sponsorship OS" },
      { href: "/notification-os", label: "Notification OS" },
      { href: "/revenue-os", label: "Revenue OS" },
    ],
  },
  {
    title: "Operational Directories",
    items: [
      { href: "/users", label: "Users Registry" },
      { href: "/businesses", label: "Business Directory" },
      { href: "/services", label: "Services Registry" },
      { href: "/auto-drivers", label: "Auto Drivers" },
      { href: "/jobs", label: "Job Postings" },
      { href: "/properties", label: "Property Board" },
      { href: "/resale", label: "Resale Items" },
      { href: "/products", label: "Product Inventory" },
      { href: "/offers", label: "Offers & Deals" },
      { href: "/events", label: "Events Calendar" },
      { href: "/news", label: "News & Media" },
      { href: "/reviews", label: "User Reviews" },
    ],
  },
  {
    title: "Hyperlocal Intel",
    items: [
      { href: "/search-intelligence", label: "Search Intelligence" },
      { href: "/business-intelligence", label: "Business Intel" },
      { href: "/user-intelligence", label: "User Intelligence" },
    ],
  },
  {
    title: "Control & Security",
    items: [
      { href: "/automation-engine", label: "Automation Engine" },
      { href: "/audit-system", label: "System Audit Logs" },
      { href: "/monitoring-center", label: "Monitoring Center" },
      { href: "/roles-permissions", label: "Roles & Permissions" },
      { href: "/export-center", label: "Data Export Center" },
      { href: "/settings", label: "Platform Settings" },
    ],
  },
] as const;
