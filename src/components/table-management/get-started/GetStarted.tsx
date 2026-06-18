'use client'
import { useState } from "react"
import ProgressSidebar from "./ProgressSidebar"
import ReviewLaunch from "./ReviewLaunch"
import TableSetup from "./TableSetup";
import BookingRules from "./BookingRules";
import image from '../../../../public/images/restaurant-live-image.svg'
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TableManagementSetupProvider } from "@/contexts/table-management-setup-context";

const GetStarted = () => {

    const [step, setStep] = useState<number>(1);

    const goToNext = () => {
        setStep(prev => prev < 4 ? prev + 1 : 4)
    }

    const goToPrev = () => {
        setStep(prev => prev > 1 ? prev - 1 : 1)
    }

    const displayStep = (step: number) => {
        switch (step) {
            case 1:
                return <TableSetup next={goToNext} prev={goToPrev} />
            case 2:
                return <BookingRules next={goToNext} prev={goToPrev} />
            case 3:
                return <ReviewLaunch prev={goToPrev} />
            default:
                break;
        }
    }

    return (
        <TableManagementSetupProvider>
            <div>
                <h1 className='text-[22px] font-semibold mb-5'>Let&apos;s get you started</h1>

                {step < 4 ?
                    <div className='grid grid-cols-[310px_auto] md:grid-cols-1 gap-5'>
                        <ProgressSidebar step={step} />
                        {displayStep(step)}
                    </div>
                    :
                    <div className="w-full rounded-[10px] border border-[#E4E7EC] h-[400px] flex flex-col gap-3 items-center justify-center md:p-4">
                        <Image src={image} alt="" className="md:w-6/10" />
                        <h2 className="font-semibold text-[24px] md:text-xl text-[#1A1A21]">Your Restaurant is Live!</h2>
                        <p className="text-[#8C94A6] text-center md:text-sm w-2/5 lg:w-full">Your availability grid is ready. Guest can start booking and your week view is populated</p>
                        <Button className="mt-2">Continue</Button>
                    </div>
                }
            </div>
        </TableManagementSetupProvider>
    )
}

export default GetStarted