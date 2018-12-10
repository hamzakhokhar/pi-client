'use strict';

const dht11 = require('node-dht-sensor');

class Sensor {
    constructor(model, pin){
        this.model = model;
        this.pin = pin;
        this._sampler = null;
    }

    read(){
        return Promise.resolve((resolve, reject) => {
            dht11.read(this.model, this.pin, (err, temperature, humidity) => {
                console.log(err, temperature, humidity);
                if(err) reject(err);
                else resolve({
                    temperature: temperature,
                    humidity: humidity
                })
            })
        })
    }

    startSampler(state){
        let _samplerRate = state.samplerRate || 2000;
        this._sampler = setInterval(() => {
            dht11.read(this.model, this.pin, (err, temperature, humidity) => {
                let sample = {temperature: temperature, humidity: humidity};
                if(this.onSampleReceived && typeof this.onSampleReceived === 'function'){
                    this.onSampleReceived(sample);
                }
            })
        }, _samplerRate);

        if(this.onSamplerStart && typeof this.onSamplerStart === 'function'){
            this.onSamplerStart(state);
        }
    }

    stopSampler(state){
        if(this._sampler === null){
            if(this.onSamplerStop && typeof this.onSamplerStop === 'function'){
                this.onSamplerStop(state);
            }
        }
        clearInterval(this._sampler);

        if(this.onSamplerStop && typeof this.onSamplerStop === 'function'){
            this.onSamplerStop(state);
        }
    }

    processShadowState(state){
        if(state.samplerState === 'inactive'){
            this.stopSampler(state);
        }

        if(state.samplerState === 'active'){
            clearInterval(this._sampler);
            this.startSampler(state)
        }

        if(state.samplerState === 'active' && state.samplerRate){
            clearInterval(this._sampler);
            this.startSampler(state)
        }
    }

    onSampleReceived(){}
    onSamplerStart(){}
    onSamplerStop(){}
}

module.exports = Sensor;
