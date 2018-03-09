import { AccountsProvider } from './accounts-provider'
import { TransactionsProvider } from './transactions-provider'

class CogitoProvider {
  constructor ({ originalProvider, telepathChannel }) {
    this.provider = originalProvider
    this.accounts = new AccountsProvider({ telepathChannel })
    this.transactions = new TransactionsProvider({
      originalProvider, telepathChannel
    })
  }

  send (payload, callback) {
    if (payload.method === 'eth_accounts') {
      this.accounts.send(payload, callback)
    } else if (payload.method === 'eth_sendTransaction') {
      this.transactions.send(payload, callback)
    } else {
      this.provider.send(payload, callback)
    }
  }
}

export { CogitoProvider }
