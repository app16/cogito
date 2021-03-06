import Quick
import Nimble
@testable import Cogito

class TransactionSignerSpec: QuickSpec {
    override func spec() {
        let validTransaction: [String: Any] = [
            "from": Address.testAddress1.description,
            "to": Address.testAddress2.description,
            "data": "0xabcdef",
            "gasPrice": "0x1",
            "gasLimit": "0x2",
             "nonce": "0x3",
             "value": "0x4",
             "chainId": 55
        ]

        var store: RecordingStore!

        beforeEach {
            store = RecordingStore()
        }

        it("dispatches invalid when transaction data is incomplete") {
            var transaction = validTransaction
            transaction.removeValue(forKey: "from")

            let builder = TransactionSignerBuilder(transaction: transaction,
                                                   dispatch: store.dispatch,
                                                   getState: { return nil },
                                                   responseId: JsonRpcId(0),
                                                   channel: TelepathChannelSpy())
            let signer = builder.build()
            expect(signer).to(beAKindOf(TransactionSignerInvalid.self))
            signer.execute()
            let lastAction = store.firstAction(ofType: TelepathActions.SendPending.self)
            expect(lastAction?.message).to(contain("missing or invalid field(s) in transaction data"))
        }

        it("dispatches invalid when transaction data is invalid") {
            var transaction = validTransaction
            transaction["from"] = "foo"

            let builder = TransactionSignerBuilder(transaction: transaction,
                                                   dispatch: store.dispatch,
                                                   getState: { return nil },
                                                   responseId: JsonRpcId(0),
                                                   channel: TelepathChannelSpy())
            let signer = builder.build()
            expect(signer).to(beAKindOf(TransactionSignerInvalid.self))
            signer.execute()
            let lastAction = store.firstAction(ofType: TelepathActions.SendPending.self)
            expect(lastAction?.message).to(contain("missing or invalid field(s) in transaction data"))
        }

        it("dispatches uknown identity if address to sign for is unknown") {
            var transaction = validTransaction
            transaction["from"] = Address.testAddress3.description

            let builder = TransactionSignerBuilder(transaction: transaction,
                                                   dispatch: store.dispatch,
                                                   getState: { return nil },
                                                   responseId: JsonRpcId(0),
                                                   channel: TelepathChannelSpy())
            let signer = builder.build()
            expect(signer).to(beAKindOf(TransactionSignerInvalid.self))
            signer.execute()
            let lastAction = store.firstAction(ofType: TelepathActions.SendPending.self)
            expect(lastAction?.message).to(contain("signature requested for unknown identity"))
        }

        it("builds valid signer when transaction data is valid") {
            let state = appState(diamond: DiamondState(facets: [
                Identity(description: "test", address: Address.testAddress1)
            ]))
            let builder = TransactionSignerBuilder(transaction: validTransaction,
                                                   dispatch: store.dispatch,
                                                   getState: { return state },
                                                   responseId: JsonRpcId(0),
                                                   channel: TelepathChannelSpy())
            let signer = builder.build()
            expect(signer).to(beAKindOf(TransactionSignerValid.self))
        }
    }
}
