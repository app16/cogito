//  Copyright © 2017 Konkinklijke Philips Nederland N.V. All rights reserved.

import ReSwift

func createIdentityReducer(action: Action, state: CreateIdentityState?) -> CreateIdentityState {
    var state = state ?? initialCreateIdentityState
    switch action {
        case let action as CreateIdentityActions.SetDescription:
            state.description = action.description
        default:
            break
    }
    return state
}
