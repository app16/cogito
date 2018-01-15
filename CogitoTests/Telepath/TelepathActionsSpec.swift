//Copyright © 2017 Koninklijke Philips Nederland N.V. All rights reserved.

import Quick
import Nimble
import SwiftyJSON

class TelepathActionsSpec: QuickSpec {
    override func spec() {
        var store: RecordingStore!

        beforeEach {
            store = RecordingStore()
        }

        describe("connection") {
            let connectUrl = URL(
                string: "https://cogito.example.com/telepath/connect#I=1234&E=abcd"
            )!

            it("connects to a channel") {
                store.dispatch(TelepathActions.Connect(url: connectUrl))
                let fulfilled = store.actions.last as? TelepathActions.ConnectFulfilled
                expect(fulfilled).toNot(beNil())
            }

            it("reports an error when connecting to a channel fails") {
                store.dispatch(TelepathActions.Connect(url: URL(string: "http://invalid")!))
                let rejected = store.actions.last as? TelepathActions.ConnectRejected
                expect(rejected).toNot(beNil())
            }
        }

        describe("sending and receiving") {
            var channel: TelepathChannelSpy!

            beforeEach {
                channel = TelepathChannelSpy()
                store.state = appState(telepath: TelepathState(channel: channel))
            }

            it("receives messages") {
                let message = "a message"
                channel.receiveMessage = message
                store.dispatch(TelepathActions.Receive())
                let fulfilled = store.actions.last as? TelepathActions.ReceiveFulfilled
                expect(fulfilled?.message) == message
            }

            it("reports errors while receiving") {
                let error = ExampleError(message: "an error")
                channel.receiveError = error
                store.dispatch(TelepathActions.Receive())
                let rejected = store.actions.last as? TelepathActions.ReceiveRejected
                expect(rejected?.error as? ExampleError) == error
            }

            it("sends messages") {
                let message = "a message"
                store.dispatch(TelepathActions.Send(message: message))
                expect(channel.sentMessage) == message
            }

            it("reports sending success") {
                store.dispatch(TelepathActions.Send(message: ""))
                let fulfilled = store.actions.last as? TelepathActions.SendFulfilled
                expect(fulfilled).toNot(beNil())
            }

            it("reports errors while sending") {
                let error = ExampleError(message: "an error")
                channel.sendError = error
                store.dispatch(TelepathActions.Send(message: ""))
                let rejected = store.actions.last as? TelepathActions.SendRejected
                expect(rejected?.error as? ExampleError) == error
            }
        }

        describe("sending JSON-RPC") {
            let id = JsonRpcId(42)
            let result = [ "foo": 1 ]
            let errorCode = 123
            let errorMessage = "an error message"

            it("encodes responses") {
                store.dispatch(TelepathActions.Send(id: id, result: result))

                let pending = store.firstAction(ofType: TelepathActions.SendPending.self)!
                expect(JSON(parseJSON: pending.message)) == JSON([
                    "jsonrpc": "2.0",
                    "id": id.object,
                    "result": result
                ])
            }

            it("encodes errors") {
                let action = TelepathActions.Send(
                    id: id,
                    errorCode: errorCode,
                    errorMessage: errorMessage
                )

                store.dispatch(action)

                let pending = store.firstAction(ofType: TelepathActions.SendPending.self)!

                expect(JSON(parseJSON: pending.message)) == JSON([
                    "jsonrpc": "2.0",
                    "id": id.object,
                    "error": [
                        "code": errorCode,
                        "message": errorMessage
                    ]
                ])
            }
        }
    }
}
