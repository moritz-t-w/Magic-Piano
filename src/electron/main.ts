// src/electron/main.ts
import * as url from "url";
import { app, BrowserWindow } from "electron";

app.whenReady().then(() => {
	const win = new BrowserWindow({
		title: "Main window",
		fullscreen: true,
	});

	// You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else {
		// Load your file
		win.loadFile("dist/index.html");
	}
});
