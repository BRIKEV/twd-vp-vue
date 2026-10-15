<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useTodosStore, type TodoFilter } from '@/stores/todos'

const store = useTodosStore()

const form = reactive({ title: '', description: '', dueDate: '' })
const formError = ref<string | null>(null)
const isSaving = ref(false)
const actionError = ref<string | null>(null)

const filters: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

onMounted(() => {
  store.load()
})

async function submit() {
  formError.value = null
  if (!form.title.trim()) {
    formError.value = 'Title is required'
    return
  }
  isSaving.value = true
  try {
    await store.add({
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
    })
    form.title = ''
    form.description = ''
    form.dueDate = ''
  } catch {
    formError.value = 'Could not save the todo. Please try again.'
  } finally {
    isSaving.value = false
  }
}

async function runAction(action: () => Promise<void>, message: string) {
  actionError.value = null
  try {
    await action()
  } catch {
    actionError.value = message
  }
}
</script>

<template>
  <section class="todos">
    <h1>My Todos</h1>

    <form class="card" aria-label="New todo" novalidate @submit.prevent="submit">
      <h2>Create a new todo</h2>
      <label>
        Title
        <input v-model="form.title" type="text" placeholder="What needs doing?" />
      </label>
      <label>
        Description
        <textarea v-model="form.description" rows="2" placeholder="Optional details" />
      </label>
      <label>
        Due date
        <input v-model="form.dueDate" type="date" />
      </label>
      <p v-if="formError" role="alert" class="error">{{ formError }}</p>
      <button type="submit" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Add todo' }}
      </button>
    </form>

    <div class="toolbar">
      <p class="remaining" aria-live="polite">
        {{ store.remaining }} of {{ store.todos.length }} remaining
      </p>
      <div role="group" aria-label="Filter todos" class="filters">
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          :aria-pressed="store.filter === option.value"
          @click="store.filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <p v-if="actionError" role="alert" class="error">{{ actionError }}</p>

    <p v-if="store.isLoading" class="status">Loading todos...</p>

    <div v-else-if="store.loadError" role="alert" class="card error-card">
      <p>{{ store.loadError }}</p>
      <button type="button" @click="store.load()">Retry</button>
    </div>

    <p v-else-if="store.visibleTodos.length === 0" class="status">
      {{ store.todos.length === 0 ? 'No todos yet. Create one above!' : 'Nothing to show here.' }}
    </p>

    <ul v-else aria-label="Todo list" class="list">
      <li
        v-for="todo in store.visibleTodos"
        :key="todo.id"
        class="card item"
        :class="{ done: todo.completed }"
      >
        <label class="check">
          <input
            type="checkbox"
            :checked="todo.completed"
            :aria-label="`Mark ${todo.title} as ${todo.completed ? 'active' : 'completed'}`"
            @change="runAction(() => store.toggle(todo.id), `Could not update ${todo.title}.`)"
          />
          <span class="title">{{ todo.title }}</span>
        </label>
        <p v-if="todo.description" class="description">{{ todo.description }}</p>
        <p v-if="todo.dueDate" class="due">Due {{ todo.dueDate }}</p>
        <button
          type="button"
          class="delete"
          :aria-label="`Delete ${todo.title}`"
          @click="runAction(() => store.remove(todo.id), `Could not delete ${todo.title}.`)"
        >
          Delete
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.todos {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

h1 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-heading);
}

h2 {
  font-size: 1.1rem;
  color: var(--color-heading);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-background-soft);
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

form label {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

input[type='text'],
input[type='date'],
textarea {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
}

button {
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
}

button[type='submit'] {
  background: hsla(160, 100%, 37%, 1);
  border-color: transparent;
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filters {
  display: flex;
  gap: 0.25rem;
}

.filters button[aria-pressed='true'] {
  border-color: hsla(160, 100%, 37%, 1);
  color: hsla(160, 100%, 37%, 1);
}

.list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  position: relative;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title {
  font-weight: 600;
  color: var(--color-heading);
}

.done .title {
  text-decoration: line-through;
  opacity: 0.6;
}

.description,
.due {
  font-size: 0.9rem;
  margin-left: 1.5rem;
}

.due {
  opacity: 0.7;
}

.delete {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.status {
  opacity: 0.8;
}

.error {
  color: #d9534f;
}

.error-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #d9534f;
}
</style>
