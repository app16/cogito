const Defaults = require('./transaction-defaults')
const TransactionNonces = require('./transaction-nonces')

class TransactionsProvider {
  constructor ({ originalProvider, telepathChannel }) {
    this.provider = originalProvider
    this.channel = telepathChannel
    this.defaults = new Defaults({ provider: originalProvider })
    this.nonces = new TransactionNonces({ provider: originalProvider })
  }

  async send (payload, callback) {
    try {
      const nonces = this.nonces
      const transaction = await this.extractTransaction(payload)
      const nonce = transaction.nonce || await nonces.getNonce(transaction)
      transaction.nonce = nonce
      const signedTransaction = await this.sign(transaction, payload.id)
      const sendRequest = {
        jsonrpc: '2.0',
        id: payload.id,
        method: 'eth_sendRawTransaction',
        params: [ signedTransaction ]
      }
      this.provider.send(sendRequest, function (error, result) {
        if (!error) {
          nonces.commitNonce(transaction)
        }
        callback(error, result)
      })
    } catch (error) {
      callback(error, null)
    }
  }

  async extractTransaction (payload) {
    const transaction = payload.params[0]
    return this.defaults.apply(transaction)
  }

  async sign (transaction, requestId) {
    const signRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'sign',
      params: [ transaction ]
    }
    const response = await this.channel.send(signRequest)
    if (!response) {
      throw new Error('timeout while waiting for signature')
    }
    if (response.error) {
      throw new Error(response.error.message)
    }
    return response.result
  }
}

module.exports = TransactionsProvider
