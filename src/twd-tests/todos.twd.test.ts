import { twd, userEvent, screenDom, expect } from 'twd-js'
import { describe, it, beforeEach, afterEach } from 'twd-js/runner'
import { useCounterStore } from '@/stores/counter'
import { useTodosStore } from '@/stores/todos'
import { buildTodoApp, learnTwd, todoList } from './mocks/todos'

describe('Todos page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules()
    twd.clearComponentMocks()
    useCounterStore().$reset()
    useTodosStore().$reset()
  })

  afterEach(() => {
    twd.clearRequestMockRules()
  })

  describe('Loading the list', () => {
    it('should show a loading state while the request is in flight, then render every todo', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: todoList,
        status: 200,
        delay: 500,
      })
      await twd.visit('/todos')

      const loading = await screenDom.findByText('Loading todos...')
      twd.should(loading, 'be.visible')
      await twd.waitForRequest('getTodos')

      const list = await screenDom.findByRole('list', { name: 'Todo list' })
      twd.should(list, 'be.visible')
      expect(screenDom.queryByText('Loading todos...')).to.equal(null)
      const items = await screenDom.findAllByRole('listitem')
      expect(items).to.have.length(3)

      const title = await screenDom.findByText('Learn TWD')
      twd.should(title, 'be.visible')
      const description = await screenDom.findByText('Write tests while the app is running')
      twd.should(description, 'be.visible')
      const due = await screenDom.findByText('Due 2026-10-20')
      twd.should(due, 'be.visible')

      const remaining = await screenDom.findByText('2 of 3 remaining')
      twd.should(remaining, 'be.visible')
      const shipped = await screenDom.findByRole('checkbox', { name: 'Mark Ship it as active' })
      twd.should(shipped, 'be.checked')
    })

    it('should show the empty state when the API returns no todos', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: [],
        status: 200,
      })
      await twd.visit('/todos')
      await twd.waitForRequest('getTodos')

      const empty = await screenDom.findByText('No todos yet. Create one above!')
      twd.should(empty, 'be.visible')
      const remaining = await screenDom.findByText('0 of 0 remaining')
      twd.should(remaining, 'be.visible')
    })

    it('should show an error on a server failure and recover when Retry succeeds', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: { message: 'Internal Server Error' },
        status: 500,
      })
      await twd.visit('/todos')
      await twd.waitForRequest('getTodos')

      const error = await screenDom.findByText('Could not load your todos.')
      twd.should(error, 'be.visible')

      // Same alias, new response: the next request gets the healthy API
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: todoList,
        status: 200,
      })
      const retry = await screenDom.findByRole('button', { name: 'Retry' })
      await userEvent.click(retry)
      await twd.waitForRequest('getTodos')

      const items = await screenDom.findAllByRole('listitem')
      expect(items).to.have.length(3)
      expect(screenDom.queryByText('Could not load your todos.')).to.equal(null)
    })
  })

  describe('Creating a todo', () => {
    it('should send the form as JSON, disable the button while saving and append the created todo', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: todoList,
        status: 200,
      })
      await twd.mockRequest('createTodo', {
        method: 'POST',
        url: '/api/todos',
        response: {
          id: '42',
          title: 'Record a TWD demo',
          description: 'Show mockRequest in action',
          dueDate: '2026-11-01',
          completed: false,
        },
        status: 201,
        delay: 500,
      })
      await twd.visit('/todos')
      await twd.waitForRequest('getTodos')

      const title = await screenDom.findByLabelText('Title')
      await userEvent.type(title, '  Record a TWD demo  ')
      const description = await screenDom.findByLabelText('Description')
      await userEvent.type(description, 'Show mockRequest in action')
      const dueDate = await screenDom.findByLabelText('Due date')
      await userEvent.type(dueDate, '2026-11-01')

      const submit = await screenDom.findByRole('button', { name: 'Add todo' })
      await userEvent.click(submit)

      const saving = await screenDom.findByRole('button', { name: 'Saving...' })
      twd.should(saving, 'be.disabled')

      const rule = await twd.waitForRequest('createTodo')
      expect(rule.request).to.deep.equal({
        title: 'Record a TWD demo',
        description: 'Show mockRequest in action',
        dueDate: '2026-11-01',
      })

      const created = await screenDom.findByText('Record a TWD demo')
      twd.should(created, 'be.visible')
      const items = await screenDom.findAllByRole('listitem')
      expect(items).to.have.length(4)
      const remaining = await screenDom.findByText('3 of 4 remaining')
      twd.should(remaining, 'be.visible')

      const ready = await screenDom.findByRole('button', { name: 'Add todo' })
      twd.should(ready, 'be.enabled')
      twd.should(title, 'have.value', '')
      twd.should(description, 'have.value', '')
    })

    it('should block an empty title without calling the API and keep the input on a network failure', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: todoList,
        status: 200,
      })
      await twd.mockRequest('createTodo', {
        method: 'POST',
        url: '/api/todos',
        response: null,
        status: 0,
      })
      await twd.visit('/todos')
      await twd.waitForRequest('getTodos')

      const submit = await screenDom.findByRole('button', { name: 'Add todo' })
      await userEvent.click(submit)
      const required = await screenDom.findByRole('alert')
      twd.should(required, 'have.text', 'Title is required')
      expect(twd.getRequestCount('createTodo')).to.equal(0)

      const title = await screenDom.findByLabelText('Title')
      await userEvent.type(title, 'Offline todo')
      await userEvent.click(submit)
      await twd.waitForRequest('createTodo')

      const failed = await screenDom.findByText('Could not save the todo. Please try again.')
      twd.should(failed, 'be.visible')
      twd.should(title, 'have.value', 'Offline todo')
      const items = await screenDom.findAllByRole('listitem')
      expect(items).to.have.length(3)
    })
  })

  describe('Updating and deleting', () => {
    it('should mark a todo as completed with a PATCH and filter the list by status', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: todoList,
        status: 200,
      })
      await twd.mockRequest('completeTodo', {
        method: 'PATCH',
        url: '/api/todos/2',
        response: { ...buildTodoApp, completed: true },
        status: 200,
      })
      await twd.visit('/todos')
      await twd.waitForRequest('getTodos')

      const checkbox = await screenDom.findByRole('checkbox', {
        name: 'Mark Build Todo App as completed',
      })
      await userEvent.click(checkbox)

      const rule = await twd.waitForRequest('completeTodo')
      expect(rule.request).to.deep.equal({ completed: true })
      const remaining = await screenDom.findByText('1 of 3 remaining')
      twd.should(remaining, 'be.visible')
      const toggled = await screenDom.findByRole('checkbox', {
        name: 'Mark Build Todo App as active',
      })
      twd.should(toggled, 'be.checked')

      const completedFilter = await screenDom.findByRole('button', { name: 'Completed' })
      await userEvent.click(completedFilter)
      twd.should(completedFilter, 'have.attr', 'aria-pressed', 'true')
      const completedItems = await screenDom.findAllByRole('listitem')
      expect(completedItems).to.have.length(2)
      expect(screenDom.queryByText('Learn TWD')).to.equal(null)

      const activeFilter = await screenDom.findByRole('button', { name: 'Active' })
      await userEvent.click(activeFilter)
      const activeItems = await screenDom.findAllByRole('listitem')
      expect(activeItems).to.have.length(1)
      const onlyActive = await screenDom.findByText('Learn TWD')
      twd.should(onlyActive, 'be.visible')
    })

    it('should delete a todo, and keep it listed with an error when the delete fails', async () => {
      await twd.mockRequest('getTodos', {
        method: 'GET',
        url: '/api/todos',
        response: todoList,
        status: 200,
      })
      await twd.mockRequest('deleteLearnTwd', {
        method: 'DELETE',
        url: `/api/todos/${learnTwd.id}`,
        response: null,
        status: 204,
      })
      await twd.mockRequest('deleteBuildTodoApp', {
        method: 'DELETE',
        url: `/api/todos/${buildTodoApp.id}`,
        response: { message: 'Locked' },
        status: 500,
      })
      await twd.visit('/todos')
      await twd.waitForRequest('getTodos')

      const deleteLearn = await screenDom.findByRole('button', { name: 'Delete Learn TWD' })
      await userEvent.click(deleteLearn)
      await twd.waitForRequest('deleteLearnTwd')

      await twd.waitFor(() => expect(screenDom.queryByText('Learn TWD')).to.equal(null))
      const afterDelete = await screenDom.findAllByRole('listitem')
      expect(afterDelete).to.have.length(2)

      const deleteBuild = await screenDom.findByRole('button', { name: 'Delete Build Todo App' })
      await userEvent.click(deleteBuild)
      await twd.waitForRequest('deleteBuildTodoApp')

      const error = await screenDom.findByText('Could not delete Build Todo App.')
      twd.should(error, 'be.visible')
      const stillThere = await screenDom.findByText('Build Todo App')
      twd.should(stillThere, 'be.visible')
      expect(twd.getRequestCount('getTodos')).to.equal(1)
    })
  })
})
