/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/generate-version.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function generateVersion() {
  const buildEnv = process.env.BUILD_ENV || "development";
  const timestamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace(/[-:]/g, "")
    .replace("T", "-");

  let version;

  try {
    // Try to get git information
    const gitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
    const isDirty =
      execSync("git diff --quiet", { encoding: "utf8" }).length > 0;

    // Create version based on environment
    switch (buildEnv) {
      case "production":
        version = `${gitHash}`;
        break;
      case "staging":
        version = `${gitHash}-staging-${timestamp}`;
        break;
      default:
        version = `${gitHash}-dev-${timestamp}${isDirty ? "-dirty" : ""}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.warn("Git not available, using timestamp-based version");
    version = `${buildEnv}-${timestamp}`;
  }

  const versionInfo = {
    version,
    buildTime: new Date().toISOString(),
    buildEnv,
    timestamp: Date.now(),
  };

  // Write version info to file
  const versionPath = path.join(process.cwd(), ".next", "version.json");

  // Ensure .next directory exists
  const nextDir = path.dirname(versionPath);
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
  }

  fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

  // Set environment variable for the build process
  process.env.BUILD_VERSION = version;
  process.env.BUILD_TIME = versionInfo.buildTime;

  console.log(`🚀 Generated version: ${version}`);
  console.log(`📅 Build time: ${versionInfo.buildTime}`);
  console.log(`🏷️  Environment: ${buildEnv}`);

  return versionInfo;
}

// Run if called directly
if (require.main === module) {
  generateVersion();
}

module.exports = { generateVersion };
