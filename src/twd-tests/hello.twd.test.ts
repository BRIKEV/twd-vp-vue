import { twd } from 'twd-js'
import { describe, it, beforeEach, afterEach } from 'twd-js/runner'
import { useCounterStore } from '@/stores/counter'

describe('App Smoke Test', () => {
  beforeEach(() => {
    twd.clearRequestMockRules()
    twd.clearComponentMocks()
    useCounterStore().$reset()
  })

  afterEach(() => {
    twd.clearRequestMockRules()
  })

  it('renders the home page', async () => {
    // Use the /twd skill to write actual test content
  })
})
