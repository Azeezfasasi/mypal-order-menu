import KybVerificationFlow from "@/components/kyb/kyb-verification-flow";
import Loader from "@/components/shared/loading-spinner";
import { Suspense } from "react";

export default function KybPage() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <Loader message="Getting Ready...." />
            </div>
          </div>
        }
      >
        <KybVerificationFlow />
      </Suspense>
    </div>
  );
}
