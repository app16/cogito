//  Copyright © 2017 Koninklijke Philips Nederland N.V. All rights reserved.

import ReSwift

struct TransactionSigningService: TelepathService {
    let store: Store<AppState>

    func onRequest(_ request: JsonRpcRequest) {
        guard request.method == "sign" else {
            return
        }
        store.dispatch(TransactionSigningActions.Sign(tx: [:],
                                                      responseId: request.id)) // todo: take from request
    }
}
