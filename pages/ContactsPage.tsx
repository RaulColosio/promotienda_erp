import React, { useState, useMemo, useRef } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact, ContactTag, DynamicList } from '../types';
import { PlusIcon, EditIcon, TrashIcon, WhatsappIcon, MergeIcon, FilterIcon, ChevronLeftIcon, XIcon } from '../components/Icons';
import GlobalSearch from '../components/GlobalSearch';
import MergeContactsModal from '../components/MergeContactsModal';
import AddEditListModal from '../components/AddEditListModal';
import BulkEditContactsModal from '../components/BulkEditContactsModal';

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

const ListsView: React.FC<{
    onEditList: (list: DynamicList) => void;
    onViewList: (list: DynamicList) => void;
}> = ({ onEditList, onViewList }) => {
    const { contacts, dynamicLists, deleteDynamicList, showConfirmation, contactTags } = useCrm();

    const evaluateContactAgainstList = (contact: Contact, list: DynamicList): boolean => {
        return list.rules.every(rule => {
            const contactValue = contact[rule.field];
            const ruleValue = rule.value;

            if (rule.field === 'contactTagIds') {
                const tags = contact.contactTagIds || [];
                if (rule.operator === 'has_tag') return tags.includes(ruleValue);
                if (rule.operator === 'not_has_tag') return !tags.includes(ruleValue);
            } else if (typeof contactValue === 'string') {
                const cVal = contactValue.toLowerCase();
                const rVal = ruleValue.toLowerCase();
                if (rule.operator === 'contains') return cVal.includes(rVal);
                if (rule.operator === 'not_contains') return !cVal.includes(rVal);
                if (rule.operator === 'is') return cVal === rVal;
                if (rule.operator === 'is_not') return cVal !== rVal;
            }
            return false;
        });
    };

    const listData = useMemo(() => {
        return dynamicLists.map(list => ({
            ...list,
            memberCount: contacts.filter(contact => evaluateContactAgainstList(contact, list)).length
        }));
    }, [dynamicLists, contacts]);

    const handleDelete = (listId: string) => {
        showConfirmation(
            "Are you sure you want to delete this list? This will not delete the contacts, but it will un-assign any tags automatically applied by this list.",
            () => deleteDynamicList(listId)
        );
    };

    if (dynamicLists.length === 0) {
        return <div className="text-center p-8 bg-slate-50 text-slate-600 rounded-lg"><p>No dynamic lists created yet. Create one to get started!</p></div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">List Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tags Applied</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {listData.map(list => {
                        const assignedTags = list.assignedTagIds
                            .map(tagId => contactTags.find(t => t.id === tagId))
                            .filter(Boolean) as ContactTag[];
                        return (
                            <tr key={list.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => onViewList(list)} className="text-blue-600 hover:underline">{list.name}</button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{list.memberCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {assignedTags.map(tag => (
                                            <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${tag.color}`}>
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                                    <button onClick={() => onEditList(list)} className="text-blue-600 hover:text-blue-900" aria-label="Edit List">
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDelete(list.id)} className="text-red-600 hover:text-red-900" aria-label="Delete List">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


const ContactsPage: React.FC = () => {
    const { contacts, deleteContact, bulkDeleteContacts, showConfirmation, showAddEditContact, showContactDetail, contactTags, dynamicLists } = useCrm();
    const [viewMode, setViewMode] = useState<'list' | 'duplicates' | 'lists'>('list');
    const [viewingList, setViewingList] = useState<DynamicList | null>(null);
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
    const [contactsToMerge, setContactsToMerge] = useState<Contact[] | null>(null);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [listToEdit, setListToEdit] = useState<DynamicList | null>(null);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

    const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
    
    type ColumnKey = 'select' | keyof Omit<Contact, 'id' | 'createdAt' | 'zipCode' | 'googleDriveFolderUrl' | 'deletedAt' | 'contactTagIds'> | 'actions' | 'contactTags';

    const initialColumns: {key: ColumnKey; label: string; sortable: boolean}[] = [
        { key: 'select', label: '', sortable: false },
        { key: 'firstName', label: 'First Name', sortable: true },
        { key: 'lastName', label: 'Last Name', sortable: true },
        { key: 'company', label: 'Company', sortable: true },
        { key: 'email', label: 'Email', sortable: false },
        { key: 'email2', label: 'Secondary Email', sortable: false },
        { key: 'phone', label: 'Phone', sortable: false },
        { key: 'contactTags', label: 'Contact Tags', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];
    const [columns, setColumns] = useState(initialColumns);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const evaluateContactAgainstList = (contact: Contact, list: DynamicList): boolean => {
        return list.rules.every(rule => {
            const contactValue = contact[rule.field];
            const ruleValue = rule.value;

            if (rule.field === 'contactTagIds') {
                const tags = contact.contactTagIds || [];
                if (rule.operator === 'has_tag') return tags.includes(ruleValue);
                if (rule.operator === 'not_has_tag') return !tags.includes(ruleValue);
            } else if (typeof contactValue === 'string') {
                const cVal = contactValue.toLowerCase();
                const rVal = ruleValue.toLowerCase();
                if (rule.operator === 'contains') return cVal.includes(rVal);
                if (rule.operator === 'not_contains') return !cVal.includes(rVal);
                if (rule.operator === 'is') return cVal === rVal;
                if (rule.operator === 'is_not') return cVal !== rVal;
            }
            return false;
        });
    };

    const contactsInCurrentList = useMemo(() => {
        if (!viewingList) return [];
        const listFromState = dynamicLists.find(l => l.id === viewingList.id);
        if (!listFromState) return [];
        return contacts.filter(contact => evaluateContactAgainstList(contact, listFromState));
    }, [viewingList, contacts, dynamicLists]);
    
    const displayedContacts = viewingList ? contactsInCurrentList : contacts;

    const sortedContacts = useMemo(() => {
        let sorted = [...displayedContacts];
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
    }, [displayedContacts, sortConfig]);

    const handleSelect = (contactId: string) => {
        setSelectedContactIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contactId)) {
                newSet.delete(contactId);
            } else {
                newSet.add(contactId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedContactIds(new Set(sortedContacts.map(c => c.id)));
        } else {
            setSelectedContactIds(new Set());
        }
    };
    
    const handleBulkDelete = () => {
        showConfirmation(
            `Are you sure you want to delete ${selectedContactIds.size} contacts? They will be moved to the archive.`,
            async () => {
                await bulkDeleteContacts(Array.from(selectedContactIds));
                setSelectedContactIds(new Set());
            }
        );
    };

    const handleDelete = (id: string) => {
        showConfirmation(
            'Are you sure you want to delete this contact? It will be moved to the archive.',
            () => deleteContact(id)
        );
    };

    const handleOpenMergeModal = (contacts: Contact[]) => setContactsToMerge(contacts);
    const handleOpenAddListModal = () => { setListToEdit(null); setIsListModalOpen(true); };
    const handleOpenEditListModal = (list: DynamicList) => { setListToEdit(list); setIsListModalOpen(true); };
    const handleViewList = (list: DynamicList) => { setViewingList(list); setViewMode('list'); setSelectedContactIds(new Set()); };
    const handleBackToAll = () => { setViewingList(null); setSelectedContactIds(new Set()); };
    
    const formatWhatsappLink = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return `https://web.whatsapp.com/send?phone=${cleaned}`;
    };

    const requestSort = (key: keyof Contact) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Contact) => {
        if (!sortConfig || sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const handleDragStart = (e: React.DragEvent, index: number) => { dragItem.current = index; };
    const handleDragEnter = (e: React.DragEvent, index: number) => { dragOverItem.current = index; };
    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const invalidKeys: ColumnKey[] = ['actions', 'select'];
        if (invalidKeys.includes(columns[dragItem.current].key) || invalidKeys.includes(columns[dragOverItem.current].key)) return;

        const newColumns = [...columns];
        const dragItemContent = newColumns.splice(dragItem.current, 1)[0];
        newColumns.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setColumns(newColumns);
    };
    
    const viewButtonClasses = (isActive: boolean) => 
        `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
            isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-300'
        }`;
        
    const isAllSelected = sortedContacts.length > 0 && selectedContactIds.size === sortedContacts.length;

    return (
        <>
            {contactsToMerge && <MergeContactsModal isOpen={!!contactsToMerge} onClose={() => setContactsToMerge(null)} contactsToMerge={contactsToMerge} />}
            <AddEditListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} listToEdit={listToEdit} />
            <BulkEditContactsModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} selectedContactIds={Array.from(selectedContactIds)} />
            
            <div className="flex flex-col h-[calc(100vh)] p-8">
                <div className="flex-shrink-0 pb-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-slate-800">Contacts</h2>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-200 p-1 rounded-lg flex items-center">
                                <button onClick={() => { setViewMode('list'); handleBackToAll(); }} className={viewButtonClasses(viewMode === 'list')}>List</button>
                                <button onClick={() => setViewMode('lists')} className={viewButtonClasses(viewMode === 'lists')}><FilterIcon className="w-4 h-4"/> Lists</button>
                                <button onClick={() => setViewMode('duplicates')} className={viewButtonClasses(viewMode === 'duplicates')}><MergeIcon className="w-4 h-4"/> Find Duplicates</button>
                            </div>
                            <button
                                onClick={viewMode === 'lists' ? handleOpenAddListModal : () => showAddEditContact()}
                                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                {viewMode === 'lists' ? 'Add List' : 'Add Contact'}
                            </button>
                        </div>
                    </div>
                    <GlobalSearch />
                </div>
                
                <div className="flex-grow overflow-auto">
                    {viewMode === 'list' && (
                        <>
                            {viewingList && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                                    <div>
                                        <span className="text-sm text-slate-600">Viewing list:</span>
                                        <h3 className="font-semibold text-blue-800">{viewingList.name}</h3>
                                    </div>
                                    <button onClick={handleBackToAll} className="flex items-center text-sm font-semibold text-blue-600 hover:underline">
                                        <ChevronLeftIcon className="w-4 h-4 mr-1"/> Back to All Contacts
                                    </button>
                                </div>
                            )}

                            {selectedContactIds.size > 0 && (
                                <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 flex justify-between items-center mb-4 sticky top-0 z-10">
                                    <span className="text-sm font-semibold text-blue-800">{selectedContactIds.size} contact(s) selected</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsBulkEditModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
                                            <EditIcon className="w-5 h-5"/> Bulk Edit
                                        </button>
                                        <button onClick={handleBulkDelete} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800">
                                            <TrashIcon className="w-5 h-5"/> Delete
                                        </button>
                                        <button onClick={() => setSelectedContactIds(new Set())} className="text-slate-500 hover:text-slate-700">
                                            <XIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                                    draggable={col.key !== 'actions' && col.key !== 'select'}
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                                    onDragEnd={handleDrop}
                                                    onDragOver={(e) => e.preventDefault()}
                                                >
                                                    {col.key === 'select' ? (
                                                        <input type="checkbox" onChange={handleSelectAll} checked={isAllSelected} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                                                    ) : (
                                                        <>
                                                            {col.label}
                                                            {col.sortable && getSortIndicator(col.key as keyof Contact)}
                                                        </>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {sortedContacts.map((contact) => (
                                            <tr key={contact.id} className={`hover:bg-slate-50 ${selectedContactIds.has(contact.id) ? 'bg-blue-50' : ''}`}>
                                                {columns.map(col => {
                                                    const cellContent = () => {
                                                        switch(col.key) {
                                                            case 'select': return <input type="checkbox" checked={selectedContactIds.has(contact.id)} onChange={() => handleSelect(contact.id)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />;
                                                            case 'firstName': return <button onClick={() => showContactDetail(contact.id)} className="text-sm font-medium text-slate-900 hover:text-blue-600 text-left">{contact.firstName}</button>;
                                                            case 'lastName': return <div className="text-sm text-slate-800">{contact.lastName}</div>;
                                                            case 'company': return <div className="text-sm text-slate-700">{contact.company}</div>;
                                                            case 'email': return <div className="text-sm text-slate-700">{contact.email}</div>;
                                                            case 'email2': return <div className="text-sm text-slate-700">{contact.email2}</div>;
                                                            case 'phone': return (
                                                                <div className="text-sm text-slate-500 flex items-center">
                                                                    {contact.phone}
                                                                    <a href={formatWhatsappLink(contact.phone)} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-500 hover:text-green-600" title="Send WhatsApp message"><WhatsappIcon className="w-5 h-5"/></a>
                                                                </div>
                                                            );
                                                            case 'contactTags':
                                                                const assignedTags = (contact.contactTagIds || []).map(tagId => contactTags.find(t => t.id === tagId)).filter(Boolean) as ContactTag[];
                                                                return (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {assignedTags.map(tag => <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${tag.color}`}>{tag.name}</span>)}
                                                                    </div>
                                                                );
                                                            case 'actions': return (
                                                                <div className="flex items-center gap-4">
                                                                    <button onClick={() => showAddEditContact(contact)} className="text-blue-600 hover:text-blue-900" aria-label="Edit"><EditIcon className="w-5 h-5"/></button>
                                                                    <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-900" aria-label="Delete"><TrashIcon className="w-5 h-5"/></button>
                                                                </div>
                                                            );
                                                            default: return null;
                                                        }
                                                    }
                                                    return <td key={col.key} className="px-6 py-4 whitespace-nowrap">{cellContent()}</td>;
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {viewMode === 'duplicates' && <DuplicateFinderView onMerge={handleOpenMergeModal} />}
                    {viewMode === 'lists' && <ListsView onEditList={handleOpenEditListModal} onViewList={handleViewList} />}
                </div>
            </div>
        </>
    );
};

export default ContactsPage;