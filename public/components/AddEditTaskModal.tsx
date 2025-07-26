
import React, { useState, useEffect } from 'react';
import { useCrm, formatDate, addWorkingDays } from '../store/crmStore';
import { Task } from '../types';
import Modal from './Modal';
import RobustDatePicker from './RobustDatePicker';
import { CalendarIcon, UsersIcon, XIcon } from './Icons';

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskToEdit?: Task | null;
    dealId?: string; // For creating a new task linked to a deal
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({ isOpen, onClose, taskToEdit, dealId }) => {
    const { users, addTask, updateTask } = useCrm();
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [responsibleUserId, setResponsibleUserId] = useState<string>('');

    const getISODateString = (date: Date) => date.toISOString().split('T')[0];
    const todayStr = getISODateString(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getISODateString(tomorrowDate);
    const twoDaysWorking = getISODateString(addWorkingDays(new Date(), 2));

    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDueDate(taskToEdit.dueDate || '');
                setResponsibleUserId(taskToEdit.responsibleUserId || '');
            } else {
                setTitle('Seguimiento');
                setDueDate('');
                setResponsibleUserId('');
            }
        }
    }, [isOpen, taskToEdit]);
    
    const getButtonClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors border ${
        isActive
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
    }`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            if (taskToEdit) {
                await updateTask({
                    ...taskToEdit,
                    title,
                    dueDate: dueDate || undefined,
                    responsibleUserId: responsibleUserId || undefined,
                });
            } else {
                await addTask({
                    title,
                    dueDate: dueDate || undefined,
                    responsibleUserId: responsibleUserId || undefined,
                    dealId: dealId,
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save task:", error);
            // Modal stays open for user to fix assignment.
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={taskToEdit ? "Edit Task" : "Add Task"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="task-title" className="block text-sm font-medium text-slate-700">Title</label>
                    <textarea
                        id="task-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        rows={3}
                    />
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
                    <label htmlFor="responsible-user" className="block text-sm font-medium text-slate-700">Assign to</label>
                    <div className="relative mt-1">
                        <select
                            id="responsible-user"
                            value={responsibleUserId}
                            onChange={(e) => setResponsibleUserId(e.target.value)}
                             className="appearance-none block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                             <UsersIcon className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">{taskToEdit ? 'Save Changes' : 'Add Task'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditTaskModal;
