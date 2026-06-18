import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Onboarding - MyPal",
  description: "Complete your business onboarding with MyPal",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
