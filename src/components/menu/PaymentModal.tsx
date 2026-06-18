"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  X, 
  CreditCard, 
  Building2, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2,
  Printer
} from "lucide-react";

type Step = "SELECT_METHOD" | "ENTER_EMAIL" | "SUCCESS";
type PaymentMethod = "card" | "transfer" | "app";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<Step>("SELECT_METHOD");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [email, setEmail] = useState("useremail@gmail.com");

  // Reset states when modal completely closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => setStep("SELECT_METHOD"), 300);
    }
  };

  const handleContinue = () => {
    if (step === "SELECT_METHOD") {
      if (selectedMethod === "app") {
        setStep("ENTER_EMAIL");
      } else {
        // Handle logic for other methods or direct success for this demo
        setStep("SUCCESS");
      }
    } else if (step === "ENTER_EMAIL") {
      setStep("SUCCESS");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[95dvh] overflow-auto w-[calc(100%-32px)] p-6 gap-0 rounded-2xl bg-white border-none shadow-xl outline-none sm:rounded-2xl [&>button]:hidden">
        
        {/* Header Block */}
        <div className="flex items-center justify-between pb-4">
          <DialogTitle className="text-lg font-bold text-[#111928]">
            Payment
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 border border-orange-200 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Dynamic Wizard Steps */}
        {step === "SELECT_METHOD" && (
          <div className="space-y-5">
            {/* Invoice Summary Box */}
            <div className="bg-[#EEF4FF] rounded-xl p-4 font-sans text-sm text-[#374151] relative overflow-visible">
              <div className="flex justify-between items-center py-1.5">
                <span>Subtotal</span>
                <span className="font-medium">₦ 68,000</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-gray-500">
                <span>Service (5%)</span>
                <span>₦ 15,000</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-gray-500 pb-3">
                <span>VAT (7.5%)</span>
                <span>₦ 15,000</span>
              </div>
              
              <div className="border-t border-dashed border-gray-300 my-1"></div>
              
              <div className="flex justify-between items-center pt-3 text-base">
                <span className="font-bold text-[#111928]">TOTAL</span>
                <span className="font-extrabold text-[#D93F0B] text-xl">₦ 3,900</span>
              </div>
            </div>

            {/* Payment Options Selection List */}
            <div className="space-y-3">
              {/* Card Payment */}
              <button
                onClick={() => setSelectedMethod("card")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  selectedMethod === "card"
                    ? "border-[#D93F0B] bg-white shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-[#D93F0B] rounded-xl">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111928] text-sm">Card Payment</p>
                    <p className="text-xs text-gray-500 mt-0.5">Visa, Mastercard, AMEX</p>
                  </div>
                </div>
                {selectedMethod === "card" && (
                  <CheckCircle2 className="h-5 w-5 text-[#D93F0B] fill-[#D93F0B] stroke-white" />
                )}
              </button>

              {/* Bank Transfer */}
              <button
                onClick={() => setSelectedMethod("transfer")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  selectedMethod === "transfer"
                    ? "border-[#D93F0B] bg-white shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 text-gray-500 rounded-xl">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111928] text-sm">Bank Transfer</p>
                    <p className="text-xs text-gray-500 mt-0.5">Instant confirmation via mobile app</p>
                  </div>
                </div>
                {selectedMethod === "transfer" && (
                  <CheckCircle2 className="h-5 w-5 text-[#D93F0B] fill-[#D93F0B] stroke-white" />
                )}
              </button>

              {/* Send Payment to Customer App */}
              <button
                onClick={() => setSelectedMethod("app")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  selectedMethod === "app"
                    ? "border-[#D93F0B] bg-white shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 text-gray-500 rounded-xl">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111928] text-sm">Send payment to Customer app</p>
                    <p className="text-xs text-gray-500 mt-0.5">Allow customer to make payment through mobile app</p>
                  </div>
                </div>
                {selectedMethod === "app" && (
                  <CheckCircle2 className="h-5 w-5 text-[#D93F0B] fill-[#D93F0B] stroke-white" />
                )}
              </button>
            </div>

            {/* Action Buttons & Fine Print */}
            <div className="pt-2 space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-[#D93F0B] hover:bg-[#b83206] text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                Continue <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
              <p className="text-[11px] text-center text-gray-500 leading-relaxed max-w-[320px] mx-auto">
                By clicking &ldquo;Process Payment&rdquo; you agree to our service terms.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Email Configuration View */}
        {step === "ENTER_EMAIL" && (
          <div className="flex flex-col items-center pt-2 space-y-6">
            {/* Custom Printer Graphic Mock */}
            <div className="relative w-32 h-32 flex items-center justify-center bg-orange-50/50 rounded-full">
              <div className="p-5 bg-orange-100/60 rounded-2xl relative text-orange-500">
                <Printer className="h-12 w-12 stroke-[1.5]" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D93F0B] text-[10px] font-bold text-white">
                  !
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <h3 className="text-xl font-bold text-[#111928] text-left">
                Enter customer&rsquo;s email to continue
              </h3>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-orange-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#D93F0B] transition-all text-sm shadow-inner"
                placeholder="email@example.com"
              />
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-[#D93F0B] hover:bg-[#b83206] text-white font-medium py-3.5 px-4 rounded-xl transition-colors text-sm mt-2"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Success Confirmation View */}
        {step === "SUCCESS" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Multi-layered gradient success checkmark box */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-orange-500 p-[1px] shadow-md">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="w-[calc(100%-6px)] h-[calc(100%-6px)] bg-gradient-to-b from-[#ff7e47] to-[#e0450a] rounded-full flex items-center justify-center">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#111928]">Sent!</h3>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}