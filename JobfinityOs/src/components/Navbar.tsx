import { Search, Bell, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchModal from './modals/SearchModal'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <nav className='flex justify-between bg-[#060F1C] px-3 py-1.5 text-sm'>
      <div className='flex justify-center items-center gap-2 text-[#6FA3B8]'>
        <span className="text-white font-semibold tracking-tight">JobfinityOS</span>
        <span className="text-[#1e3a5a]">—</span>
        <span className="text-[#3a5a7a] text-xs">CRM</span>
      </div>
      <div className='flex justify-center items-center gap-4 text-[#6FA3B8]'>
        <button onClick={() => setOpen(true)} className="hover:text-white transition-colors" title="Search">
          <Search size={18} />
        </button>
        <SearchModal open={open} onClose={() => setOpen(false)} />
        <button className="hover:text-white transition-colors" title="Notifications">
          <Bell size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="hover:text-red-400 transition-colors"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  )
}

export default Navbar
