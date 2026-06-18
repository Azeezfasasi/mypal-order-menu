'use client'
import { useAuthStore } from '@/stores/auth-store';
import { BusinessCategoryType } from '@/types/enums';
import { ReactNode, useState } from 'react'

const TableManagementProvider = ({ children }: { children: ReactNode }) => {

    const { business } = useAuthStore();

    const [selectedBusinessType,] = useState(
        business?.category?.business_type,
    );

    if (selectedBusinessType === BusinessCategoryType.FINEDINING || selectedBusinessType === BusinessCategoryType.BUFFET) return children

    return null
    
}

export default TableManagementProvider