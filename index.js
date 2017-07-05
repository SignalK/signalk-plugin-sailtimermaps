/*
 * Copyright 2017 Fabian Tollenaar & Signal K <fabian@signalk.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-plugin-sailtimermaps')
const fetch = require('isomophic-fetch')
const Bacon = require('baconjs')
const pkg = require('./package.json')

module.exports = function SailTimerMapsPlugin (app) {
  const plugin = {}
  let unsubscribe

  plugin._onDelta = function sendDataToSailTimerMaps(username, password, data) {
    // https://www.sailtimermaps.com/Edson/WS/SaveData/USERNAME/PASSWORD/DATA/
    // DATA = {0,-48.2365485,61.325668,11,32,5,181,3.5,200,2.1,2.5}
    // (int)ID of event,(double)latitude,(double)longitude,(int)accuracy,(int)sog,(int)cog,(int)awd,(double)aws,(int)twd,(double)tws,(double)tem
    /**
    {
      event (0)
      latitude
      longitude
      accuracy
      speed over ground
      course over ground
      apparent wind direction
      true wind direction
      true wind speed
      temp
    }
    **/
  }

  plugin.start = function startSailTimerPlugin(props) {
    debug(`Started!`)

    unsubscribe = Bacon.combineWith(
      (position, sog, cog, head) => {
        debug('position', position)
        debug('SOG', convert(sog, 'm/s', 'kts'))
        debug('COG', convert(cog, 'rad', 'deg'))
        debug('Heading', convert(head, 'rad', 'deg'))
        debug('username', props.username)
        debug('password', props.password)
        return
      }, 
      [
        'navigation.position', 
        'navigation.speedOverGround', 
        'navigation.courseOverGroundTrue', 
        'navigation.headingTrue'
      ]
      .map(app.streambundle.getSelfStream, app.streambundle)
    )
    .changes()
    .debounceImmediate(1000)
    .onValue(msg => {
      debug(JSON.stringify(msg, null, 2))
    })
  }

  plugin.stop = function stopSailTimerPlugin() {
    unsubscribe()
  };

  plugin.id = pkg.name.replace('@signalk/signalk-plugin-', '')
  plugin.name = pkg.name.replace('@signalk/', '')
  plugin.description = pkg.description

  plugin.schema = {
    type: "object",
    properties: {
      username: {
        type: "string",
        title: "Your SailTimerMaps username"
      },
      password: {
        type: "string",
        title: "Your SailTimerMaps password"
      }
    }
  }
  
  return plugin
}

function convert (value, from, to) {
  if (from === 'rad' && to === 'deg') {
    return value * (180 / Math.PI)
  }

  if (from === 'm/s' && to === 'kts') {
    return value * 1.944
  }

  return value
}
