'use client'
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

export type Table = {
  name: string,
  seats: number,
  location: string,
  quantity: number,
}

export type BookingRules = {
    turnTime: number;
    minNotice: number;
    autoConfirm: boolean;
    waitlist: boolean;
    deposit: boolean;
    peakPricing: boolean;
};

type ContextType = {
    tables: Table[];
    setTables: (tables: Table[]) => void;
    bookingRules: BookingRules;
    setBookingRules: Dispatch<SetStateAction<BookingRules>>
};

const TableManagementSetupContext = createContext<ContextType | null>(null);

export const useTableManagementSetup = () => {
    const ctx = useContext(TableManagementSetupContext);
    if (!ctx) throw new Error("Use inside provider");
    return ctx;
};

export const TableManagementSetupProvider = ({ children }: { children: ReactNode }) => {

    const [tables, setTables] = useState<Table[]>([]);
    const [bookingRules, setBookingRules] = useState<BookingRules>({
        turnTime: 60,
        minNotice: 15,
        autoConfirm: true,
        waitlist: false,
        deposit: false,
        peakPricing: false,
    });

    return (
        <TableManagementSetupContext.Provider
            value={{ tables, setTables, bookingRules, setBookingRules }}
        >
            {children}
        </TableManagementSetupContext.Provider>
    );
};