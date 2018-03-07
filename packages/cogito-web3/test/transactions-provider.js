const expect = require('chai').expect
const td = require('testdouble')
const anything = td.matchers.anything
const contains = td.matchers.contains
const { stubResponse, stubResponseReject, stubResponseError } = require('./provider-stubbing')
const Web3 = require('web3')
const CogitoProvider = require('../source/lib/cogito-provider')

describe('sending transactions', function () {
  const transaction = {
    from: '0x1234567890123456789012345678901234567890',
    value: '0x10',
    gasPrice: '0x20',
    nonce: '0x30',
    gas: '0x40',
    chainId: 50
  }
  const signed = '0xSignedTransaction'
  const hash = '0xTransactionHash'

  let cogitoProvider
  let originalProvider
  let telepathChannel
  let web3

  beforeEach(function () {
    originalProvider = td.object()
    telepathChannel = td.object()
    cogitoProvider = new CogitoProvider({ originalProvider, telepathChannel })
    web3 = new Web3(cogitoProvider)
  })

  function whenCogitoProvidesSignatures () {
    const anyTransaction = {}
    whenCogitoProvidesSignatureFor(anyTransaction)
  }

  function whenCogitoProvidesSignatureFor (transaction) {
    const request = { method: 'sign', params: [transaction] }
    const response = { result: signed }
    td.when(telepathChannel.send(contains(request))).thenResolve(response)
  }

  function whenProviderSendsRawTransaction () {
    const request = { method: 'eth_sendRawTransaction', params: [signed] }
    stubResponse(originalProvider, contains(request), hash)
  }

  function whenProviderThrowsWhileSendingRawTransaction () {
    const request = { method: 'eth_sendRawTransaction', params: [signed] }
    stubResponseReject(originalProvider, contains(request))
  }

  function whenProviderReturnsErrorWhileSendingRawTransaction () {
    const request = { method: 'eth_sendRawTransaction', params: [signed] }
    const error = { code: -42, message: 'an error' }
    stubResponseError(originalProvider, contains(request), error)
  }

  async function sendTransaction (transaction) {
    return new Promise(function (resolve, reject) {
      web3.eth.sendTransaction(transaction, function (error, result) {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  it('sends a cogito signed transaction', async function () {
    whenCogitoProvidesSignatureFor(transaction)
    whenProviderSendsRawTransaction()
    expect(await sendTransaction(transaction)).to.equal(hash)
  })

  it('throws when signing via telepath fails', async function () {
    td.when(telepathChannel.send(anything())).thenReject(new Error('telepath error'))
    await expect(sendTransaction(transaction)).to.be.rejectedWith(/telepath error/)
  })

  it('throws when telepath times out', async function () {
    td.when(telepathChannel.send(anything())).thenResolve(null)
    await expect(sendTransaction(transaction)).to.be.rejectedWith(/timeout/)
  })

  it('throws when cogito returns an error', async function () {
    const response = { error: { message: 'cogito error', code: -42 } }
    td.when(telepathChannel.send(anything())).thenResolve(response)
    await expect(sendTransaction(transaction)).to.be.rejectedWith(/cogito error/)
  })

  context('when a transaction property is not provided', async function () {
    const withoutValue = Object.assign({}, transaction)
    delete withoutValue.value

    function verifyValue (value) {
      const expectedRequest = { method: 'sign', params: [{ value }] }
      td.verify(telepathChannel.send(contains(expectedRequest)))
    }

    it('sets transaction defaults', async function () {
      whenCogitoProvidesSignatures()
      whenProviderSendsRawTransaction()

      await sendTransaction(withoutValue)

      verifyValue('0x0')
    })
  })

  it('transaction nonce is unchanged when provided', async function () {
    whenCogitoProvidesSignatures()
    whenProviderSendsRawTransaction()

    await sendTransaction(transaction)

    const expectedRequest = { method: 'sign', params: [transaction] }
    td.verify(telepathChannel.send(contains(expectedRequest)))
  })

  context('when transaction nonce is is not provided', function () {
    const withoutNonce = Object.assign({}, transaction)
    delete withoutNonce.nonce

    const transactionCountRequest = {
      method: 'eth_getTransactionCount',
      params: [ transaction.from, 'pending' ]
    }

    function whenProviderReturnsTransactionCount (count) {
      stubResponse(originalProvider, contains(transactionCountRequest), count)
    }

    function whenProviderThrowsWhenRequestingTransactionCount () {
      stubResponseReject(originalProvider, contains(transactionCountRequest))
    }

    function verifyNonce (nonce, options = {}) {
      const expectedRequest = { method: 'sign', params: [{ nonce }] }
      td.verify(telepathChannel.send(contains(expectedRequest)), options)
    }

    it('is set to transaction count when not specified', async function () {
      whenProviderReturnsTransactionCount('0x42')
      whenCogitoProvidesSignatures()
      whenProviderSendsRawTransaction()

      await sendTransaction(withoutNonce)

      verifyNonce('0x42')
    })

    it('increments for successful transactions', async function () {
      whenProviderReturnsTransactionCount('0x42')
      whenCogitoProvidesSignatures()
      whenProviderSendsRawTransaction()

      await sendTransaction(withoutNonce)
      await sendTransaction(withoutNonce)

      verifyNonce('0x43')
    })

    it('does not increment for transactions that throw', async function () {
      whenProviderReturnsTransactionCount('0x42')
      whenCogitoProvidesSignatures()
      whenProviderThrowsWhileSendingRawTransaction()

      try { await sendTransaction(withoutNonce) } catch (_) {}
      try { await sendTransaction(withoutNonce) } catch (_) {}

      verifyNonce('0x42', { times: 2 })
    })

    it('does not increment for transactions that err', async function () {
      whenProviderReturnsTransactionCount('0x42')
      whenCogitoProvidesSignatures()
      whenProviderReturnsErrorWhileSendingRawTransaction()

      try { await sendTransaction(withoutNonce) } catch (_) {}
      try { await sendTransaction(withoutNonce) } catch (_) {}

      verifyNonce('0x42', { times: 2 })
    })

    it('throws when transaction count cannot be determined', async function () {
      whenProviderThrowsWhenRequestingTransactionCount()
      whenCogitoProvidesSignatures()
      whenProviderSendsRawTransaction()
      await expect(sendTransaction(withoutNonce)).to.be.rejected()
    })
  })
})