import React from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.min.css";
import "./main.css";
import { App } from "./ui/App";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
