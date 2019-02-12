import Cache from 'lru-cache'

export const maximumQueueSize = 10
export const maximumNotificationLength = 100000

export class SocketServer {
  constructor () {
    this.clients = []
    this.pendingNotifications = Cache({ maxAge: 10 * 60 * 1000 })
    setInterval(() => {
      this.pendingNotifications.prune()
    }, 60 * 1000)
  }

  onConnection (clientSocket) {
    clientSocket.on('identify', (queueId, ack) => {
      this.onIdentify(clientSocket, queueId)
      if (ack) {
        ack()
      }
    })
    clientSocket.on('notification', notification => {
      this.onNotification(clientSocket, notification)
    })
    clientSocket.on('disconnect', reason => {
      this.onDisconnect(clientSocket)
    })
  }

  onIdentify (clientSocket, queueId) {
    let clientsForQueue = this.clients[queueId] || []
    if (clientsForQueue.length > 1) {
      clientSocket.emit('error', 'too many clients for queue')
      return
    }

    clientsForQueue.push(clientSocket)
    this.clients[queueId] = clientsForQueue
    clientSocket.queueId = queueId
    this.deliverPendingNotifications(clientSocket)
  }

  deliverPendingNotifications (clientSocket) {
    const queueId = clientSocket.queueId
    const pending = this.pendingNotifications.get(queueId)
    if (pending) {
      pending.map(notification => {
        clientSocket.emit('notification', notification)
      })
      this.pendingNotifications.del(queueId)
    }
  }

  onNotification (source, notification) {
    if (!this.verifyNotification(notification)) {
      source.emit('error', 'notification too long')
      return
    }

    const receiver = this.findReceiver(source)
    if (receiver) {
      receiver.emit('notification', notification)
    } else {
      this.addPendingNotification(source, notification)
    }
  }

  verifyNotification (notification) {
    return notification.length <= maximumNotificationLength
  }

  onDisconnect (clientSocket) {
    // todo this.clients[clientSocket.queueId] may be undefined
    if (!clientSocket.queueId) {
      return /* investigate! */
    }
    const remainingClients = this.clients[clientSocket.queueId].filter(c => {
      return clientSocket !== c
    })
    if (remainingClients.length === 0) {
      delete this.clients[clientSocket.queueId]
    } else {
      this.clients[clientSocket.queueId] = remainingClients
    }
  }

  findReceiver (source) {
    const receivers = this.clients[source.queueId].filter(c => {
      return source !== c && source.queueId === c.queueId
    })
    return receivers.length === 1 ? receivers[0] : undefined
  }

  addPendingNotification (source, notification) {
    let queueId = source.queueId
    let pendingNotifications = this.pendingNotifications.get(queueId) || []
    if (pendingNotifications.length === maximumQueueSize) {
      source.emit('error', 'too many pending notifications')
      return
    }

    pendingNotifications.push(notification)
    this.pendingNotifications.set(queueId, pendingNotifications)
  }
}

export default class IOSocketServer {
  constructor (io) {
    this.socketServer = new SocketServer()
    this.io = io
  }

  start () {
    this.io.on('connection', socket => {
      this.socketServer.onConnection(socket)
    })
  }
}
