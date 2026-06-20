// scripts/clear-cache.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function clearBuildCache() {
  console.log("🗑️  Clearing build caches...\n");

  const paths = [".next", "node_modules/.cache", ".turbo", "dist", "build"];

  let clearedCount = 0;
  let totalSize = 0;

  paths.forEach((cachePath) => {
    const fullPath = path.join(process.cwd(), cachePath);

    if (fs.existsSync(fullPath)) {
      try {
        const size = getFolderSize(fullPath);
        totalSize += size;

        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Cleared ${cachePath} (${formatBytes(size)})`);
        clearedCount++;
      } catch (error) {
        console.log(`❌ Failed to clear ${cachePath}: ${error.message}`);
      }
    } else {
      console.log(`⏭️  ${cachePath} (not found)`);
    }
  });

  console.log(`\n📊 Summary: Cleared ${clearedCount} cache directories`);
  console.log(`💾 Total space freed: ${formatBytes(totalSize)}`);

  return clearedCount;
}

function getFolderSize(folderPath) {
  let size = 0;

  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getFolderSize(filePath);
      } else {
        size += stats.size;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Ignore errors for inaccessible files/folders
  }

  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function generateBrowserCacheScript() {
  console.log("\n🌐 Generating browser cache clearing script...\n");

  const script = `
// Browser Cache Clearing Script
// Run this in your browser's console to clear all app caches

(async function clearAppCaches() {
  console.log('🗑️ Clearing browser caches for MyPal Iconic Delicacy Order Menu...');
  
  try {
    // Clear all caches
    const cacheNames = await caches.keys();
    console.log(\`Found \${cacheNames.length} caches:\`, cacheNames);
    
    const deletePromises = cacheNames.map(async (cacheName) => {
      const deleted = await caches.delete(cacheName);
      console.log(\`\${deleted ? '✅' : '❌'} \${cacheName}\`);
      return deleted;
    });
    
    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(Boolean).length;
    
    console.log(\`\\n📊 Cleared \${deletedCount}/\${cacheNames.length} caches\`);
    
    // Clear localStorage related to the app
    const appKeys = Object.keys(localStorage).filter(key => 
      key.includes('mypal') || 
      key.includes('installPrompt') ||
      key.includes('auth-storage')
    );
    
    appKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(\`🗑️ Removed localStorage: \${key}\`);
    });
    
    // Clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('mypal')
    );
    
    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(\`🗑️ Removed sessionStorage: \${key}\`);
    });
    
    // Clear IndexedDB (if used)
    if ('indexedDB' in window) {
      try {
        // This is a basic attempt - you might need to customize based on your DB names
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && db.name.includes('mypal')) {
            indexedDB.deleteDatabase(db.name);
            console.log(\`🗑️ Cleared IndexedDB: \${db.name}\`);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not clear IndexedDB:', error.message);
      }
    }
    
    console.log('\\n✅ Cache clearing complete!');
    console.log('💡 Refresh the page (Ctrl+Shift+R) to see changes');
    
    return {
      cachesCleared: deletedCount,
      localStorageCleared: appKeys.length,
      sessionStorageCleared: sessionKeys.length
    };
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    throw error;
  }
})();
`;

  // Save the script to a file
  const scriptPath = path.join(
    process.cwd(),
    "scripts",
    "browser-cache-clear.js"
  );
  fs.writeFileSync(scriptPath, script.trim());

  console.log("📝 Browser cache clearing script saved to:");
  console.log(`   ${scriptPath}`);
  console.log("\n💡 Usage:");
  console.log("   1. Open your app in the browser");
  console.log("   2. Open Developer Tools (F12)");
  console.log("   3. Go to Console tab");
  console.log("   4. Copy and paste the script content");
  console.log("   5. Press Enter to execute");

  return scriptPath;
}

function clearPackageManagerCache() {
  console.log("\n📦 Clearing package manager caches...\n");
  // execSync is imported at the top as an ES module

  const commands = [
    { cmd: "npm cache clean --force", desc: "NPM cache" },
    { cmd: "npx clear-npx-cache", desc: "NPX cache" },
    { cmd: "yarn cache clean", desc: "Yarn cache" },
  ];

  commands.forEach(({ cmd, desc }) => {
    try {
      execSync(cmd, { stdio: "pipe" });
      console.log(`✅ Cleared ${desc}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log(`⏭️  ${desc} (not available or failed)`);
    }
  });
}

function displayCacheInfo() {
  console.log("\n📋 Cache Information:\n");

  console.log("🗂️  Build Caches:");
  console.log("   .next/          - Next.js build cache");
  console.log("   .turbo/         - Turbopack cache");
  console.log("   node_modules/.cache/ - Various tool caches");

  console.log("\n🌐 Browser Caches:");
  console.log("   Service Worker  - App shell and resources");
  console.log("   HTTP Cache      - Browser HTTP cache");
  console.log("   localStorage    - App settings and preferences");
  console.log("   sessionStorage  - Temporary session data");

  console.log("\n📦 Package Manager Caches:");
  console.log("   NPM cache       - Downloaded packages");
  console.log("   NPX cache       - Cached executables");
  console.log("   Yarn cache      - Yarn package cache");

  console.log("\n💡 Cache Clearing Strategy:");
  console.log("   Development: Clear build caches when having issues");
  console.log("   Deployment:  Clear all caches for clean builds");
  console.log("   User Issues: Generate browser script for users");
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "all";

  console.log("🧹 MyPal Iconic Delicacy Order Menu - Cache Clearing Tool\n");

  switch (command) {
    case "build":
      clearBuildCache();
      break;

    case "packages":
    case "pkg":
      clearPackageManagerCache();
      break;

    case "browser":
      generateBrowserCacheScript();
      break;

    case "info":
      displayCacheInfo();
      break;

    case "all":
    default:
      clearBuildCache();
      clearPackageManagerCache();
      generateBrowserCacheScript();
      console.log("\n✨ All cache clearing operations completed!");
      break;
  }

  console.log("\n" + "=".repeat(50));
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  clearBuildCache,
  clearPackageManagerCache,
  generateBrowserCacheScript,
  displayCacheInfo,
};
