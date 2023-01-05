const RRule = require('rrule').RRule;
const ical = require('node-ical');

printFromIcsToday(null, "personnel-2023-01-02.ics", new Date(2023, 0, 5));

/*
PROJET 3
PROJET 4
PROJET 2
GL 5
PDS
*/

function printFromIcsToday(message, name, targetDate) {
  (async () => {
      
      ical.parseFile(`icals/${name}`, (err, data) => {
        let filteredEvents = [];
        for (const k in data) {
          if (data.hasOwnProperty(k)) {
            const event = data[k];
            if (event.type !== "VEVENT") continue;
            if (!event.summary) continue;

            let dates = [];
            if (event.rrule) {
              dates.push(...cleanDateArray(generateDates(event.rrule)))
            } else {
              dates.push(event.start);
            }

            // On recup que les dates qui nous interesse
            dates = dates.filter(date => sameDay(date, targetDate));
            
            // si y'a une date qui nous interesse (normalement qu'une par tableau)
            if (dates.length > 0) {
              const date = new Date(dates[0]);
              let exDate = event.exdate;
              if (exDate) {
                exDate = new Date(exDate);
                
                // Date valide ?
                if (!isNaN()) {
                  // La date est valide et n'est pas le même jour que dates[0]
                  if (!sameDay(exDate, date)) {
                    
                    filteredEvents.push({date, event})
                  }
                }
              } else {
                filteredEvents.push({date, event})
              }
            }
          }
        }
        filteredEvents.sort((a,b) => a.date - b.date);

        filteredEvents = filteredEvents.map(obj => {
          const { event } = obj;

          const type = parseSummarryArray(event.summary).toString();
          const matiere = parseSummaryString(event.summary).toString();
          const nGroup = parseInt(parseSummaryInteger(event.summary).toString(), 10);

          let start = new Date(event.start);
          let end = new Date(event.end);

          const options = { timeZone: 'Europe/Paris' };
          start = new Date(start.toLocaleString('fr-FR', options));
          end = new Date(end.toLocaleString('fr-FR', options));
          
          return {
              type: `${type} ${matiere} ${nGroup || ""}`,
              location: `${event.location}`,
              time: `${start.getHours()}h${pad(start.getMinutes(), 2)} -> ${end.getHours()}h${pad(end.getMinutes(),2)}`
          }
      });
        console.log(filteredEvents)
        // sendEmbed(message, targetDate, filteredEvents);
      });

  })();
}

/**
 * Permet de générer toutes les dates en fonction des règles de création d'évènements
 * @param {*} rrule 
 * @returns 
 */
function generateDates(rrule) {
    return new RRule(rrule.options).all();
}

function cleanDateArray(dates) {
  return dates.filter(date => !isNaN(date));
}


function sameDay(d1, d2) {
  return  d1?.getFullYear() === d2?.getFullYear() &&
          d1?.getMonth() === d2?.getMonth() &&
          d1?.getDate() === d2?.getDate();
}

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

/**
 * Return parsed Integer, first integer found
 * 
 * @param summary String to parse, example : "TD LAAS 1 - M2..."
 * return integer, example : 1
 */
function parseSummaryInteger(summary) {
  return summary.match(/\b\d+\b/)?.toString() ?? "";
}

/**
* Return parsed String, the second word found
* @param summary String to parse, example : "TD Logique 3 - M1 .."
* return string, example : "Logique"
*/
function parseSummaryString(summary) {
  return summary.match(/(?<=\b\w+\s)\b\w+\b/)?.toString() ?? "";
}

/**
* 
* @param {*} string String to parse, example : "Obligatoire 3"
* return string, example "Obligatoire"
*/
function parseSummarryArray(string) {
  return string.match(/\b\w+\b/)?.toString() ?? "";
}