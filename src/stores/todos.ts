import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api/todos'
import type { NewTodo, Todo } from '@/api/todos'

export type TodoFilter = 'all' | 'active' | 'completed'

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>('all')
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  const remaining = computed(() => todos.value.filter((todo) => !todo.completed).length)
  const visibleTodos = computed(() => {
    if (filter.value === 'active') return todos.value.filter((todo) => !todo.completed)
    if (filter.value === 'completed') return todos.value.filter((todo) => todo.completed)
    return todos.value
  })

  async function load() {
    isLoading.value = true
    loadError.value = null
    try {
      todos.value = await api.fetchTodos()
    } catch {
      loadError.value = 'Could not load your todos.'
    } finally {
      isLoading.value = false
    }
  }

  async function add(todo: NewTodo) {
    const created = await api.createTodo(todo)
    todos.value.push(created)
  }

  async function toggle(id: string) {
    const todo = todos.value.find((item) => item.id === id)
    if (!todo) return
    const updated = await api.updateTodo(id, { completed: !todo.completed })
    Object.assign(todo, updated)
  }

  async function remove(id: string) {
    await api.deleteTodo(id)
    todos.value = todos.value.filter((todo) => todo.id !== id)
  }

  function $reset() {
    todos.value = []
    filter.value = 'all'
    isLoading.value = false
    loadError.value = null
  }

  return {
    todos,
    filter,
    isLoading,
    loadError,
    remaining,
    visibleTodos,
    load,
    add,
    toggle,
    remove,
    $reset,
  }
})
