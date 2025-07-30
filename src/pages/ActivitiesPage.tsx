import React, { useState, useEffect, useMemo } from 'react';
import { useCrm, formatDate, addWorkingDays } from '../store/crmStore';
import { Task } from '../types';
import { Link } from 'react-router-dom';
import { ClipboardListIcon, CheckCircleIcon, CircleIcon, CalendarIcon, TrashIcon, UsersIcon, EditIcon, XIcon, ChevronDownIcon } from '../components/Icons';
import Modal from '../components/Modal';
import RobustDatePicker from '../components/RobustDatePicker';
import TaskCreator from '../components/TaskCreator';
import AddEditTaskModal from '../components/AddEditTaskModal';

const FollowUpTaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (title: string, dueDate: string, dealId?: string, responsibleUserId?: string) => void;
    onUndo: () => void;
    dealId?: string;
    defaultResponsibleUserId?: string;
}> = ({ isOpen, onClose, onAddTask, onUndo, dealId, defaultResponsibleUserId }) => {
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
    
    React.useEffect(() => {
        if (isOpen) {
            setTitle("Seguimiento");
            setDueDate(twoDaysWorking);
            setResponsibleUserId(defaultResponsibleUserId || '');
        }
    }, [isOpen, twoDaysWorking, defaultResponsibleUserId]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAddTask(title, dueDate, dealId, responsibleUserId);
        // The calling component handles closing on success
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
                        <option value="">Unassigned</option>
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


const ActivitiesPage: React.FC = () => {
    const { currentUser, users, getAllPendingTasks, updateTask, deleteTask, getDealById, addTask, getUserById, deleteTasks, completeTasks, showConfirmation, showAlert } = useCrm();
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [completedTask, setCompletedTask] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [activeTabUserId, setActiveTabUserId] = useState(currentUser?.id || 'all');
    const [isCreatorCollapsed, setIsCreatorCollapsed] = useState(true);
    
    const pendingTasks = getAllPendingTasks();

    const sortedUsers = useMemo(() => {
        if (!currentUser) return users;
        const currentUserInList = users.find(u => u.id === currentUser.id);
        if (!currentUserInList) return users;

        const otherUsers = users.filter(u => u.id !== currentUser.id);
        return [currentUserInList, ...otherUsers];
    }, [users, currentUser]);
    
    const filteredTasks = useMemo(() => {
        if (activeTabUserId === 'all') {
            return pendingTasks;
        }
        if (activeTabUserId === 'unassigned') {
            return pendingTasks.filter(t => !t.responsibleUserId);
        }
        return pendingTasks.filter(t => t.responsibleUserId === activeTabUserId);
    }, [pendingTasks, activeTabUserId]);

    useEffect(() => {
        setSelectedTaskIds(new Set());
    }, [activeTabUserId]);


    const handleToggleComplete = (task: Task) => {
        const isCompleting = !task.completed;
        updateTask({ ...task, completed: isCompleting }).catch(() => {
            // Revert UI change if update fails.
            // (The store shows an alert, no need for another one here)
        });
        if (isCompleting) {
            setCompletedTask(task);
            setShowFollowUpModal(true);
        }
    };
    
    const handleUndoComplete = () => {
        if (completedTask) {
            updateTask({ ...completedTask, completed: false });
        }
    };

    const handleAddFollowUpTask = async (title: string, dueDate: string, dealId?: string, responsibleUserId?: string) => {
        try {
            await addTask({ dealId, title, dueDate, responsibleUserId });
            setShowFollowUpModal(false);
        } catch (error) {
            console.error("Failed to add follow-up task:", error);
            // Modal stays open for user to correct.
        }
    };

    const handleOpenEditModal = (task: Task) => {
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    const handleSelectTask = (taskId: string) => {
        setSelectedTaskIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(taskId)) {
                newSelection.delete(taskId);
            } else {
                newSelection.add(taskId);
            }
            return newSelection;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
        } else {
            setSelectedTaskIds(new Set());
        }
    };

    const handleBulkDelete = () => {
        showConfirmation(
            `Are you sure you want to delete ${selectedTaskIds.size} tasks? They will be moved to the archive.`,
            () => {
                deleteTasks(Array.from(selectedTaskIds));
                setSelectedTaskIds(new Set());
            }
        );
    };

    const handleBulkComplete = () => {
        const tasksToComplete = Array.from(selectedTaskIds)
            .map(id => pendingTasks.find(t => t.id === id))
            .filter(Boolean) as Task[];
        
        const unassignedTasks = tasksToComplete.filter(t => !t.responsibleUserId);
        if (unassignedTasks.length > 0) {
            showAlert("Action Required", "Cannot complete tasks that are unassigned. Please assign them first.");
            return;
        }

        completeTasks(Array.from(selectedTaskIds));
        setSelectedTaskIds(new Set());
    };

    const handleDeleteTask = (taskId: string) => {
        showConfirmation(
            'Are you sure you want to delete this task? It will be moved to the archive.',
            () => deleteTask(taskId)
        );
    }
    
    const TabButton = ({ isActive, onClick, children }: { isActive: boolean, onClick: () => void, children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                isActive 
                ? 'text-blue-600 border-blue-600' 
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col h-full p-8">
            {completedTask && (
                <FollowUpTaskModal
                    isOpen={showFollowUpModal}
                    onClose={() => setShowFollowUpModal(false)}
                    onAddTask={handleAddFollowUpTask}
                    onUndo={handleUndoComplete}
                    dealId={completedTask.dealId}
                    defaultResponsibleUserId={completedTask.responsibleUserId}
                />
            )}
            <AddEditTaskModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                taskToEdit={taskToEdit}
            />
            <div className="flex-shrink-0 pb-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-slate-800">Tareas</h2>
                </div>
                <div className="bg-white shadow rounded-lg">
                    <button
                        onClick={() => setIsCreatorCollapsed(!isCreatorCollapsed)}
                        className="w-full flex justify-between items-center p-4 text-left text-lg font-semibold text-slate-700"
                        aria-expanded={!isCreatorCollapsed}
                    >
                        <span>Añadir nueva tarea</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isCreatorCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                    {!isCreatorCollapsed && (
                        <div className="p-4 border-t border-slate-200">
                            <TaskCreator showUserAssignment={true} className="bg-transparent border-none p-0 shadow-none" />
                        </div>
                    )}
                </div>
            </div>

            <div className="border-b border-slate-200 mb-4">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <TabButton isActive={activeTabUserId === 'all'} onClick={() => setActiveTabUserId('all')}>Todos</TabButton>
                    {sortedUsers.map(user => (
                        <TabButton key={user.id} isActive={activeTabUserId === user.id} onClick={() => setActiveTabUserId(user.id)}>
                            {user.name}
                        </TabButton>
                    ))}
                </nav>
            </div>

            <div className="flex-grow overflow-auto">
                 {selectedTaskIds.size > 0 && (
                    <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-blue-800">{selectedTaskIds.size} task(s) selected</span>
                        <div className="flex items-center gap-4">
                            <button onClick={handleBulkComplete} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
                                <CheckCircleIcon className="w-5 h-5"/> Mark as complete
                            </button>
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800">
                                <TrashIcon className="w-5 h-5"/> Delete
                            </button>
                             <button onClick={() => setSelectedTaskIds(new Set())} className="text-slate-500 hover:text-slate-700">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                )}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center">
                        <input 
                            type="checkbox"
                            id="select-all-tasks"
                            className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                            onChange={handleSelectAll}
                            checked={filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length}
                            disabled={filteredTasks.length === 0}
                        />
                        <label htmlFor="select-all-tasks" className="ml-3 text-sm text-slate-600 font-medium">
                            Select All Pending Tasks
                        </label>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => {
                                const deal = task.dealId ? getDealById(task.dealId) : null;
                                const responsibleUser = task.responsibleUserId ? getUserById(task.responsibleUserId) : null;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const taskDueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
                                const isOverdue = taskDueDate && taskDueDate < today && !task.completed;

                                return (
                                    <div key={task.id} className={`flex items-center justify-between p-4 group ${selectedTaskIds.has(task.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <div className="flex items-center flex-grow pr-4">
                                             <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500 mr-4 flex-shrink-0"
                                                checked={selectedTaskIds.has(task.id)}
                                                onChange={() => handleSelectTask(task.id)}
                                                aria-label={`Select task ${task.title}`}
                                            />
                                            <button onClick={() => handleToggleComplete(task)} aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'} className="pt-px">
                                                {task.completed ? <CheckCircleIcon className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" /> : <CircleIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mr-4 flex-shrink-0" />}
                                            </button>
                                            <div className="flex-grow">
                                                <p className="text-slate-800 font-medium">{task.title}</p>
                                                <div className="flex items-center gap-4 text-sm mt-1">
                                                    {deal && (
                                                        <Link to={`/deals/${deal.id}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">
                                                            Deal: {deal.title}
                                                        </Link>
                                                    )}
                                                     {responsibleUser ? (
                                                        <span className="text-slate-500 flex items-center">
                                                            <UsersIcon className="w-4 h-4 mr-1.5"/>
                                                            {responsibleUser.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic flex items-center">
                                                            <UsersIcon className="w-4 h-4 mr-1.5"/>
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            {task.dueDate && (
                                                <p className={`flex items-center text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                    <CalendarIcon className="w-4 h-4 mr-1.5" />
                                                    Due {formatDate(task.dueDate)}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(task); }} className="text-slate-400 hover:text-blue-600">
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-slate-400 hover:text-red-600">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center">
                                <ClipboardListIcon className="w-16 h-16 mx-auto text-slate-400"/>
                                <h3 className="mt-4 text-xl font-semibold text-slate-800">No Pending Tasks</h3>
                                <p className="mt-1 text-slate-500">No tasks match the current filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivitiesPage;