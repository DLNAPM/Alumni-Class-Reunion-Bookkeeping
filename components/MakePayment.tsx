import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory, Transaction, PaymentType } from '../types';

const MakePayment: React.FC = () => {
  const { user, addTransaction } = useData();
  const [category, setCategory] = useState<PaymentCategory>(PaymentCategory.Dues);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !user) return;

    setStatus('processing');
    
    const newTransaction: Omit<Transaction, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      description: description || `${category} Payment`,
      category: category,
      amount: parseFloat(amount),
      classmateName: user.name,
      paymentType: PaymentType.BankCard, // Credit card payments will be categorized as 'Bank Card'
    };
    
    // Simulate API call
    setTimeout(() => {
      addTransaction(newTransaction);
      setStatus('success');
      setAmount('');
      setDescription('');
      setCategory(PaymentCategory.Dues);
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Make a Payment</h2>
        
        {status === 'success' && (
          <div className="bg-success/10 border-l-4 border-success text-success p-4 mb-6" role="alert">
            <p className="font-bold">Payment Successful!</p>
            <p>Your transaction has been recorded. A receipt has been sent to {user?.email}.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Payment Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PaymentCategory)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm rounded-md"
            >
              {Object.values(PaymentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                className="focus:ring-brand-secondary focus:border-brand-secondary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">USD</span>
              </div>
            </div>
          </div>
          
           <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <input
              type="text"
              name="description"
              id="description"
              className="mt-1 focus:ring-brand-secondary focus:border-brand-secondary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., Reunion deposit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
            <p className="mt-1 text-sm text-gray-500">Enter your credit or debit card details.</p>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div className="sm:col-span-2">
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card number</label>
                <input type="text" id="card-number" placeholder="•••• •••• •••• ••••" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700">Expiration date</label>
                <input type="text" id="expiration-date" placeholder="MM / YY" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                <input type="text" id="cvc" placeholder="•••" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={status === 'processing'}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400"
            >
              {status === 'processing' ? 'Processing...' : `Pay $${parseFloat(amount || '0').toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakePayment;