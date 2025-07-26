
import React, { useState, useEffect } from 'react';
import { useCrm, formatDate, addWorkingDays } from '../store/crmStore';
import RobustDatePicker from './RobustDatePicker';
import { CalendarIcon, PlusIcon, XIcon, UsersIcon } from './Icons';

interface TaskCreatorProps {
    dealId?: string;
    className?: string;
    showUserAssignment?: boolean;
    defaultAssignedUserId?: string;
    onTaskAdded?: () => void;
    onCancel?: () => void;
}

const TaskCreator: React.FC<TaskCreatorProps> = ({ dealId, className, showUserAssignment = false, defaultAssignedUserId, onTaskAdded, onCancel }) => {
    const { users, addTask } = useCrm();
    const [taskTitle, setTaskTitle] = useState('Seguimiento');
    const [dueDate, setDueDate] = useState('');
    const [responsibleUserId, setResponsibleUserId] = useState(defaultAssignedUserId || '');

    useEffect(() => {
        setResponsibleUserId(defaultAssignedUserId || '');
    }, [defaultAssignedUserId]);

    const getISODateString = (date: Date) => date.toISOString().split('T')[0];

    const todayStr = getISODateString(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getISODateString(tomorrowDate);
    const twoDaysWorking = getISODateString(addWorkingDays(new Date(), 2));

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (taskTitle.trim() === '') return;

        try {
            await addTask({
                title: taskTitle,
                dueDate: dueDate || undefined,
                dealId: dealId,
                responsibleUserId: responsibleUserId || undefined,
            });
            setTaskTitle('Seguimiento');
            setDueDate('');
            // Don't reset responsible user, they might want to add another for the same person
            if (onTaskAdded) {
                onTaskAdded();
            }
        } catch (error) {
            console.error(error);
            // The modal will not close, allowing the user to fix the assignment.
        }
    };
    
    const getButtonClass = (isActive: boolean) =>
        `px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${
            isActive
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
        }`;

    return (
        <form onSubmit={handleAddTask} className={`bg-slate-50 border border-slate-200 p-3 rounded-lg ${className}`}>
            <div>
                <input
                    type="text"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex justify-between items-center mt-3 gap-4">
                 <div className="flex items-center gap-2 flex-wrap flex-grow">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Due:</span>
                    <button type="button" onClick={() => setDueDate(todayStr)} className={getButtonClass(dueDate === todayStr)}>Hoy</button>
                    <button type="button" onClick={() => setDueDate(tomorrowStr)} className={getButtonClass(dueDate === tomorrowStr)}>Mañana</button>
                    <button type="button" onClick={() => setDueDate(twoDaysWorking)} className={getButtonClass(dueDate === twoDaysWorking)}>En 2 días</button>
                    <RobustDatePicker value={dueDate} onChange={setDueDate}>
                        <div className={getButtonClass(!!dueDate && dueDate !== todayStr && dueDate !== tomorrowStr && dueDate !== twoDaysWorking)}>
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                    </RobustDatePicker>
                    {dueDate && (
                        <div className="flex items-center gap-2 text-sm bg-blue-100 text-blue-800 font-medium px-3 py-2 rounded-md">
                            <span>{formatDate(dueDate)}</span>
                            <button type="button" onClick={() => setDueDate('')} className="text-blue-600 hover:text-blue-800">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {showUserAssignment && (
                        <div className="relative" style={{minWidth: '150px'}}>
                            <select
                                id="responsible-user"
                                value={responsibleUserId}
                                onChange={(e) => setResponsibleUserId(e.target.value)}
                                className="appearance-none block w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="">Assign to...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                 <UsersIcon className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    )}
                    
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                    )}
                    <button type="submit" className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 whitespace-nowrap" disabled={!taskTitle.trim()}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Task
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TaskCreator;
