// scripts/validate-sw.js
import fs from "fs";
import path from "path";

function validateServiceWorker() {
  console.log("🔍 Validating Service Worker...\n");

  const swPath = path.join(process.cwd(), "public", "sw.js");
  const errors = [];
  const warnings = [];
  let score = 100;

  try {
    // Check if service worker file exists
    if (!fs.existsSync(swPath)) {
      errors.push("❌ Service worker file not found at public/sw.js");
      return { errors, warnings, score: 0 };
    }

    const swContent = fs.readFileSync(swPath, "utf8");

    // Essential checks
    const checks = [
      {
        name: "Build Version Variable",
        test: /BUILD_VERSION|__BUILD_VERSION__/,
        critical: true,
        points: 20,
        message:
          "Service worker should include build version for cache management",
      },
      {
        name: "Install Event",
        test: /addEventListener\(['"`]install['"`]/,
        critical: true,
        points: 15,
        message: "Install event listener is required",
      },
      {
        name: "Activate Event",
        test: /addEventListener\(['"`]activate['"`]/,
        critical: true,
        points: 15,
        message: "Activate event listener is required",
      },
      {
        name: "Fetch Event",
        test: /addEventListener\(['"`]fetch['"`]/,
        critical: true,
        points: 15,
        message: "Fetch event listener is required for caching",
      },
      {
        name: "Cache Management",
        test: /caches\.(open|match|delete)/,
        critical: true,
        points: 15,
        message: "Cache API usage is required",
      },
      {
        name: "Skip Waiting",
        test: /skipWaiting\(\)/,
        critical: false,
        points: 10,
        message: "skipWaiting() helps with immediate updates",
      },
      {
        name: "Client Claim",
        test: /clients\.claim\(\)/,
        critical: false,
        points: 5,
        message: "clients.claim() helps take control immediately",
      },
      {
        name: "Error Handling",
        test: /catch\s*\(/,
        critical: false,
        points: 5,
        message: "Error handling improves reliability",
      },
    ];

    // Run checks
    checks.forEach((check) => {
      const passed = check.test.test(swContent);

      if (!passed) {
        const message = `${check.critical ? "❌" : "⚠️"} ${check.name}: ${
          check.message
        }`;

        if (check.critical) {
          errors.push(message);
          score -= check.points;
        } else {
          warnings.push(message);
          score -= check.points;
        }
      } else {
        console.log(`✅ ${check.name}: Passed`);
      }
    });

    // Additional checks

    // Check for console.log in production builds
    if (
      swContent.includes("console.log") &&
      process.env.NODE_ENV === "production"
    ) {
      warnings.push("⚠️ Console logs found - consider removing for production");
      score -= 2;
    }

    // Check cache naming convention
    if (
      !swContent.includes("CACHE_PREFIX") &&
      !swContent.includes("CACHE_NAME")
    ) {
      warnings.push("⚠️ No cache naming convention found");
      score -= 3;
    }

    // Check for API request handling
    if (!swContent.includes("/api/") && !swContent.includes("api.mypal")) {
      warnings.push("⚠️ No API request filtering found");
      score -= 3;
    }

    // Check file size
    const fileSizeKB = Math.round(swContent.length / 1024);
    if (fileSizeKB > 50) {
      warnings.push(
        `⚠️ Service worker is quite large (${fileSizeKB}KB) - consider optimizing`,
      );
      score -= 2;
    } else {
      console.log(`✅ File size: ${fileSizeKB}KB (reasonable)`);
    }

    // Check for push notifications
    if (swContent.includes('addEventListener("push"')) {
      console.log("✅ Push notifications: Implemented");
    } else {
      warnings.push("⚠️ Push notifications not implemented");
      score -= 2;
    }

    // Syntax validation (basic)
    try {
      new Function(swContent);
      console.log("✅ Syntax validation: Passed");
    } catch (syntaxError) {
      errors.push(`❌ Syntax error: ${syntaxError.message}`);
      score -= 20;
    }
  } catch (error) {
    errors.push(`❌ Failed to read service worker: ${error.message}`);
    score = 0;
  }

  return { errors, warnings, score: Math.max(0, score) };
}

function printResults(results) {
  const { errors, warnings, score } = results;

  console.log("\n" + "=".repeat(50));
  console.log("📊 SERVICE WORKER VALIDATION RESULTS");
  console.log("=".repeat(50));

  // Score
  let scoreColor = score >= 90 ? "🟢" : score >= 70 ? "🟡" : "🔴";
  console.log(`${scoreColor} Overall Score: ${score}/100\n`);

  // Errors
  if (errors.length > 0) {
    console.log("🚨 CRITICAL ISSUES:");
    errors.forEach((error) => console.log(`  ${error}`));
    console.log("");
  }

  // Warnings
  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    warnings.forEach((warning) => console.log(`  ${warning}`));
    console.log("");
  }

  // Recommendations
  console.log("💡 RECOMMENDATIONS:");

  if (score >= 90) {
    console.log("  ✨ Excellent! Your service worker is well configured.");
  } else if (score >= 70) {
    console.log(
      "  👍 Good service worker, but consider addressing the warnings above.",
    );
  } else {
    console.log("  🔧 Your service worker needs significant improvements.");
    console.log("  📖 Check the deployment guide for best practices.");
  }

  if (errors.length > 0) {
    console.log("  🚨 Fix all critical issues before deployment.");
  }

  console.log("");
  console.log(
    "📚 For help: Check the deployment guide or Next.js PWA documentation",
  );
  console.log("=".repeat(50));

  // Exit with appropriate code
  if (errors.length > 0) {
    process.exit(1);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = validateServiceWorker();
  printResults(results);
}

export { validateServiceWorker };
