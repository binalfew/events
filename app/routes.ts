import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("up", "routes/up.tsx"),
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  route("dashboard", "routes/_dashboard.tsx", [index("routes/_dashboard._index.tsx")]),
] satisfies RouteConfig;
