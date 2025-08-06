import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Paperclip, 
  Flag,
  MoreVertical,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import { taskApi } from '../../entities/Task';
import TaskModal from './TaskModal';
import TimeTracker from './TimeTracker';

const KanbanBoard = ({ projectId }) => {
  const [kanbanData, setKanbanData] = useState({
    todo: [],
    in_progress: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTimeTracker, setActiveTimeTracker] = useState(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ];

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getByProject(projectId);
      setKanbanData(response.kanbanData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = kanbanData[source.droppableId];
    const destColumn = kanbanData[destination.droppableId];
    const draggedTask = sourceColumn[source.index];

    // Remove from source
    const newSourceTasks = [...sourceColumn];
    newSourceTasks.splice(source.index, 1);

    // Add to destination
    const newDestTasks = [...destColumn];
    newDestTasks.splice(destination.index, 0, {
      ...draggedTask,
      status: destination.droppableId
    });

    // Update local state immediately
    setKanbanData({
      ...kanbanData,
      [source.droppableId]: newSourceTasks,
      [destination.droppableId]: newDestTasks
    });

    // Prepare reorder data
    const reorderData = [];
    
    // Add tasks from source column
    newSourceTasks.forEach((task, index) => {
      reorderData.push({
        id: task._id,
        order: index,
        status: source.droppableId
      });
    });

    // Add tasks from destination column
    newDestTasks.forEach((task, index) => {
      reorderData.push({
        id: task._id,
        order: index,
        status: destination.droppableId
      });
    });

    try {
      await taskApi.reorder(reorderData);
    } catch (error) {
      console.error('Error updating task order:', error);
      // Revert on error
      loadTasks();
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await taskApi.update(editingTask._id, taskData);
      } else {
        await taskApi.create({ ...taskData, project_id: projectId });
      }
      setShowTaskModal(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.delete(taskId);
        loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleTimeTracking = async (task, action) => {
    try {
      await taskApi.trackTime(task._id, action);
      if (action === 'start') {
        setActiveTimeTracker(task._id);
      } else {
        setActiveTimeTracker(null);
      }
      loadTasks();
    } catch (error) {
      console.error('Error tracking time:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return '';
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const TaskCard = ({ task, index }) => (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
          onClick={() => handleEditTask(task)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">
              {task.title}
            </h4>
            <div className="flex items-center ml-2">
              <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Show task menu
                }}
                className="ml-1 p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-3 w-3" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {task.deadline && (
                <div className={`flex items-center ${
                  new Date(task.deadline) < new Date() ? 'text-red-600' : ''
                }`}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDeadline(task.deadline)}
                </div>
              )}
              
              {task.estimated_hours > 0 && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.estimated_hours}h
                </div>
              )}
              
              {task.attachments?.length > 0 && (
                <div className="flex items-center">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {task.attachments.length}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {task.assigned_to && (
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{task.assigned_to.name?.charAt(0) || 'U'}</span>
                </div>
              )}
              
              {/* Time tracking controls */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const hasActiveEntry = task.time_entries?.some(entry => !entry.end_time);
                  handleTimeTracking(task, hasActiveEntry ? 'stop' : 'start');
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {task.time_entries?.some(entry => !entry.end_time) ? (
                  <Pause className="h-3 w-3 text-red-600" />
                ) : (
                  <Play className="h-3 w-3 text-green-600" />
                )}
              </button>
            </div>
          </div>

          {task.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Project Board</h2>
        <button
          onClick={handleCreateTask}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-white text-gray-700 text-sm px-2 py-1 rounded-full">
                    {kanbanData[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    {kanbanData[column.id]?.map((task, index) => (
                      <TaskCard key={task._id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onDelete={editingTask ? () => handleDeleteTask(editingTask._id) : null}
        />
      )}

      {/* Active Time Tracker */}
      {activeTimeTracker && (
        <TimeTracker
          taskId={activeTimeTracker}
          onStop={() => setActiveTimeTracker(null)}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
