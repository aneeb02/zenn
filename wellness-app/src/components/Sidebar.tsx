'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Activity, 
  Clock, 
  BarChart3, 
  Settings, 
  Users,
  Heart,
  LogOut,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Focus', href: '/focus', icon: Clock },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Wellness', href: '/wellness', icon: Heart },
  { name: 'Friends', href: '/friends', icon: Users },
  { name: 'Activity', href: '/activity', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full z-40
        w-20 lg:w-24
        bg-white/80 backdrop-blur-xl
        border-r border-gray-100
        flex flex-col
        transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8">
          <ul className="space-y-2 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      group relative flex items-center justify-center
                      w-full h-14 rounded-2xl
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        w-6 h-6 transition-all duration-300
                        ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}
                      `} 
                    />
                    
                    {/* Tooltip */}
                    <span className="
                      absolute left-full ml-3 px-3 py-1.5
                      bg-gray-900 text-white text-sm rounded-lg
                      opacity-0 pointer-events-none
                      group-hover:opacity-100 group-hover:pointer-events-auto
                      transition-opacity duration-200
                      whitespace-nowrap
                      hidden lg:block
                    ">
                      {item.name}
                    </span>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -right-3 w-1 h-8 bg-purple-500 rounded-l-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 space-y-2 border-t border-gray-100">
          {/* Settings */}
          <Link
            href="/settings"
            onClick={() => setIsMobileOpen(false)}
            className={`
              group relative flex items-center justify-center
              w-full h-14 rounded-2xl
              transition-all duration-300
              ${pathname === '/settings'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
                : 'hover:bg-gray-100'
              }
            `}
          >
            <Settings 
              className={`
                w-6 h-6 transition-all duration-300
                ${pathname === '/settings' ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}
              `} 
            />
            
            <span className="
              absolute left-full ml-3 px-3 py-1.5
              bg-gray-900 text-white text-sm rounded-lg
              opacity-0 pointer-events-none
              group-hover:opacity-100 group-hover:pointer-events-auto
              transition-opacity duration-200
              whitespace-nowrap
              hidden lg:block
            ">
              Settings
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className="
              group relative flex items-center justify-center
              w-full h-14 rounded-2xl
              transition-all duration-300
              hover:bg-red-50
            "
          >
            <LogOut className="w-6 h-6 text-gray-600 group-hover:text-red-600 transition-colors" />
            
            <span className="
              absolute left-full ml-3 px-3 py-1.5
              bg-gray-900 text-white text-sm rounded-lg
              opacity-0 pointer-events-none
              group-hover:opacity-100 group-hover:pointer-events-auto
              transition-opacity duration-200
              whitespace-nowrap
              hidden lg:block
            ">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
