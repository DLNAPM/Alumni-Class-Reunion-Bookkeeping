
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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 flex justify-between items-center">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-32">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block xl:inline">Modern Finance for</span>{' '}
                        <span className="block text-brand-primary xl:inline">Alumni Classes</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                        Simplify dues collection, track expenses transparency, and keep your classmates connected. The professional ledger built for your reunion committee.
                    </p>
                    <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                         <div className="space-y-4">
                            <button
                                onClick={handleSignInClick}
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transition-all"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                                </svg>
                                Sign in with Google
                            </button>
                             <button
                                onClick={onGuestLogin}
                                className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                                Continue as Guest
                            </button>
                        </div>
                         <p className="mt-3 text-sm text-gray-400">
                            Secure access via Google Authentication.
                        </p>
                    </div>
                </div>
                <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                    <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                        <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                             <img
                                className="w-full"
                                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                                alt="Financial Dashboard"
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-40"></div>
                             <div className="absolute bottom-0 left-0 p-6">
                                 <p className="text-white font-semibold text-lg">Transparent Financials</p>
                                 <p className="text-gray-200 text-sm">Real-time reporting for every classmate.</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Feature Sections */}
        <div className="bg-gray-50 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base font-semibold text-brand-primary tracking-wide uppercase">Features</h2>
                    <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">
                        Everything you need to manage your class.
                    </p>
                </div>

                <div className="mt-16">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="pt-6">
                            <div className="flow-root bg-white rounded-lg px-6 pb-8">
                                <div className="-mt-6">
                                    <div>
                                        <span className="inline-flex items-center justify-center p-3 bg-brand-primary rounded-md shadow-lg">
                                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 3.666V14h-6v-3.334H5V18h14v-7.334h-2.999V7H15zM9 7H6v3.334h3V7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Classmate Management</h3>
                                    <p className="mt-5 text-base text-gray-500">
                                        Maintain an up-to-date directory of all classmates. Track contact info, roles, and status in one secure place.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="pt-6">
                             <div className="flow-root bg-white rounded-lg px-6 pb-8">
                                <div className="-mt-6">
                                    <div>
                                        <span className="inline-flex items-center justify-center p-3 bg-brand-primary rounded-md shadow-lg">
                                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1" />
                                            </svg>
                                        </span>
                                    </div>
                                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Financial Tracking</h3>
                                    <p className="mt-5 text-base text-gray-500">
                                        Record dues, donations, and expenses with ease. Generate transparent reports so everyone knows how funds are used.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="pt-6">
                             <div className="flow-root bg-white rounded-lg px-6 pb-8">
                                <div className="-mt-6">
                                    <div>
                                        <span className="inline-flex items-center justify-center p-3 bg-brand-primary rounded-md shadow-lg">
                                             <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                        </span>
                                    </div>
                                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Events & Announcements</h3>
                                    <p className="mt-5 text-base text-gray-500">
                                        Keep the class informed about reunions, picnics, and fundraisers. Embed Facebook posts or create custom announcements.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8 border-t border-gray-200">
            <div className="flex justify-center space-x-6 md:order-2">
                <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Privacy Policy</span>
                <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Terms of Service</span>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
                <p className="text-center text-base text-gray-400">
                &copy; {new Date().getFullYear()} Alumni Bookkeeping App. All rights reserved.
                </p>
            </div>
          </div>
      </footer>
    </div>
  );
};

export default Login;
