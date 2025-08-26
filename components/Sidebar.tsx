import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

// Fix: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
const NavLink: React.FC<{ icon: React.ReactElement; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-brand-accent text-white'
        : 'text-gray-200 hover:bg-brand-secondary hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isAdmin, onLogout }) => {
  const { logo } = useData();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { name: 'payment', label: 'Make a Payment', icon: <PaymentIcon /> },
    { name: 'transactions', label: 'My Transactions', icon: <TransactionsIcon /> },
  ];

  if (isAdmin) {
    navigation.push({ name: 'admin', label: 'Admin Panel', icon: <AdminIcon /> });
  }

  const sidebarContent = (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center px-4 py-6">
            <img className="h-20 w-20 rounded-full object-cover" src={logo} alt="Class Logo" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
            {navigation.map((item) => (
            <NavLink
                key={item.name}
                label={item.label}
                icon={item.icon}
                isActive={currentPage === item.name}
                onClick={() => { setCurrentPage(item.name); setMobileMenuOpen(false); }}
            />
            ))}
        </nav>
        <div className="px-2 py-4">
             <NavLink
                label="Logout"
                icon={<LogoutIcon />}
                isActive={false}
                onClick={onLogout}
            />
        </div>
    </div>
  );

  return (
    <>
      {/* Mobile Nav */}
      <div className="lg:hidden">
        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="fixed top-4 left-4 z-30 p-2 bg-brand-primary text-white rounded-md">
            <MenuIcon />
        </button>
        <div className={`fixed inset-0 z-20 bg-brand-primary transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
            {sidebarContent}
        </div>
      </div>

      {/* Desktop Nav */}
      <aside className="hidden lg:flex lg:flex-shrink-0 w-64 bg-brand-primary">
          {sidebarContent}
      </aside>
    </>
  );
};


// SVG Icons
const DashboardIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const PaymentIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const TransactionsIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const AdminIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const MenuIcon = () => <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>


export default Sidebar;