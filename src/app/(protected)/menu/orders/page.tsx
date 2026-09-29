'use client'

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Header, { MenuActions } from "@/components/menu/Header"
import PlaceOrder from "@/components/menu/PlaceOrder"
import ViewOrders from "@/components/menu/ViewOrders"
import { ClipboardList, Eye } from "lucide-react"

const OrdersContent = () => {
  const searchParams = useSearchParams()
  const initialTableId = searchParams.get("table") ?? undefined
  const [activeTab, setActiveTab] = useState("place-order")

  const tabs = [
    { id: "place-order", label: "Place Order", icon: ClipboardList },
    { id: "view-order", label: "View Orders", icon: Eye },
  ]

  return (
    <div>
      <Header showActions={false} />

      <div className="flex items-center justify-between gap-4 mb-6 md:flex-col md:items-start">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm flex items-center gap-2 font-medium rounded-[8px] transition-colors ${activeTab === tab.id
                ? "text-orange-600"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <MenuActions />
      </div>

      {activeTab === "place-order" && <PlaceOrder initialTableId={initialTableId} />}
      {activeTab === "view-order" && <ViewOrders />}
    </div>
  )
}

const Page = () => (
  <Suspense>
    <OrdersContent />
  </Suspense>
)

export default Page
