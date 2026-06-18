"use client";

import {
  debugFirebaseConfig,
  resetFcmTokenPromise,
  safeRequestNotificationPermission,
} from "@/config/firebase";
import { testPushServiceConnectivity } from "@/lib/utils/push-diagnostics";
import { useState } from "react";

export function PushDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<{
    success: boolean;
    details: string[];
    recommendations: string[];
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tokenResult, setTokenResult] = useState<{
    token: string | null;
    error?: Error;
    userGuidance?: {
      title: string;
      message: string;
      steps: string[];
      canRetry: boolean;
    };
  } | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.log("🔍 Running push service diagnostics...");
      debugFirebaseConfig();

      const result = await testPushServiceConnectivity();
      setDiagnostics(result);

      console.log("📊 Diagnostic Results:", result);
    } catch (error) {
      console.error("Diagnostics failed:", error);
      setDiagnostics({
        success: false,
        details: [`Error running diagnostics: ${(error as Error).message}`],
        recommendations: ["Check browser console for more details"],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testTokenGeneration = async () => {
    setIsRunning(true);
    setTokenResult(null);

    try {
      console.log("🔑 Testing FCM token generation...");
      resetFcmTokenPromise(); // Clear cache

      const result = await safeRequestNotificationPermission();
      setTokenResult(result);

      console.log("🔑 Token Result:", result);
    } catch (error) {
      console.error("Token test failed:", error);
      setTokenResult({
        token: null,
        error: error as Error,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        🔍 Push Notification Diagnostics
      </h3>

      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run Diagnostics"}
          </button>

          <button
            onClick={testTokenGeneration}
            disabled={isRunning}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isRunning ? "Testing..." : "Test FCM Token"}
          </button>
        </div>

        {diagnostics && (
          <div className="border rounded p-4">
            <h4 className="font-semibold mb-2">
              Diagnostic Results:{" "}
              {diagnostics.success ? "✅ Healthy" : "❌ Issues Found"}
            </h4>

            <div className="mb-3">
              <h5 className="font-medium mb-1">Details:</h5>
              <ul className="text-sm space-y-1">
                {diagnostics.details.map((detail, i) => (
                  <li
                    key={i}
                    className="font-mono text-xs bg-gray-100 p-1 rounded"
                  >
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            {diagnostics.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium mb-1">Recommendations:</h5>
                <ul className="text-sm space-y-1">
                  {diagnostics.recommendations.map((rec, i) => (
                    <li key={i} className="text-orange-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tokenResult && (
          <div className="border rounded p-4">
            <h4 className="font-semibold mb-2">
              FCM Token Test: {tokenResult.token ? "✅ Success" : "❌ Failed"}
            </h4>

            {tokenResult.token && (
              <div className="mb-2">
                <span className="text-sm font-mono bg-green-100 p-1 rounded">
                  Token: {tokenResult.token.substring(0, 30)}...
                </span>
              </div>
            )}

            {tokenResult.error && (
              <div className="mb-2">
                <span className="text-sm font-mono bg-red-100 p-1 rounded text-red-700">
                  Error: {tokenResult.error.message}
                </span>
              </div>
            )}

            {tokenResult.userGuidance && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                <h5 className="font-medium text-yellow-800">
                  {tokenResult.userGuidance.title}
                </h5>
                <p className="text-sm text-yellow-700 mt-1">
                  {tokenResult.userGuidance.message}
                </p>
                <ol className="text-sm text-yellow-700 mt-2 space-y-1">
                  {tokenResult.userGuidance.steps.map(
                    (step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ),
                  )}
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-2">
          💡 Open your browser&apos;s developer console (F12) to see detailed
          logs while running these tests.
        </div>
      </div>
    </div>
  );
}
