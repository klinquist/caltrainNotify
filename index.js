//There are times when 511 doesn't return any data for a given train.  Retrying seems to help.
const MAX_RETRIES = 3;
const SECONDS_BETWEEN_RETRIES = 15;



const CronJob = require('cron').CronJob;
const cronstrue = require('cronstrue');
const _ = require('lodash');
const axios = require('axios')
const moment = require('moment')
const Push = require('pushover-notifications');
const geolib = require('geolib')


const config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'))
const nb = JSON.parse(require('fs').readFileSync('./stationDataNorth.json', 'utf8'))
const sb = JSON.parse(require('fs').readFileSync('./stationDataSouth.json', 'utf8'))



const push = new Push({
    user: config.pushover_user_key,
    token: config.pushover_api_token
});




const sendPush = (txt) => {
    push.send({
        message: txt,
        priority: 1
    }, (err) => {
        if (err) log('Error sending push notification: ' + err);
    });
}


sendPush('Starting CaltrainNotify')



const log = (msg) => {
    let now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log(`${now} - ${msg}`)
}



let sleep = async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};




const httpGetWithRetry = async (url) => {
    return new Promise(async (resolve, reject) => {
        let retries = 0;
        let success = false;
        while (retries < MAX_RETRIES && !success) {
            if (retries > 0) {
                log(`Waiting ${SECONDS_BETWEEN_RETRIES} seconds before retrying...`)
                await sleep(SECONDS_BETWEEN_RETRIES * 1000)
            }
            let data;
            log('Making request to ' + url)
            try {
                data = await axios.get(url);
            } catch (err) {
                return reject(err)
            }
            if (!data || !data.data) {
                return reject('Error receiving data from 511.')
            }
            let VehicleActivity = _.get(data, 'data.Siri.ServiceDelivery.VehicleMonitoringDelivery.VehicleActivity')
            if (VehicleActivity) {
                success = true
                return resolve(VehicleActivity)
            } else {
                retries++;
            }
        }
        reject(`Train not found after ${MAX_RETRIES} retries.`)
    })
}



async function checkSchedule(schedule) {
    let VehicleActivity;
    try {
        VehicleActivity = await httpGetWithRetry(`http://api.511.org/transit/VehicleMonitoring?api_key=${config['511_api_key']}&format=json&agency=CT&VehicleID=${schedule.VehicleRef}`)
    } catch (err) {
        return sendPush('Error:  ' + err)
    }

    let entries = []
    
    VehicleActivity.forEach((v) => {
        entries.push(v.MonitoredVehicleJourney)
    })

    let record = _.find(entries, (n) => {
        return n.VehicleRef = schedule.VehicleRef
    })

    if (!record) {
        return log(`Skipping: Train ${schedule.VehicleRef} is not currently found on the line`)
    }

    let yourStop = _.find(record.OnwardCalls.OnwardCall, (n) => {
        return Number(n.StopPointRef) == Number(schedule.stop_id)
    })

    //If your stop is the next stop, the arrival data will show up in the MonitoredCall object
    //rather than the OnwardCalls array.

    if (!yourStop && Number(record.MonitoredCall.StopPointRef) == Number(schedule.stop_id)) {
        yourStop = record.MonitoredCall
    }

    let distanceM = geolib.getPreciseDistance({
        latitude: schedule.station.stop_lat,
        longitude: schedule.station.stop_lon
    }, {
        latitude: Number(record.VehicleLocation.Latitude),
        longitude: Number(record.VehicleLocation.Longitude)
    })
    let distanceMi = Math.round(0.000621371 * distanceM * 10) / 10
    let dir = geolib.getCompassDirection({
        latitude: schedule.station.stop_lat,
        longitude: schedule.station.stop_lon
    }, {
        latitude: Number(record.VehicleLocation.Latitude),
        longitude: Number(record.VehicleLocation.Longitude)
    })
    
    
    if (!yourStop) {
        log(`No stop data for train ${schedule.VehicleRef} at ${schedule.station.stop_name}. Sending push notification with distance data.`)
        let msg = `Train ${schedule.VehicleRef} is ${distanceMi}mi ${dir} from ${schedule.station.stop_name}`
        log(msg)
        return sendPush(msg)
    } else {

        let s = yourStop.StopPointName.replace('Caltrain Station', '').trim()
        let sch, act, which;

        //Lets default to the arrival time if it's available
        //  (It's not available at the origin station)
        //  This could be a configuration option!

        if (yourStop.AimedArrivalTime && yourStop.ExpectedArrivalTime) { 
            sch = moment(yourStop.AimedArrivalTime)
            act = moment(yourStop.ExpectedArrivalTime);
            which = 'arrive'
        } else {
            sch = moment(yourStop.AimedDepartureTime)
            act = moment(yourStop.ExpectedDepartureTime);
            which = 'depart'
        }

        let diff = act.diff(sch, 'minutes')
        let tf = act.format('h:mm')
        let schf = sch.format('h:mm')

        //This is a fix for some bad data I see on 511 when traversing UTC dates.
        if (diff > 1400) {
            diff = diff - 1440
        }

        let str = ''

        if (schedule.notify == 'always' || (schedule.notify == 'late' && diff > 1)) {
            if (diff > 0) {
                str += `${s} @ ${tf}`
                str += ` (${diff}m late)`
            } else {
                str += `${s} @ ${schf}`
                str += ` (on time)`
            }
            let msg = `Train ${schedule.VehicleRef} is ${distanceMi}mi away and expected to ${which} ${str}`
            log(msg)
            return sendPush(msg)
        } else {
            return log('Not sending notification - train is on time.')
        }
    }
}


(async () => {
    config.schedules.forEach((schedule) => {
        let station = _.find(nb, (n) => {
            return n.stop_id == schedule.stop_id
        })
        if (!station) {
            station = _.find(sb, (n) => {
                return n.stop_id == schedule.stop_id
            })
        }
        if (!station) {
            return log(`Skipping ${schedule.stop_id} : Invalid station`)
        }
        schedule.station = station
        log(`Scheduling: ${cronstrue.toString(schedule.cron)} for train ${schedule.VehicleRef} at ${schedule.station.stop_name}`)
        const job = new CronJob(schedule.cron, function () {
            checkSchedule(schedule)
        }, null, true, config.time_zone);
    })
})()