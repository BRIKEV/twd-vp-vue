import type { Todo } from '@/api/todos'

export const learnTwd: Todo = {
  id: '1',
  title: 'Learn TWD',
  description: 'Write tests while the app is running',
  dueDate: '2026-10-20',
  completed: false,
}

export const buildTodoApp: Todo = {
  id: '2',
  title: 'Build Todo App',
  description: 'A Vue + Pinia app to show off mockRequest',
  dueDate: '2026-10-25',
  completed: false,
}

export const shipIt: Todo = {
  id: '3',
  title: 'Ship it',
  description: '',
  dueDate: '',
  completed: true,
}

export const todoList: Todo[] = [learnTwd, buildTodoApp, shipIt]
