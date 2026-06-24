import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { LanguageProvider } from "./components/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}