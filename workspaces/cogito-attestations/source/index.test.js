import { AttestationsRetriever, issue, accept, verify } from './index'

it('exports CogitoAttestations', () => {
  expect(AttestationsRetriever).toBeDefined()
})

it('exports the issue function', () => {
  expect(issue).toBeDefined()
})

it('exports the accept function', () => {
  expect(accept).toBeDefined()
})

it('exports the verify function', () => {
  expect(verify).toBeDefined()
})
