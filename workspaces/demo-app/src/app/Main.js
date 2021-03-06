import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { PageCentered } from '@react-frontend-developer/react-layout-helpers'
import { CogitoEthereumReact } from '@cogitojs/cogito-ethereum-react'
import { WithStore } from '@react-frontend-developer/react-redux-render-prop'
import { Dimmer, Loader, Segment } from 'semantic-ui-react'
import { UserDataActions } from 'user-data'

import { CogitoId } from 'pages/home'
import { Contracts } from 'pages/contracts'
import { SimpleEncryption } from 'pages/simple-encryption'
import { StreamEncryption } from 'pages/stream-encryption'
import { Attestations } from 'pages/attestations'
import { NoMatch404 } from 'pages/404'

import { SimpleStorage } from '@cogitojs/demo-app-contracts'

class Main extends React.Component {
  renderComponent = (Component, routeProps, web3Props) => (
    <Component {...web3Props} {...routeProps} />
  )

  web3IsReady = ({ cogitoWeb3, telepathChannel, contractsProxies }) => {
    return cogitoWeb3 && telepathChannel && contractsProxies.SimpleStorage
  }

  cogitoProps = ({ cogitoWeb3, telepathChannel, contractsProxies: { SimpleStorage }, newChannel }) => ({
    cogitoWeb3,
    telepathChannel,
    SimpleStorage,
    newChannel
  })

  onTelepathChanged = ({ channelId, channelKey, appName }, dispatch) => {
    dispatch(UserDataActions.setTelepath({ channelId, channelKey, appName }))
  }

  render () {
    return (
      <WithStore
        selector={state => ({
          channelId: state.userData.channelId,
          channelKey: state.userData.channelKey
        })}
        render={({ channelId, channelKey }, dispatch) => (
          <CogitoEthereumReact
            contractsBlobs={[ SimpleStorage() ]}
            channelId={channelId}
            channelKey={channelKey}
            appName='Cogito Demo App'
            onTelepathChanged={telepath =>
              this.onTelepathChanged(telepath, dispatch)}
          >
            {web3Props => {
              if (this.web3IsReady(web3Props)) {
                return (
                  <Switch>
                    <Route
                      exact
                      path='/'
                      render={routeProps =>
                        this.renderComponent(CogitoId, routeProps, this.cogitoProps(web3Props))}
                    />
                    <Route
                      exact
                      path='/contracts'
                      render={routeProps =>
                        this.renderComponent(Contracts, routeProps, this.cogitoProps(web3Props))}
                    />
                    <Route
                      exact
                      path='/simple-encryption'
                      render={routeProps =>
                        this.renderComponent(
                          SimpleEncryption,
                          routeProps,
                          this.cogitoProps(web3Props)
                        )}
                    />
                    <Route
                      exact
                      path='/stream-encryption'
                      render={routeProps =>
                        this.renderComponent(
                          StreamEncryption,
                          routeProps,
                          this.cogitoProps(web3Props)
                        )}
                    />
                    <Route
                      exact
                      path='/attestations'
                      render={routeProps =>
                        this.renderComponent(
                          Attestations,
                          routeProps,
                          this.cogitoProps(web3Props)
                        )}
                    />
                    <Route component={NoMatch404} />
                  </Switch>
                )
              } else {
                return (
                  <PageCentered>
                    <div style={{ width: '300px', height: '200px' }}>
                      <Segment style={{ width: '100%', height: '100%' }}>
                        <Dimmer active inverted>
                          <Loader inverted content={<p>loading web3...</p>} />
                        </Dimmer>
                      </Segment>
                    </div>
                  </PageCentered>
                )
              }
            }}
          </CogitoEthereumReact>
        )}
      />
    )
  }
}

export { Main }
