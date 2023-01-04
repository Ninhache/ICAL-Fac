const ical = require('ical');
const fs = require('fs');

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const icss = fs.readdirSync('icals/');
icss.forEach(dir => printFromIcsToday(dir))



fs.readFile(`personal-2023-01-02.ics`, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    // Parser le fichier
    const events = ical.parseICS(data);
    
    const todayEvents = [];
    for (let element in events) {
        if (events[element]?.type == 'VEVENT') {
            if (sameDay(new Date(events[element]?.start) , tomorrow)) {

                // Check date constraint to know if a date is in the rules
                // https://www.kanzaki.com/docs/ical/dtstart.html
                const constraintMax = new Date(events[element]?.rrule?.options?.until);
                const constraintMin = new Date(events[element]?.rrule?.options?.dtstart);
                const start = events[element]?.start;
                const isInRange = dates.inRange(start, constraintMin, constraintMax);
                
                // Check if the date is part of exceptions date
                // https://www.kanzaki.com/docs/ical/exdate.html
                const exDate = events[element]?.exdate;
                let notAnEx = true;
                if (exDate) {
                    const array = Object.entries(exDate);
                    //console.log(array.length) array[0][i]
                    
                    for (let i = 0 ; i < array.length ; i++) {
                        for (let y = 0 ; y < array[i].length ; y++) {
                            if (sameDay(start,new Date(array[i][y]))) {
                                notAnEx = false;
                                break;
                            }
                        }
                    }
                }
                
                if (isInRange && !notAnEx) {
                    todayEvents.push(element)
                }
            }
        }
    }

    // Tous les events du jour
    
    todayEvents.forEach(event => {
        const start = new Date(events[event].start);
        //console.log(events[event]?.exdate)
        console.log(`Il y a cours le ${start.getDate()}/${pad(start.getMonth().valueOf() + 1, 2)} a ${start.getHours()}h, pour ${events[event].summary}`)
    })
});



function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
}

function getNextDayOfWeek(date, dayOfWeek) {
    var resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

const dates = {
    convert:function(d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year,d.month,d.date) :
            NaN
        );
    },
    compare:function(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=this.convert(a).valueOf()) &&
            isFinite(b=this.convert(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    },
    inRange:function(d,start,end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
       return (
            isFinite(d=this.convert(d).valueOf()) &&
            isFinite(start=this.convert(start).valueOf()) &&
            isFinite(end=this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
}