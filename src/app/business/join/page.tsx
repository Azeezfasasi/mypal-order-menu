import { Suspense } from "react";
import JoinPageContent from "./join-page-content";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying your invite...</p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinPageContent />
    </Suspense>
  );
}
