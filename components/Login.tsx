
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (isAdmin: boolean) => void;
  subtitle: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, subtitle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-auto text-brand-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-brand-text">Alumni Bookkeeping</h2>
          <p className="mt-2 text-md font-medium text-gray-700">{subtitle}</p>
          <p className="mt-2 text-sm text-gray-600">Welcome back, classmate!</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input 
                id="email-address" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-brand-text rounded-t-md focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary focus:z-10 sm:text-sm" 
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-brand-text rounded-b-md focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary focus:z-10 sm:text-sm" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-brand-secondary hover:text-brand-primary">
                Forgot your password?
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              onClick={() => onLogin(false)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-secondary hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition duration-150 ease-in-out"
            >
              Sign in as Classmate
            </button>
            <button
              type="submit"
              onClick={() => onLogin(true)}
              className="group relative w-full flex justify-center py-3 px-4 border border-brand-accent text-sm font-medium rounded-md text-brand-secondary bg-white hover:bg-brand-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition duration-150 ease-in-out"
            >
              Sign in as Administrator
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
