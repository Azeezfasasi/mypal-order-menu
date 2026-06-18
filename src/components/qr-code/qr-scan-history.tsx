"use client";

import { QRCodeApi, type QRScanHistoryItem } from "@/services/api/qrcode-api";
import { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { ErrorDisplay } from "@/components/shared/error-display";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";

export interface QRScanHistoryRef {
  refetch: () => void;
}

export const QRScanHistory = forwardRef<QRScanHistoryRef>(function QRScanHistory(_, ref) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const {
    data: historyResponse,
    isLoading,
    error,
    refetch,
  } = QRCodeApi.useGetScanHistory({
    page: currentPage,
    limit: pageSize,
  });

  // Expose refetch to parent component
  useImperativeHandle(ref, () => ({
    refetch: () => refetch(),
  }), [refetch]);

  // Extract data from nested response structure
  const scansArray = historyResponse?.data?.data || [];
  const totalScans = historyResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalScans / pageSize);

  console.log("QRScanHistory - historyResponse:", historyResponse);
  console.log("QRScanHistory - scansArray:", scansArray);
  console.log("QRScanHistory - totalScans:", totalScans);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
      case "declined":
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "approved":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "failed":
      case "declined":
      case "rejected":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner message="Loading scan history" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Scan History"
        message="Could not fetch QR code scan history."
        error={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">QR Code Scan History</h2>
        <p className="text-muted-foreground mt-1">
          View all QR codes you have scanned
        </p>
      </div>

      {scansArray.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Reference ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Last Verified
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Expires At
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {scansArray.map((scan: QRScanHistoryItem) => (
                    <tr
                      key={scan.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium truncate max-w-xs">
                          {scan.referenceId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {scan.user ? `${scan.user.firstname} ${scan.user.lastname}` : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {scan.referenceType || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {scan.isVerified ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                              No
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {scan.lastVerifiedAt ? formatDate(scan.lastVerifiedAt) : "Not verified"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(scan.expiresAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(scan.status || "active")}`}>
                          {getStatusIcon(scan.status || "active")}
                          <span className="capitalize">{scan.status || "Active"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalScans)} of {totalScans} scans
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-8 border rounded-md">
          No scan history found yet.
        </div>
      )}
    </div>
  );
});
