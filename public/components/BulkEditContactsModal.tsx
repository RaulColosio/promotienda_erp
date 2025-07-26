import React, { useState, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { ContactTag } from '../types';
import Modal from './Modal';
import { XIcon } from './Icons';

interface BulkEditContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedContactIds: string[];
}

const BulkEditContactsModal: React.FC<BulkEditContactsModalProps> = ({ isOpen, onClose, selectedContactIds }) => {
    const { contactTags, bulkUpdateContacts } = useCrm();
    const [addTagIds, setAddTagIds] = useState<string[]>([]);
    const [removeTagIds, setRemoveTagIds] = useState<string[]>([]);

    const availableTagsToAdd = useMemo(() => contactTags.filter(t => !addTagIds.includes(t.id)), [contactTags, addTagIds]);
    const availableTagsToRemove = useMemo(() => contactTags.filter(t => !removeTagIds.includes(t.id)), [contactTags, removeTagIds]);

    const handleAddTag = (tagId: string, type: 'add' | 'remove') => {
        if (!tagId) return;
        if (type === 'add') {
            if (!addTagIds.includes(tagId)) setAddTagIds(prev => [...prev, tagId]);
        } else {
            if (!removeTagIds.includes(tagId)) setRemoveTagIds(prev => [...prev, tagId]);
        }
    };

    const handleRemoveTag = (tagId: string, type: 'add' | 'remove') => {
        if (type === 'add') {
            setAddTagIds(prev => prev.filter(id => id !== tagId));
        } else {
            setRemoveTagIds(prev => prev.filter(id => id !== tagId));
        }
    };
    
    const handleSubmit = async () => {
        await bulkUpdateContacts(selectedContactIds, {
            addTagIds: addTagIds,
            removeTagIds: removeTagIds
        });
        onClose();
        // Reset state for next time
        setAddTagIds([]);
        setRemoveTagIds([]);
    };

    const TagSelector: React.FC<{
        label: string;
        selectedTagIds: string[];
        availableTags: ContactTag[];
        onAdd: (tagId: string) => void;
        onRemove: (tagId: string) => void;
    }> = ({ label, selectedTagIds, availableTags, onAdd, onRemove }) => {
        const selectedTags = selectedTagIds.map(id => contactTags.find(t => t.id === id)).filter(Boolean) as ContactTag[];

        return (
            <div>
                <label className="block text-sm font-medium text-slate-700">{label}</label>
                <div className="mt-2 p-2 min-h-[40px] bg-slate-50 border rounded-md flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                        <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-1 rounded-full flex items-center ${tag.color}`}>
                            {tag.name}
                            <button type="button" onClick={() => onRemove(tag.id)} className="ml-1.5 -mr-0.5 text-white/70 hover:text-white">
                                <XIcon className="w-3 h-3"/>
                            </button>
                        </span>
                    ))}
                </div>
                <select
                    onChange={(e) => {
                        onAdd(e.target.value);
                        e.target.value = '';
                    }}
                    value=""
                    className="mt-2 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                >
                    <option value="">Select a tag...</option>
                    {availableTags.map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Edit ${selectedContactIds.length} Contacts`}>
            <div className="space-y-6">
                <p className="text-sm text-slate-600">
                    The changes you make here will be applied to all selected contacts. This will not affect any tags that were applied manually or by other lists.
                </p>
                <TagSelector 
                    label="Add these tags"
                    selectedTagIds={addTagIds}
                    availableTags={availableTagsToAdd}
                    onAdd={(tagId) => handleAddTag(tagId, 'add')}
                    onRemove={(tagId) => handleRemoveTag(tagId, 'add')}
                />
                <TagSelector 
                    label="Remove these tags"
                    selectedTagIds={removeTagIds}
                    availableTags={availableTagsToRemove}
                    onAdd={(tagId) => handleAddTag(tagId, 'remove')}
                    onRemove={(tagId) => handleRemoveTag(tagId, 'remove')}
                />

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Apply Changes</button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkEditContactsModal;