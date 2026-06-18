'use client'

import { useState } from "react"
import Header from "@/components/menu/Header"
import PlaceOrder from "@/components/menu/PlaceOrder"
import ViewOrders from "@/components/menu/ViewOrders"
import { FilePlus, ScrollText } from "lucide-react"

const Page = () => {
  const [activeTab, setActiveTab] = useState("place-order")

  return (
    <div>
      <Header />

      <div className="w-full flex items-center border-b border-gray-300">
        <button
          onClick={() => setActiveTab("place-order")}
          className={`px-8 py-2 text-[15px] flex items-center gap-3 font-medium border-b-2 transition-all ${activeTab === "place-order"
              ? "text-orange-500 border-orange-500"
              : "text-gray-500 border-transparent"
            }`}
        >
          <FilePlus className="sm:hidden" size={18} />
          Place Order
        </button>

        <button
          onClick={() => setActiveTab("view-order")}
          className={`px-8 py-2 text-[15px] flex items-center gap-3 font-medium border-b-2 transition-all ${activeTab === "view-order"
              ? "text-orange-500 border-orange-500"
              : "text-gray-500 border-transparent"
            }`}
        >
          <ScrollText className="sm:hidden" size={18} />
          View Orders
        </button>
      </div>

      <div className="pt-6">
        {activeTab === "place-order" && <PlaceOrder />}
        {activeTab === "view-order" && <ViewOrders />}
      </div>
    </div>
  )
}

export default Page