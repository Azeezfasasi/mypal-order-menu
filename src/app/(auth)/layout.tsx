"use client";

import KybLayout from "@/components/kyb/kyb-layout";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const isKybRoute = pathname.startsWith("/kyb");

  // If it's a KYB route, just render the children without the auth layout
  if (isKybRoute) {
    return <KybLayout>{children}</KybLayout>;
  }

  // Otherwise, render the standard auth layout
  return (
    <div className={`min-h-screen flex md:flex-col ${isLoginRoute ? 'flex-row' : 'flex-row-reverse'} items-stretch bg-white`}>
      
      {/* Left: Logo and Auth Form */}
      <div className="flex flex-col justify-center items-center md:w-full w-1/2 px-8 py-12">
        <Image
          src="/images/mypal-logo.jpg"
          alt="MyPal Logo"
          width={80}
          height={80}
          className="mb-6"
          priority={true}
        />
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right: Background Image & Testimonial */}
      {isLoginRoute ?
        <div className="md:hidden block relative w-1/2 border-r border-gray-300 overflow-hidden">
          <Image
            src="/images/auth-bg.jpg"
            alt="Restaurant Background"
            fill={true}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            priority={true}
          />
          <div className="absolute bottom-8 left-8 right-8 bg-white/60 backdrop-blur-md rounded-xl p-6 shadow-lg flex flex-col gap-2">
            <p className="text-lg md:text-xl text-gray-800 font-medium">
              &quot;Since joining MyPal, I’ve unlocked a world of choices — from
              dining and hangouts to real-time events and exclusive deals. The
              reviews guide me like a trusted insider, and sharing my own
              experiences has built real connections. MyPal isn’t just an app,
              it’s a local guide in every customer’s pocket.&quot;
            </p>
            <div className="mt-4">
              <span className="font-semibold text-gray-900">Tolu Okewowo</span>
              <span className="ml-2 text-gray-600 italic">Investor</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        :
        <div className="md:hidden block relative w-1/2 border-r border-gray-300 overflow-hidden bg-[url(/images/new-auth-bg.svg)] bg-cover" />

      }
    </div>
  );
}