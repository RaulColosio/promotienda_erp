import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact, Deal } from '../types';
import Modal from './Modal';
import { MergeIcon, LayersIcon } from './Icons';

const MergeContactsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  contactsToMerge: Contact[] | null;
}> = ({ isOpen, onClose, contactsToMerge }) => {
    const { mergeContacts, deals } = useCrm();
    const [masterId, setMasterId] = useState<string>('');
    const [finalData, setFinalData] = useState<Partial<Contact>>({});
    const [isMerging, setIsMerging] = useState(false);

    useEffect(() => {
        if (contactsToMerge && contactsToMerge.length > 0) {
            // Set most recently created as master by default
            const sorted = [...contactsToMerge].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const master = sorted[0];
            setMasterId(master.id);
            setFinalData(master); // Start with master's data
        } else {
            setMasterId('');
            setFinalData({});
        }
    }, [contactsToMerge, isOpen]);

    const allAssociatedDeals = useMemo(() => {
        if (!contactsToMerge) return [];
        const contactIds = new Set(contactsToMerge.map(c => c.id));
        return deals.filter(deal => deal.contactIds.some(id => contactIds.has(id)));
    }, [contactsToMerge, deals]);

    const handleFieldSelect = (field: keyof Contact, value: any) => {
        setFinalData(prev => ({ ...prev, [field]: value }));
    };

    const handleMerge = async () => {
        if (!masterId || !contactsToMerge) return;
        setIsMerging(true);
        try {
            const otherIds = contactsToMerge.map(c => c.id).filter(id => id !== masterId);
            // Ensure we don't pass the ID in the update object
            const { id, ...updateData } = finalData;
            await mergeContacts(masterId, updateData, otherIds);
            onClose();
        } catch (error) {
            console.error("Failed to merge contacts:", error);
            alert("An error occurred while merging contacts. Please check the console and try again.");
        } finally {
            setIsMerging(false);
        }
    };
    
    if (!contactsToMerge || contactsToMerge.length < 2) return null;

    const fieldsToMerge: (keyof Omit<Contact, 'id' | 'createdAt' | 'deletedAt'>)[] = [
        'firstName', 'lastName', 'email', 'email2', 'phone', 'company', 'zipCode', 'googleDriveFolderUrl'
    ];

    const fieldLabels: Record<string, string> = {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        email2: 'Secondary Email',
        phone: 'Phone',
        company: 'Company',
        zipCode: 'Zip Code',
        googleDriveFolderUrl: 'Google Drive URL',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Merge Duplicate Contacts">
            <div className="space-y-6">
                <p className="text-sm text-slate-600">Review the duplicate contacts below. Select the master record that will be kept, and choose which information to retain for each field. All associated deals and notes will be moved to the master contact.</p>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Field</th>
                                {contactsToMerge.map(contact => (
                                    <th key={contact.id} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="master-contact"
                                                value={contact.id}
                                                checked={masterId === contact.id}
                                                onChange={() => setMasterId(contact.id)}
                                                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-2">Master</span>
                                        </label>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {fieldsToMerge.map(field => (
                                <tr key={field}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-700">{fieldLabels[field]}</td>
                                    {contactsToMerge.map(contact => (
                                        <td key={contact.id} className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name={field}
                                                    checked={finalData[field] === contact[field]}
                                                    onChange={() => handleFieldSelect(field, contact[field])}
                                                    className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 truncate" title={contact[field] || ''}>{contact[field] || <i className="text-slate-400">empty</i>}</span>
                                            </label>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {allAssociatedDeals.length > 0 && (
                     <div>
                        <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center">
                            <LayersIcon className="w-5 h-5 mr-2 text-slate-500" />
                            Associated Deals to be Merged ({allAssociatedDeals.length})
                        </h4>
                        <div className="border rounded-lg max-h-32 overflow-y-auto p-2 bg-slate-50 space-y-1">
                           {allAssociatedDeals.map(deal => (
                               <div key={deal.id} className="text-sm text-slate-600">{deal.title}</div>
                           ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button
                        type="button"
                        onClick={handleMerge}
                        disabled={isMerging}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        <MergeIcon className="w-5 h-5 mr-2" />
                        {isMerging ? 'Merging...' : 'Merge Contacts'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MergeContactsModal;