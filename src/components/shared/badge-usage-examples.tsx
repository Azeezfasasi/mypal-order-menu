// examples/badge-usage-examples.tsx
import { AlertTriangle, Check, Clock, X } from "lucide-react";
import { StatusBadge } from "../shared/status-badge";

// Example table column configurations
export const tableColumnConfigs = {
  // Standard badge column
  statusColumn: {
    accessorKey: "status",
    header: "Status",
    type: "status" as const,
    statusConfig: {
      badgeType: "badge" as const,
      colorMap: {
        Active: "success",
        Inactive: "destructive",
        Pending: "warning",
        Draft: "outline",
      },
    },
  },

  // Badge with dots
  statusWithDotColumn: {
    accessorKey: "status",
    header: "Status",
    type: "status" as const,
    statusConfig: {
      badgeType: "badge" as const,
      showDot: true,
      dotPosition: "left" as const,
      colorMap: {
        Online: "success",
        Offline: "destructive",
        Away: "warning",
        Busy: "info",
      },
    },
  },

  // Pill style badges
  priorityPillColumn: {
    accessorKey: "priority",
    header: "Priority",
    type: "status" as const,
    statusConfig: {
      badgeType: "pill" as const,
      colorMap: {
        High: "solid-warning",
        Medium: "warning",
        Low: "soft-info",
        Critical: "destructive",
      },
    },
  },

  // Dot-only for compact displays
  connectionStatusColumn: {
    accessorKey: "connectionStatus",
    header: "Connection",
    type: "status" as const,
    statusConfig: {
      badgeType: "dot-only" as const,
      colorMap: {
        Connected: "success",
        Disconnected: "destructive",
        Connecting: "warning",
      },
    },
  },

  // Status with icons
  taskStatusWithIconColumn: {
    accessorKey: "taskStatus",
    header: "Task Status",
    type: "status" as const,
    statusConfig: {
      badgeType: "badge" as const,
      showIcon: true,
      iconMap: {
        Completed: Check,
        "In Progress": Clock,
        Failed: X,
        Blocked: AlertTriangle,
      },
      colorMap: {
        Completed: "success",
        "In Progress": "info",
        Failed: "destructive",
        Blocked: "warning",
      },
    },
  },

  // Tags with different badge types
  tagsColumn: {
    accessorKey: "tags",
    header: "Tags",
    type: "tags" as const,
    tagsConfig: {
      maxDisplay: 3,
      badgeType: "pill" as const,
      variant: "secondary",
      colorMap: {
        urgent: "#ef4444",
        feature: "#3b82f6",
        bug: "#f59e0b",
      },
    },
  },
};

// Example data
export const exampleData = [
  {
    id: 1,
    status: "Active",
    priority: "High",
    connectionStatus: "Connected",
    taskStatus: "Completed",
    tags: ["urgent", "feature"],
  },
  {
    id: 2,
    status: "Pending",
    priority: "Medium",
    connectionStatus: "Connecting",
    taskStatus: "In Progress",
    tags: ["bug", "critical", "backend"],
  },
  {
    id: 3,
    status: "Inactive",
    priority: "Low",
    connectionStatus: "Disconnected",
    taskStatus: "Failed",
    tags: ["enhancement"],
  },
];

// Component to showcase all badge types
export function BadgeShowcase() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Badge Types Showcase</h2>

        {/* Standard Badges */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Standard Badges</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="success" badgeType="badge">
              Active
            </StatusBadge>
            <StatusBadge variant="warning" badgeType="badge">
              Pending
            </StatusBadge>
            <StatusBadge variant="destructive" badgeType="badge">
              Failed
            </StatusBadge>
            <StatusBadge variant="info" badgeType="badge">
              Info
            </StatusBadge>
            <StatusBadge variant="outline" badgeType="badge">
              Draft
            </StatusBadge>
          </div>
        </div>

        {/* Pills */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Pill Badges</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="solid-warning" badgeType="pill">
              High Priority
            </StatusBadge>
            <StatusBadge variant="warning" badgeType="pill">
              Medium Priority
            </StatusBadge>
            <StatusBadge variant="soft-info" badgeType="pill">
              Low Priority
            </StatusBadge>
            <StatusBadge variant="destructive" badgeType="pill">
              Critical
            </StatusBadge>
          </div>
        </div>

        {/* Badges with Dots */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Badges with Dots</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              variant="success"
              badgeType="badge"
              showDot
              dotPosition="left"
            >
              Online
            </StatusBadge>
            <StatusBadge
              variant="destructive"
              badgeType="badge"
              showDot
              dotPosition="left"
            >
              Offline
            </StatusBadge>
            <StatusBadge
              variant="warning"
              badgeType="badge"
              showDot
              dotPosition="right"
            >
              Away
            </StatusBadge>
            <StatusBadge
              variant="info"
              badgeType="badge"
              showDot
              dotPosition="right"
            >
              Busy
            </StatusBadge>
          </div>
        </div>

        {/* Dot Only */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Dot Only (Compact)</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <StatusBadge variant="success" badgeType="dot-only" />
              <span className="text-sm">Connected</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge variant="destructive" badgeType="dot-only" />
              <span className="text-sm">Disconnected</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge variant="warning" badgeType="dot-only" />
              <span className="text-sm">Connecting</span>
            </div>
          </div>
        </div>

        {/* Badges with Icons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Badges with Icons</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="success" badgeType="badge" icon={Check}>
              Completed
            </StatusBadge>
            <StatusBadge variant="info" badgeType="badge" icon={Clock}>
              In Progress
            </StatusBadge>
            <StatusBadge variant="destructive" badgeType="badge" icon={X}>
              Failed
            </StatusBadge>
            <StatusBadge
              variant="warning"
              badgeType="badge"
              icon={AlertTriangle}
            >
              Blocked
            </StatusBadge>
          </div>
        </div>

        {/* Mixed Styles */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Mixed Styles</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="solid-success" badgeType="pill" icon={Check}>
              Verified
            </StatusBadge>
            <StatusBadge
              variant="outline-warning"
              badgeType="badge"
              showDot
              dotPosition="left"
            >
              Review Required
            </StatusBadge>
            <StatusBadge
              variant="soft-info"
              badgeType="pill"
              showDot
              dotPosition="right"
            >
              Processing
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Table Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Table Usage Examples</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Connection
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Task Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exampleData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{row.id}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      variant={
                        row.status === "Active"
                          ? "success"
                          : row.status === "Pending"
                          ? "warning"
                          : row.status === "Inactive"
                          ? "destructive"
                          : "outline"
                      }
                      badgeType="badge"
                      showDot
                      dotPosition="left"
                    >
                      {row.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      variant={
                        row.priority === "High"
                          ? "solid-warning"
                          : row.priority === "Medium"
                          ? "warning"
                          : row.priority === "Low"
                          ? "soft-info"
                          : "destructive"
                      }
                      badgeType="pill"
                    >
                      {row.priority}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={
                          row.connectionStatus === "Connected"
                            ? "success"
                            : row.connectionStatus === "Connecting"
                            ? "warning"
                            : "destructive"
                        }
                        badgeType="dot-only"
                      />
                      <span className="text-sm">{row.connectionStatus}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      variant={
                        row.taskStatus === "Completed"
                          ? "success"
                          : row.taskStatus === "In Progress"
                          ? "info"
                          : row.taskStatus === "Failed"
                          ? "destructive"
                          : "warning"
                      }
                      badgeType="badge"
                      icon={
                        row.taskStatus === "Completed"
                          ? Check
                          : row.taskStatus === "In Progress"
                          ? Clock
                          : row.taskStatus === "Failed"
                          ? X
                          : AlertTriangle
                      }
                    >
                      {row.taskStatus}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.tags.slice(0, 2).map((tag, index) => (
                        <StatusBadge
                          key={index}
                          variant="secondary"
                          badgeType="pill"
                          className="text-xs"
                        >
                          {tag}
                        </StatusBadge>
                      ))}
                      {row.tags.length > 2 && (
                        <StatusBadge
                          variant="outline"
                          badgeType="pill"
                          className="text-xs"
                        >
                          +{row.tags.length - 2}
                        </StatusBadge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Examples */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Configuration Examples</h2>
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">
              Standard Badge Configuration:
            </h4>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`statusConfig: {
                  badgeType: "badge",
                  colorMap: {
                    "Active": "success",
                    "Inactive": "destructive",
                    "Pending": "warning",
                  }
                }`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">
              Badge with Dot Configuration:
            </h4>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`statusConfig: {
                  badgeType: "badge",
                  showDot: true,
                  dotPosition: "left",
                  colorMap: {
                    "Online": "success",
                    "Offline": "destructive",
                    "Away": "warning",
                  }
                }`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Pill Style Configuration:</h4>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`statusConfig: {
                  badgeType: "pill",
                  colorMap: {
                    "High": "solid-warning",
                    "Medium": "warning",
                    "Low": "soft-info",
                  }
                }`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Dot-Only Configuration:</h4>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`statusConfig: {
                  badgeType: "dot-only",
                  colorMap: {
                    "Connected": "success",
                    "Disconnected": "destructive",
                    "Connecting": "warning",
                  }
                }`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">
              Badge with Icons Configuration:
            </h4>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`statusConfig: {
                  badgeType: "badge",
                  showIcon: true,
                  iconMap: {
                    "Completed": Check,
                    "In Progress": Clock,
                    "Failed": X,
                    "Blocked": AlertTriangle,
                  },
                  colorMap: {
                    "Completed": "success",
                    "In Progress": "info",
                    "Failed": "destructive",
                    "Blocked": "warning",
                  }
                }`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Advanced usage with custom styling
export function AdvancedBadgeExamples() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Advanced Badge Usage</h2>

      {/* Custom styled badges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Styled Badges</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            variant="success"
            badgeType="badge"
            className="font-bold uppercase tracking-wide"
          >
            Success
          </StatusBadge>
          <StatusBadge
            variant="info"
            badgeType="pill"
            className="px-4 py-2 text-sm shadow-lg"
          >
            Information
          </StatusBadge>
          <StatusBadge
            variant="warning"
            badgeType="badge"
            showDot
            className="border-2 border-amber-300"
          >
            Warning
          </StatusBadge>
        </div>
      </div>

      {/* Conditional rendering example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Conditional Badge Types</h3>
        <div className="space-y-2">
          {["High", "Medium", "Low"].map((priority) => (
            <div key={priority} className="flex items-center gap-4">
              <span className="w-16">{priority}:</span>
              <StatusBadge
                variant={
                  priority === "High"
                    ? "destructive"
                    : priority === "Medium"
                    ? "warning"
                    : "success"
                }
                badgeType={priority === "High" ? "pill" : "badge"}
                showDot={priority === "Medium"}
                icon={priority === "High" ? AlertTriangle : undefined}
              >
                {priority} Priority
              </StatusBadge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
