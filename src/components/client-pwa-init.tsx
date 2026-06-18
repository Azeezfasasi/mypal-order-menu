"use client";

import InstallPrompt from "@/components/install-prompt";
import { registerServiceWorker } from "@/lib/register-sw";
import { useEffect } from "react";

export default function ClientPWAInit() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <InstallPrompt />;
}
