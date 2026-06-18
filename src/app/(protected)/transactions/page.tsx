"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { transactions } from "@/data/sample-data";
import { getStatusClass } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FilterIcon,
  Search,
} from "lucide-react";

export default function TransactionManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction management</h1>
          <p className="text-gray-600">
            View key metrics and performance of your business
          </p>
        </div>
        <Button className="bg-primary-50 text-primary-600 hover:bg-primary-100">
          View Order Status
        </Button>
      </div>

      {/* Revenue Card */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
        <Card className="bg-[#001529] text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">Total revenue generated</p>
                <h2 className="text-4xl font-bold">
                  ₦ 23,000,000<span className="text-gray-400">.00</span>
                </h2>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                >
                  Last month <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#001529] text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">Total revenue generated</p>
                <h2 className="text-4xl font-bold">
                  ₦ 23,000,000<span className="text-gray-400">.00</span>
                </h2>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                >
                  Last month <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm bg-primary-500"></div>
            <h2 className="text-xl font-semibold">Transaction history</h2>
          </div>
          {/* <Button variant="outline" className="gap-2">
            <DownloadIcon className="h-4 w-4" /> Download PDF
          </Button> */}
        </div>

        <div className="flex flex-wrap gap-4 md:flex-col">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search here..." className="pl-10" />
          </div>

          <div className="flex gap-2 md:flex-wrap">
            <Button variant="outline" className="gap-2">
              <FilterIcon className="h-4 w-4" /> Filter by
            </Button>
            <Button variant="outline">Last 7 days</Button>
            <Button variant="outline" className="gap-2">
              Select dates <ChevronDown className="h-4 w-4" />
            </Button>
            <Button className="bg-primary-600 hover:bg-primary-700">
              View all
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Order status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={transaction.avatar}
                        alt={transaction.name}
                      />
                      <AvatarFallback>
                        {transaction.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{transaction.name}</span>
                  </div>
                </TableCell>
                <TableCell>{transaction.orderId}</TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell className="text-primary-600 font-medium">
                  ₦{transaction.amount}
                </TableCell>
                <TableCell>
                  <span className={getStatusClass(transaction.status)}>
                    {transaction.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  >
                    View details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between md:flex-col md:gap-4">
          <div className="text-sm text-gray-500">Page 1 of 20</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" className="gap-1">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
