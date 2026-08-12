import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Discover } from "./pages/Discover";
import { NotFound } from "./pages/NotFound";
import { RoomPage } from "./pages/RoomPage";
import { AdminPanel } from "./pages/AdminPanel";
import { OwnerPanel } from "./pages/OwnerPanel";
import { CalendarPanel } from "./pages/CalendarPanel";
import { ClientPanel } from "./pages/ClientPanel";

export const router = createBrowserRouter([
  {
    path: "/admin",
    Component: AdminPanel,
  },
  {
    path: "/owner",
    Component: OwnerPanel,
  },
  {
    path: "/calendario",
    Component: CalendarPanel,
  },
  {
    path: "/panel",
    Component: ClientPanel,
  },
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