// scripts/check-version.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function getCurrentVersion() {
  console.log("📋 MyPal Business Admin - Version Information\n");

  const info = {
    buildVersion: process.env.BUILD_VERSION || "Not set",
    buildTime: process.env.BUILD_TIME || "Not set",
    nodeEnv: process.env.NODE_ENV || "development",
    buildEnv: process.env.BUILD_ENV || "Not set",
  };

  // Try to get version from file
  const versionPath = path.join(process.cwd(), ".next", "version.json");
  if (fs.existsSync(versionPath)) {
    try {
      const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
      info.fileVersion = versionData.version;
      info.fileBuildTime = versionData.buildTime;
      info.fileBuildEnv = versionData.buildEnv;
    } catch (error) {
      info.fileError = error.message;
    }
  }

  // Get git information
  try {
    info.gitHash = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    info.gitShortHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
    info.gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();

    // Check if working directory is clean
    try {
      execSync("git diff --quiet", { stdio: "pipe" });
      info.gitStatus = "clean";
    } catch {
      info.gitStatus = "dirty (uncommitted changes)";
    }

    // Get last commit info
    info.lastCommit = execSync(
      'git log -1 --pretty=format:"%h - %s (%cr) <%an>"',
      { encoding: "utf8" }
    ).trim();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    info.gitError = "Git not available or not a git repository";
  }

  // Get package.json version
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    info.packageVersion = packageData.version || "Not specified";
    info.packageName = packageData.name || "Unknown";
  } catch (error) {
    info.packageError = error.message;
  }

  return info;
}

function displayVersionInfo(info) {
  console.log("🏷️  VERSION INFORMATION");
  console.log("=".repeat(50));

  // Package info
  console.log(`📦 Package: ${info.packageName} v${info.packageVersion}`);

  // Environment info
  console.log(`🌍 Environment: ${info.nodeEnv}`);
  console.log(`🔧 Build Environment: ${info.buildEnv}`);

  // Current build version
  console.log("\n📋 CURRENT BUILD:");
  console.log(`   Version: ${info.buildVersion}`);
  console.log(`   Build Time: ${info.buildTime}`);

  // File-based version (from last build)
  if (info.fileVersion) {
    console.log("\n📁 LAST BUILD (from file):");
    console.log(`   Version: ${info.fileVersion}`);
    console.log(`   Build Time: ${info.fileBuildTime}`);
    console.log(`   Environment: ${info.fileBuildEnv}`);

    // Compare versions
    if (
      info.buildVersion !== "Not set" &&
      info.buildVersion !== info.fileVersion
    ) {
      console.log("   ⚠️  Version mismatch detected!");
    }
  } else if (info.fileError) {
    console.log(`\n❌ Build file error: ${info.fileError}`);
  } else {
    console.log('\n⚠️  No build file found - run "npm run build" first');
  }

  // Git information
  if (info.gitHash) {
    console.log("\n🔀 GIT INFORMATION:");
    console.log(`   Branch: ${info.gitBranch}`);
    console.log(
      `   Commit: ${info.gitShortHash} (${info.gitHash.substring(0, 12)}...)`
    );
    console.log(`   Status: ${info.gitStatus}`);
    console.log(`   Last Commit: ${info.lastCommit}`);
  } else {
    console.log(`\n❌ Git error: ${info.gitError}`);
  }

  console.log("\n=".repeat(50));
}

function checkServiceWorkerVersion() {
  console.log("\n🔧 SERVICE WORKER VERSION CHECK");
  console.log("-".repeat(30));

  const swPath = path.join(process.cwd(), "public", "sw.js");

  if (!fs.existsSync(swPath)) {
    console.log("❌ Service worker not found at public/sw.js");
    return;
  }

  try {
    const swContent = fs.readFileSync(swPath, "utf8");

    // Look for version references
    const versionMatches = swContent.match(
      /__BUILD_VERSION__|\$\{BUILD_VERSION\}|BUILD_VERSION\s*=/g
    );
    const buildTimeMatches = swContent.match(
      /__BUILD_TIME__|\$\{BUILD_TIME\}|BUILD_TIME\s*=/g
    );

    console.log(`📁 Service Worker: ${path.basename(swPath)}`);
    console.log(`📏 File Size: ${Math.round(swContent.length / 1024)}KB`);
    console.log(
      `🏷️  Version Variables: ${
        versionMatches ? versionMatches.length : 0
      } found`
    );
    console.log(
      `⏰ Build Time Variables: ${
        buildTimeMatches ? buildTimeMatches.length : 0
      } found`
    );

    // Check for cache names
    const cacheMatches = swContent.match(
      /CACHE_NAME|STATIC_CACHE|RUNTIME_CACHE/g
    );
    console.log(
      `💾 Cache Variables: ${cacheMatches ? cacheMatches.length : 0} found`
    );

    if (!versionMatches) {
      console.log("⚠️  Warning: No version variables found in service worker");
    }
  } catch (error) {
    console.log(`❌ Error reading service worker: ${error.message}`);
  }
}

function suggestActions(info) {
  console.log("\n💡 SUGGESTED ACTIONS:");
  console.log("-".repeat(20));

  const suggestions = [];

  if (info.buildVersion === "Not set") {
    suggestions.push("🔧 Set BUILD_VERSION environment variable");
  }

  if (info.gitStatus && info.gitStatus.includes("dirty")) {
    suggestions.push("📝 Commit your changes for clean versioning");
  }

  if (!info.fileVersion) {
    suggestions.push('🏗️  Run "npm run build" to generate version file');
  }

  if (
    info.buildVersion !== "Not set" &&
    info.fileVersion &&
    info.buildVersion !== info.fileVersion
  ) {
    suggestions.push("🔄 Rebuild to sync versions");
  }

  if (suggestions.length === 0) {
    console.log(
      "✅ Everything looks good! Your versioning is properly configured."
    );
  } else {
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }
}

function main() {
  const args = process.argv.slice(2);
  const detailed = args.includes("--detailed") || args.includes("-d");

  const info = getCurrentVersion();
  displayVersionInfo(info);

  if (detailed) {
    checkServiceWorkerVersion();
  }

  suggestActions(info);

  console.log("\n📚 Commands:");
  console.log("   npm run version:check --detailed  # Detailed version info");
  console.log("   npm run version:generate          # Generate new version");
  console.log("   npm run build                     # Build with version");
  console.log("   npm run sw:validate               # Validate service worker");
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  displayVersionInfo,
  checkServiceWorkerVersion,
};
