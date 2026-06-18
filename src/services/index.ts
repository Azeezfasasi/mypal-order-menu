// Export Deal API
export * from "./api/deals-api";
export * from "./deal-query-keys";

// Export Notification API (React hooks and standalone functions)
export * from "./api/notification-api";
export * from "./notification-query-keys";

// Export Notification Service (Axios-based utility class)
// Note: Individual methods are not exported to avoid naming conflicts with notification-api
// Usage: notificationService.methodName() or import directly from "./notification-service"
export {
  notificationService,
  NotificationService,
} from "./notification-service";
