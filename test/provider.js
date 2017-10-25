/* eslint-env mocha */
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const dirtyChai = require('dirty-chai')
const td = require('testdouble')
const anything = td.matchers.anything
const contains = td.matchers.contains
const Web3 = require('web3')
const CogitoProvider = require('../lib/provider')
const promisify = require('util.promisify')

chai.use(chaiAsPromised)
chai.use(dirtyChai)

describe('provider', function () {
  let cogitoProvider
  let originalProvider
  let telepathChannel
  let web3

  beforeEach(function () {
    originalProvider = td.object()
    telepathChannel = td.object()
    cogitoProvider = new CogitoProvider({ originalProvider, telepathChannel })
    web3 = new Web3(cogitoProvider)
    web3.eth.getAccounts = promisify(web3.eth.getAccounts)
    web3.eth.getBlockNumber = promisify(web3.eth.getBlockNumber)
  })

  context('when cogito provides accounts', function () {
    const accounts = [ '0x1234', '0xabcd' ]

    beforeEach(function () {
      const request = JSON.stringify({ method: 'accounts' })
      const response = JSON.stringify({ result: accounts })
      td.when(telepathChannel.send(request)).thenDo(function () {
        td.when(telepathChannel.receive(), { times: 1 }).thenResolve(response)
      })
    })

    it('returns the cogito accounts', async function () {
      expect(await web3.eth.getAccounts()).to.eql(accounts)
    })
  })

  it('throws when requesting accounts via telepath fails', async function () {
    td.when(telepathChannel.send(anything())).thenReject(new Error('an error'))
    await expect(web3.eth.getAccounts()).to.eventually.be.rejected()
  })

  context('when cogito provides signatures', function () {
    const transaction = { from: '0x1234567890123456789012345678901234567890' }
    const signed = '0xSignedTransaction'

    beforeEach(function () {
      const request = JSON.stringify({ method: 'sign', params: [ transaction ] })
      const response = JSON.stringify({ result: signed })
      td.when(telepathChannel.send(request)).thenDo(function () {
        td.when(telepathChannel.receive(), { times: 1 }).thenResolve(response)
      })
    })

    context('when using original provider for raw transactions', function () {
      const hash = '0xTransactionHash'

      beforeEach(function () {
        const request = { method: 'eth_sendRawTransaction', params: [ signed ] }
        const response = { jsonrpc: '2.0', result: hash, id: 1 }
        td.when(originalProvider.sendAsync(contains(request)))
          .thenCallback(null, response)
      })

      it('sends a cogito signed transaction', function (done) {
        web3.eth.sendTransaction(transaction, function (_, result) {
          expect(result).to.equal(hash)
          done()
        })
      })
    })
  })

  it('throws when signing via telepath fails', function (done) {
    const transaction = { from: '0x1234567890123456789012345678901234567890' }
    td.when(telepathChannel.send(anything())).thenReject(new Error('an error'))
    web3.eth.sendTransaction(transaction, function (error, _) {
      expect(error).to.not.be.null()
      done()
    })
  })

  it('passes requests to the original provider', async function () {
    td.when(originalProvider.sendAsync(anything(), anything()))
      .thenDo(function (payload, callback) {
        callback(null, { jsonrpc: '2.0', id: payload.id, result: 42 })
      })
    expect(await web3.eth.getBlockNumber()).to.equal(42)
  })
})
