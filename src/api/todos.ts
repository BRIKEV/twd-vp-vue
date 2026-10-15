export interface Todo {
  id: string
  title: string
  description: string
  dueDate: string
  completed: boolean
}

export interface NewTodo {
  title: string
  description: string
  dueDate: string
}

const BASE_URL = '/api/todos'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export const fetchTodos = () => request<Todo[]>(BASE_URL)

export const createTodo = (todo: NewTodo) =>
  request<Todo>(BASE_URL, { method: 'POST', body: JSON.stringify(todo) })

export const updateTodo = (id: string, changes: Partial<Omit<Todo, 'id'>>) =>
  request<Todo>(`${BASE_URL}/${id}`, { method: 'PATCH', body: JSON.stringify(changes) })

export const deleteTodo = (id: string) => request<void>(`${BASE_URL}/${id}`, { method: 'DELETE' })
