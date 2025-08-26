import { PaymentCategory, Transaction, PaymentType } from '../types';

const classmates = [
  'Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt',
  'Fiona Glenanne', 'George Costanza', 'Holly Golightly', 'Ian Malcolm', 'Jane Eyre'
];

export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const categories = Object.values(PaymentCategory);
  const paymentTypes = Object.values(PaymentType);
  const startDate = new Date('2021-01-01');
  const endDate = new Date();

  for (let i = 1; i <= 150; i++) {
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const category = categories[Math.floor(Math.random() * categories.length)];
    const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
    const amount = category === PaymentCategory.Fundraiser 
      ? Math.floor(Math.random() * 200) + 20 
      : Math.floor(Math.random() * 100) + 25;

    transactions.push({
      id: i,
      date: randomDate.toISOString().split('T')[0],
      description: `${category} Payment`,
      category: category,
      paymentType: paymentType,
      amount: amount,
      classmateName: classmates[Math.floor(Math.random() * classmates.length)],
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};