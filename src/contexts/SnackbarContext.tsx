"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface SnackbarContextType {
  showSnackbar: (
    message: string,
    variant?: "success" | "error" | "info",
  ) => void;
  snackbarMessage: string;
  snackbarVariant: "success" | "error" | "info" | null;
  isSnackbarOpen: boolean;
  closeSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined,
);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isSnackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVariant, setSnackbarVariant] = useState<
    "success" | "error" | "info" | null
  >(null);

  const showSnackbar = (
    message: string,
    variant: "success" | "error" | "info" = "info",
  ) => {
    setSnackbarMessage(message);
    setSnackbarVariant(variant);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => setSnackbarOpen(false);

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        snackbarMessage,
        snackbarVariant,
        isSnackbarOpen,
        closeSnackbar,
      }}
    >
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
