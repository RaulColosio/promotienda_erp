import React, { useState, useEffect } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact } from '../types';
import Modal from './Modal';
import { TrashIcon, LinkIcon } from './Icons';

const countryCodes = [
    { name: 'Mexico', code: '+52' },
    { name: 'USA', code: '+1' },
];

const AddEditContactModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    contactToEdit?: Contact | null; 
}> = ({ isOpen, onClose, contactToEdit }) => {
    const { addContact, updateContact, deleteContact, showConfirmation, pickGoogleDriveFolder, isGoogleDriveConnected, googleApiReady } = useCrm();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [email2, setEmail2] = useState('');
    const [countryCode, setCountryCode] = useState('+52');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');

    useEffect(() => {
        if (contactToEdit) {
            setFirstName(contactToEdit.firstName);
            setLastName(contactToEdit.lastName);
            setEmail(contactToEdit.email);
            setEmail2(contactToEdit.email2 || '');
            setCompany(contactToEdit.company);
            setZipCode(contactToEdit.zipCode);
            setGoogleDriveFolderUrl(contactToEdit.googleDriveFolderUrl || '');

            const phoneStr = contactToEdit.phone || '';
            let found = false;
            const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
            for (const c of sortedCodes) {
                if (phoneStr.startsWith(c.code)) {
                    setCountryCode(c.code);
                    setPhoneNumber(phoneStr.substring(c.code.length));
                    found = true;
                    break;
                }
            }
            if (!found) {
                setCountryCode('+52');
                setPhoneNumber(phoneStr.replace(/\D/g, ''));
            }

        } else {
            setFirstName('');
            setLastName('');
            setEmail('');
            setEmail2('');
            setCountryCode('+52');
            setPhoneNumber('');
            setCompany('');
            setZipCode('');
            setGoogleDriveFolderUrl('');
        }
    }, [contactToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const sanitizedFirstName = firstName.trim();
        const sanitizedLastName = lastName.trim();
        const sanitizedEmail = email.replace(/\s/g, '');
        const sanitizedEmail2 = email2.replace(/\s/g, '');
        const sanitizedPhoneNumber = phoneNumber.replace(/\s/g, '');
        const sanitizedCompany = company.trim();
        const sanitizedZipCode = zipCode.trim();
        const sanitizedGoogleDriveUrl = googleDriveFolderUrl.trim();
        
        if (!sanitizedFirstName && !sanitizedLastName && !sanitizedEmail && !sanitizedPhoneNumber && !sanitizedCompany) {
            alert('Please fill out at least one field (First Name, Last Name, Email, Phone, or Company) to create a contact.');
            return;
        }

        const contactData = {
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
            email: sanitizedEmail,
            email2: sanitizedEmail2,
            phone: `${countryCode}${sanitizedPhoneNumber}`,
            company: sanitizedCompany,
            zipCode: sanitizedZipCode,
            googleDriveFolderUrl: sanitizedGoogleDriveUrl,
        };

        onClose();

        (async () => {
            try {
                if (contactToEdit) {
                    await updateContact({ ...contactData, id: contactToEdit.id, createdAt: contactToEdit.createdAt });
                } else {
                    await addContact(contactData);
                }
            } catch (error) {
                console.error("Failed to save contact in background:", error);
            }
        })();
    };

    const handleDelete = () => {
        if (contactToEdit) {
            showConfirmation(
                'Are you sure you want to delete this contact? It will be moved to the archive.',
                () => {
                    deleteContact(contactToEdit.id);
                    onClose();
                }
            );
        }
    };

    const handleSelectFolder = async () => {
        try {
            const folder = await pickGoogleDriveFolder();
            if (folder) {
                setGoogleDriveFolderUrl(folder.url);
            }
        } catch (error) {
            console.error(error);
            alert("Could not open Google Drive picker. Please ensure you are connected in Settings.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={contactToEdit ? 'Edit Contact' : 'Add New Contact'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">First Name</label>
                        <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Last Name</label>
                        <input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="email2" className="block text-sm font-medium text-slate-700">Secondary Email (Optional)</label>
                    <input type="email" id="email2" value={email2} onChange={e => setEmail2(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
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
                            id="phone"
                            placeholder="Phone number"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="flex-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-slate-700">Company</label>
                        <input type="text" id="company" value={company} onChange={e => setCompany(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">Zip Code</label>
                        <input type="text" id="zipCode" value={zipCode} onChange={e => setZipCode(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                <div>
                    <label htmlFor="googleDriveUrl" className="block text-sm font-medium text-slate-700">Google Drive Folder URL</label>
                    <div className="mt-1 flex gap-2">
                        <input type="url" id="googleDriveUrl" value={googleDriveFolderUrl} onChange={e => setGoogleDriveFolderUrl(e.target.value)} placeholder="https://drive.google.com/..." className="flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        <button
                            type="button"
                            onClick={handleSelectFolder}
                            disabled={!isGoogleDriveConnected || !googleApiReady}
                            title={!isGoogleDriveConnected ? "Connect to Google Drive in Settings first" : "Select Folder from Google Drive"}
                            className="flex-shrink-0 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                            <LinkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {!isGoogleDriveConnected && <p className="text-xs text-slate-500 mt-1">Connect to Google Drive in Settings to enable folder selection.</p>}
                </div>
                <div className="flex justify-between items-center pt-4">
                    <div>
                        {contactToEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-md"
                            >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Delete Contact
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">{contactToEdit ? 'Save Changes' : 'Add Contact'}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditContactModal;