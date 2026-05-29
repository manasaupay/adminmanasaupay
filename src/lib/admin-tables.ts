export type AdminTableKey =
  | "users"
  | "businesses"
  | "services"
  | "auto_drivers"
  | "jobs"
  | "categories"
  | "ads"
  | "popup_ads"
  | "sponsored_shops"
  | "notifications"
  | "updates"
  | "news"
  | "events"
  | "offers"
  | "properties"
  | "resale"
  | "reviews"
  | "follows"
  | "analytics"
  | "call_sessions"
  | "chat_threads"
  | "chat_messages"
  | "settings"
  | "products";

export type AdminColumnType =
  | "text"
  | "enum"
  | "date"
  | "json"
  | "boolean"
  | "image";

export type AdminOptionSource =
  | "categoryLabels"
  | "categoryKeys"
  | "businessCategoryLabels"
  | "businessSubcategoryLabels"
  | "serviceCategoryLabels"
  | "serviceSubcategoryLabels"
  | "businesses"
  | "users"
  | "chatThreads";

export type AdminTableConfig = {
  key: AdminTableKey;
  title: string;
  description: string;
  sectionKey: string;
  approveField?: "is_approved";
  featuredField?: "is_featured";
  activeField?: "active";
  availabilityField?: "availability";
  columns: {
    key: string;
    label: string;
    options?: string[];
    optionSource?: AdminOptionSource;
    type?: AdminColumnType;
  }[];
};

const categoryScopes = [
  "global",
  "businesses",
  "services",
  "auto_drivers",
  "jobs",
  "properties",
  "resale",
  "offers",
  "events",
  "news",
  "ads",
  "creators",
];

const pagePlacements = [
  "homepage",
  "category",
  "subcategory",
  "search",
  "business",
  "services",
  "jobs",
  "properties",
  "offers",
  "resale",
  "news",
  "events",
];

export const ADMIN_TABLES: Record<AdminTableKey, AdminTableConfig> = {
  users: {
    key: "users",
    title: "User Management",
    description: "Manage users, roles, verification, blocking, and activity metadata.",
    sectionKey: "users",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role", options: ["user", "business", "service_provider", "auto_driver", "admin"], type: "enum" },
      { key: "is_verified", label: "Verified", type: "boolean" },
      { key: "is_blocked", label: "Blocked", type: "boolean" },
      { key: "meta.notes", label: "Admin Notes" },
    ],
  },
  businesses: {
    key: "businesses",
    title: "Business Management",
    description: "Approve businesses, manage premium pages, badges, categories, banners, and sponsorship state.",
    sectionKey: "businesses",
    approveField: "is_approved",
    featuredField: "is_featured",
    columns: [
      { key: "name", label: "Name" },
      { key: "owner_id", label: "Owner", optionSource: "users" },
      { key: "category", label: "Category", optionSource: "businessCategoryLabels" },
      { key: "subcategory", label: "Subcategory", optionSource: "businessSubcategoryLabels" },
      { key: "phone", label: "Phone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "cover_image", label: "Cover Image", type: "image" },
      { key: "logo_url", label: "Logo", type: "image" },
      { key: "is_verified", label: "Verified", type: "boolean" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "priority", label: "Priority" },
      { key: "meta.tags", label: "Search Tags" },
      { key: "meta.notes", label: "Admin Notes" },
    ],
  },
  services: {
    key: "services",
    title: "Services Management",
    description: "Approve providers, assign categories/subcategories, and manage sponsored service listings.",
    sectionKey: "services",
    approveField: "is_approved",
    featuredField: "is_featured",
    columns: [
      { key: "name", label: "Name" },
      { key: "provider_id", label: "Provider", optionSource: "users" },
      { key: "category", label: "Category", optionSource: "serviceCategoryLabels" },
      { key: "subcategory", label: "Subcategory", optionSource: "serviceSubcategoryLabels" },
      { key: "contact", label: "Contact" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "area", label: "Area" },
      { key: "is_verified", label: "Verified", type: "boolean" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "meta.tags", label: "Search Tags" },
      { key: "meta.notes", label: "Admin Notes" },
    ],
  },
  auto_drivers: {
    key: "auto_drivers",
    title: "Auto Booking",
    description: "Approve driver profiles and manage availability, areas, call, WhatsApp, and share metadata.",
    sectionKey: "auto_drivers",
    approveField: "is_approved",
    availabilityField: "availability",
    columns: [
      { key: "name", label: "Name" },
      { key: "user_id", label: "User", optionSource: "users" },
      { key: "phone", label: "Phone" },
      { key: "vehicle_number", label: "Vehicle" },
      { key: "area", label: "Area" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "meta.notes", label: "Admin Notes" },
    ],
  },
  jobs: {
    key: "jobs",
    title: "Jobs Management",
    description: "Approve posts, link businesses, manage applications and sponsored job visibility.",
    sectionKey: "jobs",
    approveField: "is_approved",
    featuredField: "is_featured",
    columns: [
      { key: "title", label: "Title" },
      { key: "business_id", label: "Business", optionSource: "businesses" },
      { key: "salary", label: "Salary" },
      { key: "location", label: "Location" },
      { key: "contact", label: "Contact" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "application_link", label: "Apply Link" },
      { key: "meta.business_name", label: "Business Name Override" },
      { key: "meta.notes", label: "Admin Notes" },
    ],
  },
  categories: {
    key: "categories",
    title: "Dynamic Categories",
    description: "Create nested categories and subcategories with icons, colors, banners, ordering, and visibility.",
    sectionKey: "categories",
    activeField: "active",
    columns: [
      { key: "key", label: "Key" },
      { key: "label", label: "Label" },
      { key: "scope", label: "Scope", options: categoryScopes, type: "enum" },
      { key: "parent_key", label: "Parent Key", optionSource: "categoryKeys" },
      { key: "icon_url", label: "Icon", type: "image" },
      { key: "banner_url", label: "Banner", type: "image" },
      { key: "color", label: "Color" },
      { key: "sort_order", label: "Sort Order" },
      { key: "meta.subtitle", label: "Subtitle" },
      { key: "meta.keywords", label: "Keywords" },
    ],
  },
  ads: {
    key: "ads",
    title: "Advertisement Management",
    description: "Manage slider, inline, sponsored card, featured shop, and search-result ad placements.",
    sectionKey: "ads",
    activeField: "active",
    columns: [
      { key: "type", label: "Type", options: ["slider", "in_page", "popup", "sponsored_card", "featured_shop", "search_result"], type: "enum" },
      { key: "placement", label: "Placement", options: pagePlacements, type: "enum" },
      { key: "title", label: "Title" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "redirect_link", label: "Link" },
      { key: "category_key", label: "Category Target", optionSource: "categoryKeys" },
      { key: "subcategory_key", label: "Subcategory Target", optionSource: "categoryKeys" },
      { key: "priority", label: "Priority" },
      { key: "start_date", label: "Start", type: "date" },
      { key: "expiry_date", label: "End", type: "date" },
      { key: "meta.audience", label: "Audience Note" },
    ],
  },
  popup_ads: {
    key: "popup_ads",
    title: "Popup Ads",
    description: "Control popup creatives, CTAs, trigger rules, frequency, category targeting, and priority.",
    sectionKey: "ads",
    activeField: "active",
    columns: [
      { key: "title", label: "Title" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "cta_label", label: "CTA Label" },
      { key: "redirect_link", label: "Link" },
      { key: "trigger_type", label: "Trigger", options: ["app_open", "timed", "category", "campaign"], type: "enum" },
      { key: "frequency", label: "Frequency" },
      { key: "category_key", label: "Category Target", optionSource: "categoryKeys" },
      { key: "priority", label: "Priority" },
      { key: "start_at", label: "Start", type: "date" },
      { key: "end_at", label: "End", type: "date" },
    ],
  },
  sponsored_shops: {
    key: "sponsored_shops",
    title: "Sponsored Shops",
    description: "Approve sponsorships and control homepage, category, search, and offer placements.",
    sectionKey: "sponsored_shops",
    activeField: "active",
    columns: [
      { key: "business_id", label: "Business", optionSource: "businesses" },
      { key: "placement", label: "Placement", options: ["homepage", "category", "search", "offers", "carousel"], type: "enum" },
      { key: "category_key", label: "Category Target", optionSource: "categoryKeys" },
      { key: "priority", label: "Priority" },
      { key: "start_date", label: "Start", type: "date" },
      { key: "end_date", label: "End", type: "date" },
      { key: "meta.campaign_name", label: "Campaign Name" },
    ],
  },
  notifications: {
    key: "notifications",
    title: "Notifications",
    description: "Create broadcast, personalized, category-based, and automated FCM notifications with deep links.",
    sectionKey: "notifications",
    columns: [
      { key: "title", label: "Title" },
      { key: "message", label: "Message" },
      { key: "image", label: "Image", type: "image" },
      { key: "audience", label: "Audience", options: ["all", "businesses", "service_providers", "auto_drivers", "selected", "categories", "users"], type: "enum" },
      { key: "deep_link", label: "Deep Link" },
      { key: "target_meta.category_keys", label: "Target Category Keys" },
      { key: "target_meta.user_ids", label: "Target User IDs" },
    ],
  },
  updates: {
    key: "updates",
    title: "City Updates",
    description: "Publish card-based city notices, announcements, alerts, and community updates.",
    sectionKey: "updates",
    featuredField: "is_featured",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category", optionSource: "categoryLabels" },
      { key: "content", label: "Content" },
      { key: "image", label: "Image", type: "image" },
      { key: "scheduled_at", label: "Schedule", type: "date" },
      { key: "meta.priority_note", label: "Priority Note" },
    ],
  },
  news: {
    key: "news",
    title: "News Management",
    description: "Add, schedule, publish, and trend local news and announcements.",
    sectionKey: "news",
    activeField: "active",
    featuredField: "is_featured",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category", optionSource: "categoryLabels" },
      { key: "summary", label: "Summary" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "published_at", label: "Publish Date", type: "date" },
      { key: "is_trending", label: "Trending", type: "boolean" },
      { key: "meta.source", label: "Source" },
    ],
  },
  events: {
    key: "events",
    title: "Events Management",
    description: "Create event cards with banners, schedules, organizer details, and promotions.",
    sectionKey: "events",
    activeField: "active",
    featuredField: "is_featured",
    columns: [
      { key: "title", label: "Title" },
      { key: "organizer", label: "Organizer" },
      { key: "location", label: "Location" },
      { key: "banner_url", label: "Banner", type: "image" },
      { key: "event_date", label: "Event Date", type: "date" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "meta.organizer_phone", label: "Organizer Phone" },
    ],
  },
  offers: {
    key: "offers",
    title: "Offers Management",
    description: "Manage business offers, discount banners, sponsored promotions, and expiry dates.",
    sectionKey: "offers",
    activeField: "active",
    featuredField: "is_featured",
    columns: [
      { key: "business_id", label: "Business", optionSource: "businesses" },
      { key: "title", label: "Title" },
      { key: "discount_text", label: "Discount" },
      { key: "banner_url", label: "Banner", type: "image" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "start_date", label: "Start", type: "date" },
      { key: "end_date", label: "End", type: "date" },
      { key: "meta.terms", label: "Terms" },
    ],
  },
  properties: {
    key: "properties",
    title: "Properties Management",
    description: "Approve listings, manage pricing, images, location metadata, and featured placement.",
    sectionKey: "properties",
    approveField: "is_approved",
    featuredField: "is_featured",
    columns: [
      { key: "title", label: "Title" },
      { key: "user_id", label: "User", optionSource: "users" },
      { key: "property_type", label: "Type", options: ["residential", "commercial", "plot", "rental"], type: "enum" },
      { key: "price", label: "Price" },
      { key: "location", label: "Location" },
      { key: "contact", label: "Contact" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "meta.landmark", label: "Landmark" },
    ],
  },
  resale: {
    key: "resale",
    title: "Resale Management",
    description: "Approve resale items, remove spam, and manage sponsored resale placements.",
    sectionKey: "resale",
    approveField: "is_approved",
    featuredField: "is_featured",
    columns: [
      { key: "title", label: "Title" },
      { key: "user_id", label: "User", optionSource: "users" },
      { key: "category", label: "Category", optionSource: "categoryLabels" },
      { key: "price", label: "Price" },
      { key: "location", label: "Location" },
      { key: "contact", label: "Contact" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "is_sponsored", label: "Sponsored", type: "boolean" },
      { key: "meta.condition", label: "Condition" },
    ],
  },
  reviews: {
    key: "reviews",
    title: "Reviews & Ratings",
    description: "Moderate star ratings, written reviews, images, reports, replies, and verified reviewer state.",
    sectionKey: "reviews",
    activeField: "active",
    columns: [
      { key: "target_type", label: "Target", options: ["business", "service", "property", "resale", "auto"], type: "enum" },
      { key: "target_id", label: "Target ID" },
      { key: "rating", label: "Rating" },
      { key: "comment", label: "Review" },
      { key: "image_urls", label: "Image URLs" },
      { key: "business_reply", label: "Business Reply" },
      { key: "is_verified_reviewer", label: "Verified Reviewer", type: "boolean" },
      { key: "reported_count", label: "Reports" },
    ],
  },
  follows: {
    key: "follows",
    title: "Follow System",
    description: "Inspect follow relationships for businesses, services, creators, categories, and listings.",
    sectionKey: "follows",
    activeField: "active",
    columns: [
      { key: "user_id", label: "User", optionSource: "users" },
      { key: "target_type", label: "Target", options: ["business", "service", "creator", "category", "property"], type: "enum" },
      { key: "target_id", label: "Target ID" },
      { key: "notification_preferences.channels", label: "Notification Channels" },
    ],
  },
  analytics: {
    key: "analytics",
    title: "Analytics Events",
    description: "Track ad clicks, notification clicks, top searches, sponsorship performance, and module activity.",
    sectionKey: "analytics",
    columns: [
      { key: "event_name", label: "Event" },
      { key: "entity_type", label: "Entity Type" },
      { key: "entity_id", label: "Entity ID" },
      { key: "user_id", label: "User", optionSource: "users" },
      { key: "metadata.screen", label: "Screen" },
      { key: "metadata.source", label: "Source" },
    ],
  },
  call_sessions: {
    key: "call_sessions",
    title: "In-app Calls",
    description: "Track Manasa Upay call requests, ringing state, accepted calls, missed calls, and partner response.",
    sectionKey: "calls",
    columns: [
      { key: "target_type", label: "Target Type" },
      { key: "target_id", label: "Target ID" },
      { key: "target_name", label: "Target Name" },
      { key: "target_phone", label: "Phone" },
      { key: "status", label: "Status", options: ["calling", "ringing", "accepted", "missed", "ended", "declined"], type: "enum" },
      { key: "meta.notes", label: "Call Notes" },
    ],
  },
  chat_threads: {
    key: "chat_threads",
    title: "Chat Threads",
    description: "Inspect app chat threads between users and partners.",
    sectionKey: "chats",
    columns: [
      { key: "target_type", label: "Target Type" },
      { key: "target_id", label: "Target ID" },
      { key: "target_name", label: "Target Name" },
      { key: "target_phone", label: "Phone" },
      { key: "last_message", label: "Last Message" },
    ],
  },
  chat_messages: {
    key: "chat_messages",
    title: "Chat Messages",
    description: "Moderate individual messages from in-app chats.",
    sectionKey: "chats",
    columns: [
      { key: "thread_id", label: "Thread", optionSource: "chatThreads" },
      { key: "sender_type", label: "Sender", options: ["user", "partner", "admin"], type: "enum" },
      { key: "message", label: "Message" },
    ],
  },
  settings: {
    key: "settings",
    title: "Platform Settings",
    description: "Manage app-wide settings for branding, UI, ads, notifications, features, and security.",
    sectionKey: "settings",
    activeField: "active",
    columns: [
      { key: "key", label: "Key" },
      { key: "setting_type", label: "Value Type", options: ["string", "boolean", "number", "json", "url", "color"], type: "enum" },
      { key: "group_name", label: "Group", options: ["general", "app", "branding", "ads", "notifications", "businesses", "services", "security", "ui", "features"], type: "enum" },
      { key: "value", label: "Value" },
      { key: "description", label: "Description" },
      { key: "meta.help_text", label: "Help Text" },
    ],
  },
  products: {
    key: "products",
    title: "Product Catalog",
    description: "Manage products for businesses, categories, pricing, images, and active listings.",
    sectionKey: "businesses",
    activeField: "active",
    columns: [
      { key: "name", label: "Product Name" },
      { key: "business_id", label: "Business", optionSource: "businesses" },
      { key: "description", label: "Description" },
      { key: "price", label: "Price" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "meta.sku", label: "SKU" },
      { key: "meta.stock", label: "Stock" },
    ],
  },
};

export function isAdminTable(value: string): value is AdminTableKey {
  return value in ADMIN_TABLES;
}
