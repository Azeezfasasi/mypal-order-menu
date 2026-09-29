'use client'
import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, Link2, Mail, MessageCircle, MoreHorizontal, Printer, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

// Base URL of the customer-facing digital menu; the business id is appended to it
const MENU_BASE_URL = process.env.NEXT_PUBLIC_ORDER_MENU_URL || "https://operations.mypal-inc.com";

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const MenuQrPanel = () => {
    const business = useAuthStore((state) => state.business);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const menuUrl = business?.id ? `${MENU_BASE_URL.replace(/\/$/, "")}/${business.id}` : "";
    const shareText = `View our menu and place your order: ${menuUrl}`;

    const qrDataUrl = () => canvasRef.current?.toDataURL("image/png") ?? "";

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = qrDataUrl();
        link.download = `${business?.business_name || "menu"}-qr-code.png`;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=480,height=600");
        if (!printWindow) {
            toast.error("Allow pop-ups to print the QR code");
            return;
        }
        printWindow.document.write(`
            <html><head><title>Menu QR Code</title></head>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif">
                <h2>${escapeHtml(business?.business_name ?? "")}</h2>
                <img src="${qrDataUrl()}" style="width:300px;height:300px" onload="window.print();window.close()" />
                <p>Scan to view our menu</p>
            </body></html>
        `);
        printWindow.document.close();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl);
            toast.success("Menu link copied");
        } catch {
            toast.error("Could not copy link");
        }
    };

    const handleMore = async () => {
        if (navigator.share) {
            await navigator.share({ title: "Our menu", text: shareText, url: menuUrl }).catch(() => undefined);
        } else {
            handleCopy();
        }
    };

    const shareActions = [
        { label: "WhatsApp", icon: MessageCircle, className: "text-green-600", onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank") },
        { label: "Email", icon: Mail, className: "text-gray-600", onClick: () => window.open(`mailto:?subject=${encodeURIComponent("Our menu")}&body=${encodeURIComponent(shareText)}`) },
        { label: "Copy Link", icon: Link2, className: "text-gray-600", onClick: handleCopy },
        { label: "More", icon: MoreHorizontal, className: "text-gray-600", onClick: handleMore },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-[12px] p-5 space-y-5 h-fit">
            <div>
                <h3 className="font-bold text-gray-800">Menu QR Code</h3>
                <p className="text-xs text-gray-500 mt-1">Let your customers scan the QR code to view the menu and place orders.</p>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className="border border-dashed border-gray-300 rounded-[12px] p-5">
                    {menuUrl ? (
                        <QRCodeCanvas ref={canvasRef} value={menuUrl} size={150} marginSize={1} />
                    ) : (
                        <div className="w-[150px] h-[150px] flex items-center justify-center text-xs text-gray-400 text-center">Business not loaded</div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Scan to view menu</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-600">Active</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDownload} disabled={!menuUrl} className="flex items-center justify-center gap-2 py-2 rounded-[8px] bg-orange-50 text-orange-600 text-sm font-semibold hover:bg-orange-100 disabled:opacity-50">
                    <Download size={15} /> Download
                </button>
                <button onClick={handlePrint} disabled={!menuUrl} className="flex items-center justify-center gap-2 py-2 rounded-[8px] bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 disabled:opacity-50">
                    <Printer size={15} /> Print
                </button>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Share menu link</p>
                <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2.5">
                    <span className="text-xs text-gray-600 truncate">{menuUrl}</span>
                    <button onClick={handleCopy} aria-label="Copy menu link" className="text-gray-400 hover:text-gray-700 shrink-0">
                        <Copy size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-4 pt-1">
                    {shareActions.map((action) => (
                        <button key={action.label} onClick={action.onClick} disabled={!menuUrl} className="flex flex-col items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 disabled:opacity-50">
                            <action.icon size={18} className={action.className} />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 bg-orange-50 border border-orange-200 rounded-[10px] p-3 text-xs text-orange-700">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <p>Orders placed through the digital menu will appear here and sync with the <span className="font-bold">Kitchen</span> in real-time.</p>
            </div>
        </div>
    );
};

export default MenuQrPanel;
