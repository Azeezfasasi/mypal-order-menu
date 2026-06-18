import { Button } from "@/components/ui/button";
import { Info, RefreshCw, X } from "lucide-react";
import React from "react";
import { useAppVersion } from "../hooks/useAppVersion"; // Adjust path as needed

export default function AppUpdateNotification() {
  const {
    isUpdateAvailable,
    refreshApp,
    isRefreshing,
    getVersionInfo,
    isServiceWorkerSupported,
  } = useAppVersion();

  const [showNotification, setShowNotification] = React.useState(false);
  const [showVersionInfo, setShowVersionInfo] = React.useState(false);

  React.useEffect(() => {
    if (isUpdateAvailable) {
      setShowNotification(true);
    }
  }, [isUpdateAvailable]);

  const handleRefresh = async () => {
    await refreshApp();
  };

  const handleDismiss = () => {
    setShowNotification(false);
    // Show again after 30 minutes
    setTimeout(() => {
      if (isUpdateAvailable) {
        setShowNotification(true);
      }
    }, 30 * 60 * 1000);
  };

  const versionInfo = getVersionInfo();

  if (!isServiceWorkerSupported) {
    return null;
  }

  return (
    <>
      {/* Update Available Notification */}
      {showNotification && isUpdateAvailable && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-white border border-orange-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Update Available
                </h3>
                <p className="text-sm text-gray-600">
                  A new version is ready to install
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              Later
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Now"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Version Info Toggle (Development/Debug) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersionInfo(!showVersionInfo)}
            className="bg-white/90 backdrop-blur-sm"
          >
            <Info className="w-4 h-4 mr-1" />v
            {versionInfo.version.substring(0, 8)}
          </Button>

          {showVersionInfo && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-3 min-w-64 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Version:</span>{" "}
                  {versionInfo.version}
                </div>
                <div>
                  <span className="font-medium">Built:</span>{" "}
                  {versionInfo.buildDate}
                </div>
                <div>
                  <span className="font-medium">Age:</span>{" "}
                  {versionInfo.ageInHours}h ago
                </div>
                <div>
                  <span className="font-medium">SW Support:</span>{" "}
                  {versionInfo.isServiceWorkerSupported ? "✅" : "❌"}
                </div>
                <div>
                  <span className="font-medium">Update Available:</span>{" "}
                  {versionInfo.isUpdateAvailable ? "🔄" : "✅"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
