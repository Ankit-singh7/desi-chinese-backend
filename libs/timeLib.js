const moment = require('moment')//npm install moment --save
const momenttz = require('moment-timezone')//npm install moment-timezone --save
const timeZone = 'Asia/Calcutta'

let now = () => {
    //this method returns the current time in utc(universal time coordinator) format
  return moment.utc().format()
}

let getLocalTime = () => {
    //this method is to get the local time of the area
  return moment().tz(timeZone).format()
}

// let getNormalTime = () => {
//   return moment(new Date()).format("DD-MM-YYYY")
// }

let getNormalTime = () => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth()+1; 
  let yyyy = today.getFullYear();
   if(dd<10) 
    {
      dd='0'+dd;
    } 

    if(mm<10) 
    {
      mm='0'+mm;
    } 
 today = dd+'-'+mm+'-'+yyyy;
  console.log(today);
  return today
}

let convertToLocalTime = (time) => {
  return momenttz.tz(time, timeZone).format('LLLL')
}
module.exports = {
  now: now,
  getLocalTime: getLocalTime,
  convertToLocalTime: convertToLocalTime,
  getNormalTime:getNormalTime
}