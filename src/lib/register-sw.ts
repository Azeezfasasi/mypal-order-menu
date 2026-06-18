// Registers the service worker for PWA support
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log(
          "Service Worker registered successfully:",
          registration.scope
        );

        // Update service worker when new version is available
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker is available, prompt user to refresh
                if (confirm("New version available! Click OK to refresh.")) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    });
  }
}
