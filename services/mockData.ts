
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
    
    let amount: number;
    if ([PaymentCategory.Expense, PaymentCategory.BankMaintFee, PaymentCategory.Bereavement].includes(category)) {
      amount = -(Math.floor(Math.random() * 150) + 7); // Expenses are negative
    } else if (category === PaymentCategory.Fundraiser) {
      amount = Math.floor(Math.random() * 200) + 20;
    } else {
      amount = Math.floor(Math.random() * 100) + 25;
    }


    const transaction: Transaction = {
      // Fix: The transaction ID must be a string. Converted the number `i` to a string.
      id: i.toString(),
      date: randomDate.toISOString().split('T')[0],
      description: `${category} Payment`,
      category: category,
      paymentType: paymentType,
      amount: amount,
      classmateName: classmates[Math.floor(Math.random() * classmates.length)],
    };
    
    const typesWithTxId = [
      PaymentType.PayPal,
      PaymentType.CashApp,
      PaymentType.Zelle,
      PaymentType.Suntrust,
      PaymentType.Truist,
      PaymentType.BankCard,
    ];

    if (typesWithTxId.includes(paymentType)) {
      transaction.transactionId = Math.random().toString(36).substring(2, 15).toUpperCase();
    }
    
    transactions.push(transaction);
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
