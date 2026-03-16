import { createResourceUrl } from "@/constants";

import { redirect, useRouteLoaderData } from "react-router";

import { Avatar } from "#/components/ui/avatar";
import { Icon } from "#/components/ui/icon";

import { type loader as rootLoader } from "../../root";

// ──────────────────────────────────────────────────────────────

/** Profile page showing user information */
export default function Index() {
  const loaderData = useRouteLoaderData<typeof rootLoader>("root");

  if (!loaderData?.user) {
    throw redirect("/login");
  }

  const { user } = loaderData;

  return (
    <div className="profile__content-profile">
      <div className="profile__content-profile-info">
        <Avatar src={createResourceUrl("avatar", user.user_avatar_source)} size="xl" bordered />
        <h4 className="profile__content-profile-info-name">{user.user_name}</h4>
      </div>
      <div className="profile__content-profile-stats">
        <div className="profile__content-profile-stats-item">
          <Icon.Eye />
          <strong>0 Followers</strong>
        </div>
      </div>
    </div>
  );
}
