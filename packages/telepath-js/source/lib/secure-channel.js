const base64url = require('base64url')
const { random, encrypt, decrypt, nonceSize } = require('./crypto')
const Poller = require('./poller')

class SecureChannel {
  constructor ({ queuing, id, key }) {
    this.queuing = queuing
    this.id = id
    this.key = key
    this.poller = new Poller({
      pollFunction: () => queuing.receive(`${id}.blue`),
      interval: 1000,
      retries: 600
    })
  }

  async send (message) {
    const queueId = `${this.id}.red`
    const nonce = Buffer.from(await random(await nonceSize()))
    const cypherText = Buffer.from(await encrypt(Buffer.from(message), nonce, this.key))
    const nonceAndCypherText = Buffer.concat([nonce, cypherText])
    await this.queuing.send(queueId, nonceAndCypherText)
  }

  async receive () {
    const nonceAndCypherText = await this.poller.poll()
    if (!nonceAndCypherText) {
      return null
    }
    const nonce = nonceAndCypherText.slice(0, await nonceSize())
    const cypherText = nonceAndCypherText.slice(await nonceSize())
    return decrypt(cypherText, nonce, this.key, 'text')
  }

  createConnectUrl (baseUrl) {
    const encodedKey = base64url.encode(this.key)
    return `${baseUrl}/telepath/connect#I=${this.id}&E=${encodedKey}`
  }
}

module.exports = SecureChannel