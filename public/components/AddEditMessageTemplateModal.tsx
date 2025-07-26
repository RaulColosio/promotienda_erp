import React, { useState, useEffect } from 'react';
import { useCrm } from '../store/crmStore';
import { MessageTemplate } from '../types';
import Modal from './Modal';

interface AddEditMessageTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: MessageTemplate | null;
}

const AddEditMessageTemplateModal: React.FC<AddEditMessageTemplateModalProps> = ({ isOpen, onClose, templateToEdit }) => {
  const { addMessageTemplate, updateMessageTemplate } = useCrm();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setBody(templateToEdit.body);
    } else {
      setTitle('');
      setBody('');
    }
  }, [templateToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    const templateData = { title, body };
    if (templateToEdit) {
      updateMessageTemplate({ ...templateData, id: templateToEdit.id });
    } else {
      addMessageTemplate(templateData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={templateToEdit ? 'Edit Message Template' : 'Add New Message Template'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="template-title" className="block text-sm font-medium text-slate-700">Template Title</label>
          <input type="text" id="template-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Seguimiento" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label htmlFor="template-body" className="block text-sm font-medium text-slate-700">Message Body</label>
          <textarea id="template-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
           <div className="mt-2 text-xs text-slate-500">
                Available placeholders: <code className="bg-slate-200 px-1 rounded">{'{nombre del cliente}'}</code>
            </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">{templateToEdit ? 'Save Changes' : 'Add Template'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditMessageTemplateModal;
