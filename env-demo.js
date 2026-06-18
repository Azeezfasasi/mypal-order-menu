// Demonstration: Why process.env doesn't work in Service Workers

// In Node.js (during build time):
console.log("Node.js Context:");
console.log("process.env.NODE_ENV:", process.env.NODE_ENV); // ✅ Works

// In Service Worker (runtime in browser):
console.log("Service Worker Context:");
console.log("typeof process:", typeof process); // ❌ undefined
console.log("typeof window:", typeof window); // ❌ undefined (in SW)
console.log("typeof self:", typeof self); // ✅ ServiceWorkerGlobalScope

// If we tried to use process.env in SW:
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // ❌ This would be undefined
// };

// Result: Firebase initialization would fail!
