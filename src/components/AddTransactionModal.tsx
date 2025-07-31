import React, { useState, useEffect } from 'react';
import { Transaction, Account, FinancialCategory, Provider, PurchaseProduct } from '../types';
import { useCrm } from '../store/crmStore';
import Modal from './Modal';
import { XIcon } from './Icons';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionToEdit?: Transaction | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, transactionToEdit }) => {
    const {
        accounts,
        financialCategories,
        providers,
        purchaseProducts,
        addTransaction,
        updateTransaction,
        showAlert
    } = useCrm();

    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [providerId, setProviderId] = useState('');
    const [purchaseProductId, setPurchaseProductId] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (transactionToEdit) {
                setType(transactionToEdit.type);
                setAmount(String(transactionToEdit.amount));
                setDate(transactionToEdit.date);
                setDescription(transactionToEdit.description);
                setAccountId(transactionToEdit.accountId);
                setCategoryId(transactionToEdit.categoryId);
                setProviderId(transactionToEdit.providerId || '');
                setPurchaseProductId(transactionToEdit.purchaseProductId || '');
            } else {
                // Reset form to defaults
                setType('expense');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('');
                setAccountId(accounts[0]?.id || '');
                setCategoryId('');
                setProviderId('');
                setPurchaseProductId('');
            }
        }
    }, [transactionToEdit, isOpen, accounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId || !categoryId || !amount || Number(amount) <= 0) {
            showAlert('Campos requeridos', 'Por favor, complete los campos de Cuenta, Categoría y un Monto válido.');
            return;
        }

        const transactionData = {
            amount: Number(amount),
            date,
            description,
            type,
            accountId,
            categoryId,
            providerId: providerId || undefined,
            purchaseProductId: purchaseProductId || undefined,
        };

        try {
            if (transactionToEdit) {
                await updateTransaction({ ...transactionToEdit, ...transactionData });
            } else {
                await addTransaction(transactionData);
            }
            onClose();
        } catch (error) {
            console.error("Error saving transaction:", error);
            showAlert('Error', 'No se pudo guardar la transacción.');
        }
    };

    // Filter categories based on selected transaction type
    const filteredCategories = financialCategories.filter(c => c.type === type);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-slate-800">{transactionToEdit ? 'Editar' : 'Agregar'} Transacción</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Type */}
                    <div className="flex items-center space-x-4">
                        <label className="block text-sm font-medium text-slate-700">Tipo:</label>
                        <div className="flex items-center">
                            <input type="radio" id="expense" name="type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                            <label htmlFor="expense" className="ml-2 block text-sm text-slate-900">Gasto</label>
                        </div>
                        <div className="flex items-center">
                            <input type="radio" id="income" name="type" value="income" checked={type === 'income'} onChange={() => setType('income')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"/>
                            <label htmlFor="income" className="ml-2 block text-sm text-slate-900">Ingreso</label>
                        </div>
                    </div>

                    {/* Amount and Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Monto</label>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-700">Fecha</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ej: Pago de nómina" />
                    </div>

                    {/* Account */}
                    <div>
                        <label htmlFor="account" className="block text-sm font-medium text-slate-700">Cuenta</label>
                        <select id="account" value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            <option value="">Seleccionar cuenta...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Categoría</label>
                        <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            <option value="">Seleccionar categoría...</option>
                            {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>

                    {/* Provider */}
                    <div>
                        <label htmlFor="provider" className="block text-sm font-medium text-slate-700">Proveedor (Opcional)</label>
                        <select id="provider" value={providerId} onChange={e => setProviderId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            <option value="">Seleccionar proveedor...</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Purchase Product */}
                    <div>
                        <label htmlFor="purchaseProduct" className="block text-sm font-medium text-slate-700">Producto de Compra (Opcional)</label>
                        <select id="purchaseProduct" value={purchaseProductId} onChange={e => setPurchaseProductId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            <option value="">Seleccionar producto...</option>
                            {purchaseProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            {transactionToEdit ? 'Guardar Cambios' : 'Agregar Transacción'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddTransactionModal;
