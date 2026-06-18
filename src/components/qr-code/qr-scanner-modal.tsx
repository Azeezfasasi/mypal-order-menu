"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import { QRCodeApi, type QRCodeScanResponse } from "@/services/api/qrcode-api";
import { toast } from "sonner";

export interface QRCodeData {
  ticketId: string;
  accountName: string;
  userName: string;
  amount: number;
}

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: QRCodeData) => void;
  isLoading?: boolean;
}

export function QRScannerModal({ open, onClose, onScan, isLoading = false }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [tempQRData, setTempQRData] = useState<string | null>(null);
  
  // Use the scan QR code mutation
  const { mutate: scanQRCode, isPending: isValidating } = QRCodeApi.useScanQRCode();

  useEffect(() => {
    console.log("QRScannerModal useEffect triggered - open:", open);
    
    if (!open) {
      console.log("Modal not open, skipping initialization");
      return;
    }

    let isMounted = true;

    const initScanner = async () => {
      try {
        if (!isMounted) return;
        
        if (!videoRef.current) {
          console.error("Video ref is null!");
          if (isMounted) setError("Failed to initialize camera");
          return;
        }

        // Check if running on HTTPS or localhost
        const isSecureContext = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (!isSecureContext) {
          if (isMounted) {
            setError("Camera access requires HTTPS. Please access this page over a secure connection.");
          }
          return;
        }

        if (isMounted) {
          setIsInitializing(true);
          setError("");
        }

        // First, check if camera is available with getUserMedia
        console.log("Checking camera permission...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        
        // If we got here, permission was granted. Stop the stream.
        stream.getTracks().forEach(track => track.stop());
        console.log("Camera permission granted");

        if (!isMounted) return;

        // Check if camera is available
        const devices = await QrScanner.listCameras();
        console.log("Available cameras:", devices);
        
        if (devices.length === 0) {
          if (isMounted) {
            setError("No camera found on this device.");
            setIsInitializing(false);
          }
          return;
        }

        if (!isMounted || !videoRef.current) return;

        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log("QR Code scanned:", result.data);
            handleScan(result.data);
          },
          {
            onDecodeError: (error: unknown) => {
              // Silently ignore decode errors
              console.debug("Decode error:", error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        // Use the back camera (environment facing)
        const backCamera = devices.find((camera) =>
          camera.label.toLowerCase().includes("back")
        );
        
        console.log("Selected camera:", backCamera || devices[0]);
        
        if (backCamera) {
          await scanner.setCamera(backCamera.id);
        } else if (devices.length > 0) {
          await scanner.setCamera(devices[0].id);
        }

        if (!isMounted) {
          scanner.destroy();
          return;
        }

        scannerRef.current = scanner;
        console.log("Starting scanner...");
        await scanner.start();
        console.log("Scanner started successfully");
        
        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        const error = err as Error & { name?: string };
        console.error("Camera error:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        let errorMessage = "Unable to access camera";
        
        if (error.name === "NotAllowedError" || error.message?.includes("Permission denied")) {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (error.name === "NotFoundError" || error.message?.includes("no device")) {
          errorMessage = "No camera found. Please check your device has a working camera.";
        } else if (error.name === "AbortError" || error.message?.includes("AbortError")) {
          errorMessage = "Camera initialization failed. Please try closing and reopening the scanner.";
        } else if (error.message?.includes("https")) {
          errorMessage = "Camera access requires HTTPS. Please access this page over a secure connection.";
        }
        
        setError(errorMessage);
        setIsInitializing(false);
      }
    };

    // Use a small delay to ensure video element is mounted
    const initTimer = setTimeout(() => {
      initScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (scannerRef.current) {
        try {
          scannerRef.current.destroy();
        } catch (e) {
          console.debug("Error destroying scanner:", e);
        }
        scannerRef.current = null;
      }
    };
  }, [open]);

  const handleScan = (qrData: string) => {
    // Store the QR data and show PIN input
    setTempQRData(qrData);
    setShowPinInput(true);
    
    // Stop scanner while user enters PIN
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
  };

  const handleSubmitPin = () => {
    if (!pin.trim() || !tempQRData) {
      setError("Please enter your PIN");
      return;
    }

    // Validate the scanned QR code with PIN
    scanQRCode(
      { qrData: tempQRData, pin },
      {
        onSuccess: (response: QRCodeScanResponse) => {
          console.log("Full API Response:", response);
          console.log("Response Data:", response.data);
          
          // Extract data from the nested API response structure
          const responseData = response.data as unknown as {
            referenceId?: string;
            entity?: { business?: { business_name?: string }; amount?: number };
            user?: { firstname?: string; lastname?: string };
            payment?: { amount?: number };
          };
          
          const ticketId = responseData?.referenceId || tempQRData;
          const accountName = responseData?.entity?.business?.business_name || "N/A";
          const userName = responseData?.user 
            ? `${responseData.user.firstname || ""} ${responseData.user.lastname || ""}`.trim()
            : "N/A";
          const amount = responseData?.entity?.amount || responseData?.payment?.amount || 0;
          
          const data: QRCodeData = {
            ticketId,
            accountName,
            userName,
            amount: typeof amount === "number" ? amount : 0,
          };

          console.log("Extracted Data:", data);
          setScannedData(data);
          setShowPinInput(false);
          setPin("");
          setTempQRData(null);
        },
        onError: (err: unknown) => {
          let errorMsg = "Failed to validate QR code";
          
          // Try to extract the API error message from the response
          if (err instanceof Error) {
            const errorStr = err.message;
            
            // Check if error message contains JSON response data
            try {
              // Parse error message to extract API response
              if (errorStr.includes("Request failed")) {
                // This might be an axios error with data in the message
                const apiError = (err as unknown as { response?: { data?: unknown } }).response?.data;
                if (apiError && typeof apiError === "object") {
                  const apiErrorObj = apiError as Record<string, unknown>;
                  if (apiErrorObj.message) {
                    errorMsg = apiErrorObj.message as string;
                  } else if (apiErrorObj.mes) {
                    errorMsg = apiErrorObj.mes as string;
                  }
                } else if (typeof apiError === "string") {
                  // Try to parse JSON string
                  const parsed = JSON.parse(apiError);
                  errorMsg = parsed.message || parsed.mes || errorMsg;
                }
              } else {
                errorMsg = errorStr;
              }
            } catch {
              // If parsing fails, use the original message
              errorMsg = errorStr;
            }
          }
          
          // Show user-friendly error messages
          if (errorMsg.toLowerCase().includes("expired")) {
            toast.error("QR Code or PIN has expired. Please ask the guest to regenerate a new QR code.");
          } else if (errorMsg.toLowerCase().includes("invalid")) {
            toast.error("Invalid PIN. Please try again.");
          } else {
            toast.error(errorMsg);
          }
          
          setError(errorMsg);
          console.error("QR validation error:", err);
          
          // Show PIN input again for retry
          setShowPinInput(true);
          if (scannerRef.current) {
            scannerRef.current.start();
          }
        },
      }
    );
  };

  const handleValidate = () => {
    if (scannedData) {
      onScan(scannedData);
      // Reset state
      setScannedData(null);
      onClose();
    }
  };

  const handleScanAnother = async () => {
    setScannedData(null);
    setError("");
    setPin("");
    setTempQRData(null);
    setShowPinInput(false);
    
    if (scannerRef.current) {
      await scannerRef.current.start();
    }
  };

  const handleClose = () => {
    setScannedData(null);
    setError("");
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {scannedData ? "QR Code Details" : "Scan QR Code"}
          </DialogTitle>
          <DialogDescription>
            {scannedData ? "Review the ticket details below" : "Point your camera at a QR code to scan it"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!scannedData ? (
            // QR Scanner
            <div className="space-y-4">
              {!showPinInput ? (
                <>
                  <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                    />
                    {isInitializing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                          <p className="text-white text-sm">Initializing camera...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                          onClick={() => {
                            setError("");
                            if (scannerRef.current) {
                              scannerRef.current.start();
                            }
                          }}
                          className="text-xs text-red-600 dark:text-red-400 underline mt-1 hover:no-underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}

                  {!error && !isInitializing && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Point your camera at the QR code to scan it
                    </p>
                  )}
                </>
              ) : (
                // PIN Input Screen
                <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      QR code scanned successfully. Please enter your PIN to verify:
                    </p>
                    
                    <input
                      type="password"
                      placeholder="Enter PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSubmitPin();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />

                    {error && (
                      <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">Verification Failed</p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                          {error.includes("expired") && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              Please ask the guest to regenerate a new QR code.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setShowPinInput(false);
                        setPin("");
                        setError("");
                        if (scannerRef.current) {
                          scannerRef.current.start();
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitPin}
                      disabled={!pin.trim() || isValidating}
                      className="flex-1"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify PIN"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Display Scanned Details
            <div className="space-y-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ticket ID
                  </label>
                  <p className="text-lg font-semibold break-all">{scannedData.ticketId}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Account Name
                  </label>
                  <p className="text-lg font-semibold">{scannedData.accountName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Name of User
                  </label>
                  <p className="text-lg font-semibold">{scannedData.userName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Amount
                  </label>
                  <p className="text-lg font-semibold text-orange-600">
                    ₦{scannedData?.amount ? scannedData.amount.toLocaleString() : "0"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleScanAnother}
                  variant="outline"
                  className="flex-1"
                >
                  Scan Another
                </Button>
                <Button
                  onClick={handleValidate}
                  disabled={isLoading || isValidating}
                  className="flex-1"
                >
                  {isLoading || isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
