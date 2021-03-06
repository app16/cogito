const encryptionReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ENCRYPTION_SET_PLAINTEXT':
      return { ...state, plainText: action.plainText }
    case 'ENCRYPTION_SET_CIPHERTEXT':
      return { ...state, cipherText: action.cipherText }
    case 'ENCRYPTION_SET_KEY_TAG':
      return { ...state, keyTag: action.tag }
    case 'ENCRYPTION_PENDING':
    case 'DECRYPTION_PENDING':
      return { ...state, errorMessage: null, pending: true }
    case 'ENCRYPTION_COMPLETED':
      return { ...state, pending: false, plainText: '', cipherText: action.cipherText }
    case 'DECRYPTION_COMPLETED':
      return { ...state, pending: false, plainText: action.plainText, cipherText: '' }
    case 'ENCRYPTION_ERROR':
      return { ...state, errorMessage: action.message, pending: false }
    default:
      return { ...state }
  }
}

const initialState = {
  plainText: '',
  cipherText: '',
  pending: false,
  errorMessage: null
}

export { encryptionReducer }
