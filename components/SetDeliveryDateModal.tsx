import React, { useState, useEffect, useMemo } from 'react';
import { useCrm, formatDate, addWorkingDays } from '../store/crmStore';
import { Deal } from '../types';
import Modal from './Modal';
import { CalendarIcon } from './Icons';
import RobustDatePicker from './RobustDatePicker';

interface SetDeliveryDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal: Deal | null;
}

const SetDeliveryDateModal: React.FC<SetDeliveryDateModalProps> = ({ isOpen, onClose, deal }) => {
    const { updateDeal } = useCrm();
    const [deliveryDate, setDeliveryDate] = useState('');

    const oneWeekFromNow = useMemo(() => {
        const d = addWorkingDays(new Date(), 5); // 5 working days for a week
        return d.toISOString().split('T')[0];
    }, []);

    const tenDaysFromNow = useMemo(() => {
        const d = addWorkingDays(new Date(), 10);
        return d.toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        if (isOpen) {
            const initialDate = deal?.deliveryDate ? deal.deliveryDate.split('T')[0] : oneWeekFromNow;
            setDeliveryDate(initialDate);
        }
    }, [deal, isOpen, oneWeekFromNow]);


    if (!deal) return null;

    const handleSubmit = () => {
        if (!deliveryDate) {
            alert("Please select a delivery date.");
            return;
        }
        updateDeal(deal.id, () => ({
            deliveryDate,
        }));
        onClose();
    };
    
    const getButtonClass = (isActive: boolean) =>
    `px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${
        isActive
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
    }`;

    const isOneWeek = deliveryDate === oneWeekFromNow;
    const isTenDays = deliveryDate === tenDaysFromNow;
    const isCustomDate = !!deliveryDate && !isOneWeek && !isTenDays;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Establecer fecha de entrega">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Establece la fecha de entrega para el deal <span className="font-semibold">{deal.title}</span>.
                </p>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de entrega</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => setDeliveryDate(oneWeekFromNow)} className={getButtonClass(isOneWeek)}>1 Semana</button>
                        <button type="button" onClick={() => setDeliveryDate(tenDaysFromNow)} className={getButtonClass(isTenDays)}>10 días</button>
                        <RobustDatePicker value={deliveryDate} onChange={setDeliveryDate}>
                            <div className={getButtonClass(isCustomDate)}>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className={`w-4 h-4 ${!isCustomDate ? 'text-slate-500' : ''}`} />
                                    <span>Elegir fecha</span>
                                </div>
                            </div>
                        </RobustDatePicker>
                        {deliveryDate && <p className="text-sm text-slate-500 ml-2">Seleccionada: {formatDate(deliveryDate)}</p>}
                    </div>
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