import React, { useMemo, useState } from 'react';
import { useCrm } from '../store/crmStore';
import { PlusIcon, EditIcon, TrashIcon, CopyIcon } from '../components/Icons';
import { Transaction } from '../types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

const TransactionList: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const { showAddEditTransaction, deleteTransaction, cloneTransaction, showConfirmation, financialCategories, accounts } = useCrm();

    const getCategoryName = (id: string) => financialCategories.find(c => c.id === id)?.name || 'N/A';
    const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'N/A';

    const handleDelete = (id: string) => {
        showConfirmation('¿Estás seguro de que quieres eliminar esta transacción?', () => {
            deleteTransaction(id);
        });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mt-8">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Fecha</th>
                            <th scope="col" className="px-6 py-3">Descripción</th>
                            <th scope="col" className="px-6 py-3">Cuenta</th>
                            <th scope="col" className="px-6 py-3">Categoría</th>
                            <th scope="col" className="px-6 py-3 text-right">Monto</th>
                            <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">{tx.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{tx.description}</td>
                                <td className="px-6 py-4">{getAccountName(tx.accountId)}</td>
                                <td className="px-6 py-4">{getCategoryName(tx.categoryId)}</td>
                                <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => showAddEditTransaction(tx)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => cloneTransaction(tx.id)} className="text-gray-600 hover:text-gray-800"><CopyIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const FinancialsPage: React.FC = () => {
  const { accounts, transactions, showAddEditTransaction } = useCrm();

  const accountBalances = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const balance = accountTransactions.reduce((bal, tx) => {
        if (tx.type === 'income') {
          return bal + tx.amount;
        }
        return bal - tx.amount;
      }, account.initialBalance);
      return { ...account, balance };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, transactions]);

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Resumen Financiero</h1>
        <div>
            <button
              // TODO: Implement onClick={() => showAddAccountModal(true)}
              className="bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-slate-300 hover:bg-slate-100 flex items-center mr-2"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Agregar Cuenta
            </button>
            <button
              onClick={() => showAddEditTransaction()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Agregar Transacción
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountBalances.map(account => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold text-slate-700">{account.name}</h2>
                    <p className="text-sm text-slate-500 capitalize">{account.type}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                    {/* <MoreVerticalIcon className="w-5 h-5" /> */}
                </button>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-4">
              {formatCurrency(account.balance)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Transacciones Recientes</h2>
        <TransactionList transactions={transactions.slice(0, 20)} /> {/* Show recent 20 for now */}
      </div>
    </div>
  );
};

export default FinancialsPage;
