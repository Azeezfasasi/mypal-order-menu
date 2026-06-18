
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Users } from "lucide-react";

const Page = () => {
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const [selected, setSelected] = useState<'self' | 'team' | null>(null);


  useEffect(() => {
    const role = localStorage.getItem("member-role");
    setMemberRole(role);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (memberRole === "Finance Manager" || memberRole === "Media Manager" || memberRole === "Content Manager") {
      router.push("/kyb");
    }
  }, [memberRole, router]);

  if (!isLoaded) return (
    <div className="flex items-center justify-center w-full gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading ...
    </div>
  );

  if (!memberRole) {
    return (
      <div className="flex flex-col items-center justify-center bg-white p-6 font-sans">
        <div className="w-full">
          {/* Header Section */}
          <h1 className="text-[28px] font-semibold text-[#1B1818] mb-4 tracking-tight">
            How would you like to proceed?
          </h1>
          <p className="text-[#645D5D] text-sm mb-10 leading-relaxed">
            Your account is ready. You can complete onboarding yourself or invite team members to handle specific tasks.
          </p>

          {/* Card Options */}
          <div className="grid sm:grid-cols-1 grid-cols-2 gap-4 mb-10">
            {/* Continue Myself */}
            <button
              onClick={() => setSelected('self')}
              className={`flex flex-col items-start p-4 rounded-[10px] border-2 transition-all text-left h-full ${selected === 'self'
                ? 'border-orange-500 bg-[#FFECE5]'
                : 'border-transparent bg-[#FFECE5]'
                }`}
            >
              <User className="w-6 h-6 text-orange-600 block mb-8" />
              <h3 className="text-[#1D2739] font-bold text-base mb-2">Continue myself</h3>
              <p className="text-gray-600 text-xs leading-snug">
                Complete all onboarding tasks now, including document uploads and configuration.
              </p>
            </button>

            {/* Assign to team */}
            <button
              onClick={() => setSelected('team')}
              className={`flex flex-col items-start p-4 rounded-[10px] border-2 transition-all text-left h-full ${selected === 'team'
                ? 'border-orange-500 bg-[#FFECE5]'
                : 'border-transparent bg-[#FFECE5]'
                }`}
            >
              <Users className="w-6 h-6 text-orange-600 block mb-8" />
              <h3 className="text-[#1D2739] font-bold text-base mb-2">Delegate to team</h3>
              <p className="text-gray-600 text-xs leading-snug">
                Assign specific tasks to Finance, Social Media, or Content Managers.
              </p>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button onClick={() => router.push("/login")} className="flex-1 py-3 px-3 text-sm border border-orange-200 rounded-[5px] font-bold text-orange-600 hover:bg-orange-50 transition-colors">
              Back
            </button>
            <button
              disabled={!selected}
              onClick={() => {
                if (selected === 'self') {
                  router.push('/kyb');
                } else if (selected === 'team') {
                  router.push('/delegate/team');
                }
              }}
              className={`flex-[2] py-3 px-3 text-sm text-white rounded-[5px] font-bold transition-colors ${selected
                ? 'bg-[#EB5017] cursor-pointer'
                : 'bg-[#D0D5DD] cursor-not-allowed'
                }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (memberRole && (memberRole !== "Finance Manager" && memberRole !== "Media Manager" && memberRole !== "Content Manager")) {
    return <div className="text-center">
      You don&apos;t have access to this page. Please wait for the finance manager to complete business onboarding. <br />
      <button onClick={() => router.push("/login")} className=" mt-2 py-1.5 px-3 text-sm border border-orange-200 rounded-[5px] font-bold text-orange-600 hover:bg-orange-50 transition-colors">
        Back
      </button>
    </div>;
  }

  return (
    <div className="flex items-center justify-center w-full gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading ...
    </div>
  )
};

export default Page;