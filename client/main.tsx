import { createRoot } from "react-dom/client";
import { RootApp } from "./App";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<RootApp />);
}
