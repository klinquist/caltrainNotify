const CronJob = require('cron').CronJob;
const cronstrue = require('cronstrue');
const _ = require('lodash');
const axios = require('axios')
const config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'))
const moment = require('moment')
const Push = require('pushover-notifications');
const geolib = require('geolib')

let nb = JSON.parse(require('fs').readFileSync('./stationDataNorth.json', 'utf8'))
let sb = JSON.parse(require('fs').readFileSync('./stationDataSouth.json', 'utf8'))


const push = new Push({
    user: config.pushover_user_key,
    token: config.pushover_api_token
});

const sendPush = (txt) => {
    push.send({
        message: txt,
        priority: 1
    }, (err) => {
        if (err) console.log('Error sending push notification: ' + err);
    });
}

sendPush('Starting CaltrainNotify')

async function checkSchedule(schedule) {
    console.log('Running cron: ' + JSON.stringify(schedule))
    let data;
    try {
        data = await axios.get(`http://api.511.org/transit/VehicleMonitoring?api_key=${config['511_api_key']}&format=json&agency=CT&VehicleID=${schedule.VehicleRef}`)
    } catch (err) {
        return console.log('Error receiving data from 511: ' + err)
    }
    if (!data || !data.data) {
        return console.log('Error receiving data from 511.')
    }

    let entries = []
    let VehicleActivity = _.get(data, 'data.Siri.ServiceDelivery.VehicleMonitoringDelivery.VehicleActivity')
    if (!VehicleActivity) {
        return sendPush(`No activity found for train ${schedule.VehicleRef}`)
    }

    VehicleActivity.forEach((v) => {
        entries.push(v.MonitoredVehicleJourney)
    })

    let record = _.find(entries, (n) => {
        return n.VehicleRef = schedule.VehicleRef
    })

    if (!record) {
        return console.log(`Skipping: Train ${schedule.VehicleRef} is not currently found on the line`)
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
        console.log(`No stop data for train ${schedule.VehicleRef} at ${schedule.station.stop_name}. Sending push notification with distance data.`)
        let msg = `Train ${schedule.VehicleRef} is ${distanceMi}mi ${dir} from ${schedule.station.stop_name}`
        console.log(msg)
        return sendPush(msg)
    } else {

        let s = yourStop.StopPointName.replace('Caltrain Station', '').trim()

        let sch, act, which;
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
        let tf = act.format('h:mm:ss')
        let str = `${s} @ ${tf}`

        if (schedule.notify == 'always' || (schedule.notify == 'late' && diff > 1)) {
            if (diff > 0) {
                str += ` (${diff}m late)`
            } else if (diff < 0) {
                str += ` (${-diff}m early)`
            } else {
                str += ` (on time)`
            }
            let msg = `Train ${schedule.VehicleRef} is ${distanceMi}mi away and expected to ${which} ${str}`
            console.log(msg)
            return sendPush(msg)
        } else {
            return console.log('Not sending notification - train is on time.')
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
            return console.log(`Skipping ${schedule.stop_id} : Invalid station`)
        }
        schedule.station = station
        console.log(`Scheduling: ${cronstrue.toString(schedule.cron)} for train ${schedule.VehicleRef} at ${schedule.station.stop_name}`)
        const job = new CronJob(schedule.cron, function () {
            checkSchedule(schedule)
        }, null, true, config.time_zone);
    })
})()