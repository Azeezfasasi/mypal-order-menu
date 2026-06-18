#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Service Worker Build Version Updater
 * Updates the BUILD_VERSION placeholder in the service worker with the actual build version
 */

const fs = require("fs");
const path = require("path");

function updateServiceWorkerVersion() {
  const buildVersion = process.env.BUILD_VERSION || "dev";
  const swPath = path.join(process.cwd(), "public", "sw.js");

  try {
    // Read the service worker file
    let swContent = fs.readFileSync(swPath, "utf8");

    // Replace the build version placeholder
    swContent = swContent.replace(/__BUILD_VERSION__/g, buildVersion);

    // Write the updated content back
    fs.writeFileSync(swPath, swContent);

    console.log(
      `✅ Service worker updated with build version: ${buildVersion}`,
    );
  } catch (error) {
    console.error("❌ Failed to update service worker version:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateServiceWorkerVersion();
}

module.exports = { updateServiceWorkerVersion };
