import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { DynamicList, FilterRule, ContactTag } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, XIcon } from './Icons';

type Field = FilterRule['field'];
type Operator = FilterRule['operator'];

const fieldOptions: { value: Field, label: string }[] = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'zipCode', label: 'Zip Code' },
    { value: 'contactTagIds', label: 'Contact Tags' },
];

const operatorOptions: { [key in Field]: { value: Operator, label: string }[] } = {
    firstName: [
        { value: 'contains', label: 'contains' },
        { value: 'not_contains', label: 'does not contain' },
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
    ],
    lastName: [
        { value: 'contains', label: 'contains' },
        { value: 'not_contains', label: 'does not contain' },
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
    ],
    email: [
        { value: 'contains', label: 'contains' },
        { value: 'not_contains', label: 'does not contain' },
    ],
    company: [
        { value: 'contains', label: 'contains' },
        { value: 'not_contains', label: 'does not contain' },
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
    ],
    zipCode: [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
    ],
    contactTagIds: [
        { value: 'has_tag', label: 'has tag' },
        { value: 'not_has_tag', label: 'does not have tag' },
    ]
};


const AddEditListModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    listToEdit?: DynamicList | null;
}> = ({ isOpen, onClose, listToEdit }) => {
    const { addDynamicList, updateDynamicList, contactTags } = useCrm();
    const [name, setName] = useState('');
    const [assignedTagIds, setAssignedTagIds] = useState<string[]>([]);
    const [rules, setRules] = useState<FilterRule[]>([]);

    useEffect(() => {
        if (listToEdit) {
            setName(listToEdit.name);
            setAssignedTagIds(listToEdit.assignedTagIds);
            setRules(listToEdit.rules);
        } else {
            setName('');
            setAssignedTagIds([]);
            setRules([{ field: 'email', operator: 'contains', value: '' }]);
        }
    }, [listToEdit, isOpen]);

    const handleAddRule = () => {
        setRules(prev => [...prev, { field: 'email', operator: 'contains', value: '' }]);
    };
    
    const handleRemoveRule = (index: number) => {
        setRules(prev => prev.filter((_, i) => i !== index));
    };

    const handleRuleChange = (index: number, field: keyof FilterRule, value: string) => {
        const newRules = [...rules];
        const oldRule = newRules[index];
        newRules[index] = { ...oldRule, [field]: value };
        
        // If field changes, reset operator to the first valid one
        if (field === 'field') {
            const newField = value as Field;
            const newOperators = operatorOptions[newField];
            if (!newOperators.find(op => op.value === oldRule.operator)) {
                newRules[index].operator = newOperators[0].value;
                newRules[index].value = '';
            }
        }

        setRules(newRules);
    };

    const assignedTags = useMemo(() =>
        assignedTagIds.map(id => contactTags.find(t => t.id === id)).filter(Boolean) as ContactTag[],
        [assignedTagIds, contactTags]
    );

    const availableTags = useMemo(() =>
        contactTags.filter(t => !assignedTagIds.includes(t.id)),
        [assignedTagIds, contactTags]
    );

    const handleAddAssignedTag = (tagId: string) => {
        if (tagId && !assignedTagIds.includes(tagId)) {
            setAssignedTagIds(prev => [...prev, tagId]);
        }
    };
    
    const handleRemoveAssignedTag = (tagId: string) => {
        setAssignedTagIds(prev => prev.filter(id => id !== tagId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || rules.some(r => !r.value.trim())) {
            alert("Please provide a name for the list and ensure all rule values are filled in.");
            return;
        }

        const listData = { name, assignedTagIds, rules };
        
        if (listToEdit) {
            await updateDynamicList({ ...listData, id: listToEdit.id });
        } else {
            await addDynamicList(listData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={listToEdit ? "Edit Dynamic List" : "Create Dynamic List"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="list-name" className="block text-sm font-medium text-slate-700">List Name</label>
                    <input
                        type="text"
                        id="list-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Automatically apply these tags</label>
                    <div className="mt-2 p-2 min-h-[40px] bg-slate-50 border rounded-md flex flex-wrap gap-2">
                        {assignedTags.map(tag => (
                            <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-1 rounded-full flex items-center ${tag.color}`}>
                                {tag.name}
                                <button type="button" onClick={() => handleRemoveAssignedTag(tag.id)} className="ml-1.5 -mr-0.5 text-white/70 hover:text-white">
                                    <XIcon className="w-3 h-3"/>
                                </button>
                            </span>
                        ))}
                    </div>
                    <select
                        onChange={(e) => {
                            handleAddAssignedTag(e.target.value);
                            e.target.value = '';
                        }}
                        value=""
                        className="mt-2 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                    >
                        <option value="">Add a tag...</option>
                        {availableTags.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Rules</label>
                    <p className="text-xs text-slate-500">Contacts must match ALL of these rules to be in the list.</p>
                    <div className="mt-2 space-y-3">
                        {rules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                <select
                                    value={rule.field}
                                    onChange={e => handleRuleChange(index, 'field', e.target.value)}
                                    className="block w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                >
                                    {fieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <select
                                    value={rule.operator}
                                    onChange={e => handleRuleChange(index, 'operator', e.target.value)}
                                    className="block w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                >
                                    {operatorOptions[rule.field].map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                {rule.field === 'contactTagIds' ? (
                                    <select
                                        value={rule.value}
                                        onChange={e => handleRuleChange(index, 'value', e.target.value)}
                                        className="block w-2/4 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                    >
                                        <option value="">Select a tag...</option>
                                        {contactTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={rule.value}
                                        onChange={e => handleRuleChange(index, 'value', e.target.value)}
                                        className="block w-2/4 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                    />
                                )}
                                <button type="button" onClick={() => handleRemoveRule(index)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={rules.length <= 1}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddRule} className="mt-3 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                        <PlusIcon className="w-4 h-4 mr-1"/> Add another rule
                    </button>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">{listToEdit ? 'Save Changes' : 'Create List'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditListModal;