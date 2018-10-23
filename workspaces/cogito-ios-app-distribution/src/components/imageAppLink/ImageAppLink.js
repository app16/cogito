import React from 'react'
import { Image } from 'semantic-ui-react'
import manifest from './Manifest-512px.png'

export const ImageAppLink = () => (
  <Image
    src={manifest}
    as='a'
    size='medium'
    href='itms-services://?action=download-manifest&url=https://secure-transfer-app.charterlab.tech/manifest.plist'
    target='_blank'
  />
)
