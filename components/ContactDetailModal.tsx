import React from 'react';
import { useCrm, formatDate } from '../store/crmStore';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { EditIcon, LayersIcon, MailIcon, WhatsappIcon, PlusIcon } from './Icons';
import { Contact, ContactTag } from '../types';
import ContactNotesSection from './ContactNotesSection';

interface ContactDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string | null;
}

const formatWhatsappLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://web.whatsapp.com/send?phone=${cleaned}`;
};

const ContactDetailModal: React.FC<ContactDetailModalProps> = ({ isOpen, onClose, contactId }) => {
  const { getContactById, deals, showAddEditContact, showAddDeal, contactTags, getStageById } = useCrm();

  if (!contactId) return null;

  const contact = getContactById(contactId);
  const associatedDeals = deals.filter(deal => deal.contactIds.includes(contactId));

  if (!contact) return null;

  const assignedTags = contact.contactTagIds?.map(tagId => contactTags.find(t => t.id === tagId)).filter(Boolean) as ContactTag[];

  const handleEdit = () => {
    showAddEditContact(contact);
    onClose(); // Close this detail modal when opening the edit modal
  }

  const handleCreateDeal = () => {
    onClose();
    showAddDeal(contact.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Details">
        <div className="space-y-6">
            <div>
                <div className="grid grid-cols-[1fr_auto] gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-2xl font-bold text-slate-800">{contact.firstName} {contact.lastName}</h3>
                                <p className="text-slate-600">{contact.company}</p>
                            </div>
                            <button onClick={handleEdit} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 lg:hidden">
                                <EditIcon className="w-4 h-4 mr-1"/> Edit
                            </button>
                        </div>
                        
                        {assignedTags && assignedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {assignedTags.map(tag => (
                                    <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-1 rounded-full ${tag.color}`}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="border-t pt-4 space-y-2 text-sm">
                            {contact.email && <p className="text-slate-700"><strong>Email:</strong> {contact.email}</p>}
                            {contact.email2 && <p className="text-slate-700"><strong>Secondary Email:</strong> {contact.email2}</p>}
                            <p className="text-slate-700"><strong>Phone:</strong> {contact.phone}</p>
                            {contact.zipCode && <p className="text-slate-700"><strong>Zip Code:</strong> {contact.zipCode}</p>}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col space-y-2 border-l pl-6">
                         <button onClick={handleEdit} className="hidden lg:flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 justify-end mb-2">
                            <EditIcon className="w-4 h-4 mr-1"/> Edit
                        </button>
                        {contact.email &&
                          <a href={`mailto:${contact.email}`} className="p-2 rounded-md hover:bg-slate-100 text-slate-600 border" title={`Email ${contact.email}`}>
                              <MailIcon className="w-5 h-5"/>
                          </a>
                        }
                        <a href={formatWhatsappLink(contact.phone)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-slate-100 text-slate-600 border" title={`WhatsApp ${contact.phone}`}>
                            <WhatsappIcon className="w-5 h-5"/>
                        </a>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-slate-800 flex items-center mb-2">
                    <LayersIcon className="w-5 h-5 mr-2 text-slate-500" /> Associated Deals ({associatedDeals.length})
                </h4>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {associatedDeals.length > 0 ? (
                        <ul className="divide-y divide-slate-200">
                           {associatedDeals.map(deal => {
                               const stage = getStageById(deal.stageId);
                               return (
                                   <li key={deal.id} className="p-3 hover:bg-slate-50">
                                       <Link to={`/deals/${deal.id}`} onClick={onClose} className="font-semibold text-blue-600 hover:underline">{deal.title}</Link>
                                       <div className="flex justify-between items-center mt-1">
                                           <p className="text-sm text-slate-500">{stage?.name}</p>
                                           <p className="text-sm text-slate-400">{formatDate(deal.createdAt)}</p>
                                       </div>
                                   </li>
                               );
                           })}
                        </ul>
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-sm text-slate-500">No deals associated with this contact.</p>
                            <button onClick={handleCreateDeal} className="mt-2 text-sm font-semibold text-blue-600 hover:underline flex items-center justify-center mx-auto">
                                <PlusIcon className="w-4 h-4 mr-1"/>
                                Create New Deal
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t pt-4">
                <ContactNotesSection contactId={contact.id} />
            </div>
        </div>
    </Modal>
  );
};

export default ContactDetailModal;