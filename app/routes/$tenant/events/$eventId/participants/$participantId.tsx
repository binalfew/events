import { Outlet } from "react-router";

export const handle = { breadcrumb: "Participant" };

export default function ParticipantLayout() {
  return <Outlet />;
}
