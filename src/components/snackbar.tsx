"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import React, { useEffect } from "react";

const Snackbar: React.FC = () => {
  const { snackbarMessage, snackbarVariant, isSnackbarOpen, closeSnackbar } =
    useSnackbar();

  useEffect(() => {
    if (isSnackbarOpen) {
      const timer = setTimeout(() => {
        closeSnackbar();
      }, 3000); // Auto close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isSnackbarOpen, closeSnackbar]);

  if (!isSnackbarOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 20px",
        backgroundColor:
          snackbarVariant === "success"
            ? "green"
            : snackbarVariant === "error"
              ? "red"
              : "blue",
        color: "white",
        borderRadius: "5px",
        opacity: 0.9,
        transition: "opacity 0.5s ease",
      }}
    >
      <span>{snackbarMessage}</span>
    </div>
  );
};

export default Snackbar;
