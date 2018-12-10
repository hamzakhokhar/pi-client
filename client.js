'use strict';
const awsIot = require('aws-iot-device-sdk');
const uuid = require('uuid-1345');
const log = require('./logger');
const Sensor = require('./sensor');

let sensor = new Sensor(11, 4);

const config = {
    deviceType: 'tempSensor',
    physicalId: '00001'
};

const deviceId = uuid.v5({
    namespace: uuid.namespace.url,
    name: `${config.deviceType}_${config.physicalId}`
});

log.info({"eventType": "deviceType_conversion", data: deviceId});

var device = awsIot.thingShadow({
    keyPath: './certificate/eec9a1d87e-private.pem.key',
    certPath: './certificate/eec9a1d87e-certificate.pem.crt',
    caPath: './certificate/rootca.pem',
    host: 'anfllcph4xftj.iot.us-east-2.amazonaws.com'
});

let shadow = {
    setReported: (device, deviceId, state) => {
        operationToken.update = device.update(deviceId, {
            state: {
                reported: state
            }
        })
    }
};

let operationToken = {
    update: null,
    get: null
};

device.on('connect', function(data) {
    log.info({eventType: "connect", data: data});

    device.register(deviceId, { enableVersioning: false, discardStale: true}, () => {

        operationToken.get = device.get(deviceId);

        sensor.onSamplerStart = (state) => {
            log.info({eventType: "sampler:start"});
            shadow.setReported(device, deviceId, state);

            sensor.onSampleReceived = (sample) => {
                log.info({eventType: "sampler:sample", data: sample});
                shadow.setReported(device, deviceId, sample);
            }
        };

        sensor.onSamplerStop = (state) => {
            log.info({eventType: "sampler:stop"});
            shadow.setReported(device, deviceId, state);
        }
    })

});

device.on('message', function(topic, payload) {
    log.info({eventType: "message", data: payload.toString()});
});

device.on('status', (thingName, stat, clientToken, stateObject) => {
    if(stat === 'accepted' && operationToken.get === clientToken){
        sensor.processShadowState(stateObject.state.reported);
    }
})

device.on('delta', (deviceId, shadow) => {
    log.info({eventType: "delta", data: shadow.state});
    sensor.processShadowState(shadow.state);
});

device.on('error', (err) => {
    log.error({eventType: "error", data: err});
    console.log(arguments)
})

device.on('disconnect', (data) => {
    log.error({eventType: "disconnect", data: data});
})