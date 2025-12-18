
import React from 'react';
import { auth, googleProvider } from '../firebase';

interface LoginProps {
    onGuestLogin: () => void;
    onHelpClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onGuestLogin, onHelpClick }) => {

  const handleSignInClick = async () => {
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("An error occurred during sign-in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-brand-text">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1" />
            </svg>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Alumni Bookkeeping</span>
        </div>
        <button
            onClick={onHelpClick}
            className="text-gray-500 hover:text-brand-primary font-medium transition-colors"
        >
            About
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
                <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block xl:inline">Modern Finance for</span>{' '}
                        <span className="block text-brand-primary xl:inline underline decoration-brand-accent">Alumni Classes</span>
                    </h1>
                    <p className="mt-6 text-base text-gray-500 sm:mt-8 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-8 md:text-xl lg:mx-0">
                        Simplify dues collection, track expenses with total transparency, and keep your classmates connected. The professional ledger built specifically for your reunion committee.
                    </p>
                    <div className="mt-10 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleSignInClick}
                                className="flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-brand-primary hover:bg-brand-secondary shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                                </svg>
                                Sign in with Google
                            </button>
                             <button
                                onClick={onGuestLogin}
                                className="flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-base font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                            >
                                Explore as Guest
                            </button>
                        </div>
                         <p className="mt-5 text-sm text-gray-400">
                            Secure access. No credit card required to explore.
                        </p>
                    </div>
                </div>
                <div className="mt-16 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-5 flex justify-center">
                    <div className="relative mx-auto w-full rounded-3xl shadow-2xl lg:max-w-md overflow-hidden border-8 border-white ring-1 ring-gray-100">
                         <img
                            className="w-full transform hover:scale-110 transition-transform duration-700"
                            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                            alt="Financial Management"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                         <div className="absolute bottom-0 left-0 p-8">
                             <p className="text-white font-bold text-xl mb-1">Built for Transparency</p>
                             <p className="text-gray-200 text-sm opacity-90">Real-time financial status for every classmate.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Feature Sections */}
        <div className="bg-gray-50/50 py-24 sm:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-lg font-semibold text-brand-primary tracking-widest uppercase">Everything you need</h2>
                    <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Designed for Reunion Success
                    </p>
                    <p className="mt-4 text-lg text-gray-500">
                      Manage multiple class years with isolation and professional tools.
                    </p>
                </div>

                <div className="mt-20">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="relative group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="absolute -top-6 left-8">
                                <span className="inline-flex items-center justify-center p-4 bg-brand-primary rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </span>
                            </div>
                            <h3 className="mt-8 text-2xl font-bold text-gray-900">Class Directory</h3>
                            <p className="mt-4 text-base text-gray-500 leading-relaxed">
                                Maintain a secure database of classmates. Track contact information, status, and custom roles. Merge duplicate profiles with our advanced reconciliation tools.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="relative group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                             <div className="absolute -top-6 left-8">
                                <span className="inline-flex items-center justify-center p-4 bg-brand-primary rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </span>
                            </div>
                            <h3 className="mt-8 text-2xl font-bold text-gray-900">Financial Reporting</h3>
                            <p className="mt-4 text-base text-gray-500 leading-relaxed">
                                Generate professional CSV exports and AI-powered email summaries. Categorize dues, donations, and expenses to provide full accountability to your class.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="relative group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                             <div className="absolute -top-6 left-8">
                                <span className="inline-flex items-center justify-center p-4 bg-brand-primary rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                     <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </span>
                            </div>
                            <h3 className="mt-8 text-2xl font-bold text-gray-900">Multi-Class Support</h3>
                            <p className="mt-4 text-base text-gray-500 leading-relaxed">
                                Manage multiple graduation years from a single account. Each Class ID is isolated with its own ledger, directory, and settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center space-x-8 md:order-2">
                <span className="text-sm text-gray-400 hover:text-gray-900 cursor-pointer transition-colors">Privacy</span>
                <span className="text-sm text-gray-400 hover:text-gray-900 cursor-pointer transition-colors">Terms</span>
                <span className="text-sm text-gray-400 hover:text-gray-900 cursor-pointer transition-colors">Support</span>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
                <p className="text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Alumni Bookkeeping Professional. All rights reserved.
                </p>
            </div>
          </div>
      </footer>
    </div>
  );
};

export default Login;
