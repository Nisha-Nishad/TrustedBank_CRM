import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function TasksPage({ onNotify }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  // New Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'CALL',
    dueDate: new Date().toISOString().slice(0, 16),
    relatedType: 'CUSTOMER',
    relatedId: 'general',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTasks({ tab: activeTab });
      setTasks(res.tasks || []);
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const handleToggleComplete = async (taskId) => {
    try {
      await api.toggleTaskComplete(taskId);
      onNotify?.('Task status updated!', 'success');
      fetchTasks();
    } catch (err) {
      onNotify?.(err.message, 'error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.createTask({
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      });
      onNotify?.('Task created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({
        title: '',
        type: 'CALL',
        dueDate: new Date().toISOString().slice(0, 16),
        relatedType: 'CUSTOMER',
        relatedId: 'general',
      });
      fetchTasks();
    } catch (err) {
      onNotify?.(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#64748B]">Action Items & Reminders &bull; Phase 1</div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Tasks Management</h2>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center">
          + Create Task
        </Button>
      </div>

      {/* Tabs with Horizontal Scroll for Mobile */}
      <div className="border-b border-[#E2E8F0] flex gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto custom-scrollbar flex-nowrap -mx-4 sm:mx-0 px-4 sm:px-0">
        {[
          { key: 'today', label: "Today's Tasks" },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 transition shrink-0 ${
              activeTab === tab.key
                ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-xs text-[#64748B] text-center py-8">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
            No tasks found in this tab.
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#CBD5E1] transition"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleComplete(task.id)}
                    className="w-4 h-4 rounded text-[#1E3A8A] border-[#CBD5E1] focus:ring-[#1E3A8A] cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isCompleted ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Type: <span className="font-semibold text-[#0F172A]">{task.type}</span> &bull; Assigned to: {task.assignedTo?.name || 'Self'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                  <Badge variant={isCompleted ? 'success' : 'warning'}>
                    {isCompleted ? 'Completed' : 'Pending'}
                  </Badge>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {new Date(task.dueDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Follow-up Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Task Subject</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              placeholder="e.g. Call Rajesh Verma to confirm Form 16 submission"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Task Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="CALL">Phone Call</option>
                <option value="MEETING">Customer Meeting</option>
                <option value="EMAIL">Email Dispatch</option>
                <option value="FOLLOW_UP">General Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">Due Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={formLoading}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
