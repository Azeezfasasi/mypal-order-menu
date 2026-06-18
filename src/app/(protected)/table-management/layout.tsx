import TableManagementProvider from "@/components/table-management/TableManagementProvider"
import { ReactNode } from "react"

const TableManagementLayout = ({ children }: { children: ReactNode }) => {
    return (
        <TableManagementProvider>
            {children}
        </TableManagementProvider>
    )
}

export default TableManagementLayout