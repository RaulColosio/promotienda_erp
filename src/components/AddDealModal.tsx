

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../store/crmStore';
import { PipelineStage } from '../types';
import Modal from './Modal';

interface AddDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultContactId?: string;
}

const AddDealModal: React.FC<AddDealModalProps> = ({ isOpen, onClose, defaultContactId }) => {
    const { addDeal, contacts, users, pipelineStages, showAlert } = useCrm();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [contactId, setContactId] = useState('');
    const [stageId, setStageId] = useState('');
    const [assignedUserId, setAssignedUserId] = useState('user_raul_colosio');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContactId(defaultContactId || '');
            setStageId(pipelineStages.length > 0 ? pipelineStages[0].id : '');
            setAssignedUserId('user_raul_colosio');
            setIsSubmitting(false);
        }
    }, [isOpen, defaultContactId, pipelineStages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !stageId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newDeal = await addDeal({
                title,
                contactIds: contactId ? [contactId] : [],
                assignedUserId: assignedUserId,
                stageId,
                tagIds: [],
            });
            navigate(`/deals/${newDeal.id}`);
            onClose(); // Close only on success
        } catch (error) {
            console.error("Failed to create deal:", error);
            // The store shows an alert. We just need to stop the loading state
            // and keep the modal open for correction.
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Deal">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700">Deal Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-slate-700">Contact</label>
                    <select
                        id="contact"
                        value={contactId}
                        onChange={(e) => setContactId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={!!defaultContactId}
                    >
                        <option value="">Select a contact (optional)</option>
                        {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName} - {contact.company}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="assignedUser" className="block text-sm font-medium text-slate-700">Assigned To</label>
                    <select
                        id="assignedUser"
                        value={assignedUserId}
                        onChange={(e) => setAssignedUserId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="stage" className="block text-sm font-medium text-slate-700">Stage</label>
                    <select
                        id="stage"
                        value={stageId}
                        onChange={(e) => setStageId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {pipelineStages.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Add Deal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDealModal;