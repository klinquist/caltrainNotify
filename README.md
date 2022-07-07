# CaltrainNotify

## A nodejs script to send you a push notification with your train's estimated departure at a specific station.

### About
I have this script send me several push notifications each morning as my train gets closer, assuming the data will get more accurate.
It takes me ~7 minutes to get to the station, so for a 6:50 train, I have it notify me at 6:35, 6:40, 6:45.  It can then notify at 6:55, but only if the train is late.   Each of these notifications is set up as a cron.

The 511 API sometimes does not provide arrival/departure information for an upcoming stop. In this case, you will get a push notification with the train's distance (in miles) to the station.  Hopefully you can use distance as a proxy for time once a pattern has been established.


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
| San Francisco trains headed NORTHBOUND | 70011 |
| San Francisco trains headed SOUTHBOUND | 70012 |
| 22nd Street trains headed NORTHBOUND | 70021 |
| 22nd Street trains headed SOUTHBOUND | 70022 |
| Bayshore trains headed NORTHBOUND | 70031 |
| Bayshore trains headed SOUTHBOUND | 70032 |
| South San Francisco trains headed NORTHBOUND | 70041 |
| South San Francisco trains headed SOUTHBOUND | 70042 |
| San Bruno trains headed NORTHBOUND | 70051 |
| San Bruno trains headed SOUTHBOUND | 70052 |
| Millbrae trains headed NORTHBOUND | 70061 |
| Millbrae trains headed SOUTHBOUND | 70062 |
| Broadway trains headed NORTHBOUND | 70071 |
| Broadway trains headed SOUTHBOUND | 70072 |
| Burlingame trains headed NORTHBOUND | 70081 |
| Burlingame trains headed SOUTHBOUND | 70082 |
| San Mateo trains headed NORTHBOUND | 70091 |
| San Mateo trains headed SOUTHBOUND | 70092 |
| Hayward Park trains headed NORTHBOUND | 70101 |
| Hayward Park trains headed SOUTHBOUND | 70102 |
| Hillsdale trains headed NORTHBOUND | 70111 |
| Hillsdale trains headed SOUTHBOUND | 70112 |
| Belmont trains headed NORTHBOUND | 70121 |
| Belmont trains headed SOUTHBOUND | 70122 |
| San Carlos trains headed NORTHBOUND | 70131 |
| San Carlos trains headed SOUTHBOUND | 70132 |
| Redwood City trains headed NORTHBOUND | 70141 |
| Redwood City trains headed SOUTHBOUND | 70142 |
| Menlo Park trains headed NORTHBOUND | 70161 |
| Menlo Park trains headed SOUTHBOUND | 70162 |
| Palo Alto trains headed NORTHBOUND | 70171 |
| Palo Alto trains headed SOUTHBOUND | 70172 |
| California Ave trains headed NORTHBOUND | 70191 |
| California Ave trains headed SOUTHBOUND | 70192 |
| San Antonio trains headed NORTHBOUND | 70201 |
| San Antonio trains headed SOUTHBOUND | 70202 |
| Mountain View trains headed NORTHBOUND | 70211 |
| Mountain View trains headed SOUTHBOUND | 70212 |
| Sunnyvale trains headed NORTHBOUND | 70221 |
| Sunnyvale trains headed SOUTHBOUND | 70222 |
| Lawrence trains headed NORTHBOUND | 70231 |
| Lawrence trains headed SOUTHBOUND | 70232 |
| Santa Clara trains headed NORTHBOUND | 70241 |
| Santa Clara trains headed SOUTHBOUND | 70242 |
| College Park trains headed NORTHBOUND | 70251 |
| College Park trains headed SOUTHBOUND | 70252 |
| San Jose Diridon trains headed NORTHBOUND | 70261 |
| San Jose Diridon trains headed SOUTHBOUND | 70262 |
| Tamien trains headed NORTHBOUND | 70271 |
| Tamien trains headed SOUTHBOUND | 70272 |
| Capitol trains headed NORTHBOUND | 70281 |
| Capitol trains headed SOUTHBOUND | 70282 |
| Blossom Hill trains headed NORTHBOUND | 70291 |
| Blossom Hill trains headed SOUTHBOUND | 70292 |
| Morgan Hill trains headed NORTHBOUND | 70301 |
| Morgan Hill trains headed SOUTHBOUND | 70302 |
| San Martin trains headed NORTHBOUND | 70311 |
| San Martin trains headed SOUTHBOUND | 70312 |
| Gilroy trains headed NORTHBOUND | 70321 |
| Gilroy trains headed SOUTHBOUND | 70322 |


### Learnings

Trains typically show up as arriving early, but they don't actually arrive early.  I think 511.org's time agorithm does not take stops into account (the further back on the line you go, the earlier it'll say a train will arrive at a given station).  Therefore, if I show a train as arriving early, I still say it's "on time" and show the scheduled arrival time - because it won't depart early.