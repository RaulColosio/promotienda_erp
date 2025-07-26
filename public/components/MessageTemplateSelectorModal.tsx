import React, { useState, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact, MessageTemplate } from '../types';
import Modal from './Modal';
import { WhatsappIcon } from './Icons';

interface MessageTemplateSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact;
}

const MessageTemplateSelectorModal: React.FC<MessageTemplateSelectorModalProps> = ({ isOpen, onClose, contact }) => {
    const { messageTemplates } = useCrm();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    const selectedTemplate = useMemo(() => {
        return messageTemplates.find(t => t.id === selectedTemplateId);
    }, [selectedTemplateId, messageTemplates]);

    const messagePreview = useMemo(() => {
        if (!selectedTemplate) return "Select a template to see a preview.";
        return selectedTemplate.body.replace(/{nombre del cliente}/g, contact.firstName);
    }, [selectedTemplate, contact.firstName]);

    const handleSend = () => {
        if (!selectedTemplate) return;
        const phone = contact.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(messagePreview);
        const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
        window.open(url, '_blank');
        onClose();
    };
    
    React.useEffect(() => {
        if (isOpen && messageTemplates.length > 0) {
            setSelectedTemplateId(messageTemplates[0].id);
        } else if (!isOpen) {
            setSelectedTemplateId('');
        }
    }, [isOpen, messageTemplates]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send WhatsApp Message">
            <div className="space-y-4">
                <div>
                    <label htmlFor="template-select" className="block text-sm font-medium text-slate-700">Select a message template</label>
                    <select
                        id="template-select"
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {messageTemplates.length === 0 ? (
                             <option>No templates available</option>
                        ) : (
                            messageTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.title}</option>
                            ))
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Message Preview</label>
                    <div className="mt-1 p-3 min-h-[100px] bg-slate-50 border rounded-md text-sm text-slate-600 whitespace-pre-wrap">
                        {messagePreview}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button 
                        type="button"
                        onClick={handleSend}
                        disabled={!selectedTemplate}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300"
                    >
                       <WhatsappIcon className="w-5 h-5 mr-2" /> Send on WhatsApp
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MessageTemplateSelectorModal;