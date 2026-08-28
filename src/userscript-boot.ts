import { startFromWindow, type UserscriptWindow } from "@/src/userscript-entry.ts";

// The one cast in `src/`: a browser's `Window` states far more than the entry point asks of it.
startFromWindow(window as unknown as UserscriptWindow);
