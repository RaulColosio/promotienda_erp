









import React, { useState, useMemo, useRef, FormEvent, DragEvent } from 'react';
import { useCrm, formatDate } from '../store/crmStore';
import { Note, Quote, Attachment, User } from '../types';
import RichTextEditor from './RichTextEditor';
import { 
    PlusIcon, EditIcon, TrashIcon, MessageSquareIcon, FileTextIcon, 
    ExternalLinkIcon, LinkIcon, XIcon, UploadCloudIcon, DownloadIcon,
    WhatsappIcon, MailIcon, CheckIcon, ThumbsUpIcon
} from './Icons';

type TimelineItem = (Note & { type: 'note' }) | (Quote & { type: 'quote' });

const handleAttachmentClick = (attachment: { data: string, name: string, type: string }) => {
    const isViewable = attachment.type.startsWith('image/') || attachment.type === 'application/pdf';

    if (isViewable) {
        try {
            const byteCharacters = atob(attachment.data.substring(attachment.data.indexOf(',') + 1));
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: attachment.type });
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Failed to open file in new tab:", error);
            alert("Could not open file. It may be corrupted or an unsupported format.");
        }
    } else {
        // Fallback to download for other file types
        const link = document.createElement("a");
        link.href = attachment.data;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Sub-component for displaying a single Note
const NoteItem: React.FC<{note: Note}> = ({ note }) => {
    const { users, currentUser, updateNote, deleteNote, showConfirmation, toggleNoteLike, getUserById } = useCrm();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(note.content);

    const handleUpdateNote = () => {
        // Note: editing attachments is not supported in this view for simplicity.
        updateNote({ ...note, content: editedContent });
        setIsEditing(false);
    };

    const handleDelete = () => {
        showConfirmation(
            'Are you sure you want to permanently delete this note? This action cannot be undone.',
            () => deleteNote(note.id)
        );
    }

    const hasLiked = useMemo(() => {
        return currentUser && note.likes?.includes(currentUser.id);
    }, [note.likes, currentUser]);

    const likerNames = useMemo(() => {
        if (!note.likes || note.likes.length === 0) return "No one has liked this yet.";
        return "Liked by: " + note.likes.map(id => getUserById(id)?.name || 'a user').join(', ');
    }, [note.likes, getUserById]);


    return (
        <div className="relative pl-8 group">
            <div className="absolute top-0 left-0 h-full border-l-2 border-slate-200">
                <div className="absolute -left-[1.05rem] top-1.5 p-1.5 bg-white rounded-full border-2 border-slate-200">
                     <MessageSquareIcon className="w-5 h-5 text-slate-500" />
                </div>
            </div>
            <div className="ml-4 py-4">
                {isEditing ? (
                     <div className="space-y-2">
                        <RichTextEditor
                            value={editedContent}
                            onChange={setEditedContent}
                            placeholder="Edit your note..."
                            users={users}
                        />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                            <button onClick={handleUpdateNote} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <p className="text-xs text-slate-400 font-semibold">{formatDate(note.createdAt)}</p>
                            {note.content && (
                                <div
                                    className="prose max-w-none mt-1"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            )}
                            {note.attachments && note.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                    {note.attachments.map((att, index) => (
                                        <button 
                                            key={index} 
                                            onClick={() => handleAttachmentClick(att)}
                                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-medium group"
                                        >
                                            <FileTextIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500"/>
                                            <span>{att.name}</span>
                                            <DownloadIcon className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-500" title={likerNames}>
                                <button onClick={() => toggleNoteLike(note.id)} className={`p-1 rounded-full transition-colors ${hasLiked ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 hover:text-blue-600'}`}>
                                    <ThumbsUpIcon className={`w-5 h-5 ${hasLiked ? 'fill-current' : 'fill-none'}`} />
                                </button>
                                {note.likes && note.likes.length > 0 && (
                                    <span className="text-sm font-semibold">{note.likes.length}</span>
                                )}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-blue-600 p-1"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={handleDelete} className="text-slate-500 hover:text-red-600 p-1"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for displaying a single Quote
const QuoteItem: React.FC<{quote: Quote}> = ({ quote }) => {
    const { deleteQuote, showConfirmation, updateQuote } = useCrm();

    const handleDelete = (quoteId: string) => {
        showConfirmation(
            'Are you sure you want to delete this quote? This action cannot be undone.',
            () => deleteQuote(quoteId)
        );
    };
    
    const handleToggleDeliveryMethod = (method: 'whatsapp' | 'email') => {
        const currentMethods = quote.deliveryMethods || [];
        const newMethods = currentMethods.includes(method)
            ? currentMethods.filter(m => m !== method) // remove it
            : [...currentMethods, method]; // add it
        updateQuote(quote.id, { deliveryMethods: newMethods });
    };
    
    const allDeliveryOptions: ('whatsapp' | 'email')[] = ['whatsapp', 'email'];

    return (
         <div className="relative pl-8 group">
            <div className="absolute top-0 left-0 h-full border-l-2 border-slate-200">
                 <div className="absolute -left-[1.05rem] top-1.5 p-1.5 bg-white rounded-full border-2 border-slate-200">
                     <FileTextIcon className="w-5 h-5 text-slate-500" />
                </div>
            </div>
            <div className="ml-4 py-4">
                 <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                        {quote.title && <h4 className="font-bold text-slate-800 mb-2 truncate">{quote.title}</h4>}
                        <div className="flex items-center gap-3">
                            {quote.pdfName && quote.pdfData ? (
                                <button onClick={() => handleAttachmentClick({ data: quote.pdfData!, name: quote.pdfName!, type: 'application/pdf' })} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-medium text-left">
                                    <FileTextIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                    <span className="truncate">{quote.pdfName}</span>
                                </button>
                            ) : quote.zohoUrl ? (
                                <span className="flex items-center gap-2 text-slate-700 font-medium">
                                    <LinkIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                    <span className="truncate">Zoho Quote Link</span>
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                         <span className="text-xs text-slate-400 font-semibold">{formatDate(quote.createdAt)}</span>
                        {quote.zohoUrl && (
                            <a href={quote.zohoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title="Open in Zoho">
                                <ExternalLinkIcon className="w-5 h-5" />
                            </a>
                        )}
                        <button onClick={() => handleDelete(quote.id)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-slate-500">Delivered via:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {allDeliveryOptions.map(method => {
                                const isSelected = quote.deliveryMethods?.includes(method);
                                
                                const baseClasses = "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors";
                                
                                const selectedClasses = method === 'whatsapp' 
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200';
                                
                                const unselectedClasses = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';

                                return (
                                    <button 
                                        key={method}
                                        onClick={() => handleToggleDeliveryMethod(method)}
                                        className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
                                    >
                                        {method === 'whatsapp' ? <WhatsappIcon className="w-4 h-4"/> : <MailIcon className="w-4 h-4"/>}
                                        <span>{method === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
                                        {isSelected && <CheckIcon className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const fileToBase64 = (fileToConvert: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToConvert);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const ActivitySection: React.FC<{ dealId: string }> = ({ dealId }) => {
    const { getNotesForDeal, addNote, getQuotesForDeal, addQuote, users } = useCrm();
    const [activeTab, setActiveTab] = useState<'note' | 'quote'>('note');

    // State for Note Creator
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteAttachments, setNewNoteAttachments] = useState<Attachment[]>([]);
    
    // State for Quote Creator
    const [quoteTitle, setQuoteTitle] = useState('');
    const [quoteFile, setQuoteFile] = useState<File | null>(null);
    const [zohoUrl, setZohoUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const notes = getNotesForDeal(dealId);
    const quotes = getQuotesForDeal(dealId);

    const timelineItems: TimelineItem[] = useMemo(() => {
        const combined = [
            ...notes.map(n => ({ ...n, type: 'note' as const })),
            ...quotes.map(q => ({ ...q, type: 'quote' as const }))
        ];
        return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notes, quotes]);
    
    const handleNoteFilesDrop = async (files: File[]) => {
        const fileToAttachment = async (file: File): Promise<Attachment> => {
            const data = await fileToBase64(file);
            return {
                id: `${file.name}-${Date.now()}`, // temp id
                name: file.name,
                type: file.type,
                size: file.size,
                data: data,
            };
        };
        const newAttachments = await Promise.all(files.map(fileToAttachment));
        setNewNoteAttachments(prev => [...prev, ...newAttachments]);
    };
    
    const handleRemoveAttachment = (attachmentId: string) => {
        setNewNoteAttachments(prev => prev.filter(a => a.id !== attachmentId));
    };

    const handleAddNote = async () => {
        const hasText = newNoteContent.replace(/<[^>]*>/g, '').trim().length > 0;
        const hasMentions = /data-mention="true"/.test(newNoteContent);
        
        if (!hasText && !hasMentions && newNoteAttachments.length === 0) {
            return; // Note is empty, do nothing
        }

        setIsSubmitting(true);
        try {
            await addNote({ dealId, content: newNoteContent, attachments: newNoteAttachments });
            setNewNoteContent('');
            setNewNoteAttachments([]);
        } catch (error) {
            console.error("Error creating note:", error);
            alert("Could not save note. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddQuote = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedZohoUrl = zohoUrl.trim();
        if (!quoteFile && !trimmedZohoUrl) return;

        setIsSubmitting(true);
        try {
             let quoteData: Omit<Quote, 'id' | 'createdAt' | 'dealId'> = {
                title: quoteTitle.trim() || undefined,
                zohoUrl: trimmedZohoUrl || undefined,
            };

            if (quoteFile) {
                const pdfData = await fileToBase64(quoteFile);
                quoteData.pdfName = quoteFile.name;
                quoteData.pdfData = pdfData;
            }

            await addQuote({ ...quoteData, dealId });
            
            setQuoteTitle('');
            setQuoteFile(null);
            setZohoUrl('');
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Error uploading quote:", error);
            alert("Could not add quote. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files ? event.target.files[0] : null;
        if (selectedFile && selectedFile.type !== "application/pdf") {
            alert("Only PDF files are allowed.");
            setQuoteFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setQuoteFile(selectedFile);
    };

    const handleQuoteDragEvent = (e: DragEvent<HTMLFormElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(isEntering);
    };

    const handleQuoteDrop = (e: DragEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const selectedFile = files[0];
            if (selectedFile.type !== "application/pdf") {
                alert("Only PDF files are allowed.");
            } else {
                setQuoteFile(selectedFile);
            }
        }
    };
    
    const TabButton = ({ tab, children }: { tab: 'note' | 'quote', children: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab 
                ? 'text-blue-600 border-blue-600' 
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <MessageSquareIcon className="w-5 h-5 mr-2 text-slate-500" /> Activity
            </h3>

            <div className="mt-4 border-b border-slate-200">
                <div className="flex -mb-px">
                    <TabButton tab="note">Add Note</TabButton>
                    <TabButton tab="quote">Add Quote</TabButton>
                </div>
            </div>
            
            <div className="py-4">
                {activeTab === 'note' && (
                    <div className="space-y-3">
                         <RichTextEditor
                            value={newNoteContent}
                            onChange={setNewNoteContent}
                            placeholder="Add a new note, mention with @, or drag & drop files..."
                            onFilesDrop={handleNoteFilesDrop}
                            users={users}
                        />
                         {newNoteAttachments.length > 0 && (
                            <div className="space-y-2 p-2 border rounded-md bg-slate-50">
                                <h4 className="text-xs font-bold text-slate-500 uppercase">Attachments</h4>
                                {newNoteAttachments.map(att => (
                                    <div key={att.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <FileTextIcon className="w-4 h-4 text-slate-400" />
                                            <span>{att.name}</span>
                                            <span className="text-xs text-slate-500">({(att.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <button onClick={() => handleRemoveAttachment(att.id)} className="text-red-500 hover:text-red-700">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end">
                             <button onClick={handleAddNote} disabled={isSubmitting} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-300">
                                <PlusIcon className="w-4 h-4 mr-2" /> {isSubmitting ? 'Saving...' : 'Add Note'}
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'quote' && (
                    <form 
                        onSubmit={handleAddQuote}
                        onDragEnter={(e) => handleQuoteDragEvent(e, true)}
                        onDragLeave={(e) => handleQuoteDragEvent(e, false)}
                        onDragOver={(e) => handleQuoteDragEvent(e, true)}
                        onDrop={handleQuoteDrop}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-2">
                             <div className="flex-shrink-0 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setQuoteTitle('Anticipo')}
                                    className={`px-3 py-2 text-sm font-semibold rounded-md border transition-colors ${quoteTitle === 'Anticipo' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    Anticipo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuoteTitle('Liquidación')}
                                    className={`px-3 py-2 text-sm font-semibold rounded-md border transition-colors ${quoteTitle === 'Liquidación' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    Liquidación
                                </button>
                            </div>
                            <input
                                type="text"
                                value={quoteTitle}
                                onChange={e => setQuoteTitle(e.target.value)}
                                placeholder="Or type a custom title..."
                                className="w-full flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <label htmlFor="quote-file-upload"
                            className={`relative block border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer ${
                                isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                            }`}
                        >
                            <input 
                                type="file" 
                                id="quote-file-upload" 
                                accept="application/pdf" 
                                onChange={handleFileChange} 
                                ref={fileInputRef} 
                                className="sr-only"
                            />
                            {quoteFile ? (
                                <div className="flex flex-col items-center justify-center">
                                     <FileTextIcon className="w-8 h-8 text-green-500" />
                                     <p className="mt-2 font-semibold text-slate-700">{quoteFile.name}</p>
                                     <p className="text-xs text-slate-500">{(quoteFile.size / 1024).toFixed(2)} KB</p>
                                     <button 
                                         type="button" 
                                         onClick={(e) => {
                                             e.preventDefault();
                                             setQuoteFile(null);
                                             if(fileInputRef.current) fileInputRef.current.value = "";
                                         }}
                                         className="mt-3 flex items-center text-sm font-semibold text-red-600 hover:text-red-800"
                                     >
                                         <XIcon className="w-4 h-4 mr-1" /> Remove File
                                     </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pointer-events-none">
                                     <UploadCloudIcon className="w-8 h-8 text-slate-400" />
                                     <p className="mt-2 font-semibold text-slate-700">
                                        <span className="text-blue-600">Click to upload</span> or drag and drop
                                     </p>
                                     <p className="text-xs text-slate-500">PDF only</p>
                                </div>
                            )}
                        </label>
                
                        <div className="flex items-center gap-3">
                            <div className="flex-grow relative">
                                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="url"
                                    value={zohoUrl}
                                    onChange={e => setZohoUrl(e.target.value)}
                                    placeholder="or add Zoho URL"
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                
                            <button 
                                type="submit" 
                                disabled={isSubmitting || (!quoteFile && !zohoUrl.trim())} 
                                className="flex-shrink-0 flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4 mr-1.5" />
                                {isSubmitting ? 'Adding...' : 'Add Quote'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="mt-4 border-t border-slate-200 -mx-6 px-2">
                 {timelineItems.length > 0 ? (
                    timelineItems.map(item => (
                        <div key={`${item.type}-${item.id}`} className="border-b border-slate-200 last:border-b-0">
                            {item.type === 'note' ? <NoteItem note={item} /> : <QuoteItem quote={item} />}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No activity for this deal yet.</p>
                )}
            </div>
        </div>
    );
};

export default ActivitySection;