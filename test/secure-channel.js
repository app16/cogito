/* eslint-env mocha */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const td = require('testdouble')
const anything = td.matchers.anything
const sodium = require('libsodium-wrappers')
const random = sodium.randombytes_buf
const nonceSize = sodium.crypto_secretbox_NONCEBYTES
const keySize = sodium.crypto_secretbox_KEYBYTES
const decrypt = sodium.crypto_secretbox_open_easy
const encrypt = sodium.crypto_secretbox_easy
const { SecureChannel } = require('../lib/secure-channel')

chai.use(chaiAsPromised)

describe('secure-channel', function () {
  const channelId = 'channel_id'
  const key = random(keySize)
  const blueQueue = `${channelId}.blue`
  const redQueue = `${channelId}.red`
  const message = 'a message'

  let channel
  let queuing

  beforeEach(function () {
    queuing = td.object()
    channel = new SecureChannel({ queuing, id: channelId, key })
  })

  context('when sending a message', function () {
    beforeEach(function () {
      channel.send(message)
    })

    it('encrypts the message', function () {
      const captor = td.matchers.captor()
      td.verify(queuing.send(anything(), captor.capture()))
      const nonceAndCypherText = captor.value
      const nonce = nonceAndCypherText.slice(0, nonceSize)
      const cypherText = nonceAndCypherText.slice(nonceSize)
      expect(decrypt(cypherText, nonce, key, 'text')).to.equal(message)
    })

    it('uses the red queue', function () {
      td.verify(queuing.send(redQueue, anything()))
    })
  })

  context('when receiving a message (on the blue queue)', function () {
    let receivedMessage

    beforeEach(async function () {
      const nonce = Buffer.from(random(nonceSize))
      const cypherText = Buffer.from(encrypt(Buffer.from(message), nonce, key))
      const nonceAndCypherText = Buffer.concat([nonce, cypherText])
      td.when(queuing.receive(blueQueue)).thenResolve(nonceAndCypherText)
      receivedMessage = await channel.receive()
    })

    it('decrypts the message', function () {
      expect(receivedMessage).to.equal(message)
    })
  })

  it('throws when there is an error while sending', function () {
    td.when(queuing.send(anything(), anything())).thenThrow('an error')
    expect(() => channel.send('a message')).to.throw()
  })

  it('throws when there is an error while receiving', async function () {
    td.when(queuing.receive(blueQueue)).thenReject('an error')
    await expect(channel.receive()).to.be.rejected
  })

  it('throws when there is an error while decrypting', async function () {
    td.when(queuing.receive(blueQueue)).thenResolve('invalid data')
    await expect(channel.receive()).to.be.rejected
  })
})
