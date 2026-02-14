import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("up", "routes/up.tsx"),
] satisfies RouteConfig;
