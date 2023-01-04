const ical = require('node-ical');
const fs = require('fs');

// Need 1 rang / 
/*
6 | Obligatoire : msLdRbYEYYgZQTZF-2023-01-02.ics
    > TEC
    > RSX
    > RSX2
    > Projet

3 | Archi : gB4PsiTT7p7wEByN-2023-01-02.ics
4 | PDS : fpq2rQ2qgDCzXFYW-2023-01-02.ics
5 | JSFS : XoskZbjeeT7YYc3d-2023-01-02.ics
5 | GL : deoCHgoogEJDzDq6-2023-01-02.ics
4 | LAAS : x55ExgaYbbBfD7WR-2023-01-02.ics
3 | Logique : NDD7KLrWS395Hofj-2023-01-02.ics

-1| Option : pGHaTgM6X5DofFNc-2023-01-02
    > 1er mot différent de TP/TD/Cours
*/


const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 2)

//const icss = fs.readdirSync('icals/');
//icss.forEach(dir => printFromIcsToday(dir, tomorrow, ["Obligatoire 3"]))
printFromIcsToday("personnel-2023-01-02.ics", tomorrow, ["Obligatoire 3", "LAAS 1", "MAL", "Logique"]);


// Lire le fichier ICS
// personnel-2023-01-02.ics
/**
 * 
 * @param {*} name All the ics
 * @param {*} targetDate The date (if not provided should be today)
 * @param {*} roles Roles name, like ['Obligatoire 2', 'LAAS 3', ...]
 */
function printFromIcsToday(name, targetDate, dirtyRoles) {

    const roles = cleanRoles(dirtyRoles);
    
    fs.readFile(`icals/${name}`, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
      
        // Parser le fichier
          ical.parseICS(data, (err, events) => {
              if (err) {
                  console.error(err);
                  return;
              }
      
              // Filtrer les événements pour n'inclure que ceux qui ont lieu à la date cible
              let filteredEvents = Object.values(events).filter(event => {
                  // Vérifier si la date de début de l'événement correspond à la date cible
                  return sameDay(event?.start, targetDate);
              });
      
              filteredEvents = filteredEvents.filter(event => {
                  // Check if the date is part of exceptions date
                  // https://www.kanzaki.com/docs/ical/exdate.html
                  const exDate = event.exdate;
                  if (exDate) {
                      const array = Object.entries(exDate);
                      //console.log(array.length) array[0][i]
                      let result = true;
                      for (let i = 0 ; i < array.length ; i++) {
                          for (let y = 0 ; y < array[i].length ; y++) {
                              if (sameDay(event.start,new Date(array[i][y]))) {
                                  result = false;
                              }
                          }
                      }
                      return result;
                  } else {
                      return true;
                  }
              })

              // On vérifie que l'event est bien existant
              filteredEvents = filteredEvents.filter(event => event.summary)

              // Filtre en fonction du rôle, si les rôles passés en paramètre est adéquat
              filteredEvents = filteredEvents.filter(event => {
                const type = parseSummarryArray(event.summary).toString();
                const matiere = parseSummaryString(event.summary).toString();
                // On vérifie si c'est un amphi
                if (type === "Cours") {
                    // On vérifie qu'on a la matière
                    if (roles.find(role => parseSummarryArray(role).toString() === matiere)) {
                        return true;
                    } else {
                        return false;
                    }
                }

                // On vérifie si c'est une option, genre II2D
                if (type !== "TD" && type !== "TP" && type !== "Cours") {
                    return true
                }

                const nGroup = parseInt(parseSummaryInteger(event.summary).toString(), 10)
                return roles.find(role => `${parseSummarryArray(role).toString()} ${parseSummaryInteger(role).toString()}`
                    === `${matiere} ${nGroup}`);
              })
      
              filteredEvents.sort((a, b) => {
                  return new Date(a.start) - new Date(b.start);
              });
      
              // Afficher le "summary" de chaque événement filtré
              filteredEvents.forEach(event => {
                  printEvent(event);
              });
          });
      });
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

function printEvent(event) {
    const start = new Date(event.start);
    console.log(`Le ${start.getDate()}/${pad(start.getMonth().valueOf() + 1, 2)}, tu as ${event.summary}, de ${start.getHours()}h jusque ${new Date(event.end).getHours()}h`);
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

function cleanRoles(dirtyRoles) {
    const result = [];

    dirtyRoles.forEach(role => {
        if (parseSummarryArray(role).toString() === "Obligatoire") {
            result.push(`TEC ${parseSummaryInteger(role)}`);
            result.push(`RSX ${parseSummaryInteger(role)}`);
            result.push(`RSX2 ${parseSummaryInteger(role)}`);
            result.push(`Projet ${parseSummaryInteger(role)}`);
        } else {
            result.push(role)
        }
    })

    return result;
}
