import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PaymentCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fix: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-brand-accent p-3 rounded-full text-white">{icon}</div>
    <div className="ml-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-brand-text">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { classBalance, transactions, announcements } = useData();

  const chartData = useMemo(() => {
    const yearlyData: { [year: string]: { donations: number; payments: number } } = {};

    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear().toString();
      if (!yearlyData[year]) {
        yearlyData[year] = { donations: 0, payments: 0 };
      }
      if (t.category === PaymentCategory.Donation) {
        yearlyData[year].donations += t.amount;
      } else {
        yearlyData[year].payments += t.amount;
      }
    });

    return Object.entries(yearlyData)
      .map(([year, data]) => ({ year, ...data }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year))
      .slice(-5); // Show last 5 years
  }, [transactions]);

  const totalDonations = useMemo(() => {
      return transactions
          .filter(t => t.category === PaymentCategory.Donation)
          .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Class Account Balance" 
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(classBalance)}
          icon={<BalanceIcon />}
        />
        <StatCard 
          title="Total Donations Received" 
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalDonations)}
          icon={<DonationIcon />}
        />
         <StatCard 
          title="Total Transactions" 
          value={transactions.length.toString()}
          icon={<TransactionsIcon />}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Yearly Contributions</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
              <Legend />
              <Bar dataKey="donations" fill="#4CAF50" name="Donations" />
              <Bar dataKey="payments" fill="#1976D2" name="Other Payments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Announcements</h3>
        <div className="space-y-4">
          {announcements.slice(0, 3).map((ann) => (
            <div key={ann.id} className="border-l-4 border-brand-accent p-4 bg-gray-50 rounded-r-lg">
              <h4 className="font-bold">{ann.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(ann.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// SVG Icons
const BalanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1m0-1v-1" /></svg>;
const DonationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const TransactionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

export default Dashboard;