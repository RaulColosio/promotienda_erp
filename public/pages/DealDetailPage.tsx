import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCrm, formatDate, addWorkingDays } from '../store/crmStore';
import { Contact, Deal, Task, Note, Attachment, Tag, User, PipelineStage } from '../types';
import Modal from '../components/Modal';
import { 
    ChevronLeftIcon, UsersIcon, MailIcon, WhatsappIcon, 
    MessageSquareIcon, ClipboardListIcon, PlusIcon, CalendarIcon, 
    CircleIcon, CheckCircleIcon, TrashIcon, EditIcon, PaperclipIcon,
    DownloadIcon, FileIcon, XIcon, ChevronDownIcon, TagIcon, RefreshCwIcon,
    BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, EraserIcon, CheckIcon, CopyIcon
} from '../components/Icons';
import ManageDealContactsModal from '../components/ManageDealContactsModal';
import RobustDatePicker from '../components/RobustDatePicker';
import TaskCreator from '../components/TaskCreator';
import AddEditTaskModal from '../components/AddEditTaskModal';
import ProductionTypeModal from '../components/ProductionTypeModal';
import SetDeliveryDateModal from '../components/SetDeliveryDateModal';
import CloudSection from '../components/CloudSection';
import DeliverySection from '../components/DeliverySection';
import ActivitySection from '../components/ActivitySection';
import MessageTemplateSelectorModal from '../components/MessageTemplateSelectorModal';

const EditDealModal: React.FC<{ isOpen: boolean; onClose: () => void; deal: Deal }> = ({ isOpen, onClose, deal }) => {
    const { updateDeal, deleteDeal, showConfirmation, users } = useCrm();
    const [title, setTitle] = useState(deal.title);
    const [deliveryDate, setDeliveryDate] = useState(deal.deliveryDate || '');
    const [assignedUserId, setAssignedUserId] = useState(deal.assignedUserId || '');

    const oneWeekFromNow = useMemo(() => {
        const d = addWorkingDays(new Date(), 5); // 5 working days for a week
        return d.toISOString().split('T')[0];
    }, []);

    const tenDaysFromNow = useMemo(() => {
        const d = addWorkingDays(new Date(), 10);
        return d.toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        if(deal && isOpen) {
            setTitle(deal.title);
            const initialDate = deal.deliveryDate ? deal.deliveryDate.split('T')[0] : oneWeekFromNow;
            setDeliveryDate(initialDate);
            setAssignedUserId(deal.assignedUserId || '');
        }
    }, [deal, isOpen, oneWeekFromNow]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !assignedUserId) return;
        updateDeal(deal.id, (prevDeal) => ({
            ...prevDeal,
            title,
            deliveryDate: deliveryDate || undefined,
            assignedUserId,
        }));
        onClose();
    };

    const handleDelete = () => {
        showConfirmation(
            'Are you sure you want to delete this deal? It will be moved to the archive.',
            () => {
                deleteDeal(deal.id);
                onClose();
            }
        );
    };
    
    const getButtonClass = (isActive: boolean) =>
    `px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${
        isActive
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
    }`;
    
    const isOneWeek = deliveryDate === oneWeekFromNow;
    const isTenDays = deliveryDate === tenDaysFromNow;
    const isCustomDate = !!deliveryDate && !isOneWeek && !isTenDays;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Deal">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700">Deal Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => setDeliveryDate(oneWeekFromNow)} className={getButtonClass(isOneWeek)}>1 Semana</button>
                        <button type="button" onClick={() => setDeliveryDate(tenDaysFromNow)} className={getButtonClass(isTenDays)}>10 días</button>
                        <RobustDatePicker value={deliveryDate} onChange={setDeliveryDate}>
                            <div className={getButtonClass(isCustomDate)}>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className={`w-4 h-4 ${!isCustomDate ? 'text-slate-500' : ''}`} />
                                    <span>Elegir fecha</span>
                                </div>
                            </div>
                        </RobustDatePicker>
                        {deliveryDate && <p className="text-sm text-slate-500 ml-2">Seleccionada: {formatDate(deliveryDate)}</p>}
                    </div>
                </div>
                 <div>
                    <label htmlFor="assignedUser" className="block text-sm font-medium text-slate-700">Assigned To</label>
                    <select
                        id="assignedUser"
                        value={assignedUserId}
                        onChange={(e) => setAssignedUserId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded-md hover:bg-red-50">
                       Delete Deal
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save Changes</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

const PipelineStepper: React.FC<{ deal: Deal; onStageChange: (newStageId: string) => void }> = ({ deal, onStageChange }) => {
    const { pipelineStages } = useCrm();
    
    return (
        <div className="flex flex-wrap items-center gap-2">
            {pipelineStages.map((stage) => (
                <button
                    key={stage.id}
                    onClick={() => onStageChange(stage.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        deal.stageId === stage.id
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                    {stage.name}
                </button>
            ))}
        </div>
    );
};

const ContactsSection: React.FC<{deal: Deal}> = ({ deal }) => {
    const { getContactById, showContactDetail } = useCrm();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedContactForMsg, setSelectedContactForMsg] = useState<Contact | null>(null);

    const assignedContacts = useMemo(() => deal.contactIds.map(id => getContactById(id)).filter(c => c !== undefined) as Contact[], [deal.contactIds, getContactById]);
    
    const handleWhatsAppClick = (contact: Contact) => {
        setSelectedContactForMsg(contact);
        setIsTemplateModalOpen(true);
    };

    const CopyButton: React.FC<{ textToCopy: string | undefined }> = ({ textToCopy }) => {
        const [copied, setCopied] = useState(false);
    
        const handleCopy = () => {
            if (!textToCopy) return;
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }, (err) => {
                console.error('Could not copy text: ', err);
            });
        };
    
        return (
            <button onClick={handleCopy} className="text-slate-400 hover:text-blue-600 disabled:opacity-50" disabled={!textToCopy} title={`Copy ${textToCopy}`}>
                {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        );
    };

    const formatDisplayPhone = (phone: string): string => {
        if (phone.startsWith('+52')) return phone.substring(3).trim();
        if (phone.startsWith('+1')) return phone.substring(2).trim();
        return phone;
    };

    return (
        <>
        <ManageDealContactsModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} deal={deal} />
        {selectedContactForMsg && <MessageTemplateSelectorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} contact={selectedContactForMsg} />}

        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <UsersIcon className="w-5 h-5 mr-2 text-slate-500" />
                    Contacts
                </h3>
                <button onClick={() => setIsManageModalOpen(true)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                    Edit Contacts
                </button>
            </div>
            
            <div className="space-y-4">
                {assignedContacts.length > 0 ? (
                    assignedContacts.map(contact => (
                         <div key={contact.id} className="flex gap-4 items-start">
                             <div className="flex-grow p-4 bg-slate-50 rounded-lg space-y-2">
                                <div className="flex items-center gap-3">
                                    <CopyButton textToCopy={`${contact.firstName} ${contact.lastName}`} />
                                    <button onClick={() => showContactDetail(contact.id)} className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left">{contact.firstName} {contact.lastName}</button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CopyButton textToCopy={contact.company} />
                                    <p className="text-sm text-slate-600">{contact.company}</p>
                                </div>
                                <div className="flex items-center gap-3 border-t pt-2 mt-2">
                                    <CopyButton textToCopy={formatDisplayPhone(contact.phone)} />
                                    <p className="text-sm text-slate-600">{formatDisplayPhone(contact.phone)}</p>
                                </div>
                                {contact.email && (
                                    <div className="flex items-center gap-3">
                                        <CopyButton textToCopy={contact.email} />
                                        <p className="text-sm text-slate-600 break-all">{contact.email}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <a 
                                    href={`mailto:${contact.email}`}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    title={`Email ${contact.email}`}
                                >
                                    <MailIcon className="w-5 h-5"/>
                                </a>
                                <button 
                                    onClick={() => handleWhatsAppClick(contact)}
                                    className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                    title={`WhatsApp ${contact.phone}`}
                                >
                                    <WhatsappIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No contacts assigned to this deal.</p>
                )}
            </div>
        </div>
        </>
    );
};

const FollowUpTaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (title: string, dueDate: string, responsibleUserId?: string) => void;
    onUndo: () => void;
    defaultResponsibleUserId?: string;
}> = ({ isOpen, onClose, onAddTask, onUndo, defaultResponsibleUserId }) => {
    const { users } = useCrm();
    const getISODateString = (date: Date) => date.toISOString().split('T')[0];

    const todayStr = getISODateString(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getISODateString(tomorrowDate);
    const twoDaysWorking = getISODateString(addWorkingDays(new Date(), 2));

    const [title, setTitle] = useState("Seguimiento");
    const [dueDate, setDueDate] = useState(twoDaysWorking);
    const [responsibleUserId, setResponsibleUserId] = useState(defaultResponsibleUserId || '');

    useEffect(() => {
        if (isOpen) {
            setTitle("Seguimiento");
            setDueDate(twoDaysWorking);
            setResponsibleUserId(defaultResponsibleUserId || '');
        }
    }, [isOpen, defaultResponsibleUserId, twoDaysWorking]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAddTask(title, dueDate, responsibleUserId);
        onClose();
    };

    const handleUndo = () => {
      onUndo();
      onClose();
    }
    
    const getButtonClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors border ${
        isActive
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
    }`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Follow-up Task">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">The previous task was marked as complete. Create a follow-up task?</p>
                <div>
                    <label htmlFor="followup-title" className="block text-sm font-medium text-slate-700">Task Title</label>
                    <input type="text" id="followup-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => setDueDate(todayStr)} className={getButtonClass(dueDate === todayStr)}>Hoy</button>
                        <button type="button" onClick={() => setDueDate(tomorrowStr)} className={getButtonClass(dueDate === tomorrowStr)}>Mañana</button>
                        <button type="button" onClick={() => setDueDate(twoDaysWorking)} className={getButtonClass(dueDate === twoDaysWorking)}>En 2 días</button>
                        <RobustDatePicker value={dueDate} onChange={setDueDate}>
                            <div className={getButtonClass(!!dueDate && dueDate !== todayStr && dueDate !== tomorrowStr && dueDate !== twoDaysWorking)}>
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                        </RobustDatePicker>
                        {dueDate && (
                            <div className="flex items-center gap-2 text-sm bg-blue-100 text-blue-800 font-medium px-3 py-1.5 rounded-md">
                                <span>{formatDate(dueDate)}</span>
                                <button type="button" onClick={() => setDueDate('')} className="text-blue-600 hover:text-blue-800">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor="followup-user" className="block text-sm font-medium text-slate-700">Assign to</label>
                    <select
                        id="followup-user"
                        value={responsibleUserId}
                        onChange={e => setResponsibleUserId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-between items-center pt-4">
                    <button onClick={handleUndo} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100">Undo</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Skip</button>
                        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Create Task</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const TasksSection: React.FC<{dealId: string}> = ({ dealId }) => {
    const { getTasksForDeal, addTask, updateTask, deleteTask, getUserById, showConfirmation, getDealById } = useCrm();
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [completedTask, setCompletedTask] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const tasks = getTasksForDeal(dealId);
    const deal = getDealById(dealId);
    
    const handleAddFollowUpTask = (title: string, dueDate: string, responsibleUserId?: string) => {
        addTask({ dealId, title, dueDate, responsibleUserId });
    };

    const handleUndoComplete = () => {
        if (completedTask) {
            updateTask({ ...completedTask, completed: false });
        }
    };
    
    const handleOpenEditModal = (task: Task) => {
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: string) => {
        showConfirmation(
            'Are you sure you want to delete this task? It will be moved to the archive.',
            () => deleteTask(id)
        );
    };

    const toggleComplete = (task: Task) => {
        const isCompleting = !task.completed;
        updateTask({ ...task, completed: isCompleting });
        if (isCompleting) {
            setCompletedTask(task);
            setShowFollowUpModal(true);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <FollowUpTaskModal 
                isOpen={showFollowUpModal} 
                onClose={() => setShowFollowUpModal(false)}
                onAddTask={handleAddFollowUpTask}
                onUndo={handleUndoComplete}
                defaultResponsibleUserId={completedTask?.responsibleUserId}
            />
            <AddEditTaskModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                taskToEdit={taskToEdit}
            />
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <ClipboardListIcon className="w-5 h-5 mr-2 text-slate-500" /> Tasks
                </h3>
                {!isCreatingTask && (
                    <button onClick={() => setIsCreatingTask(true)} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow hover:bg-blue-700 transition-colors">
                        <PlusIcon className="w-4 h-4 mr-1"/> Add Task
                    </button>
                )}
            </div>
            {isCreatingTask && (
                <TaskCreator 
                    dealId={dealId} 
                    showUserAssignment={true} 
                    defaultAssignedUserId={deal?.assignedUserId} 
                    onTaskAdded={() => setIsCreatingTask(false)}
                    onCancel={() => setIsCreatingTask(false)}
                />
            )}
             <div className="mt-6 space-y-2 border-t pt-3">
                {tasks.length > 0 ? tasks.map(task => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const taskDueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
                    const isOverdue = taskDueDate && taskDueDate < today && !task.completed;
                    const responsibleUser = task.responsibleUserId ? getUserById(task.responsibleUserId) : null;

                    return (
                        <div key={task.id} className="flex items-center justify-between text-sm group -m-2 p-2 rounded-md hover:bg-slate-50">
                            <div className="flex items-start flex-grow pr-4 py-1">
                                <button onClick={() => toggleComplete(task)} aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'} className="pt-px">
                                    {task.completed 
                                        ? <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0"/> 
                                        : <CircleIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mr-3 flex-shrink-0"/>}
                                </button>
                                <div className="flex-grow">
                                    <p className={`text-slate-800 break-words ${task.completed ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                                    <div className="flex items-center text-xs mt-1 space-x-3">
                                        {task.dueDate && (
                                            <p className={`flex items-center ${
                                                task.completed ? 'text-slate-400' : isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'
                                            }`}>
                                                <CalendarIcon className="w-3 h-3 mr-1.5"/> Due {formatDate(task.dueDate)} {isOverdue && '(Overdue)'}
                                            </p>
                                        )}
                                        {responsibleUser && (
                                            <p className="flex items-center text-slate-500"><UsersIcon className="w-3 h-3 mr-1.5" />{responsibleUser.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => handleOpenEditModal(task)} className="text-slate-400 hover:text-blue-600">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-600">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                }) : <p className="text-sm text-slate-500 pt-2">No tasks for this deal yet.</p>}
            </div>
        </div>
    );
};

const TagsSection: React.FC<{deal: Deal}> = ({deal}) => {
    const { tags, getTagById, updateDeal, addTag } = useCrm();
    const [isManaging, setIsManaging] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('bg-gray-500');

    const assignedTags = useMemo(() => deal.tagIds.map(id => getTagById(id)).filter(t => t), [deal.tagIds, getTagById]);
    const availableTags = useMemo(() => tags.filter(t => !deal.tagIds.includes(t.id)), [tags, deal.tagIds]);
    
    const handleAddTag = (tagId: string) => {
        updateDeal(deal.id, (prevDeal) => ({ tagIds: [...prevDeal.tagIds, tagId] }));
    };

    const handleRemoveTag = (tagId: string) => {
        updateDeal(deal.id, (deal) => ({ tagIds: deal.tagIds.filter(id => id !== tagId) }));
    };
    
    const handleCreateTag = async () => {
        if (!newTagName) return;
        const newTag = await addTag({ name: newTagName, color: newTagColor });
        handleAddTag(newTag.id);
        setNewTagName('');
        setNewTagColor('bg-gray-500');
    }
    
    const tagColors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <TagIcon className="w-5 h-5 mr-2 text-slate-500" /> Tags
                </h3>
                <button onClick={() => setIsManaging(!isManaging)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                    {isManaging ? 'Done' : 'Manage Tags'}
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {assignedTags.map(tag => tag && (
                    <span key={tag.id} className={`text-xs font-semibold text-white px-2 py-1 rounded-full flex items-center ${tag.color}`}>
                        {tag.name}
                        {isManaging && (
                             <button onClick={() => handleRemoveTag(tag.id)} className="ml-1.5 -mr-0.5 text-white/70 hover:text-white">
                                <XIcon className="w-3 h-3"/>
                            </button>
                        )}
                    </span>
                ))}
            </div>

            {isManaging && (
                <div className="mt-4 pt-4 border-t">
                    <div className="mb-2">
                        <label className="text-sm font-medium text-slate-600 block mb-1">Add existing tag</label>
                        <select onChange={(e) => handleAddTag(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm">
                            <option>Select a tag...</option>
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
                                <button key={color} onClick={() => setNewTagColor(color)} className={`w-6 h-6 rounded-full ${color} ${newTagColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}></button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const DealDetailPage: React.FC = () => {
    const { dealId } = useParams<{ dealId: string }>();
    const navigate = useNavigate();
    const { getDealById, updateDeal, restoreDeal, deals, getUserById, getStageById, pipelineStages } = useCrm();
    
    const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
    const [productionModalDeal, setProductionModalDeal] = useState<Deal | null>(null);
    const [isDeliveryDateModalOpen, setIsDeliveryDateModalOpen] = useState(false);

    const deal = useMemo(() => {
        return getDealById(dealId);
    }, [dealId, getDealById, deals]);

    const isArchived = useMemo(() => {
        return deal ? !deals.some(d => d.id === deal.id) : false;
    }, [deal, deals]);
    
    const assignedUser = useMemo(() => 
        deal?.assignedUserId ? getUserById(deal.assignedUserId) : null
    , [deal, getUserById]);

    useEffect(() => {
        if (!deal) {
            const timer = setTimeout(() => navigate('/deals', { replace: true }), 1000);
            return () => clearTimeout(timer);
        }
    }, [deal, navigate]);


    if (!deal) {
        return (
            <div className="text-center p-10">
                <h2 className="text-2xl font-bold text-slate-700">Deal not found</h2>
                <p className="text-slate-500 mt-2">Redirecting to deals list...</p>
            </div>
        );
    }
    
    const handleStageChange = (newStageId: string) => {
        if (isArchived || deal.stageId === newStageId) return;
        
        const newStage = getStageById(newStageId);
        if (!newStage) return;

        if (newStage.name === 'Producción') {
            setProductionModalDeal(deal);
        } else {
            updateDeal(deal.id, (prevDeal) => ({ ...prevDeal, stageId: newStageId }));
        }
        
        if (newStage.name === 'Compra de material') {
            setIsDeliveryDateModalOpen(true);
        }
    };

    return (
        <div className="p-8 overflow-y-auto h-full">
            {isEditDealModalOpen && <EditDealModal isOpen={isEditDealModalOpen} onClose={() => setIsEditDealModalOpen(false)} deal={deal} />}
            {productionModalDeal && (
                <ProductionTypeModal 
                    isOpen={!!productionModalDeal}
                    onClose={() => setProductionModalDeal(null)}
                    onConfirm={(tagIds) => {
                        const productionStage = pipelineStages.find(s => s.name === 'Producción');
                        if (productionStage) {
                            updateDeal(productionModalDeal.id, () => ({
                                stageId: productionStage.id,
                                tagIds,
                            }));
                        }
                        setProductionModalDeal(null);
                    }}
                    deal={productionModalDeal}
                />
            )}
            <SetDeliveryDateModal 
                isOpen={isDeliveryDateModalOpen}
                onClose={() => setIsDeliveryDateModalOpen(false)}
                deal={deal}
            />

            <div className="mb-8">
                <button onClick={() => navigate('/deals')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back to Deals
                </button>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-slate-800">{deal.title}</h2>
                             {isArchived ? (
                                <span className="bg-red-100 text-red-800 text-sm font-semibold mr-2 px-3 py-1 rounded-full">Eliminado</span>
                            ) : (
                                <button onClick={() => setIsEditDealModalOpen(true)} className="text-slate-500 hover:text-blue-600">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                            {assignedUser && (
                                <p className="text-sm text-slate-600 flex items-center font-medium">
                                    <UsersIcon className="w-4 h-4 mr-2 text-slate-500" />
                                    {assignedUser.name}
                                </p>
                            )}
                            {deal.deliveryDate && (
                                <p className="text-sm text-slate-600 flex items-center font-medium">
                                    <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" />
                                    {formatDate(deal.deliveryDate)}
                                </p>
                            )}
                        </div>
                    </div>
                     {isArchived && (
                        <button onClick={() => restoreDeal(deal.id)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                            <RefreshCwIcon className="w-5 h-5 mr-2" /> Restore Deal
                        </button>
                    )}
                </div>
                 <div className="mt-6 border-t pt-6">
                    {isArchived ? (
                         <p className="text-slate-500 italic p-3 bg-slate-100 rounded-md">This deal is archived. Restore it to make changes.</p>
                    ) : (
                        <PipelineStepper deal={deal} onStageChange={handleStageChange} />
                    )}
                </div>
            </div>

            <fieldset disabled={isArchived} className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 lg:items-start disabled:opacity-75">
                <div className="lg:col-span-2 space-y-8">
                    <TasksSection dealId={deal.id} />
                    <ActivitySection dealId={deal.id} />
                </div>
                <div className="lg:col-span-1 mt-8 lg:mt-0 space-y-8">
                    <div className="space-y-8">
                        <TagsSection deal={deal} />
                        <DeliverySection deal={deal} />
                        <ContactsSection deal={deal} />
                        <CloudSection deal={deal} />
                    </div>
                </div>
            </fieldset>
        </div>
    );
};

export default DealDetailPage;