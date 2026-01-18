// PWA Utilities for Fizzy Timer
// Manual service worker registration since vite-plugin-pwa doesn't work well with TanStack Start SSR

// Types for PWA install prompt
export interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installPromptHandler: ((prompt: BeforeInstallPromptEvent) => void) | null =
	null;
let swRegistration: ServiceWorkerRegistration | null = null;
const updateAvailableHandler:
	| ((registration: ServiceWorkerRegistration) => void)
	| null = null;
let isUpdateWaiting = false;

// Register SW manually with update handling
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/pwa-worker.js", {
			type: "classic",
		})
		.then((registration) => {
			console.log("Service Worker registered:", registration);
			swRegistration = registration;

			// Check for updates every hour
			setInterval(
				() => {
					registration.update();
				},
				60 * 60 * 1000,
			);

			// Listen for service worker updates
			registration.addEventListener("updatefound", () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// New SW is installed and waiting to activate
							console.log("New service worker available, waiting to activate");
							isUpdateWaiting = true;

							// Notify app that update is available
							if (updateAvailableHandler) {
								updateAvailableHandler(registration);
							}
						}
					});
				}
			});
		})
		.catch((error) => {
			console.error("Service Worker registration failed:", error);
		});

	// Listen for controlling service worker changes (when skipWaiting is called)
	// NOTE: Disabled automatic reload to prevent infinite loop
	// navigator.serviceWorker.addEventListener('controllerchange', () => {
	//   console.log('Controller changed, reloading page...');
	//   // Reload the page to use the new service worker
	//   window.location.reload();
	// });
}

/**
 * Setup PWA Install Prompt
 * Call this once in your app root to listen for beforeinstallprompt event
 */
export function setupInstallPrompt(
	onInstallAvailable: (prompt: BeforeInstallPromptEvent) => void,
) {
	installPromptHandler = onInstallAvailable;

	// Listen for the beforeinstallprompt event
	window.addEventListener("beforeinstallprompt", (e) => {
		// Prevent the mini-infobar from appearing on mobile
		e.preventDefault();

		// Store the event for later use
		deferredPrompt = e as BeforeInstallPromptEvent;

		// Notify the app that install is available
		if (installPromptHandler) {
			installPromptHandler(deferredPrompt);
		}

		console.log("PWA install prompt event captured");
	});

	// Listen for app installed event
	window.addEventListener("appinstalled", () => {
		// Clear the deferredPrompt
		deferredPrompt = null;
		console.log("PWA installed successfully");
	});
}

/**
 * Check if PWA can be installed
 */
export function canInstallPWA(): boolean {
	return deferredPrompt !== null;
}

/**
 * Prompt the user to install the PWA
 */
export async function promptInstall(): Promise<boolean> {
	if (!deferredPrompt) {
		console.log("No install prompt available");
		return false;
	}

	// Show the install prompt
	deferredPrompt.prompt();

	// Wait for the user to respond to the prompt
	const { outcome } = await deferredPrompt.userChoice;

	console.log(`User response to install prompt: ${outcome}`);

	// Clear the deferredPrompt since it can only be used once
	deferredPrompt = null;

	return outcome === "accepted";
}

/**
 * Check if the app is running as PWA (installed)
 */
export function isPWAInstalled(): boolean {
	if (typeof window === "undefined") return false;
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		(window.navigator as any).standalone === true ||
		document.referrer.includes("android-app://")
	);
}

/**
 * Check if running on iOS (needs manual install instructions)
 */
export function isIOS(): boolean {
	return (
		[
			"iPad Simulator",
			"iPhone Simulator",
			"iPod Simulator",
			"iPad",
			"iPhone",
			"iPod",
		].includes(navigator.platform) ||
		(navigator.userAgent.includes("Mac") && "ontouchend" in document)
	);
}

/**
 * Check if iOS PWA is already installed
 */
export function isIOSPWAInstalled(): boolean {
	return (
		"standalone" in window.navigator &&
		(window.navigator as any).standalone === true
	);
}
