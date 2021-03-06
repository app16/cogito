import React from 'react'
import { Centered } from '@react-frontend-developer/react-layout-helpers'
import { Button, TextArea } from 'semantic-ui-react'
import {
  EncryptionGrid, PlainTextGridItem, CipherTextGridItem,
  EncryptGridItem, DecryptGridItem
} from './EncryptionGrid'
import { StatusSegmentRow } from 'components/ui/layout'
import { EncryptionActions } from 'encryption-state'
import { WithStore } from '@react-frontend-developer/react-redux-render-prop'

const CogitoSimpleEncryption = ({ telepathChannel }) => (
  <WithStore selector={state => state.encryption}>
    {
      ({ plainText, cipherText, pending, errorMessage }, dispatch) => (
        <CogitoSimpleEncryptionView
          telepathChannel={telepathChannel}
          plainText={plainText}
          cipherText={cipherText}
          pending={pending}
          errorMessage={errorMessage}
          dispatch={dispatch}
        />
      )
    }
  </WithStore>
)

const CogitoSimpleEncryptionView = ({ telepathChannel, plainText, cipherText, pending, dispatch, errorMessage }) => (
  <Centered>
    <EncryptionGrid>
      <EncryptionView plainText={plainText} pending={pending} telepathChannel={telepathChannel} dispatch={dispatch} />
      <DecryptionView cipherText={cipherText} pending={pending} telepathChannel={telepathChannel} dispatch={dispatch} />
    </EncryptionGrid>
    <ErrorMessage message={errorMessage} />
  </Centered>
)

const EncryptionView = ({ plainText, pending, telepathChannel, dispatch }) => (
  <>
    <PlainTextGridItem>
      <TextInput
        data-testid='plain-text'
        placeholder='Enter some text'
        value={plainText}
        onChange={(event) => dispatch(
          EncryptionActions.setPlainText(event.target.value)
        )}
        disabled={pending}
      />
    </PlainTextGridItem>
    <EncryptGridItem>
      <Button
        secondary color='black'
        onClick={() => dispatch(
          EncryptionActions.encrypt({
            telepathChannel: telepathChannel
          })
        )}
        disabled={pending}
      >
        ―Encrypt→
      </Button>
    </EncryptGridItem>
  </>
)

const DecryptionView = ({ cipherText, pending, telepathChannel, dispatch }) => (
  <>
    <DecryptGridItem>
      <Button
        secondary color='black'
        onClick={() => dispatch(
          EncryptionActions.decrypt({
            telepathChannel: telepathChannel
          })
        )}
        disabled={pending}
      >
       ←Decrypt―
      </Button>
    </DecryptGridItem>
    <CipherTextGridItem>
      <TextInput
        data-testid='cipher-text'
        placeholder='Encrypted text appears here'
        value={cipherText}
        onChange={(event) => dispatch(
          EncryptionActions.setCipherText(event.target.value)
        )}
        disabled={pending}
      />
    </CipherTextGridItem>
  </>
)

const ErrorMessage = ({ message }) => {
  if (!message) {
    return null
  }

  return (
    <div data-testid='error-message'>
      <StatusSegmentRow>{message}</StatusSegmentRow>
    </div>
  )
}

const TextInput = ({ ...args }) => (
  <TextArea {...args} style={{ width: '13rem', height: '10rem' }} />
)

export { CogitoSimpleEncryption, CogitoSimpleEncryptionView }
