import { Store } from '../types'
export const reducer = async (action: string, clientState: any, store: Store) => {
  switch (action) {
    case 'submit-gtmetrix':
      store.gtmetrixEmail = clientState.gtmetrixEmail
      store.gtmetrixApiKey = clientState.gtmetrixApiKey
      break
    case 'reset-gtmetrix':
      store.gtmetrixEmail = null
      store.gtmetrixApiKey = null
      store.gtmetrixCredits = null
      store.gtmetrixRefill = null
      store.projectId = null
      store.location = null
      store.browser = null
      store.testIds = []
      break
    case 'change-location':
      store.location = clientState.location
      break
    case 'change-browser':
      store.browser = clientState.browser
      break
    case 'change-throttling':
      store.throttling = clientState.throttling
      break
  }
}
