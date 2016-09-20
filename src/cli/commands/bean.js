'use strict'


const common = require('./common')
const commandIds = require('../../command-definitions').commandIds
const sleep = require('sleep')
const async = require('async')
const sprintf = require('sprintf-js').sprintf
const buffer = require('buffer')


function _printDeviceInfo(mfgName, modelNumber, hwVersion, fwVersion, swVersion, battVoltage, sketchName) {

}


function blinkLed(sdk, beanName, beanAddress, completedCallback) {

  common.connectToBean(sdk, beanName, beanAddress, (device)=> {
    console.log('Blinking led...')
    device.setLed(255, 0, 255)
    sleep.sleep(1)
    device.setLed(0, 0, 0)
    completedCallback(null)
  }, completedCallback)

}


function readAccel(sdk, beanName, beanAddress, completedCallback) {

  common.connectToBean(sdk, beanName, beanAddress, (device)=> {

    async.timesSeries(30, (n, next)=> {
      device.readAccelerometer((err, response)=> {
        let xOut = sprintf("X: %-10s", response.x_axis)
        let yOut = sprintf("Y: %-10s", response.y_axis)
        let zOut = sprintf("Z: %-10s", response.z_axis)
        let out = `${xOut}${yOut}${zOut}`
        console.log(out)
        sleep.usleep(500000)
        next()
      })
    }, (err, results)=> {
      // All done
      completedCallback(null)
    })

  }, completedCallback)

}


function readConfig(sdk, beanName, beanAddress, completedCallback) {

  common.connectToBean(sdk, beanName, beanAddress, (device)=> {
    device.readBleConfig((err, response)=> {
      let out = "\n"
      out += `    Advertising Interval: ${response.advertising_interval}\n`
      out += `     Connection Interval: ${response.connection_interval}\n`
      out += `                Tx Power: ${response.tx_power}\n`
      out += `        Advertising Mode: ${response.advertising_mode}\n`
      out += `            iBeacon UUID: ${response.ibeacon_uuid}\n`
      out += `        iBeacon Major ID: ${response.ibeacon_major_id}\n`
      out += `        iBeacon Minor ID: ${response.ibeacon_minor_id}\n`
      out += `              Local Name: ${response.local_name}\n`
      console.log(out)
      completedCallback(null)
    })
  }, completedCallback)
}


function readDeviceInfo(sdk, beanName, beanAddress, completedCallback) {

  common.connectToBean(sdk, beanName, beanAddress, (device)=> {
    let dis = device.getDeviceInformationService()
    dis.serialize((err, info) => {
      if (err)
        throw new Error(err)

      device.getBatteryService().getVoltage((err, battVoltage)=> {
        if (err)
          throw new Error(err)

        device.readSketchInfo((err, sketchInfo)=> {
          if (err)
            throw new Error(err)

          let out = "\n"
          out += `      Manufacturer: ${info.manufacturer_name}\n`
          out += `      Model Number: ${info.model_number}\n`
          out += `  Hardware Version: ${info.hardware_version}\n`
          out += `  Firmware Version: ${info.firmware_version}\n`
          out += `  Software Version: ${info.software_version}\n`
          out += `     Battery Level: ${battVoltage}%\n`
          out += `       Sketch Name: ${sketchInfo.sketch_name}\n`
          console.log(out)

          completedCallback(null)
        })
      })
    })
  }, completedCallback)
}


function logSerial(sdk, beanName, beanAddress, completedCallback) {
  common.connectToBean(sdk, beanName, beanAddress, (device)=> {
    console.log('Logging serial data...')
    device.getSerialTransportService().registerForCommandNotification(commandIds.SERIAL_DATA, (serialCmd)=> {
      console.log(`Rx: ${serialCmd.data}`)
    })
  })
}


function sendSerial(sdk, data, binary, beanName, beanAddress, completedCallback) {

  // Parse data into buffer
  let buf

  if (binary === true) {
    // Interpret as hex digits
    buf = new buffer.Buffer(data, 'hex')
  } else {
    // Ascii
    buf = new buffer.Buffer(data, 'ascii')
  }

  common.connectToBean(sdk, beanName, beanAddress, (device)=> {
    device.sendSerial(buf)
    sleep.sleep(1)
    completedCallback(null)
  })
}


function rename(sdk, newName, beanName, beanAddress, completedCallback) {

  common.connectToBean(sdk, beanName, beanAddress, (device)=> {
    console.log(`Renaming Bean to: ${newName}`)
    device.rename(newName, completedCallback)
  })

}


module.exports = {
  blinkLed: blinkLed,
  readAccel: readAccel,
  readConfig: readConfig,
  readDeviceInfo: readDeviceInfo,
  logSerial: logSerial,
  sendSerial: sendSerial,
  rename: rename
}
