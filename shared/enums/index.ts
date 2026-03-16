// Database Enums
export const GroupStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  DELETION_PENDING: "deletion_pending",
  DELETED: "deleted",
} as const;

export const GroupRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export const ContentStatus = {
  DRAFT: "draft", // Stands for status that means that content is in process of creation!
  PUBLISHED: "published",
  ARCHIVED: "archived",
  PRIVATE: "private",
  DELETION_PENDING: "deletion_pending",
  DELETED: "deleted",
} as const;

export const PadPlayMode = {
  TAP: "tap",
  HOLD: "hold",
  TOGGLE: "toggle",
  CYCLE: "cycle",
} as const;

export const UserStatus = {
  ACTIVE: "active",
  ANONIMIZATION_PENDING: "anonimization_pending",
  ANONIMIZED: "anonimized",
  FULL_DELETION_PENDING: "full_deletion_pending",
} as const;

export const UserPermissions = {
  CREATE_KIT: "create_kit",
  DELETE_KIT: "delete_kit",
  PUBLISH_KIT: "publish_kit",
  CREATE_GROUP: "create_group",
  MANAGE_USERS: "manage_users",
  UPLOAD_SAMPLES: "upload_samples",
} as const;

// Type exports
export type GroupStatusType = (typeof GroupStatus)[keyof typeof GroupStatus];
export type GroupRoleType = (typeof GroupRole)[keyof typeof GroupRole];
export type ContentStatusType = (typeof ContentStatus)[keyof typeof ContentStatus];
export type PadPlayModeType = (typeof PadPlayMode)[keyof typeof PadPlayMode];
export type UserPermissionType = (typeof UserPermissions)[keyof typeof UserPermissions];
export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

// Enum arrays for Drizzle
export const GROUP_STATUS_VALUES = Object.values(GroupStatus) as [string, ...string[]];
export const GROUP_ROLE_VALUES = Object.values(GroupRole) as [string, ...string[]];
export const CONTENT_STATUS_VALUES = Object.values(ContentStatus) as [string, ...string[]];
export const PAD_PLAY_MODE_VALUES = Object.values(PadPlayMode) as [string, ...string[]];
export const USER_STATUS_VALUES = Object.values(UserStatus) as [string, ...string[]];

// Helper functions for permissions
export const hasPermission = (
  userRights: Record<string, boolean>,
  permission: UserPermissionType,
): boolean => {
  return userRights[permission] === true;
};

export const grantPermission = (
  userRights: Record<string, boolean>,
  permission: UserPermissionType,
): Record<string, boolean> => {
  return { ...userRights, [permission]: true };
};

export const revokePermission = (
  userRights: Record<string, boolean>,
  permission: UserPermissionType,
): Record<string, boolean> => {
  return { ...userRights, [permission]: false };
};
