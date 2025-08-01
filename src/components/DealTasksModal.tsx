import React, { useState } from 'react';
import { useCrm, formatDate } from '../store/crmStore';
import { Deal, Task } from '../types';
import Modal from './Modal';
import AddEditTaskModal from './AddEditTaskModal';
import { PlusIcon, CheckCircleIcon, CircleIcon } from './Icons';

interface DealTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

const DealTasksModal: React.FC<DealTasksModalProps> = ({ isOpen, onClose, deal }) => {
  const { getTasksForDeal, updateTask, completeTasks } = useCrm();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const tasks = getTasksForDeal(deal.id);
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleToggleComplete = (task: Task) => {
    if (task.completed) {
      // This is a simplified un-complete action.
      // The store's `completeTasks` only marks as complete.
      // A more robust solution might need an `uncompleteTask` function.
      updateTask({ ...task, completed: false });
    } else {
      completeTasks([task.id]);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Tasks for: ${deal.title}`}>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Pending Tasks ({pendingTasks.length})</h3>
              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md shadow hover:bg-blue-700 transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Task
              </button>
            </div>
            <ul className="space-y-2">
              {pendingTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                  <div className="flex items-center">
                    <button onClick={() => handleToggleComplete(task)} className="mr-3 text-slate-400 hover:text-green-500">
                      <CircleIcon className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="text-slate-800">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-sm text-slate-500">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-slate-500 text-sm italic">No pending tasks.</p>
              )}
            </ul>
          </div>

          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mt-4 border-t pt-4">Completed Tasks ({completedTasks.length})</h3>
              <ul className="space-y-2 mt-2">
                {completedTasks.map(task => (
                  <li key={task.id} className="flex items-center p-2">
                     <button onClick={() => handleToggleComplete(task)} className="mr-3 text-green-500 hover:text-slate-400">
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="text-slate-500 line-through">{task.title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {isAddTaskModalOpen && (
        <AddEditTaskModal
          isOpen={isAddTaskModalOpen}
          onClose={() => setIsAddTaskModalOpen(false)}
          dealId={deal.id}
        />
      )}
    </>
  );
};

export default DealTasksModal;
