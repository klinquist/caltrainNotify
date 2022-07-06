const CronJob = require('cron').CronJob;
const _ = require('lodash');
const axios = require('axios')
const config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'))
const moment = require('moment')
const Push = require('pushover-notifications');
const geolib = require('geolib')

let nb = JSON.parse(require('fs').readFileSync('./stationDataNorth.json', 'utf8'))
let sb = JSON.parse(require('fs').readFileSync('./stationDataNorth.json', 'utf8'))


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
        data = await axios.get(`http://api.511.org/transit/VehicleMonitoring?api_key=${config['511_api_key']}&format=json&agency=CT`)
    } catch (err) {
        console.log('Error receiving data from 511: ' + err)
    }
    if (!data) {
        return
    }

    let entries = []
    data.data.Siri.ServiceDelivery.VehicleMonitoringDelivery.VehicleActivity.forEach((v) => {
        entries.push(v.MonitoredVehicleJourney)
    })

    let record = _.find(entries, (n) => {
        return n.VehicleRef = schedule.VehicleRef
    })

    if (!record) {
        console.log(`Skipping: Train ${schedule.VehicleRef} is not currently found on the line`)
        return;
    }

    let yourStop = _.find(record.OnwardCalls.OnwardCall, (n) => {
        return Number(n.StopPointRef) == Number(schedule.stop_id)
    })

    if (!yourStop) {
        console.log(`Skipping: Train ${schedule.VehicleRef} is not stopping at ${schedule.stop_id}`)

        let station = _.find(nb, (n)=>{
            return n.stop_id == schedule.stop_id
        })
        if (!station) {
            station = _.find(sb, (n) => {
                return n.stop_id == schedule.stop_id
            })
        }
        if (!station) {
            return console.log("Invalid station")
        }
        let stationLat = station.stop_lat
        let stationLong = station.stop_lon
        let vehicleLocation = record.vehicleLocation
        let distanceM = geolib.getPreciseDistance({ latitude: stationLat, longitude: stationLong }, { latitude: vehicleLocation.latitude, longitude: vehicleLocation.longitude })
        let distanceMi = Math.round(0.000621371 * distanceM * 10) / 10
        let msg = `Train ${schedule.VehicleRef} is ${distanceMi} from ${station.stop_name}`
        return sendPush(msg)
    }

    let s = yourStop.StopPointName.replace('Caltrain Station', '').trim()
    let sch = moment(yourStop.AimedDepartureTime)
    let act = moment(yourStop.ExpectedDepartureTime);
    let diff = act.diff(sch, 'minutes')
    let tf = act.format('h:mm:ss')
    let str = `${s} @ ${tf}`


    if (schedule.notify == 'always' || (schedule.notify == 'late' && diff > 1)) {
        if (diff > 0) {
            str += ` (${diff}m late)`
        } else {
            str += ` (on time)`
        }
        let msg = `Train ${schedule.VehicleRef} is expected to depart ${str}`
        sendPush(msg)
    } else {
        console.log('Not sending notification - train is on time.')
    }
}












(async () => {
    config.schedules.forEach((schedule) => {
        console.log(`Scheduling cron: ${schedule.cron} for train ${schedule.VehicleRef} at stop ${schedule.stop_id}`)
        const job = new CronJob(schedule.cron, function () {
            checkSchedule(schedule)
        }, null, true, config.time_zone);
    })
})()