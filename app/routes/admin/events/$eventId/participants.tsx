import { Outlet } from "react-router";

export const handle = { breadcrumb: "Participants" };

export default function ParticipantsLayout() {
  return <Outlet />;
}
