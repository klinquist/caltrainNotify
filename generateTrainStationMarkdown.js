let nb = JSON.parse(require('fs').readFileSync('./stationDataNorth.json', 'utf8'))
const sb = JSON.parse(require('fs').readFileSync('./stationDataSouth.json', 'utf8'))

nb = nb.reverse()

let output = '| Station | stop_id |\n'
output += '| ------- | ------- |\n'

for (let i = 0; i<nb.length; i++) {
    output += `| ${nb[i].stop_name.replace(' Caltrain', '').trim()} trains headed NORTHBOUND | ${nb[i].stop_id} |\n`
    output += `| ${sb[i].stop_name.replace(' Caltrain', '').trim()} trains headed SOUTHBOUND | ${sb[i].stop_id} |\n`
}

console.log(output)