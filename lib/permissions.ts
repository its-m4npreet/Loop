export type Role = "ADMIN" | "ANALYST" | "VIEWER"

export type Permission =
  | "dashboard:view"
  | "feedback:import"
  | "feedback:manual"
  | "feedback:review"
  | "ask_loop:use"
  | "reports:generate"
  | "reports:view"
  | "team:manage"
  | "settings:manage"

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "feedback:import",
    "feedback:manual",
    "feedback:review",
    "ask_loop:use",
    "reports:generate",
    "reports:view",
    "team:manage",
    "settings:manage",
  ],
  ANALYST: [
    "dashboard:view",
    "feedback:import",
    "feedback:manual",
    "feedback:review",
    "ask_loop:use",
    "reports:generate",
    "reports:view",
  ],
  VIEWER: [
    "dashboard:view",
    "ask_loop:use",
    "reports:view",
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? []
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  ANALYST: "Analyst",
  VIEWER: "Viewer",
}

export const ROLE_EMOJIS: Record<Role, string> = {
  ADMIN: "\u{1F451}",
  ANALYST: "\u{1F4CA}",
  VIEWER: "\u{1F440}",
}

export const ALL_ROLES: Role[] = ["ADMIN", "ANALYST", "VIEWER"]
