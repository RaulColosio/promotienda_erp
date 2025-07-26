import React, { useState, useMemo } from 'react';
import { useCrm, formatDate } from '../store/crmStore';
import { ContactNote, Attachment, User } from '../types';
import RichTextEditor from './RichTextEditor';
import { PlusIcon, EditIcon, TrashIcon, MessageSquareIcon, FileTextIcon, DownloadIcon, XIcon, ThumbsUpIcon } from './Icons';

// Helper function to handle file downloads
const handleDownload = (data: string, name: string) => {
    const link = document.createElement("a");
    link.href = data;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper to convert a file to a Base64 string for storage
const fileToBase64 = (fileToConvert: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToConvert);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


// Sub-component for displaying a single Contact Note
const ContactNoteItem: React.FC<{note: ContactNote}> = ({ note }) => {
    const { users, currentUser, updateContactNote, deleteContactNote, showConfirmation, toggleContactNoteLike, getUserById } = useCrm();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(note.content);

    const handleUpdateNote = () => {
        // Note: editing attachments is not supported in this view for simplicity.
        updateContactNote({ ...note, content: editedContent });
        setIsEditing(false);
    };

    const handleDelete = () => {
        showConfirmation(
            'Are you sure you want to permanently delete this note? This action cannot be undone.',
            () => deleteContactNote(note.id)
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
                                            onClick={() => handleDownload(att.data, att.name)} 
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
                                <button onClick={() => toggleContactNoteLike(note.id)} className={`p-1 rounded-full transition-colors ${hasLiked ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 hover:text-blue-600'}`}>
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

// Main component for the Contact Notes section
const ContactNotesSection: React.FC<{ contactId: string }> = ({ contactId }) => {
    const { getNotesForContact, addContactNote, users } = useCrm();
    const notes = getNotesForContact(contactId);

    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteAttachments, setNewNoteAttachments] = useState<Attachment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFilesDrop = async (files: File[]) => {
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
            await addContactNote({ contactId, content: newNoteContent, attachments: newNoteAttachments });
            setNewNoteContent('');
            setNewNoteAttachments([]);
        } catch (error) {
            console.error("Error creating note for contact:", error);
            alert("Could not save note. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h4 className="text-lg font-semibold text-slate-800 flex items-center mb-2">
                <MessageSquareIcon className="w-5 h-5 mr-2 text-slate-500" />
                Contact Notes
            </h4>
            <div className="py-4 space-y-3">
                <RichTextEditor
                    value={newNoteContent}
                    onChange={setNewNoteContent}
                    placeholder="Add a note, mention with @, or drag & drop files..."
                    onFilesDrop={handleFilesDrop}
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

            <div className="mt-4 border-t border-slate-200">
                {notes.length > 0 ? (
                    notes.map(note => (
                        <div key={note.id} className="border-b border-slate-200 last:border-b-0">
                            <ContactNoteItem note={note} />
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No notes for this contact yet.</p>
                )}
            </div>
        </div>
    );
};

export default ContactNotesSection;