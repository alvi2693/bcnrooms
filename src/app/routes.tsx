import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Discover } from "./pages/Discover";
import { NotFound } from "./pages/NotFound";
import { RoomPage } from "./pages/RoomPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "descubre", Component: Discover },
      { path: "habitacion/:slug", Component: RoomPage },
      { path: "*", Component: NotFound },
    ],
  },
]);