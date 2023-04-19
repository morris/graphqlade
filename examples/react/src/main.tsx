import { createRoot } from "react-dom/client";
import { Root } from "./components/Root";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(<Root />);
