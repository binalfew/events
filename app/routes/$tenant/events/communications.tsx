import { Outlet } from "react-router";

export const handle = { breadcrumb: "Communications" };

export default function CommunicationsLayout() {
  return <Outlet />;
}
