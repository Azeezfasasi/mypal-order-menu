// #!/usr/bin/env node

// /**
//  * Service Worker Environment Replacer
//  * Replaces environment variables in the Firebase messaging service worker
//  */

// // eslint-disable-next-line @typescript-eslint/no-require-imports
// const fs = require("fs");
// // eslint-disable-next-line @typescript-eslint/no-require-imports
// const path = require("path");

// const swPath = path.join(__dirname, "..", "public", "firebase-messaging-sw.js");
// const swTemplatePath = path.join(
//   __dirname,
//   "..",
//   "public",
//   "firebase-messaging-sw.template.js",
// );
// const envPath = path.join(__dirname, "..", ".env.local");

// // Load environment variables from .env.local
// function loadEnvFile() {
//   if (fs.existsSync(envPath)) {
//     const envContent = fs.readFileSync(envPath, "utf8");
//     const envVars = {};

//     envContent.split("\n").forEach((line) => {
//       const [key, ...valueParts] = line.split("=");
//       if (key && valueParts.length > 0) {
//         const value = valueParts.join("=");
//         // Wrap the value in quotes for JavaScript string literals
//         envVars[key.trim()] = `"${value.trim()}"`;
//       }
//     });

//     return envVars;
//   }
//   return {};
// }

// const loadedEnv = loadEnvFile();

// // Read the template file
// let swContent = fs.readFileSync(swTemplatePath, "utf8");

// // Replace environment variables
// const envVars = {
//   "process.env.NEXT_PUBLIC_FIREBASE_API_KEY":
//     loadedEnv.NEXT_PUBLIC_FIREBASE_API_KEY ||
//     process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
//     '"your_firebase_api_key"',
//   "process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN":
//     loadedEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
//     process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
//     '"your_project.firebaseapp.com"',
//   "process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID":
//     loadedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
//     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
//     '"your_project_id"',
//   "process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID":
//     loadedEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
//     process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
//     '"your_sender_id"',
//   "process.env.NEXT_PUBLIC_FIREBASE_APP_ID":
//     loadedEnv.NEXT_PUBLIC_FIREBASE_APP_ID ||
//     process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
//     '"your_app_id"',
//   "process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID":
//     loadedEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
//     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
//     '"G-XXXXXXX"',
// };

// // Replace all environment variables
// Object.keys(envVars).forEach((key) => {
//   const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
//   swContent = swContent.replace(regex, envVars[key]);
// });

// // Write the processed service worker
// fs.writeFileSync(swPath, swContent);

// console.log(
//   "✅ Firebase messaging service worker updated with environment variables",
// );
