const axios = require("axios");

// API keys and timezone.
const ApiRoutePassword = process.env.ALL_USER_DATA_API_ROUTE_PASSWORD;
const fetchKey = process.env.TIME_API_KEY;

const timeApiUri = "http://api.timezonedb.com/v2.1/get-time-zone";
const updateSentStatus = `http://eventmanager-web-api.herokuapp.com/api/done/${ApiRoutePassword}`; // "/api/done/:pw/:eventId"
const userDataApi = `http://eventmanager-web-api.herokuapp.com/api/all/${ApiRoutePassword}`;  // "/api/all/:pw"
//send grid config
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);   


 function eventIterator(eventsArray, currentUserDateTime) {
  if (eventsArray.length === 0 || undefined) {
    console.log("No event in database...Waiting for event to be added.");
  }
    for (let i = 0;  i < eventsArray.length; i++) {
      // [i] represents the current event of the current user.
      // iterates thru all events of induvidual user.
      // current date and time from time API.
      const year =  parseInt(currentUserDateTime.slice(0, 4)); 
      const month = parseInt(currentUserDateTime.slice(5, 7));
      const day =   parseInt(currentUserDateTime.slice(8, 10));
      const hour =  parseInt(currentUserDateTime.slice(11, 13));
      const minutes = parseInt(currentUserDateTime.slice(14, 16));
      //event message properties such as event name, message, sending time.
        // sendgrid (email sending API takes a msg obj).
        let html = `<img  src='${eventsArray[i].cardUrl}' /> <br /> <p>${eventsArray[i].text}<p/>`;
        let msg = {
          to: eventsArray[i].to,
          from: eventsArray[i].from ,
          subject: eventsArray[i].subject,
          html:  html,
        }
        // each event has sent status boolean.
          const sent = eventsArray[i].sent;
          //parsing both API current time and sending time 
          //removes leading zero so both time values must be parsed before comparing.
          const sendingHour = parseInt(eventsArray[i].sendingHour);
          const sendingMinutes = parseInt(eventsArray[i].sendingMinutes);
          const sendingYear = parseInt(eventsArray[i].year);
          const sendingMonth = parseInt(eventsArray[i].month);
          const sendingDay = parseInt(eventsArray[i].day);
          
          //email sending
          const sendingLogic = (
            sent === false  &&
            sendingYear === year &&
            sendingMonth === month &&
            sendingDay === day &&
            sendingHour === hour &&
            sendingMinutes === minutes
            );


          if (sendingLogic) {
            const eventId = eventsArray[i]._id;
            axios.get(`${updateSentStatus}/${eventId}`)
            .then(res => {
              if (res.status === 200){
                console.log(`status: 200 means okay.`);
                console.log(`sending ${eventsArray[i].event}`);
                sendGridMail.send(msg);
              }
            })
            .catch(err =>console.log(err));
    }
    console.log(`Checking Event named:  ${eventsArray[i].event}`);


       
  }}


//sends email when date time matches
async function  EmailSender  () {
  await axios.get(userDataApi)
  .then(res =>res.data)
  .then(userData => {
    let totalUserLength = userData.length;
    //iterating all users and get their timezone.
     for (let i = 0; i < totalUserLength; i++) { 
        // userzone is an array of objects containing timeZone of the user at 0 index.
          //currentUserTimze for date and time checking is stored in var.
          // [i] represents the current user so we can use that to obtain all the needed information.
          if (userData[i].userZone.length !== 0) {
          let currentUserTimeZone = userData[i].userZone[0].timeZone;
          // fetching all users time according to their time zones.
           axios.get(`${timeApiUri}?key=${fetchKey}&format=json&by=zone&zone=${currentUserTimeZone}`)
          .then(res =>  res.data.formatted)
          .then(timeAndDate => {
                  userEventLength = userData[i].events.length;
                  //current event iterator.
                   eventIterator(userData[i].events, timeAndDate);
                   
            
          })
          .catch(err => console.log(err));      
    }
  }
  }).catch(err => console.log(err));
}

module.exports = EmailSender;
