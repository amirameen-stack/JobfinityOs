import {HatGlasses,FolderOpen,ChartNoAxesCombined,Calendar,Settings,Palette,SunMedium} from 'lucide-react'
type Props = {
  open: boolean;
  onClose: () => void;
};

const SearchModal = ({ open, onClose }: Props) => {
    if(!open) return null
  return (
        <div className="fixed inset-0 z-500 text-white">
                {/* blur background */}
            <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>

                {/* content */}
                <div className="relative w-[60%] h-full bg-[#0F1B2D] flex flex-col items-center justify-between border border-[#1E2738] pt-10 rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full max-w-md">
                        <input type="text" placeholder="Search apps, clients, documents..." className='w-full px-10 py-3 rounded-xl bg-[#1F2A3D] border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent' />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-xs w-full px-10 ">
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#1E375B] p-4 rounded-xl'>
                                <HatGlasses className='text-[#ACC7FF]'/>
                            </div>
                            <div>CRM</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#28225B] p-4 rounded-xl'>
                                <FolderOpen className='text-[#ACC7FF]'/>
                            </div>
                            <div>Agents</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#183B3B] p-4 rounded-xl'>
                                <FolderOpen className='text-[#61DF7E]'/>
                            </div>
                            <div>Documents</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#352132] p-4 rounded-xl'>
                                <SunMedium className='text-[#FFB4AB]'/>
                            </div>
                            <div>Social Media</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#1B3A50] p-4 rounded-xl'>
                                <ChartNoAxesCombined className='text-[#00D0FF]'/>
                            </div>
                            <div>Analytics</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#353937] p-4 rounded-xl'>
                                <Calendar className='text-[#FFC107]'/>
                            </div>
                            <div>Calender</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#343E50] p-4 rounded-xl'>
                                <Settings className='text-[#C2C6D5]'/>
                            </div>
                            <div>Settings</div>
                        </div>
                        <div className="aspect-square flex flex-col gap-2 justify-center items-center bg-[#1F2A3D] rounded-2xl hover:border-[#174F99] hover:border-2">
                            <div className='bg-[#3A4963] p-4 rounded-xl'>
                                <Palette className='text-[#ACC7FF]'/>
                            </div>
                            <div>Theme Engine</div>
                        </div>
                    </div>
                    <div className='bg-[#091426] text-[#717786] w-full flex justify-between px-6 py-3 rounded-b-3xl text-xs'>
                        <div className='flex gap-5'>
                            <p>
                                ACTIVE SESSIONS: 04
                            </p>
                            <p>
                                SYSTEM LOAD: 12%
                            </p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className="text-[#61DF7E]">•</span>
                            <p>NET-OPS NORMAL</p>
                        </div>
                    </div>                    
                </div>
            </div>         
                
        </div>
        )
}

export default SearchModal