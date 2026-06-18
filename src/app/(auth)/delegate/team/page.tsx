"use client";

import React, { useState } from 'react';
import { UserCircle2, ShieldAlert } from 'lucide-react';
import { BusinessAuthApi } from '@/services/api/auth-api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DelegationRole {
    id: string;
    title: string;
    responsibilities: string;
    placeholder: string;
    task_type: string;
}

const ROLES: DelegationRole[] = [
    {
        id: 'finance',
        title: 'Finance Manager',
        responsibilities: 'CAC documents · TIN documents · Verification',
        placeholder: 'Finance@company.com',
        task_type: 'FINANCE',
    },
    {
        id: 'social',
        title: 'Social Media Manager',
        responsibilities: 'Media assets · Services & offerings',
        placeholder: 'Social@company.com',
        task_type: 'SOCIAL_MEDIA',
    },
    {
        id: 'content',
        title: 'Content Manager',
        responsibilities: 'Services & offerings · Availability config',
        placeholder: 'Content@company.com',
        task_type: 'CONTENT',
    },
];

const Page = () => {
    const [emails, setEmails] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const router = useRouter();
    const delegateMutation = BusinessAuthApi.useDelegateOnboarding();

    const handleChange = (roleId: string, value: string) => {
        setEmails(prev => ({
            ...prev,
            [roleId]: value
        }));

        // clear error when user starts typing
        setErrors(prev => ({
            ...prev,
            [roleId]: ''
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const filledRoles = ROLES.filter(role =>
            emails[role.id]?.trim()
        );

        // ensure at least one email is entered
        if (filledRoles.length === 0) {
            toast.error('Please add at least one team member email');
            return false;
        }

        // validate only filled fields
        filledRoles.forEach(role => {
            const value = emails[role.id]?.trim();

            if (value && !emailRegex.test(value)) {
                newErrors[role.id] = 'Enter a valid email';
            }
        });

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = () => {
        if (!validate()) return;

        const payload = {
            delegations: ROLES
                .filter(role => emails[role.id]?.trim())
                .map(role => ({
                    task_type: role.task_type,
                    email: emails[role.id].trim()
                }))
        };

        console.log(payload);

        delegateMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Onboarding delegation successful')
                router.push('/login');
            }
        });
    };

    return (
        <div>
            {/* Header */}
            <div>
                <h1 className="text-[28px] font-semibold text-[#1B1818] mb-4 tracking-tight">
                    Assign task to your team
                </h1>
                <p className="text-[#645D5D] text-sm mb-6 leading-relaxed">
                    Enter each team member&apos;s email. They&apos;ll receive an invite with access limited to their responsibilities.
                </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
                {ROLES.map((role) => (
                    <div
                        key={role.id}
                        className="w-full p-3 rounded-[8px] border border-[#FEE1D8] bg-[#FFFCFB]"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <UserCircle2 className="w-7 h-7 text-orange-600" />
                            <div className="flex-1">
                                <h3 className="font-bold text-base">
                                    {role.title}
                                </h3>
                                <p className="text-[13px] mt-1">
                                    {role.responsibilities}
                                </p>
                            </div>
                        </div>

                        <input
                            type="email"
                            value={emails[role.id] || ''}
                            onChange={(e) => handleChange(role.id, e.target.value)}
                            placeholder={role.placeholder}
                            className={`w-full px-4 py-2.5 rounded-[5px] text-sm border ${errors[role.id]
                                ? 'border-red-400'
                                : 'border-orange-200'
                                }`}
                        />

                        {errors[role.id] && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors[role.id]}
                            </p>
                        )}
                    </div>
                ))}

                {/* Notice */}
                <div className="flex items-center gap-4 p-3 rounded-[10px] border border-[#CEDCFB] bg-[#FAFBFF] mt-2">
                    <ShieldAlert className="w-6 h-6 text-orange-500" />
                    <p className="text-[13px]">
                        Accounts & Settlements is restricted to you (Super Admin) only.
                    </p>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-5">
                <button
                    onClick={() => router.push('/delegate')}
                    className="flex-1 py-3 text-sm border border-orange-200 rounded-[5px] font-bold text-orange-600"
                >
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={delegateMutation.isPending}
                    className="flex-[2] py-3 text-sm text-white rounded-[5px] font-bold bg-[#EB5017] disabled:opacity-60"
                >
                    {delegateMutation.isPending ? 'Sending...' : 'Send invites and continue'}
                </button>
            </div>
        </div>
    );
};

export default Page;