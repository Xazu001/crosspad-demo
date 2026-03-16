// ──────────────────────────────────────────────────────────────

/** Get avatar URL with fallback to default */
export function getAvatarUrl(avatarSource: string | null) {
  return avatarSource ? avatarSource : "/assets/default-avatar.png";
}
