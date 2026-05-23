export type AdminTableKey =
  | "businesses"
  | "services"
  | "auto_drivers"
  | "jobs"
  | "updates"
  | "ads"
  | "users"
  | "notifications";

export type AdminTableConfig = {
  key: AdminTableKey;
  title: string;
  description: string;
  sectionKey: string;
  approveField?: "is_approved";
  featuredField?: "is_featured";
  activeField?: "active";
  availabilityField?: "availability";
  // columns can include optional predefined options to render selects in the UI
  columns: { key: string; label: string; options?: string[] }[];
};

export const ADMIN_TABLES: Record<AdminTableKey, AdminTableConfig> = {
  businesses: {
    key: "businesses",
    title: "Business Management",
    description: "Approve businesses, edit listings, manage featured shops.",
    sectionKey: "businesses",
    approveField: "is_approved",
    featuredField: "is_featured",
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category", options: ["Grocery", "Food", "Retail", "Health", "Services"] },
      { key: "phone", label: "Phone" },
    ],
  },
  services: {
    key: "services",
    title: "Services Management",
    description: "Approve service providers and manage listings.",
    sectionKey: "services",
    approveField: "is_approved",
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category", options: ["Home Services", "Health", "Education", "Transport", "Professional"] },
      { key: "contact", label: "Contact" },
    ],
  },
  auto_drivers: {
    key: "auto_drivers",
    title: "Auto Drivers",
    description: "Approve drivers and manage availability.",
    sectionKey: "auto_drivers",
    approveField: "is_approved",
    availabilityField: "availability",
    columns: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "vehicle_number", label: "Vehicle" },
    ],
  },
  jobs: {
    key: "jobs",
    title: "Jobs Management",
    description: "Approve and manage job posts.",
    sectionKey: "jobs",
    approveField: "is_approved",
    columns: [
      { key: "title", label: "Title" },
      { key: "salary", label: "Salary" },
      { key: "location", label: "Location", options: ["City Center", "Suburb", "Remote"] },
    ],
  },
  updates: {
    key: "updates",
    title: "City Updates",
    description: "Publish notices and local updates.",
    sectionKey: "updates",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category", options: ["Alert", "Event", "Info"] },
      { key: "content", label: "Content" },
    ],
  },
  ads: {
    key: "ads",
    title: "Advertisement Management",
    description: "Banners, in-page and popup ads.",
    sectionKey: "ads",
    activeField: "active",
    columns: [
      { key: "type", label: "Type", options: ["slider", "in_page", "popup"] },
      { key: "image_url", label: "Image URL" },
      { key: "redirect_link", label: "Link" },
    ],
  },
  users: {
    key: "users",
    title: "User Management",
    description: "View users and roles.",
    sectionKey: "users",
    columns: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role", options: ["user", "admin", "moderator"] },
    ],
  },
  notifications: {
    key: "notifications",
    title: "Notifications Log",
    description: "Sent notifications history.",
    sectionKey: "notifications",
    columns: [
      { key: "title", label: "Title" },
      { key: "audience", label: "Audience" },
      { key: "deep_link", label: "Deep link" },
    ],
  },
};

export function isAdminTable(value: string): value is AdminTableKey {
  return value in ADMIN_TABLES;
}
