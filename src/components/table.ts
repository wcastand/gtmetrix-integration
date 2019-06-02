import { htm } from '@zeit/integration-utils'
import humanize from 'humanize-duration'

export const Table = ({ header, children }: { header: any; children: any }) => htm`
<Box
  width="100%"
  display="grid"
  borderRadius="5px"
  borderColor="#eaeaea"
  overflow="hidden"
  borderStyle="solid"
  borderWidth="1px"
  marginTop="20px"
  marginBottom="20px"
>
  <Box
    display="grid"
    gridTemplateColumns="repeat(auto-fit, minmax(60px, 1fr))"
  >${header}</Box>
    ${children}
</Box>
`

export const TableRow = ({ children }: { children: any }) => htm`
<Box
  display="grid"
  gridTemplateColumns="repeat(auto-fit, minmax(60px, 1fr))"
  gridAutoFlow="row dense"
  gridAutoRows="minmax(auto, 50px)"
  borderColor="#eaeaea"
  borderStyle="solid"
  borderWidth="0px"
  borderBottomWidth="1px"
  backgroundColor="white"
>
  ${children}
</Box>
`

export const HeaderItem = ({ children }: { children: any }) => htm`
<Box
  minWidth="100px"
  padding="10px"
  ><P><B>${children}</B></P></Box
>
`

export const BodyItem = ({
  children,
  color,
  align,
  error = false,
}: {
  children: any
  color?: string
  align?: string
  error?: boolean
}) =>
  htm`<Box
  whiteSpace="nowrap"
  overflow="hidden"
  textOverflow="ellipsis"
  gridColumn="${error ? `4 / span 4` : ''}"
  padding="10px"
  textAlign="${align ? align : 'left'}"
  color="${error ? 'red' : color || '#232323'}"
>${children}</Box>`

export const TestRow = ({ test }: { test: any }) => {
  switch (test.state) {
    case 'completed':
      return htm`
        <${TableRow} key=${test.details.id}>
          <${BodyItem}><Link href=${test.results.report_url} target="_blank">${
        test.details.id
      }</Link></${BodyItem}>
          <${BodyItem}>${test.details.locationName}</${BodyItem}>
          <${BodyItem}>${test.details.browserName}</${BodyItem}>
          <${BodyItem}>${test.results.pagespeed_score} / 100</${BodyItem}>
          <${BodyItem}>${humanize(test.results.fully_loaded_time, {
        maxDecimalPoints: 2,
      })}</${BodyItem}>
          <${BodyItem}>${humanize(test.results.dom_interactive_time, {
        maxDecimalPoints: 2,
      })}</${BodyItem}>
          <${BodyItem}>${Math.ceil(test.results.page_bytes / 1024)} Kb</${BodyItem}>
        </${TableRow}>
      `
    case 'error':
      return htm`
        <${TableRow}>
          <${BodyItem}>${test.details.id}</${BodyItem}>
          <${BodyItem}>${test.details.locationName}</${BodyItem}>
          <${BodyItem}>${test.details.browserName}</${BodyItem}>
          <${BodyItem} error>${test.error}</${BodyItem}>
        </${TableRow}>
        `
    default:
      return htm`
        <${TableRow}>
          <${BodyItem}>${test.details.id}</${BodyItem}>
          <${BodyItem}>${test.details.locationName}</${BodyItem}>
          <${BodyItem}>${test.details.browserName}</${BodyItem}>
          <${BodyItem} color="#d1d1d1">pending</${BodyItem}>
          <${BodyItem} color="#d1d1d1">pending</${BodyItem}>
          <${BodyItem} color="#d1d1d1">pending</${BodyItem}>
          <${BodyItem} color="#d1d1d1">pending</${BodyItem}>
        </${TableRow}>
      `
  }
}
