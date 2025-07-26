import React from 'react';
import { useCrm, formatDate } from '../store/crmStore';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { EditIcon, LayersIcon, MailIcon, WhatsappIcon, PlusIcon } from './Icons';
import { Contact } from '../types';
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
  const { getContactById, deals, showAddEditContact, showAddDeal } = useCrm();

  if (!contactId) return null;

  const contact = getContactById(contactId);
  const associatedDeals = deals.filter(deal => deal.contactIds.includes(contactId));

  if (!contact) return null;

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
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">{contact.firstName} {contact.lastName}</h3>
                        <p className="text-slate-600">{contact.company}</p>
                    </div>
                    <button onClick={handleEdit} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                        <EditIcon className="w-4 h-4 mr-1"/> Edit
                    </button>
                </div>
                <div className="mt-4 border-t pt-4 space-y-2 text-sm">
                    {contact.email && <p className="text-slate-700"><strong>Email:</strong> {contact.email}</p>}
                    {contact.email2 && <p className="text-slate-700"><strong>Secondary Email:</strong> {contact.email2}</p>}
                    <p className="text-slate-700"><strong>Phone:</strong> {contact.phone}</p>
                    {contact.zipCode && <p className="text-slate-700"><strong>Zip Code:</strong> {contact.zipCode}</p>}
                </div>
                 <div className="mt-4 flex flex-col space-y-2">
                    {contact.email &&
                      <a href={`mailto:${contact.email}`} className="text-center bg-blue-100 text-blue-700 px-3 py-2 rounded-md font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center">
                          <MailIcon className="w-4 h-4 mr-2"/> Email
                      </a>
                    }
                    {contact.email2 &&
                      <a href={`mailto:${contact.email2}`} className="text-center bg-blue-100 text-blue-700 px-3 py-2 rounded-md font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center">
                          <MailIcon className="w-4 h-4 mr-2"/> Secondary Email
                      </a>
                    }
                    <a href={formatWhatsappLink(contact.phone)} target="_blank" rel="noopener noreferrer" className="text-center bg-green-100 text-green-700 px-3 py-2 rounded-md font-semibold hover:bg-green-200 transition-colors flex items-center justify-center">
                        <WhatsappIcon className="w-4 h-4 mr-2"/> WhatsApp
                    </a>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-slate-800 flex items-center mb-2">
                    <LayersIcon className="w-5 h-5 mr-2 text-slate-500" /> Associated Deals ({associatedDeals.length})
                </h4>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {associatedDeals.length > 0 ? (
                        <ul className="divide-y divide-slate-200">
                           {associatedDeals.map(deal => (
                               <li key={deal.id} className="p-3 hover:bg-slate-50">
                                   <Link to={`/deals/${deal.id}`} onClick={onClose} className="font-semibold text-blue-600 hover:underline">{deal.title}</Link>
                                   <div className="flex justify-between items-center mt-1">
                                       <p className="text-sm text-slate-500">{deal.stage}</p>
                                       <p className="text-sm text-slate-400">{formatDate(deal.createdAt)}</p>
                                   </div>
                               </li>
                           ))}
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