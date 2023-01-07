const fs = require('fs');
const Discord = require('discord.js')
const { prefix, token } = require('./config.json');


const { Client, GatewayIntentBits, Partials  } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const botId = "1059451207862730873"

// Setup the commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
exports.commandFiles = commandFiles;
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('!edt');
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.id === botId) return;

	const channel = client.channels.cache.get(reaction.message.channel.id);
	if (channel.name !== "accueil") return;
	
	if (reaction.partial) {
		try {
			await reaction.fetch();

			let roleToUpdate = parseSummarryArray(reaction.message.content);
			let number = parseEmoji(reaction._emoji.name);
			
			if (roleToUpdate === "OPTIONS") {
				roleToUpdate = parseOptions(number, roleToUpdate);
				number = -1;
			}
			
			const server = reaction.message.guild;
			const guildMember = reaction.message.guild.members.cache.get(user.id);
			const finalRole = number > 0 ? `${roleToUpdate} ${number}` : `${roleToUpdate}`;

			guildMember.roles.add(server.roles.cache.find(role => role.name === finalRole))
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	} else {
		let roleToUpdate = parseSummarryArray(reaction.message.content);
		let number = parseEmoji(reaction._emoji.name);

		if (roleToUpdate === "OPTIONS") {
			roleToUpdate = parseOptions(number, roleToUpdate);
			number = -1;
		}

		const server = reaction.message.guild;
		const guildMember = reaction.message.guild.members.cache.get(user.id);
		const finalRole = number > 0 ? `${roleToUpdate} ${number}` : `${roleToUpdate}`;
		guildMember.roles.add(server.roles.cache.find(role => role.name === finalRole))
	}
  });

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.id === botId) return;
	const channel = client.channels.cache.get(reaction.message.channel.id);
	if (channel.name !== "accueil") return;

	if (reaction.partial) {
		
		try {
			await reaction.fetch();

			let roleToUpdate = parseSummarryArray(reaction.message.content);
			let number = parseEmoji(reaction._emoji.name);
			
			if (roleToUpdate === "OPTIONS") {
				roleToUpdate = parseOptions(number, roleToUpdate);
				number = -1;
			}
			
			const server = reaction.message.guild;
			const guildMember = reaction.message.guild.members.cache.get(user.id);
			guildMember.roles.remove(server.roles.cache.find(role => role.name === `${number > 0 ? `${roleToUpdate} ${number}` : `${roleToUpdate}`}`))
				.catch(err => console.error(err))

		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	} else {
		let roleToUpdate = parseSummarryArray(reaction.message.content);
		let number = parseEmoji(reaction._emoji.name);
			
		if (roleToUpdate === "OPTIONS") {
			roleToUpdate = parseOptions(number);
			number = -1;
		}

		const server = reaction.message.guild;
		const guildMember = reaction.message.guild.members.cache.get(user.id);
		const finalRole = number > 0 ? `${roleToUpdate} ${number}` : `${roleToUpdate}`;
		guildMember.roles.remove(server.roles.cache.find(role => role.name === finalRole))
			.catch(err => console.error(err))
	}
});
  
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.channelId !== "1060022452782104586") return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.channel.send('error : something has gone terribly wrong');
	}
}); 

client.login(token);

function parseOptions(number) {
	let roleToUpdate;
	switch (number) {
		case 1:
			roleToUpdate = "BIOINFO";
			break;
		case 2:
			roleToUpdate = "ICHP";
			break;
		case 3:
			roleToUpdate = "II2D";
			break;
		case 4:
			roleToUpdate = "ML";
			break;
		case 5:
			roleToUpdate = "META";
			break;
		case 6:
			roleToUpdate = "PDM";
			break;
	}
	return roleToUpdate;
}

/**
 * 
 * @param {*} string String to parse, example : "Obligatoire 3"
 * return string, example "Obligatoire"
 */
function parseSummarryArray(string) {
    return string.match(/\b\w+\b/)?.toString() ?? "";
}

function parseEmoji(emoji) {
	switch (emoji) {
		case "1️⃣":
			return 1;
		case "2️⃣":
			return 2;
		case "3️⃣":
			return 3;
		case "4️⃣":
			return 4;
		case "5️⃣":
			return 5
		case "6️⃣":
			return 6
		default:
			return undefined;
	}
}
