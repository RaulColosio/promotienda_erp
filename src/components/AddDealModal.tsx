
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../store/crmStore';
import { Contact } from '../types';
import Modal from './Modal';
import { XIcon, UsersIcon } from './Icons';

interface AddDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultContactId?: string;
}

const AddDealModal: React.FC<AddDealModalProps> = ({ isOpen, onClose, defaultContactId }) => {
    const { addDeal, contacts, users, pipelineStages, showAddEditContact, getContactById } = useCrm();
    const navigate = useNavigate();
    
    const [title, setTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [stageId, setStageId] = useState('');
    const [assignedUserId, setAssignedUserId] = useState('user_raul_colosio');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSearchQuery('');
            setIsSearchFocused(false);
            setStageId(pipelineStages.length > 0 ? pipelineStages[0].id : '');
            setAssignedUserId('user_raul_colosio');
            setIsSubmitting(false);

            if (defaultContactId) {
                const contact = getContactById(defaultContactId);
                setSelectedContact(contact || null);
            } else {
                setSelectedContact(null);
            }
        }
    }, [isOpen, defaultContactId, pipelineStages, getContactById]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerQuery = searchQuery.toLowerCase();
        return contacts.filter(c =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerQuery) ||
          c.email?.toLowerCase().includes(lowerQuery) ||
          c.company?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);
    }, [searchQuery, contacts]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        setSearchQuery('');
        setIsSearchFocused(false);
    };

    const handleClearContact = () => {
        setSelectedContact(null);
    };

    const handleCreateNewContact = () => {
        const nameParts = searchQuery.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        showAddEditContact(null, {
            initialValues: { firstName, lastName },
            onSave: (newContact) => {
                setSelectedContact(newContact);
                setIsSearchFocused(false);
                setSearchQuery('');
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !stageId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newDeal = await addDeal({
                title,
                contactIds: selectedContact ? [selectedContact.id] : [],
                assignedUserId: assignedUserId,
                stageId,
                tagIds: [],
            });
            navigate(`/deals/${newDeal.id}`);
            onClose();
        } catch (error) {
            console.error("Failed to create deal:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const showSearchResults = isSearchFocused && searchQuery && !selectedContact;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Deal">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700">Deal Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                
                <div>
                    <label htmlFor="contact-search" className="block text-sm font-medium text-slate-700">Contact</label>
                    <div ref={searchContainerRef} className="relative mt-1">
                        {selectedContact ? (
                            <div className="flex items-center justify-between p-2 bg-slate-100 border border-slate-300 rounded-md">
                                <span className="text-sm font-medium text-slate-800">{selectedContact.firstName} {selectedContact.lastName}</span>
                                {!defaultContactId && (
                                    <button type="button" onClick={handleClearContact} className="text-slate-500 hover:text-slate-700">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                             <input
                                type="text"
                                id="contact-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="Search by name, email, or company"
                                className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                disabled={!!defaultContactId}
                                autoComplete="off"
                            />
                        )}
                        
                        {showSearchResults && (
                            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                <ul>
                                    {searchResults.map(contact => (
                                        <li key={contact.id} onMouseDown={() => handleSelectContact(contact)} className="text-slate-900 cursor-pointer select-none relative py-2 px-4 hover:bg-slate-100">
                                            <span className="font-normal block truncate">{contact.firstName} {contact.lastName}</span>
                                            <span className="text-slate-500 text-xs block truncate">{contact.company}</span>
                                        </li>
                                    ))}
                                    {searchResults.length === 0 && searchQuery && (
                                         <li onMouseDown={handleCreateNewContact} className="text-blue-600 cursor-pointer select-none relative py-2 px-4 hover:bg-blue-50">
                                            + Create new contact: "{searchQuery}"
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
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
