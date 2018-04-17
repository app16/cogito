//Copyright © 2017 Koninklijke Philips Nederland N.V. All rights reserved.

import Quick
import Nimble
import ReSwift
import Telepath

class TelepathReceiverSpec: QuickSpec {
    override func spec() {
        var receiver: TelepathReceiver!
        var store: RecordingStore!

        beforeEach {
            store = RecordingStore()
            receiver = TelepathReceiver(store: store, pollInterval: 0)
        }

        describe("subscribe/unsubscribe") {
            var newStateReceived = false

            beforeEach {
                newStateReceived = false
                receiver.onNewState = { _ in return { _ in
                    newStateReceived = true
                }}
            }

            it("subscribes to changes to the telepath channel") {
                receiver.start()
                store.dispatch(TracerAction())
                expect(newStateReceived).to(beTrue())
            }

            it("unsubscribes") {
                receiver.stop()
                store.dispatch(TracerAction())
                expect(newStateReceived).to(beFalse())
            }
        }

        it("continuously polls for new messages") {
            let identity = Identity(description: "test", address: Address.testAddress)
            receiver.newState(state: [TelepathChannelSpy(): identity])
            expect(store.actions.count).toEventually(beGreaterThan(5))
        }

        it("has a sensible polling interval") {
            expect(TelepathReceiver(store: store).pollInterval) == 1.0
        }
    }
}
