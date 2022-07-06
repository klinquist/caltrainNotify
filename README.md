# CaltrainNotify

## A nodejs script to send you a push notification with your train's estimated departure at a specific station.

### About
I have this script send me several push notifications each morning as my train gets closer, assuming the data will get more accurate.
It takes me ~7 minutes to get to the station, so for a 6:50 train, I have it notify me at 6:35, 6:40, 6:45.  It can then notify at 6:55, but only if the train is late.   Each of these notifications is set up as a cron.

The 511 API sometimes does not provide arrival/departure information for an upcoming stop. In this case, you will get a push notification with the distance (in miles) to the station.  Hopefully you can use distance as a proxy for time once a pattern has been established.


### Installing
1. Go ao 511.org and obtain an API key
2. Install the pushover app, login to pushover and obtain a user token & app API key
3. Visit caltrain's website and get the train numbers you are interested in.
4. Run `npm install`
5. Rename `config.default.json` to `config.json` and fill it out!  The "schedules" array is where you define:
   1. `cron` *string*: WHEN you want to receive the push notification, in cron format
   2. `notify` *enum*: Either `always` or `late`.  *Late* will only send you a notification if the train is going to depart more than 1 minute late.
   3. `stop_id` *number*: See the stop_id reference below
   4. `VehicleRef` *string*: Train VehicleRef (number)


Run `nodejs index.js` to begin.  Run it under `pm2` (or similar) for persistence.  Works great on a Raspberry Pi!




#### Cron reference:

"A B C D E F"

A = Seconds: 0-59

B = Minutes: 0-59

C = Hours: 0-23

D = Day of Month: 1-31

E = Months: 0-11 (Jan-Dec)

F = Day of Week: 0-6 (Sun-Sat)



#### Station stop_id reference:

| Station | stop_id |
| ------- | ------- |
| San Francisco Caltrain NORTHBOUND | 70011 |
| San Francisco Caltrain SOUTHBOUND | 70012 |
| 22nd Street Caltrain NORTHBOUND | 70021 |
| 22nd Street Caltrain SOUTHBOUND | 70022 |
| Bayshore Caltrain NORTHBOUND | 70031 |
| Bayshore Caltrain SOUTHBOUND | 70032 |
| South San Francisco Caltrain NORTHBOUND | 70041 |
| South San Francisco Caltrain SOUTHBOUND | 70042 |
| San Bruno Caltrain NORTHBOUND | 70051 |
| San Bruno Caltrain SOUTHBOUND | 70052 |
| Millbrae Caltrain NORTHBOUND | 70061 |
| Millbrae Caltrain SOUTHBOUND | 70062 |
| Broadway Caltrain NORTHBOUND | 70071 |
| Broadway Caltrain SOUTHBOUND | 70072 |
| Burlingame Caltrain NORTHBOUND | 70081 |
| Burlingame Caltrain SOUTHBOUND | 70082 |
| San Mateo Caltrain NORTHBOUND | 70091 |
| San Mateo Caltrain SOUTHBOUND | 70092 |
| Hayward Park Caltrain NORTHBOUND | 70101 |
| Hayward Park Caltrain SOUTHBOUND | 70102 |
| Hillsdale Caltrain NORTHBOUND | 70111 |
| Hillsdale Caltrain SOUTHBOUND | 70112 |
| Belmont Caltrain NORTHBOUND | 70121 |
| Belmont Caltrain SOUTHBOUND | 70122 |
| San Carlos Caltrain NORTHBOUND | 70131 |
| San Carlos Caltrain SOUTHBOUND | 70132 |
| Redwood City Caltrain NORTHBOUND | 70141 |
| Redwood City Caltrain SOUTHBOUND | 70142 |
| Menlo Park Caltrain NORTHBOUND | 70161 |
| Menlo Park Caltrain SOUTHBOUND | 70162 |
| Palo Alto Caltrain NORTHBOUND | 70171 |
| Palo Alto Caltrain SOUTHBOUND | 70172 |
| California Ave Caltrain NORTHBOUND | 70191 |
| California Ave Caltrain SOUTHBOUND | 70192 |
| San Antonio Caltrain NORTHBOUND | 70201 |
| San Antonio Caltrain SOUTHBOUND | 70202 |
| Mountain View Caltrain NORTHBOUND | 70211 |
| Mountain View Caltrain SOUTHBOUND | 70212 |
| Sunnyvale Caltrain NORTHBOUND | 70221 |
| Sunnyvale Caltrain SOUTHBOUND | 70222 |
| Lawrence Caltrain NORTHBOUND | 70231 |
| Lawrence Caltrain SOUTHBOUND | 70232 |
| Santa Clara Caltrain NORTHBOUND | 70241 |
| Santa Clara Caltrain SOUTHBOUND | 70242 |
| College Park Caltrain NORTHBOUND | 70251 |
| College Park Caltrain SOUTHBOUND | 70252 |
| San Jose Diridon Caltrain NORTHBOUND | 70261 |
| San Jose Diridon Caltrain SOUTHBOUND | 70262 |
| Tamien Caltrain NORTHBOUND | 70271 |
| Tamien Caltrain SOUTHBOUND | 70272 |
| Capitol Caltrain NORTHBOUND | 70281 |
| Capitol Caltrain SOUTHBOUND | 70282 |
| Blossom Hill Caltrain NORTHBOUND | 70291 |
| Blossom Hill Caltrain SOUTHBOUND | 70292 |
| Morgan Hill Caltrain NORTHBOUND | 70301 |
| Morgan Hill Caltrain SOUTHBOUND | 70302 |
| San Martin Caltrain NORTHBOUND | 70311 |
| San Martin Caltrain SOUTHBOUND | 70312 |
| Gilroy Caltrain NORTHBOUND | 70321 |
| Gilroy Caltrain SOUTHBOUND | 70322 |