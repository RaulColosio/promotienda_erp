import React, { useState, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { Deal, Contact } from '../types';
import Modal from './Modal';
import { TrashIcon, PlusIcon, XIcon } from './Icons';

const countryCodes = [
    { name: 'Mexico', code: '+52' },
    { name: 'USA', code: '+1' },
    { name: 'Spain', code: '+34' },
    { name: 'UK', code: '+44' },
    { name: 'Colombia', code: '+57' },
    { name: 'Argentina', code: '+54' },
    { name: 'Peru', code: '+51' },
    { name: 'Chile', code: '+56' },
];

const CreateContactForm: React.FC<{
    onCancel: () => void;
    onSave: (newContact: Contact) => void;
}> = ({ onCancel, onSave }) => {
    const { addContact } = useCrm();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+52');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
    
    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setCountryCode('+52');
        setPhoneNumber('');
        setCompany('');
        setGoogleDriveFolderUrl('');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize data
        const sanitizedFirstName = firstName.trim();
        const sanitizedLastName = lastName.trim();
        const sanitizedEmail = email.replace(/\s/g, '');
        const sanitizedPhoneNumber = phoneNumber.replace(/\s/g, '');
        const sanitizedCompany = company.trim();
        const sanitizedGoogleDriveUrl = googleDriveFolderUrl.trim();

        // Validate that at least one key field is filled
        if (!sanitizedFirstName && !sanitizedLastName && !sanitizedEmail && !sanitizedPhoneNumber && !sanitizedCompany) {
            alert('Please fill out at least one field (First Name, Last Name, Email, Phone, or Company) to create a contact.');
            return;
        }

        const contactData = {
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
            email: sanitizedEmail,
            phone: `${countryCode}${sanitizedPhoneNumber}`,
            company: sanitizedCompany,
            googleDriveFolderUrl: sanitizedGoogleDriveUrl,
        };
        
        const newContact = await addContact(contactData);
        onSave(newContact);
        resetForm();
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg mt-4">
             <h4 className="text-md font-semibold text-slate-700 mb-3">Create New Contact</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName-new" className="block text-sm font-medium text-slate-700">First Name</label>
                        <input type="text" id="firstName-new" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                    </div>
                    <div>
                        <label htmlFor="lastName-new" className="block text-sm font-medium text-slate-700">Last Name</label>
                        <input type="text" id="lastName-new" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="email-new" className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" id="email-new" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                </div>
                 <div>
                    <label htmlFor="phone-new" className="block text-sm font-medium text-slate-700">Phone</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Country code"
                        >
                            {countryCodes.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </select>
                        <input
                            type="tel"
                            id="phone-new"
                            placeholder="Phone number"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="flex-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="company-new" className="block text-sm font-medium text-slate-700">Company</label>
                    <input type="text" id="company-new" value={company} onChange={e => setCompany(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                </div>
                <div>
                    <label htmlFor="googleDriveUrl-new" className="block text-sm font-medium text-slate-700">Google Drive Folder URL</label>
                    <input type="url" id="googleDriveUrl-new" value={googleDriveFolderUrl} onChange={e => setGoogleDriveFolderUrl(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                </div>
                <div className="flex justify-end pt-2 gap-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Create & Add</button>
                </div>
            </form>
        </div>
    )
}

const ManageDealContactsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    deal: Deal;
}> = ({ isOpen, onClose, deal }) => {
    const { contacts, getContactById, updateDeal } = useCrm();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const assignedContacts = useMemo(() =>
        deal.contactIds.map(id => getContactById(id)).filter(Boolean) as Contact[]
    , [deal.contactIds, getContactById]);

    const availableContacts = useMemo(() =>
        contacts.filter(c => 
            !deal.contactIds.includes(c.id) && 
            `${c.firstName} ${c.lastName} ${c.company}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
    , [contacts, deal.contactIds, searchTerm]);
    
    const handleRemoveContact = (contactId: string) => {
        updateDeal(deal.id, (prevDeal) => ({
            ...prevDeal,
            contactIds: prevDeal.contactIds.filter(id => id !== contactId)
        }));
    };

    const handleAddContact = (contactId: string) => {
        updateDeal(deal.id, (prevDeal) => ({
            ...prevDeal,
            contactIds: [...prevDeal.contactIds, contactId]
        }));
        setSearchTerm('');
    };
    
    const handleCreateAndAddContact = (newContact: Contact) => {
        handleAddContact(newContact.id);
        setIsCreating(false);
    }
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Contacts for "${deal.title}"`}>
            <div className="flex flex-col" style={{minHeight: '450px'}}>
                <div className="flex-grow space-y-6">
                    {/* Assigned Contacts */}
                    <div>
                        <h4 className="text-md font-semibold text-slate-700 mb-2">Assigned Contacts ({assignedContacts.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {assignedContacts.map(contact => (
                                <div key={contact.id} className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
                                    <div>
                                        <p className="font-medium text-slate-800">{contact.firstName} {contact.lastName}</p>
                                        <p className="text-sm text-slate-500">{contact.company}</p>
                                    </div>
                                    <button onClick={() => handleRemoveContact(contact.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                             {assignedContacts.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No contacts assigned.</p>}
                        </div>
                    </div>

                    {/* Add/Create Contacts */}
                    <div className="border-t pt-4">
                        { isCreating ? (
                            <CreateContactForm 
                                onCancel={() => setIsCreating(false)}
                                onSave={handleCreateAndAddContact}
                            />
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <h4 className="text-md font-semibold text-slate-700">Add Contact</h4>
                                    <button onClick={() => setIsCreating(true)} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                                        <PlusIcon className="w-4 h-4 mr-1"/> Create New
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <input 
                                        type="text"
                                        placeholder="Search existing contacts..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                    />
                                    {searchTerm && (
                                        <div className="mt-1 border rounded-md max-h-48 overflow-y-auto">
                                            {availableContacts.map(contact => (
                                                <div key={contact.id} onClick={() => handleAddContact(contact.id)} className="p-2 cursor-pointer hover:bg-slate-100">
                                                    <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
                                                    <p className="text-sm text-slate-500">{contact.company}</p>
                                                </div>
                                            ))}
                                            {availableContacts.length === 0 && <p className="text-sm text-slate-500 p-3 text-center">No matching contacts found.</p>}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                 <div className="flex-shrink-0 flex justify-end pt-5 mt-5 border-t border-slate-200">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default ManageDealContactsModal;