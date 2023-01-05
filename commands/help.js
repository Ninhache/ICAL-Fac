const Discord = require('discord.js');
const { commandFiles } = require('../main');

module.exports = {
	name: 'help',
	description: 'Display this message',
    example: '!help',
	execute(message) {
        const allCommands = []
		for (const file of commandFiles) {
            const command = require(`./${file}`);
            allCommands.push(command)
        }
		
        const response = {
            color: 0x36405e,
            title: `Help`,
            url: 'https://github.com/Ninhache/ICAL-Fac',
            author: {
                name: 'BotEDT',
                icon_url: 'https://cdn.discordapp.com/avatars/1059451207862730873/5eed643806501c1c02b03b74fb6fcd43.png?size=256',
                url: 'https://github.com/Ninhache/ICAL-Fac',
            },
            fields: [],
            footer: {
                text: `Developed by Ninhache`,
                icon_url: `https://cdn.discordapp.com/avatars/236834751325929472/6e6bc33bb4ace795331602f627249701.png`,
            },
        } 

        for (let command in allCommands) {
            console.log("===")
            console.log(command)
            response.fields.push({
                name: `${allCommands[command].example}`,
                value: `${allCommands[command].description}`
            });
        }
        console.log(allCommands)
        message.channel.send({ embeds: [response] });
	},
};