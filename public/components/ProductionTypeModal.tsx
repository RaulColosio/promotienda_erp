import React, { useState, useMemo, useEffect } from 'react';
import { useCrm } from '../store/crmStore';
import { Deal, Tag } from '../types';
import Modal from './Modal';
import { PlusIcon, XIcon } from './Icons';

interface ProductionTypeModalProps {
    isOpen: boolean;
    onClose: () => void; // Cancel
    onConfirm: (tagIds: string[]) => void; // Confirm
    deal: Deal;
}

const ProductionTypeModal: React.FC<ProductionTypeModalProps> = ({ isOpen, onClose, onConfirm, deal }) => {
    const { tags, addTag } = useCrm();
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('bg-gray-500');

    useEffect(() => {
        if (isOpen && deal) {
            setSelectedTagIds(deal.tagIds || []);
        }
    }, [isOpen, deal]);

    const selectedTags = useMemo(() => selectedTagIds.map(id => tags.find(t => t.id === id)).filter(Boolean) as Tag[], [selectedTagIds, tags]);
    const availableTags = useMemo(() => tags.filter(t => !selectedTagIds.includes(t.id)), [tags, selectedTagIds]);

    const handleAddTag = (tagId: string) => {
        if (tagId) setSelectedTagIds(prev => [...prev, tagId]);
    };
    
    const handleRemoveTag = (tagId: string) => {
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        const newTag = await addTag({ name: newTagName.trim(), color: newTagColor });
        handleAddTag(newTag.id);
        setNewTagName('');
        setNewTagColor('bg-gray-500');
    };

    const handleConfirmClick = () => {
        onConfirm(selectedTagIds);
    };

    const tagColors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Production Tags">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    To move deal <span className="font-semibold">{deal.title}</span> to Production, you must assign at least one tag.
                </p>

                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Assigned Tags</h4>
                    <div className="flex flex-wrap gap-2 min-h-[30px] p-2 bg-slate-50 rounded-md">
                        {selectedTags.map(tag => (
                            <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-1 rounded-full flex items-center ${tag.color}`}>
                                {tag.name}
                                <button onClick={() => handleRemoveTag(tag.id)} className="ml-1.5 -mr-0.5 text-white/70 hover:text-white">
                                    <XIcon className="w-3 h-3"/>
                                </button>
                            </span>
                        ))}
                        {selectedTags.length === 0 && <p className="text-xs text-slate-400">No tags selected.</p>}
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                    <div className="mb-2">
                        <label className="text-sm font-medium text-slate-600 block mb-1">Add existing tag</label>
                        <select onChange={(e) => handleAddTag(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" value="">
                            <option value="">Select a tag...</option>
                            {availableTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                        </select>
                    </div>
                    <div className="mt-4">
                        <label className="text-sm font-medium text-slate-600 block mb-1">Or create a new one</label>
                        <div className="flex gap-2">
                            <input type="text" placeholder="New tag name" value={newTagName} onChange={e => setNewTagName(e.target.value)} className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                            <button onClick={handleCreateTag} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">+</button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {tagColors.map(color => (
                                <button key={color} type="button" onClick={() => setNewTagColor(color)} className={`w-6 h-6 rounded-full ${color} ${newTagColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}></button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button 
                        onClick={handleConfirmClick} 
                        disabled={selectedTagIds.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ProductionTypeModal;