'use client'
import { TableManagementApi } from "@/services/api/table-management-api"
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TableManagement = () => {
  const { data, isLoading } = TableManagementApi.useCheckHasTableStatus();
  const router = useRouter();

  const hasTables = data?.data;

  useEffect(() => {
    if (!isLoading && hasTables === false) {
      router.push('/table-management/get-started');
      return;
    }

    if (hasTables) {
      router.push('/table-management/view')
    }

  }, [hasTables, isLoading, router]);


  return (
    <div className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      loading . . .
    </div>
  );

}

export default TableManagement