
import React from 'react';
import { useData } from '../context/DataContext';

const Header: React.FC = () => {
  const { user, subtitle } = useData();

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div>
        <h1 className="text-lg font-bold text-brand-primary">Alumni Bookkeeping</h1>
        <p className="text-sm text-gray-600 -mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 mr-3 hidden sm:inline">Welcome, {user?.name}</span>
        <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold">
          {user?.name.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Header;
