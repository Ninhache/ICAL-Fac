const RRule = require('rrule').RRule;
const ical = require('node-ical');
const Discord = require('discord.js');
const fs = require('fs');


module.exports = {
    name: 'edt',
	description: 'Show the student\'s timetable',
	execute(message, args) {
        let date = parseArgs(args);

        const user = message.author;
        const tmpMember = message.guild?.members.cache.get(user.id)
        const roles = [];
        tmpMember?._roles.forEach(element => {
            roles.push(message.guild.roles.cache.get(`${element}`).name)
        });
        
        printFromIcsToday(message, "Zeb93oMMBLj9s2Fx-2023-01-05.ics", date, roles);
    }
}

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

/**
 * 
 * @param {*} name All the ics
 * @param {*} targetDate The date (if not provided should be today)
 * @param {*} roles Roles name, like ['Obligatoire 2', 'LAAS 3', ...]
 */
function printFromIcsToday(message, name, targetDate, dirtyRoles) {
    const roles = cleanRoles(dirtyRoles);

    (async () => {

        ical.parseFile(`icals/${name}`, (err, data) => {
            if (err) {
                console.error(err)
            }
            let filteredEvents = [];
            for (const k in data) {
                if (data.hasOwnProperty(k)) {
                    const event = data[k];
                    
                    if (event.type !== "VEVENT") continue;
                    if (!event.summary) continue;
                    
                    let dates = [];

                    // Si y'a des règles, on récupère toutes les dates associés à celles-ci
                    if (event.rrule) {
                        dates.push(...cleanDateArray(generateDates(event.rrule)))
                    } else {
                        dates.push(event.start);
                    }

                    // On recup que les dates qui nous interesse
                    dates = dates.filter(date => sameDay(date, targetDate));
                    
                    // si y'a une date qui nous interesse (normalement qu'une par tableau)
                    if (dates.length > 0) {
                        const date = dates[0];
                        // On vérifie que la date ne fait pas partie d'une exception (event.exDate)
                        if (event.exdate) {
                            console.log(event.summary)
                            const array = Object.entries(event.exdate);
                            if (array) {
                                let valid = true;
                                for (let i = 0 ; i < array.length ; i++) {
                                    if (sameDay(new Date(array[i][1]), new Date(date))) {
                                        valid = false;
                                    }
                                }

                                if (valid) {
                                    filteredEvents.push({date, event})
                                }
                            } else {
                                filteredEvents.push({date, event})
                            }
                        } else {
                            filteredEvents.push({date, event})
                        }
                        
                    } 
                }
            }

            // Filtre en fonction du rôle, si les rôles passés en paramètre est adéquat
            filteredEvents = filteredEvents.filter(obj => {
                const { event } = obj;

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
                return roles.find(role => `${parseSummarryArray(role).toString()} ${parseSummaryInteger(role).toString()}` === `${matiere} ${nGroup}`);
            })

            
            // On sort pour avoir les cours dans le bon ordre
            filteredEvents.sort((a,b) => a.date - b.date);

            // On map pour avoir les données interessantes
            filteredEvents = filteredEvents.map(obj => {
                const { date, event } = obj;

                const type = parseSummarryArray(event.summary).toString();
                const matiere = parseSummaryString(event.summary).toString();
                const nGroup = parseInt(parseSummaryInteger(event.summary).toString(), 10);

                let start = new Date(event.start);
                let end = new Date(event.end);

                // NEED VPS IS NOT IN FRANCE
                const options = { timeZone: 'Europe/Paris' };
                start = new Date(start.toLocaleString('fr-FR', options));
                end = new Date(end.toLocaleString('fr-FR', options));
                
                return {
                    type: `${type} ${matiere} ${nGroup || ""}`,
                    location: `${event.location}`,
                    time: `${start.getHours()}h${pad(start.getMinutes(), 2)} -> ${end.getHours()}h${pad(end.getMinutes(),2)}`
                }
            });

            // filteredEvents.forEach(e => console.log("confirmée:", e.type))
            
            sendEmbed(message, targetDate, filteredEvents)
        });

    })();
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

// useless
function printEvent(event) {
    const start = new Date(event.start);
    console.log(`Le ${start.getDate()}/${pad(start.getMonth().valueOf() + 1, 2)}, tu as ${event.summary}, de ${start.getHours()}h jusque ${new Date(event.end).getHours()}h, en ${event.location}`);
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
            const integer = parseSummaryInteger(role);
            result.push(`TEC ${integer}`);
            result.push(`RSX ${integer}`);
            result.push(`RSX2 ${integer}`);
            result.push(`Projet ${integer}`);
        } else {
            result.push(role)
        }
    })

    return result;
}

function sendEmbed(message, targetDate, filteredEvents) {
    const channel = message.channel;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    

    const response = {
        color: 0x36405e,
        title: `${targetDate.toLocaleDateString('fr-FR', options)}`,
        fields: [],
        footer: {
            text: `Requested by @${message.author.username}`,
            icon_url: `${message.author.avatarURL()}`,
        },
    } 


    if (filteredEvents.length === 0) {
        response.color = 0xff0000;
        response.fields.push({
            name: `Aucun cours !`,
            value: 'Amuse toi bien chanceux.'
        });
    } else {
        for (let event in filteredEvents) {
            response.fields.push({
                name: `${filteredEvents[event].type}\n${filteredEvents[event].location}`,
                value: `${filteredEvents[event].time}`,
            });
        }
    }

    

    channel.send({ embeds: [response] });
}

function parseArgs (args) {
    let date;
    if (args[0]) {      
        const arg = args[0].toLowerCase();

        switch (arg) {
            case 'demain':
                date = new Date();
                date.setDate(date.getDate() + 1);
                break;
            case 'lundi':
                date = getNextDayOfWeek(new Date(), 1);
                break;
            case 'mardi':
                date = getNextDayOfWeek(new Date(), 2);
                break;
            case 'mercredi':
                date = getNextDayOfWeek(new Date(), 3);
                break;
            case 'jeudi':
                date = getNextDayOfWeek(new Date(), 4);
                break;
            case 'vendredi':
                date = getNextDayOfWeek(new Date(), 5);
                break;
            case 'samedi':
                date = getNextDayOfWeek(new Date(), 6);
                break;
            case 'dimanche':
                date = getNextDayOfWeek(new Date(), 7);
                break;
        }
    }
    
    return date ?? new Date();
}

function getNextDayOfWeek(date, dayOfWeek) {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

function cleanDateArray(dates) {
    return dates.filter(date => !isNaN(date));
}
  
/**
 * Permet de générer toutes les dates en fonction des règles de création d'évènements
 * @param {*} rrule 
 * @returns 
 */
function generateDates(rrule) {
    return new RRule(rrule.options).all();
}