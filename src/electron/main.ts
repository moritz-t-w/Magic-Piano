// src/electron/main.ts
import * as url from "url";
import { app, BrowserWindow } from "electron";

app.whenReady().then(async () => {
	const win = new BrowserWindow({
		title: "Main window",
		fullscreen: true,
		width: 1920,
		height: 1080,
	});

	win.webContents.setAudioMuted(true);

	// You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		// win.webContents.openDevTools();
	} else {
		console.log("No VITE_DEV_SERVER_URL found");
		let loaded = false;
		while (!loaded) {
			console.log("Trying to load http://localhost:8000");
			try {
				await win.loadURL('http://localhost:8000');
				loaded = true;
				console.log("Loaded");
			} catch (error) {
				console.error(error);
				console.log("Retrying...");
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}
	}
});
