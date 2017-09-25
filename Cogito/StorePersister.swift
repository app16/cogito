//  Copyright © 2017 Konkinklijke Philips Nederland N.V. All rights reserved.

import ReSwift

class StorePersister: StoreSubscriber {
    let store: Store<AppState>
    let stateUrl: URL

    static private var defaultPersister: StorePersister?
    static var `default`: StorePersister? {
        if let d = defaultPersister {
            return d
        }
        do {
            let documentsDirectory = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
            let url = URL(fileURLWithPath: documentsDirectory).appendingPathComponent("state.json")
            defaultPersister = try StorePersister(store: appStore, persistAt: url)
        } catch let e {
            print("Failed to create default store persister. Error: \(e)")
        }
        return defaultPersister
    }

    init(store: Store<AppState>, persistAt stateUrl: URL) throws {
        self.store = store
        self.stateUrl = stateUrl
        if FileManager.default.fileExists(atPath: stateUrl.path) {
            let decoder = JSONDecoder()
            let encodedState = try Data(contentsOf: stateUrl)
            store.state = try decoder.decode(AppState.self, from: encodedState)
        }
    }

    func start() {
        store.subscribe(self)
    }

    func stop() {
        store.unsubscribe(self)
    }

    func newState(state: AppState) {
        do {
            let encoder = JSONEncoder()
            let encodedState = try encoder.encode(store.state)
            try encodedState.write(to: stateUrl, options: .atomicWrite)
        } catch let e {
            print("Failed to write state to disk: \(e).")
        }
    }
}
