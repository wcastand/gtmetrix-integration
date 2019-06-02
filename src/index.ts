import { withUiHook, htm } from '@zeit/integration-utils'
import idx from 'idx'

import { reducer } from './utlis'
import { Browser, TestDetails, TestState, Store } from '../types'
import { Table, HeaderItem, TestRow, TableRow, BodyItem } from './components/table'

function isTestState(x: TestState | null): x is TestState {
  return x !== null
}
function isBrowser(x: Browser | undefined): x is Browser {
  return typeof x !== 'undefined'
}
module.exports = withUiHook(
  async ({ payload, zeitClient }): Promise<string> => {
    const { clientState, action, projectId } = payload
    try {
      const store: Store = {
        browser: null,
        location: null,
        projectId: null,
        throttling: null,
        gtmetrixEmail: null,
        gtmetrixApiKey: null,
        gtmetrixRefill: null,
        gtmetrixCredits: null,
        testIds: [],
        browserList: [],
        locationList: [],
        ...(await zeitClient.getMetadata()),
      }
      if (projectId === null) {
        store.projectId = null
        return htm`
          <Page>
            <Notice type="warn">Please select a project to use the GTmetrix integration.</Notice>
            <ProjectSwitcher />
          </Page>`
      }
      if (projectId && store.projectId !== projectId) store.projectId = projectId
      const getBrowsers = (): Browser[] => {
        const location = store.locationList.find(location => location.id === store.location)
        if (!location) return []
        return location.browsers
          .map<Browser | undefined>(id => store.browserList.find(browser => browser.id === id))
          .filter<Browser>(isBrowser)
      }
      const canLaunch = (): boolean =>
        store.location === null || store.browser === null || store.projectId === null
      const apiUrl = `/v4/now/deployments?limit=1&projectId=${store.projectId}`
      const {
        deployments: [{ url }],
      }: { deployments: { url: string }[] } = await zeitClient.fetchAndThrow(apiUrl, {
        method: 'GET',
      })
      await reducer(action, clientState, store)
      await zeitClient.setMetadata(store)

      if (!store.gtmetrixEmail || !store.gtmetrixApiKey) {
        return htm`
        <Page>
          <Fieldset>
            <FsContent>
              <H2><B>GTmetrix API Details</B></H2>
              <Box display='flex' marginBottom="20px">
                <Input label="E-mail" name="gtmetrixEmail" value='' width="200px" />
                <Box width="18px" />
                <Input label="API Key" name="gtmetrixApiKey" value='' width="300px"/>
              </Box>
            </FsContent>
            <FsFooter>
              <Button small action="submit-gtmetrix">Save</Button>
            </FsFooter>
          </Fieldset>
        </Page>
      `
      }
      const gtmetrix = require('gtmetrix')({
        email: store.gtmetrixEmail,
        apikey: store.gtmetrixApiKey,
      })

      if (action === 'submit-gtmetrix' || action === 'view') {
        console.log('view')
        const { api_refill, api_credits } = await gtmetrix.account.status()
        store.gtmetrixRefill = api_refill
        store.gtmetrixCredits = api_credits
        store.locationList = await gtmetrix.locations.list()
        store.browserList = await gtmetrix.browsers.list()
      } else if (action === 'launch-test') {
        console.log('launch')
        const test = {
          url,
          location: store.location as string,
          browser: store.browser as string,
          'x-metrix-throttle': store.throttling,
        }
        const { credits_left, test_id } = await gtmetrix.test.create(test)
        store.gtmetrixCredits = credits_left
        store.testIds.push({ id: test_id, projectId: <string>store.projectId, ...test })
      }
      const testList = await Promise.all(
        store.testIds
          .filter(_ => _.projectId === store.projectId)
          .map(async (details: TestDetails) => {
            try {
              const { resources, error, results, state } = await gtmetrix.test.get(details.id)
              const location = store.locationList.find(l => l.id === details.location)
              const browser = store.browserList.find(b => b.id.toString() === details.browser)

              return {
                details: {
                  ...details,
                  browserName: browser ? browser.name : '',
                  locationName: location ? location.name : '',
                },
                error,
                resources,
                results,
                state,
              }
            } catch (e) {
              if (e.statusCode === 404) {
                store.testIds = store.testIds.filter(_ => _.id !== details.id)
                return null
              } else
                return {
                  details: {
                    ...details,
                    browserName: '-',
                    locationName: '-',
                  },
                  resources: {},
                  results: {},
                  error: e.error,
                  state: 'error',
                }
            }
          }),
      ).then(async res => {
        if (res.some(_ => _ === null)) await zeitClient.setMetadata(store)
        return res.filter(isTestState)
      })
      await zeitClient.setMetadata(store)
      return htm`
      <Page>
      <Box marginBottom="20px">
        <ProjectSwitcher />
      </Box>
      <Fieldset>
        <FsContent>
          <H2><B>GTmetrix API Usage information</B></H2>
          <Box>
            <P><B>Current GTmetrix's credits</B>: ${store.gtmetrixCredits || 0}</P>
            <P><B>GTmetrix's credits refilled at</B>: ${
              store.gtmetrixRefill !== null ? new Date(store.gtmetrixRefill * 1000) : ''
            }</P>
          </Box>
        </FsContent>
        <FsFooter>
          <Button small action="reset-gtmetrix">Reset</Button>
        </FsFooter>
      </Fieldset>

      <Fieldset>
        <FsContent>
          <H2><B>Create a new test</B></H2>
          <Box display="flex" marginBottom="20px">
            <Box>
              <P>Choose a location: </P>
              <Select name="location" value="${idx(
                store,
                _ => _.location,
              )}" action="change-location">
                <Option value="null" caption="Choose a location" />
                ${store.locationList.map(
                  location => htm`<Option value="${location.id}" caption="${location.name}" />`,
                )}
              </Select>
              </Box>
              <Box width="24px" />
              <Box>
              <P>Choose a browser: </P>
              <Select name="browser" value="${idx(store, _ => _.browser)}" action="change-browser">
                <Option value="null" caption="Choose a browser" />
                ${getBrowsers().map(
                  browser => htm`<Option value="${browser.id}" caption="${browser.name}" />`,
                )}
              </Select>
              </Box>
              <Box width="24px" />
              <Box>
              <P>Choose connection throttling: </P>
              <Select name="throttling" value="${idx(
                store,
                _ => _.throttling,
              )}" action="change-throttling">
                <Option value="20000/5000/25" caption="Broadband Fast (20/5 Mbps, 25ms)" />
                <Option value="5000/1000/30" caption="Broadband (5/1 Mbps, 30ms)" />
                <Option value="1500/384/50" caption="Broadband Slow (1.5 Mbps/384 Kbps, 50ms)" />
                <Option value="15000/10000/100" caption="LTE Mobile (15/10 Mbps, 100ms)" />
                <Option value="1600/768/200" caption="3G Mobile (1.6 Mbps/768 Kbps, 200ms)" />
                <Option value="240/200/400" caption="2G Mobile (240/200 Kbps, 400ms)" />
                <Option value="50/30/125" caption="56K Dial-up (50/30 Kbps, 125ms)" />
              </Select>
              </Box>
            </Box>
        </FsContent>
        <FsFooter>
          <Button small action="launch-test" disabled=${canLaunch()}>Launch test</Button>
        </FsFooter>
      </Fieldset>
      <Container>
        <H2><B>Your tests</B></H2>
        <${Table} header=${htm`
          <${HeaderItem}>ID</${HeaderItem}>
          <${HeaderItem}>Location</${HeaderItem}>
          <${HeaderItem}>Browser</${HeaderItem}>
          <${HeaderItem}>PageSpeed score</${HeaderItem}>
          <${HeaderItem}>Fully loaded time</${HeaderItem}>
          <${HeaderItem}>DOM interactive time</${HeaderItem}>
          <${HeaderItem}>Page size</${HeaderItem}>
        `}>
          ${
            testList.length === 0
              ? htm`
              <${TableRow}>
                <${BodyItem} color="#d1d1d1" align='center'>You have no test for this project yet. Try one ! :)</${BodyItem}>
              </${TableRow}>
              `
              : testList.reverse().map(fullTest => htm`<${TestRow} test=${fullTest}/>`)
          }
        </${Table}>
      </Container>
      ${
        testList.some(t => t!.state !== 'completed' && t!.state !== 'error')
          ? htm`<AutoRefresh timeout="5000"/>`
          : ''
      }
    </Page>`
    } catch (e) {
      console.log('error')
      console.log(e)
      return htm`
      <Box>
        <Notice type="error">${e.message}${e.error ? `: ${e.error}` : ''}</Notice>
        <Button small action="reset-gtmetrix">Reset Details</Button>
      </Box>
      `
    }
  },
)
