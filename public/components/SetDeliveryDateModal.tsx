
import React, { useState, useEffect } from 'react';
import { useCrm, formatDate } from '../store/crmStore';
import { Deal } from '../types';
import Modal from './Modal';
import RobustDatePicker from './RobustDatePicker';
import { CalendarIcon } from './Icons';

interface SetDeliveryDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal: Deal | null;
}

const SetDeliveryDateModal: React.FC<SetDeliveryDateModalProps> = ({ isOpen, onClose, deal }) => {
    const { updateDeal } = useCrm();
    const [deliveryDate, setDeliveryDate] = useState('');

    useEffect(() => {
        if (deal && deal.deliveryDate) {
            setDeliveryDate(deal.deliveryDate.split('T')[0]);
        } else {
            setDeliveryDate('');
        }
    }, [deal, isOpen]);

    if (!deal) return null;

    const handleSubmit = () => {
        if (!deliveryDate) {
            alert("Please select a delivery date.");
            return;
        }
        updateDeal(deal.id, (prevDeal) => ({
            ...prevDeal,
            deliveryDate,
        }));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Establecer fecha de entrega">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Establece la fecha de entrega para el deal <span className="font-semibold">{deal.title}</span>.
                </p>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Fecha de entrega</label>
                    <RobustDatePicker value={deliveryDate} onChange={setDeliveryDate}>
                         <div className="mt-1 flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-left w-full">
                            <span className={deliveryDate ? 'text-slate-800' : 'text-slate-400'}>
                                {deliveryDate ? formatDate(deliveryDate) : 'Seleccionar fecha'}
                            </span>
                            <CalendarIcon className="h-5 w-5 text-slate-400" />
                        </div>
                    </RobustDatePicker>
                </div>
                 <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Guardar</button>
                </div>
            </div>
        </Modal>
    );
};

export default SetDeliveryDateModal;