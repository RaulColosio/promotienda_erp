import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCrm } from '../store/crmStore';
import { User, Tag, MessageTemplate, Contact, Deal, Task, ContactTag, PipelineStage } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon, TagIcon, MessageSquareIcon, ArchiveIcon, RefreshCwIcon, DownloadIcon, UploadIcon, CheckIcon, GripVerticalIcon, TerminalIcon, ZapIcon, BookmarkIcon, LightbulbIcon, TrendingUpIcon, XIcon, BellRingIcon } from '../components/Icons';
import AddEditMessageTemplateModal from '../components/AddEditMessageTemplateModal';
import ImportContactsModal from '../components/ImportContactsModal';
import NotificationDiagnostics from '../components/NotificationDiagnostics';

// --- Users Management Components ---
const AddEditUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}> = ({ isOpen, onClose, userToEdit }) => {
  const { addUser, updateUser } = useCrm();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
    } else {
      setName('');
      setEmail('');
      setRole('');
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    const userData = { name, email, role };
    if (userToEdit) {
      updateUser({ ...userData, id: userToEdit.id, sortIndex: userToEdit.sortIndex });
    } else {
      addUser(userData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? 'Edit User' : 'Add New User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email (Optional)</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com (for login)" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
           <p className="mt-1 text-xs text-slate-500">Required only for users who need to log in to the platform.</p>
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
          <input type="text" id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Ventas, Diseño, Administrador" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">{userToEdit ? 'Save Changes' : 'Add User'}</button>
        </div>
      </form>
    </Modal>
  );
};

const UsersTabContent: React.FC = () => {
    const { users, deleteUser, showConfirmation, reorderUser } = useCrm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const dragItem = React.useRef<string | null>(null);

    const openAddModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };
    
    const handleDelete = (user: User) => {
        showConfirmation(
            `Are you sure you want to remove ${user.name}? They will no longer be able to access the CRM.`,
            () => deleteUser(user.id)
        );
    }
    
    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => { dragItem.current = id; e.dataTransfer.effectAllowed = 'move'; };
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => { e.preventDefault(); if (dragItem.current && dragItem.current !== targetId) { reorderUser(dragItem.current, targetId); } dragItem.current = null; };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    return (
        <div>
            <AddEditUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={userToEdit} />
            <div className="flex justify-end mb-4">
                <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add User
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                    <th scope="col" className="px-2 py-3 w-12"></th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((user) => (
                    <tr 
                        key={user.id} 
                        className="hover:bg-slate-50"
                        draggable={user.id !== 'user_raul_colosio'}
                        onDragStart={(e) => user.id !== 'user_raul_colosio' && handleDragStart(e, user.id)}
                        onDrop={(e) => user.id !== 'user_raul_colosio' && handleDrop(e, user.id)}
                        onDragOver={handleDragOver}
                    >
                        <td className={`px-4 py-4 whitespace-nowrap text-slate-400 ${user.id !== 'user_raul_colosio' ? 'cursor-move hover:text-slate-600' : ''}`}>
                           {user.id !== 'user_raul_colosio' && <GripVerticalIcon className="w-5 h-5" />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{user.email || <span className="text-slate-400 italic">No login</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'Administrador' 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : user.role === 'Director'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                        {user.id !== 'user_raul_colosio' ? (
                            <>
                                <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-900" aria-label={`Edit ${user.name}`}>
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900" aria-label={`Delete ${user.name}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <span className="text-xs text-slate-400 font-medium">Sistema</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Tags Management Components ---
const TAG_COLORS = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500'];

const AddEditTagModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tagToEdit?: Tag | null;
}> = ({ isOpen, onClose, tagToEdit }) => {
  const { addTag, updateTag } = useCrm();
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    if (tagToEdit) {
      setName(tagToEdit.name);
      setColor(tagToEdit.color);
    } else {
      setName('');
      setColor(TAG_COLORS[0]);
    }
  }, [tagToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !color) return;

    onClose();

    (async () => {
        const tagData = { name, color };
        try {
            if (tagToEdit) {
              await updateTag({ ...tagData, id: tagToEdit.id, sortIndex: tagToEdit.sortIndex });
            } else {
              await addTag(tagData);
            }
        } catch (error) {
            console.error("Failed to save tag in background:", error);
        }
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tagToEdit ? 'Edit Tag' : 'Add New Tag'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tag-name" className="block text-sm font-medium text-slate-700">Tag Name</label>
          <input type="text" id="tag-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Color</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAG_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}></button>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">{tagToEdit ? 'Save Changes' : 'Add Tag'}</button>
        </div>
      </form>
    </Modal>
  );
};

const DealTagsTabContent: React.FC = () => {
    const { tags, deleteTag, showConfirmation, reorderTag } = useCrm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
    const dragItem = React.useRef<string | null>(null);

    const openAddModal = () => {
        setTagToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (tag: Tag) => {
        setTagToEdit(tag);
        setIsModalOpen(true);
    };

    const handleDelete = (tagId: string) => {
        showConfirmation(
            'Are you sure you want to delete this tag? It will be removed from all deals.',
            () => deleteTag(tagId)
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        dragItem.current = id;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
        e.preventDefault();
        if (dragItem.current && dragItem.current !== targetId) {
            reorderTag(dragItem.current, targetId);
        }
        dragItem.current = null;
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    return (
        <div>
            <AddEditTagModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} tagToEdit={tagToEdit} />
             <div className="flex justify-end mb-4">
                <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Tag
                </button>
            </div>
             <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-2 py-3 w-12"></th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Preview</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {tags.map((tag) => (
                    <tr 
                        key={tag.id} 
                        className="hover:bg-slate-50"
                        draggable
                        onDragStart={(e) => handleDragStart(e, tag.id)}
                        onDrop={(e) => handleDrop(e, tag.id)}
                        onDragOver={handleDragOver}
                    >
                        <td className="px-4 py-4 whitespace-nowrap cursor-move text-slate-400 hover:text-slate-600">
                           <GripVerticalIcon className="w-5 h-5" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-semibold text-white px-2 py-1 rounded-full ${tag.color}`}>
                                {tag.name}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tag.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                          <button onClick={() => openEditModal(tag)} className="text-blue-600 hover:text-blue-900">
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(tag.id)} className="text-red-600 hover:text-red-900">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Contact Tags Management Components ---
const AddEditContactTagModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tagToEdit?: ContactTag | null;
}> = ({ isOpen, onClose, tagToEdit }) => {
  const { addContactTag, updateContactTag } = useCrm();
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    if (tagToEdit) {
      setName(tagToEdit.name);
      setColor(tagToEdit.color);
    } else {
      setName('');
      setColor(TAG_COLORS[0]);
    }
  }, [tagToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !color) return;
    onClose();

    (async () => {
        const tagData = { name, color };
        try {
            if (tagToEdit) {
                await updateContactTag({ ...tagData, id: tagToEdit.id, sortIndex: tagToEdit.sortIndex });
            } else {
                await addContactTag(tagData);
            }
        } catch (error) {
            console.error("Failed to save contact tag in background:", error);
        }
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tagToEdit ? 'Edit Contact Tag' : 'Add New Contact Tag'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-tag-name" className="block text-sm font-medium text-slate-700">Tag Name</label>
          <input type="text" id="contact-tag-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Color</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAG_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}></button>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">{tagToEdit ? 'Save Changes' : 'Add Tag'}</button>
        </div>
      </form>
    </Modal>
  );
};

const ContactTagsTabContent: React.FC = () => {
    const { contactTags, deleteContactTag, showConfirmation, reorderContactTag } = useCrm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tagToEdit, setTagToEdit] = useState<ContactTag | null>(null);
    const dragItem = React.useRef<string | null>(null);

    const openAddModal = () => {
        setTagToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (tag: ContactTag) => {
        setTagToEdit(tag);
        setIsModalOpen(true);
    };

    const handleDelete = (tagId: string) => {
        showConfirmation(
            'Are you sure you want to delete this contact tag? It will be removed from all associated contacts.',
            () => deleteContactTag(tagId)
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => { dragItem.current = id; e.dataTransfer.effectAllowed = 'move'; };
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => { e.preventDefault(); if (dragItem.current && dragItem.current !== targetId) { reorderContactTag(dragItem.current, targetId); } dragItem.current = null; };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    return (
        <div>
            <AddEditContactTagModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} tagToEdit={tagToEdit} />
             <div className="flex justify-end mb-4">
                <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Contact Tag
                </button>
            </div>
             <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-2 py-3 w-12"></th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Preview</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {contactTags.map((tag) => (
                    <tr 
                        key={tag.id} 
                        className="hover:bg-slate-50"
                        draggable
                        onDragStart={(e) => handleDragStart(e, tag.id)}
                        onDrop={(e) => handleDrop(e, tag.id)}
                        onDragOver={handleDragOver}
                    >
                        <td className="px-4 py-4 whitespace-nowrap cursor-move text-slate-400 hover:text-slate-600">
                            <GripVerticalIcon className="w-5 h-5" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-semibold text-white px-2 py-1 rounded-full ${tag.color}`}>
                                {tag.name}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tag.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                          <button onClick={() => openEditModal(tag)} className="text-blue-600 hover:text-blue-900">
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(tag.id)} className="text-red-600 hover:text-red-900">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Message Templates Management Components ---
const MessageTemplatesTabContent: React.FC = () => {
    const { messageTemplates, deleteMessageTemplate, showConfirmation, reorderMessageTemplate } = useCrm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<MessageTemplate | null>(null);
    const dragItem = React.useRef<string | null>(null);

    const openAddModal = () => {
        setTemplateToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (template: MessageTemplate) => {
        setTemplateToEdit(template);
        setIsModalOpen(true);
    };

    const handleDelete = (templateId: string) => {
        showConfirmation(
            'Are you sure you want to delete this message template?',
            () => deleteMessageTemplate(templateId)
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => { dragItem.current = id; e.dataTransfer.effectAllowed = 'move'; };
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => { e.preventDefault(); if (dragItem.current && dragItem.current !== targetId) { reorderMessageTemplate(dragItem.current, targetId); } dragItem.current = null; };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };


    return (
        <div>
            <AddEditMessageTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} templateToEdit={templateToEdit} />
            <div className="flex justify-end mb-4">
                <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Template
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-2 py-3 w-12"></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Body</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {messageTemplates.map((template) => (
                            <tr 
                                key={template.id} 
                                className="hover:bg-slate-50"
                                draggable
                                onDragStart={(e) => handleDragStart(e, template.id)}
                                onDrop={(e) => handleDrop(e, template.id)}
                                onDragOver={handleDragOver}
                            >
                                <td className="px-4 py-4 whitespace-nowrap cursor-move text-slate-400 hover:text-slate-600">
                                    <GripVerticalIcon className="w-5 h-5" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{template.title}</td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-slate-700 max-w-md">
                                    <p className="truncate" title={template.body}>{template.body}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                                    <button onClick={() => openEditModal(template)} className="text-blue-600 hover:text-blue-900">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-900">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Pipeline Management Components ---
const PipelineTabContent: React.FC = () => {
    const { pipelineStages, updatePipelineStage, reorderPipelineStage } = useCrm();
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
    const [stageName, setStageName] = useState('');
    const dragItem = React.useRef<string | null>(null);

    const handleEditClick = (stage: PipelineStage) => {
        setEditingStage(stage);
        setStageName(stage.name);
    };

    const handleSave = async (stage: PipelineStage) => {
        if (!stageName.trim()) return;
        await updatePipelineStage({ ...stage, name: stageName });
        setEditingStage(null);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => { dragItem.current = id; e.dataTransfer.effectAllowed = 'move'; };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => { e.preventDefault(); if (dragItem.current && dragItem.current !== targetId) { reorderPipelineStage(dragItem.current, targetId); } dragItem.current = null; };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-800">Pipeline Stages</h3>
            <p className="text-sm text-slate-600 my-4">
                Customize your sales pipeline by renaming and reordering stages. Drag and drop to change the order.
            </p>
            <div className="space-y-2 max-w-md">
                {pipelineStages.map(stage => (
                    <div
                        key={stage.id}
                        className="flex items-center gap-4 p-2 bg-slate-50 border rounded-lg hover:bg-slate-100"
                        draggable
                        onDragStart={(e) => handleDragStart(e, stage.id)}
                        onDrop={(e) => handleDrop(e, stage.id)}
                        onDragOver={handleDragOver}
                    >
                        <div className="cursor-move text-slate-400 hover:text-slate-600 p-2">
                            <GripVerticalIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-grow">
                            {editingStage?.id === stage.id ? (
                                <input
                                    type="text"
                                    value={stageName}
                                    onChange={e => setStageName(e.target.value)}
                                    className="block w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                    autoFocus
                                />
                            ) : (
                                <span className="text-sm font-medium text-slate-800">{stage.name}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {editingStage?.id === stage.id ? (
                                <>
                                    <button onClick={() => handleSave(stage)} className="text-green-600 hover:text-green-800"><CheckIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setEditingStage(null)} className="text-red-600 hover:text-red-800"><XIcon className="w-5 h-5"/></button>
                                </>
                            ) : (
                                <button onClick={() => handleEditClick(stage)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5"/></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Automations Tab ---
const AutomationsTabContent: React.FC = () => {
    const existingAutomations = [
      {
        trigger: "Se crea un nuevo deal",
        action: "Crea tarea 'Enviar cotización' al usuario asignado (vence hoy).",
        status: "Activo"
      },
       {
        trigger: "Se crea un nuevo contacto",
        action: "Asigna automáticamente la etiqueta 'Lead'.",
        status: "Activo"
      },
      {
        trigger: "Deal pasa a fase 'Ganado'",
        action: "Al contacto asociado: agrega etiqueta 'Cliente' y elimina 'Lead'.",
        status: "Activo"
      },
      {
        trigger: "Deal pasa a fase 'Ganado'",
        action: "Crea tarea 'Enviar el Google review' para Raúl Colosio (vence en 2 días laborables).",
        status: "Activo"
      },
      {
        trigger: "Deal entra a fase 'Producción'",
        action: "Agrega automáticamente la etiqueta 'Recibido'.",
        status: "Activo"
      },
      {
        trigger: "Deal entra a fase 'Compra de material'",
        action: "Crea tarea 'Comprar material' al usuario asignado (vence hoy).",
        status: "Activo"
      },
      {
        trigger: "Etiqueta 'Serigrafía' es agregada",
        action: "Crea 2 tareas: 'Preparar positivo' (Raúl Colosio) y 'Impresión de serigrafía' (impresion@promotienda.mx).",
        status: "Activo"
      },
      {
        trigger: "Etiqueta 'DTF textil' es agregada",
        action: "Crea 2 tareas: 'Enviar diseño' (Raúl) y 'Estampado DTF' (Producción).",
        status: "Activo"
      },
      {
        trigger: "Etiqueta 'UV' es agregada",
        action: "Crea 2 tareas: 'Enviar diseño' (Raúl) y 'Estampado UV' (Producción).",
        status: "Activo"
      }
    ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800">Automatizaciones</h3>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50" disabled>
          <PlusIcon className="w-5 h-5 mr-2" />
          Crear Automatización
        </button>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Estas son las automatizaciones que se ejecutan actualmente en el sistema. Próximamente se podrán crear automatizaciones personalizadas.
      </p>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Disparador (Trigger)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {existingAutomations.map((automation, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-normal text-sm font-medium text-slate-900">{automation.trigger}</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-slate-700">{automation.action}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {automation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- System Logics Tab ---
const LogicsTabContent: React.FC = () => {
    const systemLogics = [
        { category: 'Deals & Tasks', logic: "Un deal o tarea debe tener siempre un usuario asignado." },
        { category: 'Contacts', logic: "Un contacto no puede tener las etiquetas 'Lead' y 'Cliente' al mismo tiempo. 'Cliente' tiene prioridad y 'Lead' se elimina si ambas están presentes." },
        { category: 'Production Stage', logic: "Un deal en 'Producción' debe tener al menos una etiqueta de tipo de producción para indicar el proceso." },
        { category: 'Production Stage', logic: "Al agregar una etiqueta de producción (ej. Serigrafía) a un deal que ya tiene 'Recibido', esta última se elimina automáticamente." },
        { category: 'Production Stage', logic: "Al salir de la fase de 'Producción', se eliminan todas las etiquetas de producción asignadas." },
        { category: 'General', logic: "El cálculo de fechas para tareas (ej. 'En 2 días') omite los domingos, considerándolos días no laborables." },
    ];

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-800">Lógicas del Sistema</h3>
      <p className="text-sm text-slate-600 my-4">
        Estas son las reglas de negocio fundamentales que garantizan la integridad y consistencia de los datos en toda la aplicación. No son flujos de trabajo, sino restricciones y comportamientos base del sistema.
      </p>
      
      <div className="space-y-4">
        {systemLogics.map((item, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <span className="text-xs font-semibold uppercase text-slate-400">{item.category}</span>
                <p className="text-slate-700 mt-1">{item.logic}</p>
            </div>
        ))}
      </div>
    </div>
  );
};


// --- Data Management (Archive & Import/Export) ---
const DataTabContent: React.FC = () => {
    const {
        contacts,
        deals,
        getDealById, getContactById,
        deletedContacts, restoreContact,
        deletedDeals, restoreDeal,
        deletedTasks, restoreTask,
    } = useCrm();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const allDeals = useMemo(() => [...deals, ...deletedDeals], [deals, deletedDeals]);

    const handleExportContacts = () => {
        const headers = ["firstName", "lastName", "email", "email2", "phone", "company", "googleDriveFolderUrl"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    
        contacts.forEach(contact => {
            const row = headers.map(header => {
                let val = contact[header as keyof Contact] || '';
                val = String(val).replace(/"/g, '""');
                if (String(val).includes(',')) {
                    val = `"${val}"`;
                }
                return val;
            }).join(",");
            csvContent += row + "\n";
        });
    
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "contacts_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getDaysLeft = (deletedAt: string | undefined): number => {
        if (!deletedAt) return 0;
        const deletedDate = new Date(deletedAt);
        const expiryDate = new Date(deletedDate.getTime());
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        if (diffTime < 0) return 0;
        
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const renderEmptyState = (itemType: string) => (
        <p className="text-center text-sm text-slate-500 p-6">No archived {itemType}.</p>
    );

    return (
        <>
        <ImportContactsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        <div className="space-y-8">
            <section>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Import & Export</h3>
                <div className="bg-slate-50 p-6 rounded-lg border flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-slate-700">Export Contacts</h4>
                        <p className="text-sm text-slate-500 mt-1">Download a CSV file of all your contacts.</p>
                    </div>
                    <button onClick={handleExportContacts} className="flex items-center bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-100 transition-colors">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Export Contacts
                    </button>
                </div>
                <div className="bg-slate-50 p-6 rounded-lg border mt-4 flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-slate-700">Import Contacts</h4>
                        <p className="text-sm text-slate-500 mt-1">Import new contacts from a CSV file.</p>
                    </div>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-100 transition-colors">
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Import Contacts
                    </button>
                </div>
            </section>
            <section>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Archived Items</h3>
                <p className="text-sm text-slate-500 mb-6">Items are permanently deleted after 30 days in the archive.</p>
                 <div className="mb-6">
                    <h4 className="font-semibold text-slate-700 mb-2">Deals ({deletedDeals.length})</h4>
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                        {deletedDeals.length > 0 ? (
                            <ul className="divide-y divide-slate-200">
                                {deletedDeals.map(deal => {
                                    const daysLeft = getDaysLeft(deal.deletedAt);
                                    const associatedContacts = deal.contactIds.map(id => getContactById(id)).filter(Boolean) as Contact[];
                                    return (
                                        <li key={deal.id} className="p-3 flex justify-between items-center group">
                                            <div>
                                                <p className="font-medium text-slate-800">{deal.title}</p>
                                                {associatedContacts.length > 0 && 
                                                    <p className="text-xs text-slate-500 mt-1">Contacts: {associatedContacts.map(c => `${c.firstName} ${c.lastName}`).join(', ')}</p>
                                                }
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                                                    {daysLeft} days left
                                                </span>
                                                <button onClick={() => restoreDeal(deal.id)} className="text-slate-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Restore"><RefreshCwIcon className="w-4 h-4" /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : renderEmptyState('deals')}
                    </div>
                </div>
                <div className="mb-6">
                    <h4 className="font-semibold text-slate-700 mb-2">Contacts ({deletedContacts.length})</h4>
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                        {deletedContacts.length > 0 ? (
                            <ul className="divide-y divide-slate-200">
                                {deletedContacts.map(contact => {
                                    const daysLeft = getDaysLeft(contact.deletedAt);
                                    const associatedDealsForContact = allDeals.filter(deal => deal.contactIds.includes(contact.id));
                                    return (
                                        <li key={contact.id} className="p-3 flex justify-between items-center group">
                                            <div>
                                                <p className="font-medium text-slate-800">{contact.firstName} {contact.lastName}</p>
                                                {associatedDealsForContact.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Deals: {' '}
                                                    {associatedDealsForContact.map((d, i) => (
                                                        <React.Fragment key={d.id}>
                                                        <Link to={`/deals/${d.id}`} className="text-blue-600 hover:underline">{d.title}</Link>
                                                        {i < associatedDealsForContact.length - 1 && ', '}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                                                    {daysLeft} days left
                                                </span>
                                                <button onClick={() => restoreContact(contact.id)} className="text-slate-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Restore"><RefreshCwIcon className="w-4 h-4" /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : renderEmptyState('contacts')}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Tasks ({deletedTasks.length})</h4>
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                        {deletedTasks.length > 0 ? (
                            <ul className="divide-y divide-slate-200">
                                {deletedTasks.map(task => {
                                    const daysLeft = getDaysLeft(task.deletedAt);
                                    const associatedDeal = task.dealId ? getDealById(task.dealId) : null;
                                    return (
                                        <li key={task.id} className="p-3 flex justify-between items-center group">
                                            <div>
                                                <p className="font-medium text-slate-800">{task.title}</p>
                                                {associatedDeal && 
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        From Deal: <Link to={`/deals/${associatedDeal.id}`} className="text-blue-600 hover:underline">{associatedDeal.title}</Link>
                                                    </p>
                                                }
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                                                    {daysLeft} days left
                                                </span>
                                                <button onClick={() => restoreTask(task.id)} className="text-slate-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Restore"><RefreshCwIcon className="w-4 h-4" /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : renderEmptyState('tasks')}
                    </div>
                </div>
            </section>
        </div>
        </>
    );
};

// --- Notifications Tab ---
const NotificationsTabContent: React.FC = () => {
  const [permission, setPermission] = useState(Notification.permission);

  const handleRequestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleSendTest = () => {
    if (Notification.permission === 'granted') {
      new Notification("Test Notification", {
        body: "If you can see this, desktop notifications are working correctly!",
        icon: '/vite.svg',
      });
    }
  };

  const renderStatus = () => {
    switch (permission) {
      case 'granted':
        return (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="font-semibold text-green-800">Desktop notifications are enabled.</p>
            <button onClick={handleSendTest} className="mt-2 text-sm font-semibold text-green-700 hover:underline">
              Send Test Notification
            </button>
          </div>
        );
      case 'denied':
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="font-semibold text-red-800">Desktop notifications are disabled.</p>
            <p className="text-sm text-red-700 mt-1">You need to enable them in your browser settings for this site.</p>
          </div>
        );
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="font-semibold text-yellow-800">Notifications are not yet enabled.</p>
            <button onClick={handleRequestPermission} className="mt-2 text-sm font-semibold text-yellow-700 hover:underline">
              Enable Desktop Notifications
            </button>
          </div>
        );
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-800">Notifications</h3>
      <p className="text-sm text-slate-600 my-4">
        Enable desktop notifications to receive alerts for new messages even when the application is in the background.
        This feature relies on your browser's capabilities and permissions.
      </p>
      {renderStatus()}
    </div>
  );
};


// --- Main Settings Page Component ---
const TABS = {
    USERS: { id: 'users', label: 'Users', icon: UsersIcon, content: UsersTabContent },
    PIPELINE: { id: 'pipeline', label: 'Pipeline', icon: TrendingUpIcon, content: PipelineTabContent },
    DEAL_TAGS: { id: 'tags', label: 'Deal Tags', icon: TagIcon, content: DealTagsTabContent },
    CONTACT_TAGS: { id: 'contact_tags', label: 'Contact Tags', icon: BookmarkIcon, content: ContactTagsTabContent },
    TEMPLATES: { id: 'templates', label: 'Message Templates', icon: MessageSquareIcon, content: MessageTemplatesTabContent },
    NOTIFICATIONS: { id: 'notifications', label: 'Notifications', icon: BellRingIcon, content: NotificationsTabContent },
    AUTOMATIONS: { id: 'automations', label: 'Automatizaciones', icon: ZapIcon, content: AutomationsTabContent },
    LOGICS: { id: 'logics', label: 'Lógicas del Sistema', icon: LightbulbIcon, content: LogicsTabContent },
    DATA: { id: 'data', label: 'Data & Archive', icon: ArchiveIcon, content: DataTabContent },
    DIAGNOSTICS: {id: 'diagnostics', label: 'Diagnostics', icon: TerminalIcon, content: NotificationDiagnostics }
};

type TabKey = keyof typeof TABS;

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('USERS');
    const ActiveContent = TABS[activeTab].content;

    return (
        <div className="flex flex-col h-full p-8">
            <header className="flex-shrink-0 mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Settings</h2>
            </header>
            
            <div className="flex flex-col md:flex-row flex-grow gap-8 overflow-hidden">
                <nav className="flex-shrink-0 md:w-64">
                    <ul className="space-y-2">
                        {Object.entries(TABS).map(([key, tab]) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === key;
                            return (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => setActiveTab(key as TabKey)}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-left ${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5 mr-3" />
                                        {tab.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <main className="flex-grow bg-white p-6 rounded-lg shadow-inner overflow-y-auto">
                    <ActiveContent />
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;