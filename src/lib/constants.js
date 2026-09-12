export const ROLES = ["Admin", "Editor", "Viewer"];

export const initialMembers = [
  { id: 1, name: "Priya Nair", email: "priya@company.com", department: "Operations", role: "Admin", status: "Active" },
  { id: 2, name: "Marcus Webb", email: "marcus@company.com", department: "Engineering", role: "Editor", status: "Active" },
  { id: 3, name: "Elena Torres", email: "elena@company.com", department: "Design", role: "Editor", status: "Active" },
  { id: 4, name: "Jordan Lee", email: "jordan@company.com", department: "Support", role: "Viewer", status: "Active" },
  { id: 5, name: "Casey Kim", email: "casey@company.com", department: "Engineering", role: "Viewer", status: "Invited" },
  { id: 6, name: "Nadia Farouk", email: "nadia@company.com", department: "Marketing", role: "Editor", status: "Active" },
];

// Seed credentials for the two starter accounts, so the roster is usable
// on first load. Real accounts created via "Create account" are added
// to this same list and persisted the same way.
export const initialCredentials = [
  { email: "priya@company.com", password: "demo123", memberId: 1 },
  { email: "jordan@company.com", password: "demo123", memberId: 4 },
];

export const MEMBERS_KEY = "team-roster:members";
export const CREDENTIALS_KEY = "team-roster:credentials";
export const THEME_KEY = "team-roster:theme";
export const SESSION_KEY = "team-roster:session";

export const TOAST_DURATION = 4200;

export function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function emptyDraft() {
  return { name: "", email: "", department: "", role: "Viewer", status: "Active" };
}
