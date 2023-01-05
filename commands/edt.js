const RRule = require('rrule').RRule;
const ical = require('node-ical');

module.exports = {
    name: 'edt',
	description: 'Gives you your schedule, based on the roles you checked in <#1060032834749857852>',
    example: '!edt [demain \| lundi \| mardi \| ...]',
	execute(message, args) {
        const date = parseArgs(args);
        const roles = getRolesFromAuthor(message)
        
        // "Zeb93oMMBLj9s2Fx-2023-01-05.ics" is an ICS with all the data, on future, gonna refresh it every hours
        printFromIcsToday(message, "Zeb93oMMBLj9s2Fx-2023-01-05.ics", date, roles);
    }
}

/**
 * Get all roles from the message author
 * 
 * @param {*} message 
 * @returns 
 */
function getRolesFromAuthor(message) {
    const roles = [];
    const user = message.author;
    const tmpMember = message.guild?.members.cache.get(user.id)

    tmpMember?._roles.forEach(element => {
        roles.push(message.guild.roles.cache.get(`${element}`).name)
    });

    return roles;
}

/**
 * Parse Ical > Filter Events > Send to Discord
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

                    // Checking for rrules to get all the dates
                    if (event.rrule) {
                        dates.push(...cleanDateArray(generateDates(event.rrule)))
                    } else {
                        dates.push(event.start);
                    }

                    // Filtering all the date to keep only if date are of the same day
                    dates = dates.filter(date => sameDay(date, targetDate));
                    
                    // Should be 0 or 1 here
                    if (dates.length > 0) {
                        const date = dates[0];
                        // Checking if event have exDate
                        if (event.exdate) {
                            console.log(event.summary)
                            const array = Object.entries(event.exdate);
                            if (array) {
                                let valid = true;

                                // Checking for every exDate if they're the same as the current date, if it is, the date won't be add to the events to send to discord
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

            // Filter roles accroding to the roles of the user
            filteredEvents = filteredEvents.filter(obj => {
                const { event } = obj;

                const type = parseSummarryArray(event.summary).toString();
                const matiere = parseSummaryString(event.summary).toString();

                // If it's "Cours", that's means it's for everyone who got the class subject, means we don't care about the group
                if (type === "Cours") {
                    // On vérifie qu'on a la matière
                    if (roles.find(role => parseSummarryArray(role).toString() === matiere)) {
                        return true;
                    } else {
                        return false;
                    }
                }
    
                // If's its an option, we add it, because everyone got options
                if (type !== "TD" && type !== "TP" && type !== "Cours") {
                    return true;
                }
    
                // Else, we're checking the roles, if Matiere === "LAAS" and nGroup === 1, we're checking if the user have the role "LAAS 1"
                const nGroup = parseInt(parseSummaryInteger(event.summary).toString(), 10)
                return roles.find(role => `${parseSummarryArray(role).toString()} ${parseSummaryInteger(role).toString()}` === `${matiere} ${nGroup}`);
            })

            
            // Sorting event to have the lessons on the right orders
            filteredEvents.sort((a,b) => a.date - b.date);

            // Refactoring the data
            filteredEvents = filteredEvents.map(obj => {
                const { event } = obj;

                const type = parseSummarryArray(event.summary).toString();
                const matiere = parseSummaryString(event.summary).toString();
                const nGroup = parseInt(parseSummaryInteger(event.summary).toString(), 10);

                let start = new Date(event.start);
                let end = new Date(event.end);

                // Force that to get the right timezone, according to where the lessons takes place
                const options = { timeZone: 'Europe/Paris' };
                start = new Date(start.toLocaleString('fr-FR', options));
                end = new Date(end.toLocaleString('fr-FR', options));
                
                return {
                    type: `${type} ${matiere} ${nGroup || ""}`,
                    location: `${event.location}`,
                    time: `${start.getHours()}h${pad(start.getMinutes(), 2)} -> ${end.getHours()}h${pad(end.getMinutes(),2)}`
                }
            });

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

/**
 * Check if two dates are the same
 * 
 * @param {*} d1 
 * @param {*} d2 
 * @returns 
 */
function sameDay(d1, d2) {
    return  d1?.getFullYear() === d2?.getFullYear() &&
            d1?.getMonth() === d2?.getMonth() &&
            d1?.getDate() === d2?.getDate();
}

/**
 * Transform 1 into 01 if you give (1, 2) as parameters
 * 
 * @param {*} num 
 * @param {*} size 
 * @returns 
 */
function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

/**
 * Change the array in parameters, to change "Obligatoire" to the "right roles" (The same on the timetable)
 * 
 * @param {*} dirtyRoles 
 * @returns 
 */
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

/**
 * Send the embed message to discord.
 * The date is passed as parameters
 * 
 * @param {*} message 
 * @param {*} targetDate 
 * @param {*} filteredEvents 
 */
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

/**
 * Parse current args, atm you've only to parse what the user want, and then here, you can ask for next day or a precise day
 * 
 * @param {*} args 
 * @returns a Date, by default it's today
 */
function parseArgs (args) {
    let date;
    if (args[0]) {      
        const arg = args[0].toLowerCase();
        
        // Close your eyes for this switch please
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

/**
 * Get the next day we'd asked, for example, if we're on Thursday and we ask for Wednesday, we will get the next Wednesday (the one in the next week)
 * 
 * @param {*} date 
 * @param {*} dayOfWeek @see parseArgs
 * @returns Date of the asked later
 */
function getNextDayOfWeek(date, dayOfWeek) {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

/**
 * Remove all invalid dates from the array passed as parameters
 * 
 * @param {*} dates 
 * @returns cleaned array
 */
function cleanDateArray(dates) {
    return dates.filter(date => !isNaN(date));
}
  
/**
 * Generates all dates for an event.RRule
 * 
 * @param {*} rrule 
 * @returns all dates of the rrule
 */
function generateDates(rrule) {
    return new RRule(rrule.options).all();
}