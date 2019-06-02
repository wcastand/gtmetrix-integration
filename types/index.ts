export interface TestDetails {
  url: string
  location: string
  browser: string
  projectId: string
  id: string
}

export interface Browser {
  id: string
  name: string
  platform: string
  device: string
  browser: string
  features: {
    adblock: boolean
    cookies: boolean
    filtering: boolean
    http_auth: boolean
    throttle: boolean
    video: boolean
    dns: boolean
    user_agent: boolean
    resolution: boolean
  }
}
export interface Location {
  id: string
  name: string
  default: boolean
  browsers: string[]
}
export interface CompletedState {
  resources: {
    har: string
    screenshot: string
    video: string
    filmstrip: string
    report_pdf: string
    report_pdf_full: string
    pagespeed: string
    pagespeed_files: string
    yslow: string
  }
  error: ''
  results: {
    report_url: string
    html_load_time: string
    html_bytes: string
    page_load_time: string
    page_bytes: string
    page_elements: string
    pagespeed_score: string
    yslow_score: string
  }
  state: 'completed'
  details: TestDetails
}
export interface StartedState {
  resources: {}
  results: {}
  error: string
  details: TestDetails
  state: 'started' | 'queued' | 'error'
}

export type TestState = StartedState | CompletedState

export interface Store {
  gtmetrixEmail: string | null
  gtmetrixApiKey: string | null
  gtmetrixRefill: number | null
  gtmetrixCredits: string | null
  projectId: string | null
  location: string | null
  browser: string | null
  testIds: TestDetails[]
  browserList: Browser[]
  locationList: Location[]
  throttling: string | null
}
