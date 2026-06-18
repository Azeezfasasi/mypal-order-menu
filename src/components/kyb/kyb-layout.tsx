import type { ReactNode } from "react";

interface KybLayoutProps {
  children: ReactNode;
  welcomeMessage?: boolean;
}

export default function KybLayout({
  children,
  welcomeMessage = true,
}: KybLayoutProps) {
  return (
    <div className="flex min-h-screen  md:flex-col">
      <div className="flex-1 p-10 md:p-6 sm:p-4">
        <div className="mx-auto max-w-2xl">{children}</div>
      </div>

      {welcomeMessage && (
        <div className="relative flex-1 bg-[url('/images/auth-bg.jpg')] bg-cover bg-center md:hidden rounded-md overflow-clip">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-8 text-white">
            <h2 className="mb-4 text-4xl font-bold font-sora">
              <span className="">MY</span>
              <span className="text-primary">Pal</span>
            </h2>
            <div className="mb-4 mt-8 text-center">
              <h3 className="mb-4 text-lg text-gray-300">MyPal for Business</h3>
              <div className="flex items-center justify-center gap-2">
                <span className="text-yellow-400 text-2xl">👍</span>
                <p className="text-2xl font-bold font-sora">
                  Thank you for Signing up...
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-md text-center text-gray-200">
              Effortlessly handle your bookings and reservations while gaining a
              comprehensive overview of your business. Streamline your
              operations with our intuitive booking management system.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
