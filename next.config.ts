import { withSentryConfig } from "@sentry/nextjs";
/**
 * Build/environment configuration
 * - Keep NODE_ENV=production for optimized Next builds
 * - Use BUILD_ENV to distinguish deployments (e.g. 'staging' vs 'production')
 * - Use NEXT_PUBLIC_STRIP_CONSOLE to explicitly enable/disable console removal
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,

  // Optimize webpack for memory usage (only applies in production)
  webpack: (config, { dev }) => {
    if (!dev) {
      // Disable source maps in production
      config.devtool = false;

      // Optimize for memory usage
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
          },
        },
      };
    }

    // Reduce memory usage during build
    config.stats = "errors-warnings";

    // Ensure pdfjs worker is bundled correctly
    // Use Webpack 5 asset modules instead of the deprecated/unmaintained file-loader
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js$/,
      type: "asset/resource",
      generator: {
        filename: "_next/static/chunks/[name].[contenthash][ext]",
      },
    });

    return config;
  },



  // Reduce bundle size and control console stripping via BUILD_ENV or explicit flag
  compiler: {
    // removeConsole is enabled when
    // - NEXT_PUBLIC_STRIP_CONSOLE === 'true' OR
    // - BUILD_ENV (or NODE_ENV fallback) === 'production'
    removeConsole: (() => {
      const explicit = process.env.NEXT_PUBLIC_STRIP_CONSOLE;
      if (typeof explicit !== "undefined") return explicit === "true";
      const buildEnv = process.env.BUILD_ENV || process.env.NODE_ENV;
      return buildEnv === "production";
    })(),
  },

  // Handle redirects - commented out as we handle this in the root page component
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/dashboard',
  //       permanent: false,
  //     },
  //   ];
  // },

  // // PWA specific headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      {
        source: "/:path*.map",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "mipal-business-data.s3.eu-west-2.amazonaws.com",
        protocol: "https",
      },
      {
        hostname: "example.com",
        protocol: "https",
      },
      {
        hostname: "mypal-business-data.s3.eu-west-2.amazonaws.com",
        protocol: "https",
      },
      {
        hostname: "images.pexels.com",
        protocol: "https",
      },
      {
        hostname: "images.unsplash.com",
        protocol: "https",
      },
      {
        hostname: "loremflickr.com",
        protocol: "https",
      },
      {
        hostname: "picsum.photos",
        protocol: "https",
      },
      {
        hostname: "placehold.co",
        protocol: "https",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  output: "standalone",
};

export default withSentryConfig(nextConfig, {
 // For all available options, see:
 // https://www.npmjs.com/package/@sentry/webpack-plugin#options

 org: "mypal-hospitality-innovation-s",

 project: "business-admin",

 // Only print logs for uploading source maps in CI
 silent: !process.env.CI,

 // For all available options, see:
 // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

 // Upload a larger set of source maps for prettier stack traces (increases build time)
 widenClientFileUpload: true,

 // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
 // This can increase your server load as well as your hosting bill.
 // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
 // side errors will fail.
 tunnelRoute: "/monitoring",

 webpack: {
   // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
   // See the following for more information:
   // https://docs.sentry.io/product/crons/
   // https://vercel.com/docs/cron-jobs
   automaticVercelMonitors: true,

   // Tree-shaking options for reducing bundle size
   treeshake: {
     // Automatically tree-shake Sentry logger statements to reduce bundle size
     removeDebugLogging: true,
   },
 },
});
