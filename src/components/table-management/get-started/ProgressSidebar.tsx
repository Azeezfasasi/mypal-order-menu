
const menu = [
    { step: 1, title: 'Table Setup' },
    { step: 2, title: 'Booking Rules' },
    { step: 3, title: 'Review and Launch' }
]

const ProgressSidebar = ({ step }: { step: number }) => {

    return (
        <div className='md:hidden w-full h-full min-h-[500px] bg-white border border-[#E4E7EC] rounded-[10px] p-7 space-y-7 flex flex-col justify-between'>
            <div className="space-y-5">
                {menu.map((menu) => (
                    <div key={menu.step} className="flex items-center gap-3 font-semibold">
                        <div className={`${menu.step === step ? 'text-white bg-[#F56630]' : 'text-[#98A2B3] border border-[#98A2B3]'} w-11 h-11 rounded-full flex items-center justify-center text-lg`}>
                            {menu.step}
                        </div>
                        {menu.title}
                    </div>
                ))}
            </div>
            <div className="">
                <h3 className="font-semibold text-[#344054]">Need Help?</h3>
                <p className="text-sm text-[#98A2B3]">Get to know how your campaign can reach a wider audience</p>
                <button className="border border-[#667185] text-[#667185] font-semibold px-4 py-2 rounded-[8px] text-sm mt-3">Contact Us</button>
            </div>
        </div>
    )
}

export default ProgressSidebar