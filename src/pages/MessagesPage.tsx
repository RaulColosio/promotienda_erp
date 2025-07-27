import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm, formatDate } from '../store/crmStore';
import { Notification } from '../types';
import { BellIcon, CheckCircleIcon, TrashIcon, MailIcon, XIcon, ThumbsUpIcon } from '../components/Icons';

const MessagesPage: React.FC = () => {
    const { 
        notifications,
        sentNotifications,
        notes,
        contactNotes,
        users,
        markNotificationsAsRead, 
        deleteNotifications, 
        markNotificationsAsUnread, 
        showConfirmation,
        getDealById,
        getContactById
    } = useCrm();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const navigate = useNavigate();

    const sortedReceived = useMemo(() => {
        return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications]);
    
    const sortedSent = useMemo(() => {
        return [...sentNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sentNotifications]);

    const currentList = activeTab === 'received' ? sortedReceived : sortedSent;

    const handleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(currentList.map(n => n.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleNotificationClick = async (notification: Notification) => {
        if (activeTab === 'received' && !notification.isRead) {
            await markNotificationsAsRead([notification.id]);
        }
        navigate(notification.link);
    };

    const handleBulkDelete = () => {
        showConfirmation(
            `Are you sure you want to delete ${selectedIds.size} message(s)? This action cannot be undone.`,
            async () => {
                await deleteNotifications(Array.from(selectedIds));
                setSelectedIds(new Set());
            }
        );
    };
    
    const handleBulkMarkAsRead = async () => {
        await markNotificationsAsRead(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    const handleBulkMarkAsUnread = async () => {
        await markNotificationsAsUnread(Array.from(selectedIds));
        setSelectedIds(new Set());
    };
    
    const handleMarkAsRead = (id: string) => markNotificationsAsRead([id]);
    const handleMarkAsUnread = (id: string) => markNotificationsAsUnread([id]);
    const handleDelete = (id: string) => {
        showConfirmation('Delete this message permanently?', () => deleteNotifications([id]));
    };

    const TabButton = ({ isActive, onClick, children }: { isActive: boolean, onClick: () => void, children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                isActive 
                ? 'text-blue-600 border-blue-600' 
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            {children}
        </button>
    );

    const isAllSelected = currentList.length > 0 && selectedIds.size === currentList.length;

    return (
        <div className="flex flex-col h-full p-8 bg-slate-100">
            <header className="flex-shrink-0 mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Mensajes</h2>
            </header>
            
            <main className="flex-grow bg-white rounded-lg shadow-inner flex flex-col overflow-hidden">
                <div className="border-b border-slate-200 sticky top-0 bg-white z-10">
                    <div className="px-4 flex">
                        <TabButton isActive={activeTab === 'received'} onClick={() => { setActiveTab('received'); setSelectedIds(new Set()); }}>
                            Recibidos ({sortedReceived.length})
                        </TabButton>
                        <TabButton isActive={activeTab === 'sent'} onClick={() => { setActiveTab('sent'); setSelectedIds(new Set()); }}>
                            Menciones realizadas ({sortedSent.length})
                        </TabButton>
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="bg-blue-100 border-b border-blue-200 p-3 flex justify-between items-center sticky top-[49px] z-10">
                        <span className="text-sm font-semibold text-blue-800">{selectedIds.size} message(s) selected</span>
                        <div className="flex items-center gap-4">
                            {activeTab === 'received' && (
                                <>
                                    <button onClick={handleBulkMarkAsRead} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
                                        <CheckCircleIcon className="w-5 h-5"/> Mark as read
                                    </button>
                                    <button onClick={handleBulkMarkAsUnread} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
                                        <MailIcon className="w-5 h-5"/> Mark as unread
                                    </button>
                                </>
                            )}
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800">
                                <TrashIcon className="w-5 h-5"/> Delete
                            </button>
                             <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-slate-700">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex-grow overflow-y-auto">
                    <div className="divide-y divide-slate-100">
                        <div className="p-4 flex items-center bg-slate-50 border-b border-slate-200 sticky top-0">
                             <input 
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                                onChange={handleSelectAll}
                                checked={isAllSelected}
                                disabled={currentList.length === 0}
                                aria-label="Select all messages"
                            />
                             <span className="ml-3 text-sm text-slate-600 font-medium">Select All</span>
                        </div>
                        {currentList.length > 0 ? (
                            currentList.map(notification => {
                                if (activeTab === 'received') {
                                    const dealIdMatch = notification.link.match(/\/deals\/(\w+)/);
                                    let enrichedMessage = notification.message;
                                    if (dealIdMatch) {
                                        const dealId = dealIdMatch[1];
                                        const deal = getDealById(dealId);
                                        if (deal) {
                                            enrichedMessage = `${notification.createdBy.name} te mencionó en una nota del deal '${deal.title}'.`;
                                        }
                                    }
                                    return (
                                        <div key={notification.id} className={`flex items-start p-4 group transition-colors ${selectedIds.has(notification.id) ? 'bg-blue-50' : ''}`}>
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500 mt-1 mr-4 flex-shrink-0" checked={selectedIds.has(notification.id)} onChange={() => handleSelect(notification.id)} aria-label={`Select message from ${notification.createdBy.name}`} />
                                            <div className="flex-grow cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                                <div className="flex items-center">
                                                    {!notification.isRead && <span className="h-2.5 w-2.5 bg-blue-500 rounded-full mr-3 flex-shrink-0" aria-label="Unread"></span>}
                                                    <p className={`text-sm ${!notification.isRead ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{enrichedMessage}</p>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{formatDate(notification.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                                {notification.isRead ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsUnread(notification.id); }} className="text-slate-500 hover:text-blue-600 p-1" title="Mark as unread"> <MailIcon className="w-5 h-5" /> </button>
                                                ) : (
                                                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }} className="text-slate-500 hover:text-blue-600 p-1" title="Mark as read"> <CheckCircleIcon className="w-5 h-5" /> </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }} className="text-slate-500 hover:text-red-600 p-1" title="Delete"> <TrashIcon className="w-5 h-5" /> </button>
                                            </div>
                                        </div>
                                    );
                                } else { // Sent Tab
                                    const note = notes.find(n => n.id === notification.sourceNoteId) || contactNotes.find(n => n.id === notification.sourceNoteId);
                                    const hasLikes = !!(note?.likes && note.likes.length > 0);
                                    let likerNames = "Not yet acknowledged.";
                                    if (hasLikes && note?.likes) {
                                        const names = note.likes.map(id => users.find(u => u.id === id)?.name || 'a user').join(', ');
                                        likerNames = `Acknowledged by: ${names}`;
                                    }
                                    
                                    const mentionedUser = users.find(u => u.id === notification.userId);
                                    
                                    let contextName = '';
                                    const dealIdMatch = notification.link.match(/\/deals\/(\w+)/);
                                    const contactIdMatch = notification.link.match(/contactId=([^&]+)/);

                                    if (dealIdMatch) {
                                        const deal = getDealById(dealIdMatch[1]);
                                        contextName = deal ? `en el deal '${deal.title}'` : 'en un deal eliminado';
                                    } else if (contactIdMatch) {
                                        const contact = getContactById(contactIdMatch[1]);
                                        contextName = contact ? `para el contacto '${contact.firstName || ''} ${contact.lastName || ''}'` : 'para un contacto eliminado';
                                    }

                                    return (
                                        <div key={notification.id} className={`flex items-start p-4 group transition-colors ${selectedIds.has(notification.id) ? 'bg-blue-50' : ''}`}>
                                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500 mt-1 mr-3 flex-shrink-0" checked={selectedIds.has(notification.id)} onChange={() => handleSelect(notification.id)} aria-label={`Select message to ${mentionedUser?.name}`} />
                                            
                                            <div className="flex-shrink-0 mt-1 mr-3" title={likerNames}>
                                                <ThumbsUpIcon className={`w-5 h-5 transition-colors ${hasLikes ? 'text-blue-600 fill-current' : 'text-slate-400'}`} />
                                            </div>

                                            <div className="flex-grow cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                                <p className="text-sm text-slate-600">
                                                    Mencionaste a <span className="font-bold">{mentionedUser?.name || 'un usuario'}</span> en una nota {contextName}.
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">{formatDate(notification.createdAt)}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }} className="text-slate-500 hover:text-red-600 p-1" title="Delete">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                            })
                        ) : (
                             <div className="text-center p-12">
                                <BellIcon className="w-12 h-12 mx-auto text-slate-300"/>
                                <h3 className="mt-4 text-lg font-semibold text-slate-700">No {activeTab === 'received' ? 'Received' : 'Sent'} Messages</h3>
                                <p className="mt-1 text-sm text-slate-500">This folder is empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MessagesPage;