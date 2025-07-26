import React, { useState, useMemo, useRef } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact } from '../types';
import { PlusIcon, EditIcon, TrashIcon, WhatsappIcon, MergeIcon } from '../components/Icons';
import GlobalSearch from '../components/GlobalSearch';
import MergeContactsModal from '../components/MergeContactsModal';

const DuplicateFinderView: React.FC<{
    onMerge: (contacts: Contact[]) => void;
}> = ({ onMerge }) => {
    const { contacts } = useCrm();

    const duplicateGroups = useMemo(() => {
        const potentialDuplicates = new Map<string, Contact[]>();
        
        contacts.forEach(contact => {
            if (contact.email) {
                const email = contact.email.toLowerCase().trim();
                if(email) {
                    if (!potentialDuplicates.has(email)) potentialDuplicates.set(email, []);
                    potentialDuplicates.get(email)!.push(contact);
                }
            }
            if (contact.phone) {
                const phone = contact.phone.replace(/\D/g, '');
                if (phone) {
                    if (!potentialDuplicates.has(phone)) potentialDuplicates.set(phone, []);
                    potentialDuplicates.get(phone)!.push(contact);
                }
            }
        });

        return Array.from(potentialDuplicates.values())
            .filter(group => group.length > 1)
            .filter((group, index, self) =>
                index === self.findIndex(g => {
                    const gIds = new Set(g.map(c => c.id));
                    const groupIds = new Set(group.map(c => c.id));
                    return gIds.size === groupIds.size && [...gIds].every(id => groupIds.has(id));
                })
            );
    }, [contacts]);

    if (duplicateGroups.length === 0) {
        return <div className="text-center p-8 bg-green-50 text-green-700 rounded-lg"><p>No potential duplicates found. Great job!</p></div>;
    }

    return (
        <div className="space-y-6">
            {duplicateGroups.map((group, index) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-slate-800">Potential Duplicate Group {index + 1}</h3>
                        <button 
                            onClick={() => onMerge(group)} 
                            className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700">
                               <MergeIcon className="w-4 h-4 mr-2" />
                               Merge
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.map(contact => (
                            <div key={contact.id} className="bg-slate-50 p-3 rounded-md border">
                                <p className="font-bold">{contact.firstName} {contact.lastName}</p>
                                <p className="text-sm text-slate-600">{contact.company}</p>
                                <p className="text-sm text-slate-600">{contact.email}</p>
                                <p className="text-sm text-slate-600">{contact.phone}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ContactsTable: React.FC = () => {
    const { contacts, deleteContact, showConfirmation, showAddEditContact, showContactDetail } = useCrm();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
    
    type ColumnKey = keyof Omit<Contact, 'id' | 'createdAt' | 'zipCode' | 'googleDriveFolderUrl' | 'deletedAt'> | 'actions';

    const initialColumns: {key: ColumnKey; label: string; sortable: boolean}[] = [
        { key: 'firstName', label: 'First Name', sortable: true },
        { key: 'lastName', label: 'Last Name', sortable: true },
        { key: 'company', label: 'Company', sortable: true },
        { key: 'email', label: 'Email', sortable: false },
        { key: 'email2', label: 'Secondary Email', sortable: false },
        { key: 'phone', label: 'Phone', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];
    const [columns, setColumns] = useState(initialColumns);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDelete = (id: string) => {
        showConfirmation(
            'Are you sure you want to delete this contact? It will be moved to the archive.',
            () => deleteContact(id)
        );
    };
    
    const formatWhatsappLink = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return `https://web.whatsapp.com/send?phone=${cleaned}`;
    };

    const sortedContacts = useMemo(() => {
        let sorted = [...contacts];
        if (sortConfig) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [contacts, sortConfig]);

    const requestSort = (key: keyof Contact) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Contact) => {
        if (!sortConfig || sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
    };
    const handleDragEnter = (e: React.DragEvent, index: number) => {
        dragOverItem.current = index;
    };
    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (columns[dragItem.current].key === 'actions' || columns[dragOverItem.current].key === 'actions') return;

        const newColumns = [...columns];
        const dragItemContent = newColumns.splice(dragItem.current, 1)[0];
        newColumns.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setColumns(newColumns);
    };
    
    return (
         <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        {columns.map((col, index) => (
                           <th
                                key={col.key}
                                scope="col"
                                className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                                onClick={() => col.sortable && requestSort(col.key as keyof Contact)}
                                draggable={col.key !== 'actions'}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                           >
                               {col.label}
                               {col.sortable && getSortIndicator(col.key as keyof Contact)}
                           </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {sortedContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-slate-50">
                            {columns.map(col => {
                                const cellContent = () => {
                                    switch(col.key) {
                                        case 'firstName': return <button onClick={() => showContactDetail(contact.id)} className="text-sm font-medium text-slate-900 hover:text-blue-600 text-left">{contact.firstName}</button>;
                                        case 'lastName': return <div className="text-sm text-slate-800">{contact.lastName}</div>;
                                        case 'company': return <div className="text-sm text-slate-700">{contact.company}</div>;
                                        case 'email': return <div className="text-sm text-slate-700">{contact.email}</div>;
                                        case 'email2': return <div className="text-sm text-slate-700">{contact.email2}</div>;
                                        case 'phone': return (
                                            <div className="text-sm text-slate-500 flex items-center">
                                                {contact.phone}
                                                <a 
                                                    href={formatWhatsappLink(contact.phone)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="ml-2 text-green-500 hover:text-green-600"
                                                    title="Send WhatsApp message"
                                                >
                                                    <WhatsappIcon className="w-5 h-5"/>
                                                </a>
                                            </div>
                                        );
                                        case 'actions': return (
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => showAddEditContact(contact)} className="text-blue-600 hover:text-blue-900" aria-label="Edit">
                                                    <EditIcon className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-900" aria-label="Delete">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        );
                                        default: return null;
                                    }
                                }
                                return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                        {cellContent()}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ContactsPage: React.FC = () => {
    const { showAddEditContact } = useCrm();
    const [viewMode, setViewMode] = useState<'list' | 'duplicates'>('list');
    const [contactsToMerge, setContactsToMerge] = useState<Contact[] | null>(null);

    const handleOpenMergeModal = (contacts: Contact[]) => {
        setContactsToMerge(contacts);
    };
    
    const handleCloseMergeModal = () => {
        setContactsToMerge(null);
    };
    
    const viewButtonClasses = (isActive: boolean) => 
        `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-300'
        }`;

    return (
        <>
        {contactsToMerge && (
            <MergeContactsModal 
                isOpen={!!contactsToMerge}
                onClose={handleCloseMergeModal}
                contactsToMerge={contactsToMerge}
            />
        )}
        <div className="flex flex-col h-[calc(100vh)] p-8">
            <div className="flex-shrink-0 pb-6 space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-slate-800">Contacts</h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-200 p-1 rounded-lg flex items-center">
                            <button onClick={() => setViewMode('list')} className={viewButtonClasses(viewMode === 'list')}>List</button>
                            <button onClick={() => setViewMode('duplicates')} className={viewButtonClasses(viewMode === 'duplicates')}>Find Duplicates</button>
                        </div>
                        <button
                            onClick={() => showAddEditContact()}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Contact
                        </button>
                    </div>
                </div>
                <GlobalSearch />
            </div>
            <div className="flex-grow overflow-auto">
                {viewMode === 'list' ? <ContactsTable /> : <DuplicateFinderView onMerge={handleOpenMergeModal} />}
            </div>
        </div>
        </>
    );
};

export default ContactsPage;