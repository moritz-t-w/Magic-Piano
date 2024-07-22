// src/electron/main.ts
import * as url from "url";
import { app, BrowserWindow } from "electron";

app.whenReady().then(() => {
	const win = new BrowserWindow({
		title: "Main window",
		fullscreen: true,
		width: 1920,
		height: 1080,
	});

	// You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		// win.webContents.openDevTools();
	} else {
		console.log("No VITE_DEV_SERVER_URL found");
		win.loadURL('http://localhost:8080');
	}
});
