import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact, ContactTag } from '../types';
import Modal from './Modal';
import { TrashIcon, LinkIcon, XIcon } from './Icons';

const countryCodes = [
    { name: 'Mexico', code: '+52' },
    { name: 'USA', code: '+1' },
];

const AddEditContactModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    contactToEdit?: Contact | null; 
    initialValues?: Partial<Pick<Contact, 'firstName' | 'lastName' | 'email' | 'company'>>;
    onSave?: (newContact: Contact) => void;
}> = ({ isOpen, onClose, contactToEdit, initialValues, onSave }) => {
    const { contacts, addContact, updateContact, deleteContact, showConfirmation, showAddDeal, pickGoogleDriveFolder, isGoogleDriveConnected, googleApiReady, contactTags } = useCrm();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [email2, setEmail2] = useState('');
    const [countryCode, setCountryCode] = useState('+52');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
    const [contactTagIds, setContactTagIds] = useState<string[]>([]);
    
    const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
    const [isCompanyInputFocused, setIsCompanyInputFocused] = useState(false);
    const companyInputContainerRef = useRef<HTMLDivElement>(null);

    const uniqueCompanies: string[] = useMemo(() => {
        const companies = new Set(contacts.map(c => c.company).filter((c): c is string => !!c));
        return Array.from(companies).sort();
    }, [contacts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (companyInputContainerRef.current && !companyInputContainerRef.current.contains(event.target as Node)) {
                setIsCompanyInputFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (contactToEdit) {
            setFirstName(contactToEdit.firstName);
            setLastName(contactToEdit.lastName);
            setEmail(contactToEdit.email);
            setEmail2(contactToEdit.email2 || '');
            setCompany(contactToEdit.company);
            setGoogleDriveFolderUrl(contactToEdit.googleDriveFolderUrl || '');
            setContactTagIds((contactToEdit.contactTagIds || []).filter((id): id is string => typeof id === 'string'));

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
            setFirstName(initialValues?.firstName || '');
            setLastName(initialValues?.lastName || '');
            setEmail(initialValues?.email || '');
            setEmail2('');
            setCountryCode('+52');
            setPhoneNumber('');
            setCompany(initialValues?.company || '');
            setGoogleDriveFolderUrl('');
            setContactTagIds([]);
        }
    }, [contactToEdit, initialValues, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const sanitizedFirstName = firstName.trim();
        const sanitizedLastName = lastName.trim();
        const sanitizedEmail = email.replace(/\s/g, '');
        const sanitizedEmail2 = email2.replace(/\s/g, '');
        const sanitizedPhoneNumber = phoneNumber.replace(/\s/g, '');
        const sanitizedCompany = company.trim();
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
            googleDriveFolderUrl: sanitizedGoogleDriveUrl,
            contactTagIds,
        };

        (async () => {
            try {
                if (contactToEdit) {
                    await updateContact({ ...contactData, id: contactToEdit.id, createdAt: contactToEdit.createdAt });
                    onClose();
                } else {
                    const newContact = await addContact(contactData);
                    onClose();
                    if(onSave) {
                        onSave(newContact);
                    }
                    showConfirmation(
                        "Cliente guardado. ¿Quieres crear un trato para este cliente?",
                        () => showAddDeal(newContact.id)
                    );
                }
            } catch (error) {
                console.error("Failed to save contact in background:", error);
                onClose();
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
    
    const assignedTags = useMemo(() => 
        contactTagIds.map(id => contactTags.find(t => t.id === id)).filter(Boolean) as ContactTag[],
        [contactTagIds, contactTags]
    );

    const availableTags = useMemo(() =>
        contactTags.filter(t => !contactTagIds.includes(t.id)),
        [contactTagIds, contactTags]
    );

    const handleAddTag = (tagId: string) => {
        if (tagId && !contactTagIds.includes(tagId)) {
            setContactTagIds(prev => [...prev, tagId]);
        }
    };

    const handleRemoveTag = (tagId: string) => {
        setContactTagIds(prev => prev.filter(id => id !== tagId));
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCompany(value);
        if (value) {
            setCompanySuggestions(
                uniqueCompanies.filter(c => c.toLowerCase().includes(value.toLowerCase()))
            );
        } else {
            setCompanySuggestions([]);
        }
    };

    const handleSelectCompany = (selectedCompany: string) => {
        setCompany(selectedCompany);
        setIsCompanyInputFocused(false);
        setCompanySuggestions([]);

        // Auto-fill logic
        const contactWithUrl = contacts.find(
            c => c.company === selectedCompany && c.googleDriveFolderUrl
        );
        if (contactWithUrl && !googleDriveFolderUrl) { // Only fill if the current URL is empty
            setGoogleDriveFolderUrl(contactWithUrl.googleDriveFolderUrl!);
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="email2" className="block text-sm font-medium text-slate-700">Secondary Email (Optional)</label>
                        <input type="email" id="email2" value={email2} onChange={e => setEmail2(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
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
                    <div className="relative" ref={companyInputContainerRef}>
                        <label htmlFor="company" className="block text-sm font-medium text-slate-700">Company</label>
                        <input 
                            type="text" 
                            id="company" 
                            value={company} 
                            onChange={handleCompanyChange} 
                            onFocus={() => setIsCompanyInputFocused(true)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="off"
                        />
                        {isCompanyInputFocused && companySuggestions.length > 0 && company.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-40 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {companySuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelectCompany(suggestion)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
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
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700">Contact Tags</label>
                    <div className="mt-2 flex flex-wrap items-center gap-2 p-2 border border-slate-300 rounded-md bg-white">
                        {assignedTags.map(tag => (
                            <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-1 rounded-full flex items-center ${tag.color}`}>
                                {tag.name}
                                <button type="button" onClick={() => handleRemoveTag(tag.id)} className="ml-1.5 -mr-0.5 text-white/70 hover:text-white">
                                    <XIcon className="w-3 h-3"/>
                                </button>
                            </span>
                        ))}
                        <select
                            onChange={(e) => {
                                handleAddTag(e.target.value);
                                e.target.value = '';
                            }}
                            value=""
                            className="flex-grow bg-transparent border-none focus:ring-0 text-sm p-0 min-w-[120px]"
                        >
                            <option value="">Add a tag...</option>
                            {availableTags.map(tag => (
                                <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                        </select>
                    </div>
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
