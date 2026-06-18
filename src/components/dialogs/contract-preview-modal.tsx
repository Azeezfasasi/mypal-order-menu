/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import {
  type IBusinessForContract,
  processContractTemplate,
} from "@/lib/contract-utils";
import type {
  IBusinessContract,
  IContractTemplate,
} from "@/types/contract-types";
import {
  Download,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  Twitter,
  X,
} from "lucide-react";
import React, { useMemo } from "react";

interface ContractPreviewModalProps {
  open: boolean;
  onClose: () => void;
  contract: IBusinessContract | null;
  template?: IContractTemplate | null;
  currentBusiness?: IBusinessForContract | null;
  onSign: () => void;
  isSubmitting?: boolean;
}

export function ContractPreviewModal({
  open,
  onClose,
  contract,
  template,
  currentBusiness,
  onSign,
  isSubmitting = false,
}: ContractPreviewModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { downloadPdf, isDownloading } = usePdfDownload();

  const formatDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not provided";

  const signedDate = formatDate(
    contract?.completed_at ?? contract?.updated_at ?? contract?.created_at,
  );

  /**
   * Process contract template with memoization to prevent unnecessary recalculations
   * Returns both sanitized HTML and validation status
   */
  const { processedContent, processingError } = useMemo(() => {
    if (!template) {
      return { processedContent: "", processingError: null };
    }

    const result = processContractTemplate(
      template.content,
      contract ?? null,
      currentBusiness ?? null,
      null,
    );

    return {
      processedContent: result.html,
      processingError: result.isValid ? null : result.warning,
    };
  }, [template, contract, currentBusiness]);

  const handleDownloadPDF = async () => {
    await downloadPdf(contentRef.current, {
      filename: `MyPal-Contract-${contract?.business_name || "agreement"}.pdf`,
      margin: 0,
      imageQuality: 0.98,
      scale: 2,
      format: "a4",
      orientation: "portrait",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {contract?.status === "COMPLETE"
              ? "Signed Contract Agreement"
              : "Contract Preview"}
          </DialogTitle>
          {template && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <span className="font-medium">Agreement:</span>
                <span>{template.title}</span>
                <span className="text-gray-400">•</span>
                <span>{template.category.name}</span>
              </div>
              {!contract && (
                <p className="text-xs text-blue-600 italic">
                  This is the contract agreement you will sign. Please review it
                  carefully before submitting your information.
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {/* Display processing error if any */}
          {processingError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
              <div className="text-red-700 text-sm">
                <p className="font-semibold">Error processing contract</p>
                <p className="text-xs">{processingError}</p>
              </div>
            </div>
          )}

          {/* Render the contract as JSX so we can use ReactMarkdown for the content */}
          <div
            ref={contentRef}
            className="contract-preview max-w-prose mx-auto"
            style={{ padding: 0 }}
          >
            <div
              className="prose prose-sm  contract-content"
              style={{
                fontFamily: "Arial, sans-serif",
                width: "100%",
                maxWidth: "none",
                margin: 0,
                padding: 0,
                background: "white",
                color: "#333",
                boxSizing: "border-box",
              }}
            >
              {/* Header Section */}
              <div
                style={{
                  background: "white",
                  padding: "15px 0",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                  pageBreakInside: "avoid",
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingLeft: 0,
                    paddingRight: 0,
                  }}
                >
                  <div>
                    <img
                      src="/images/mypal-logo.jpg"
                      alt="MyPal"
                      style={{ height: 40, width: "auto" }}
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  </div>
                  <div
                    style={{ display: "flex", gap: 15, alignItems: "center" }}
                  >
                    {/* Social Media Icons - Using Lucide Icons */}
                    <button
                      className="hover:text-blue-600 transition-colors"
                      title="TikTok"
                      onClick={() =>
                        window.open(
                          "https://www.tiktok.com/@mypaldeals?_t=ZS-90fKirE87CC&_r=1",
                          "_blank",
                        )
                      }
                    >
                      <Facebook size={20} className="text-gray-600" />
                    </button>
                    <button
                      className="hover:text-blue-400 transition-colors"
                      title="X"
                      onClick={() =>
                        window.open(
                          "https://x.com/MyPalTrybe?t=3wwVive1XcaIrtS7tanlgw&s=09",
                          "_blank",
                        )
                      }
                    >
                      <Twitter size={20} className="text-gray-600" />
                    </button>
                    <button
                      className="hover:text-blue-700 transition-colors"
                      title="LinkedIn"
                      onClick={() =>
                        window.open(
                          "https://www.linkedin.com/company/mypal-inc/",
                          "_blank",
                        )
                      }
                    >
                      <Linkedin size={20} className="text-gray-600" />
                    </button>
                    <button
                      className="hover:text-pink-600 transition-colors"
                      title="Instagram"
                      onClick={() =>
                        window.open(
                          "https://www.instagram.com/mypaltrybe_?igsh=MWxlbzNzOWxscGF1cA==",
                          "_blank",
                        )
                      }
                    >
                      <Instagram size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hero Banner */}
              <div
                style={{
                  background:
                    "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/contract-preview-bg.jpg') center/cover",
                  padding: "25px 0",
                  textAlign: "center",
                  borderRadius: 0,
                  pageBreakInside: "avoid",
                  marginLeft: 0,
                  marginRight: 0,
                  width: "100%",
                }}
              >
                <h1
                  style={{
                    color: "white",
                    fontSize: 32,
                    fontWeight: "bold",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  Mypal-Inc Hospitality Services
                </h1>
              </div>

              {/* Main Content - styles kept inline for PDF compatibility */}
              <div style={{ padding: "30px 0", lineHeight: 1.8 }}>
                <style>
                  {`.heading-node{font-size:20px;font-weight:600;margin:25px 0 15px 0;color:#1e3a5f}.text-node{margin:12px 0;line-height:1.8;color:#374151}.list-node{margin:15px 0 15px 25px}.list-node li{margin:10px 0;line-height:1.7}hr{margin:30px 0;border:none;border-top:1px solid #e5e7eb}h1{font-size:24px;font-weight:700;margin:20px 0;color:#1e3a5f}h2{font-size:18px;font-weight:600;margin:20px 0 10px 0;color:#374151}h3{font-size:16px;font-weight:600;margin:15px 0 8px 0;color:#374151}strong{font-weight:600;color:#1f2937}p{page-break-inside:avoid}.contract-section{page-break-inside:avoid;margin-bottom:20px}`}
                </style>

                {/* Contract Info Badge */}
                <div
                  style={{
                    margin: "20px 0",
                    padding: 15,
                    background: "#f3f4f6",
                    borderLeft: "4px solid #1e3a5f",
                    borderRadius: 4,
                    pageBreakInside: "avoid",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
                    <strong style={{ color: "#1e3a5f" }}>Agreement:</strong>{" "}
                    {template?.title}
                    <span style={{ color: "#6b7280" }}> • </span>
                    <strong style={{ color: "#1e3a5f" }}>Category:</strong>{" "}
                    {template?.category.name}
                  </p>
                </div>

                {/* Render sanitized HTML returned from processContractTemplate. */}
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
              </div>

              {/* Signed sections or status banner */}
              {contract ? (
                contract.status === "COMPLETE" ? (
                  <>
                    {/* Mypal Signed Section */}
                    <div
                      style={{
                        margin: "40px 0 20px 0",
                        padding: 30,
                        border: "2px solid #e5e7eb",
                        borderRadius: 8,
                        background:
                          "linear-gradient(to right, #f0f9ff 0%, #e0f2fe 100%)",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: 25,
                          color: "#1e3a5f",
                          textAlign: "center",
                        }}
                      >
                        Signed by Mypal Inc.
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 30,
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              margin: 0,
                              marginBottom: 15,
                              color: "#374151",
                            }}
                          >
                            Representative
                          </h4>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Name:</strong> John Smith
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Designation:</strong> Director of Operations
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Signature:</strong> ___________________
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Date:</strong> {signedDate}
                          </p>
                        </div>
                        <div>
                          <h4
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              margin: 0,
                              marginBottom: 15,
                              color: "#374151",
                            }}
                          >
                            Contact Information
                          </h4>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Phone:</strong> +1 (555) 123-4567
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Email:</strong> info@mypal-inc.com
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Business Signed Section */}
                    <div
                      style={{
                        margin: "20px 0 30px 0",
                        padding: 30,
                        border: "2px solid #e5e7eb",
                        borderRadius: 8,
                        background: "#f9fafb",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: 25,
                          color: "#1e3a5f",
                          textAlign: "center",
                        }}
                      >
                        Signed by Business
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 30,
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              margin: 0,
                              marginBottom: 15,
                              color: "#374151",
                            }}
                          >
                            Business Information
                          </h4>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Name:</strong>{" "}
                            {contract.business_name || "Not provided"}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Designation:</strong>{" "}
                            {contract.business_designation || "Not provided"}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Signature:</strong>{" "}
                            {contract.business_signature || "Not provided"}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Date:</strong>{" "}
                            {signedDate}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Phone:</strong>{" "}
                            {contract.business_phone || "Not provided"}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Email:</strong>{" "}
                            {contract.business_email || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <h4
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              margin: 0,
                              marginBottom: 15,
                              color: "#374151",
                            }}
                          >
                            Witness Information
                          </h4>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Signature:</strong>{" "}
                            {contract.business_witness_signature ||
                              "Not provided"}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Phone:</strong>{" "}
                            {contract.business_witness_phone || "Not provided"}
                          </p>
                          <p style={{ margin: "10px 0", fontSize: 13 }}>
                            <strong>Email:</strong>{" "}
                            {contract.business_witness_email || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 20,
                          paddingTop: 20,
                          borderTop: "1px solid #e5e7eb",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          Signed on: {signedDate}
                        </p>
                      </div>
                    </div>
                  </>
                ) : // If we already have a business signature or the status indicates approval,
                // show a concise green "Approved" banner. Otherwise keep the pending banner.
                // contract.business_signature ||
                ["APPROVED", "APPROVE"].includes(
                    (contract.status ?? "").toUpperCase(),
                  ) ? (
                  <div
                    style={{
                      margin: "30px 0",
                      padding: 20,
                      borderRadius: 8,
                      background: "#ecfdf5",
                      border: "1px solid #10b981",
                      textAlign: "center",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "#065f46",
                        fontWeight: 700,
                      }}
                    >
                      Status: Approved
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: 13,
                        color: "#065f46",
                      }}
                    >
                      This agreement has been approved.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      margin: "30px 0",
                      padding: 20,
                      borderRadius: 8,
                      background: "#fff7ed",
                      border: "1px solid #fde3b7",
                      textAlign: "center",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "#92400e",
                        fontWeight: 600,
                      }}
                    >
                      Status: {contract.status}
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: 13,
                        color: "#92400e",
                      }}
                    >
                      This agreement is currently{" "}
                      {contract.status.toLowerCase()}. You will be notified once
                      it is approved.
                    </p>
                  </div>
                )
              ) : null}

              {/* Footer */}
              <div
                style={{
                  background:
                    "linear-gradient(to right, #1e3a5f 0%, #8b3a3a 100%)",
                  padding: "30px 0",
                  color: "white",
                  pageBreakInside: "avoid",
                  marginLeft: 0,
                  marginRight: 0,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 40,
                    padding: "0 20px",
                  }}
                >
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <img
                        src="/images/mypal-logo.png"
                        alt="MyPal"
                        style={{
                          height: 40,
                          width: "auto",
                          filter: "brightness(0) invert(1)",
                        }}
                        onError={(e) =>
                          ((e.target as HTMLImageElement).style.display =
                            "none")
                        }
                      />
                    </div>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        margin: "10px 0",
                      }}
                    >
                      Mypal Incorporation
                    </p>
                    <p style={{ fontSize: 14, margin: "5px 0" }}>
                      Bookings and reservation
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 15,
                        justifyContent: "flex-end",
                        marginBottom: 20,
                      }}
                      className="footer-social-icons"
                    >
                      {/* Social Media Icons - Footer */}
                      <button
                        className="hover:text-blue-300 transition-colors"
                        title="TikTok"
                        onClick={() =>
                          window.open(
                            "https://www.tiktok.com/@mypaldeals?_t=ZS-90fKirE87CC&_r=1",
                            "_blank",
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Facebook size={18} style={{ color: "white" }} />
                      </button>
                      <button
                        className="hover:text-blue-300 transition-colors"
                        title="X"
                        onClick={() =>
                          window.open(
                            "https://x.com/MyPalTrybe?t=3wwVive1XcaIrtS7tanlgw&s=09",
                            "_blank",
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <X size={18} style={{ color: "white" }} />
                      </button>
                      <button
                        className="hover:text-blue-300 transition-colors"
                        title="LinkedIn"
                        onClick={() =>
                          window.open(
                            "https://www.linkedin.com/company/mypal-inc/",
                            "_blank",
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Linkedin size={18} style={{ color: "white" }} />
                      </button>
                      <button
                        className="hover:text-blue-300 transition-colors"
                        title="Instagram"
                        onClick={() =>
                          window.open(
                            "https://www.instagram.com/mypaltrybe_?igsh=MWxlbzNzOWxscGF1cA==",
                            "_blank",
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Instagram size={18} style={{ color: "white" }} />
                      </button>
                    </div>
                    <p style={{ fontSize: 14, margin: "5px 0" }}>
                      18B, Zainab Street, Medina Estate, Gbagada, Lagos
                    </p>
                    <p style={{ fontSize: 14, margin: "5px 0" }}>
                      info@mypal-inc.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2  md:flex-col flex-row-reverse">
          <Button
            variant="default"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          {contract?.status === "PENDING" && (
            <Button onClick={onSign} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Sign & Submit Contract"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
