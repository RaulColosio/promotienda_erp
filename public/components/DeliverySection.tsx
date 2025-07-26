import React, { useState, useEffect } from 'react';
import { useCrm } from '../store/crmStore';
import { Deal, DeliveryMethod } from '../types';
import { TruckIcon, LinkIcon } from './Icons';

interface DeliverySectionProps {
    deal: Deal;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({ deal }) => {
    const { updateDeal } = useCrm();
    const [isEditing, setIsEditing] = useState(false);
    const [trackingUrlInput, setTrackingUrlInput] = useState('');

    useEffect(() => {
        // If there's a URL, we are in "view" mode by default.
        // Otherwise, we are in "edit" mode to encourage adding one.
        if (deal.trackingUrl) {
            setIsEditing(false);
            setTrackingUrlInput(deal.trackingUrl);
        } else {
            setIsEditing(true);
            setTrackingUrlInput('');
        }
    }, [deal.trackingUrl]);

    const handleMethodChange = (method: DeliveryMethod) => {
        const updates: Partial<Deal> = { deliveryMethod: method };
        if (method !== 'shipping') {
            updates.trackingUrl = undefined;
            setIsEditing(true); // Go to edit mode if switching away from shipping
            setTrackingUrlInput('');
        }
        updateDeal(deal.id, () => updates);
    };

    const handleSave = () => {
        const trimmedUrl = trackingUrlInput.trim();
        updateDeal(deal.id, () => ({ trackingUrl: trimmedUrl || undefined }));
        if (trimmedUrl) {
            setIsEditing(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const getButtonClass = (method: DeliveryMethod) =>
        `flex-1 text-center px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${
            deal.deliveryMethod === method
                ? 'bg-blue-600 text-white border-blue-700 shadow'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
        }`;
    
    const renderTrackingInfo = () => {
        if (isEditing) {
            return (
                <div>
                    <label htmlFor="trackingUrl" className="block text-sm font-medium text-slate-700">Tracking Link</label>
                    <div className="mt-1 flex items-center gap-2">
                        <div className="relative flex-grow">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LinkIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="url"
                                id="trackingUrl"
                                value={trackingUrlInput}
                                onChange={e => setTrackingUrlInput(e.target.value)}
                                placeholder="https://..."
                                className="block w-full rounded-md border-slate-300 bg-slate-100 py-2 pl-10 pr-3 text-slate-700 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">Save</button>
                    </div>
                </div>
            );
        }

        if (deal.trackingUrl) {
             return (
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Tracking Link</label>
                    <div className="mt-1 flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-md">
                        <a 
                            href={deal.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 font-medium hover:underline"
                        >
                            <LinkIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Seguimiento</span>
                        </a>
                        <button onClick={handleEdit} className="px-4 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100">Edit</button>
                    </div>
                </div>
            );
        }
        
        return (
             <button onClick={() => setIsEditing(true)} className="w-full text-center px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200">
                + Add Tracking Link
            </button>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
                <TruckIcon className="w-5 h-5 mr-2 text-slate-500" />
                Entrega
            </h3>
            <div className="space-y-4">
                <div>
                    <div className="flex gap-2">
                        <button onClick={() => handleMethodChange('pickup')} className={getButtonClass('pickup')}>
                            Recolección
                        </button>
                        <button onClick={() => handleMethodChange('shipping')} className={getButtonClass('shipping')}>
                            Envío
                        </button>
                    </div>
                </div>

                {deal.deliveryMethod === 'shipping' && renderTrackingInfo()}
            </div>
        </div>
    );
};

export default DeliverySection;