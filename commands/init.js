const { channel } = require("diagnostics_channel");
const { createChannel, ChannelType } = require("discord.js");

module.exports = {
    name: 'init',
	description: 'Init the server by creating all the needed roles and setting up everything correctly',
	execute(message, args) {
        if (message.author.id !==  "236834751325929472") return;
        message.reply("I've heard your request..");
        createAllRoles(message);

        // create channel
        createWelcomeChannel(message)

        // create message + ajouter reaction? boutton ??
        setTimeout(() => {
          fillWelcomeChannel(message);
        }, 3000)

    }
}

/*
6 | Obligatoire : 
3 | Archi : 
4 | PDS : 
5 | JSFS : 
5 | GL :
4 | LAAS :
3 | Logique :

-1| Option :

*/
function createAllRoles(message) {
    // if () {
    
    // Obligatoire
    for (let i = 0 ; i < 6 ; i++) {
      createRole(message, `Obligatoire ${i + 1}`);
    }
    
    // Archi
    for (let i = 0 ; i < 3 ; i++) {
      createRole(message, `Archi ${i + 1}`);
    }
    
    // PDS
    for (let i = 0 ; i < 4 ; i++) {
      createRole(message, `PDS ${i + 1}`);
    }
    
    // JSFS
    for (let i = 0 ; i < 5 ; i++) {
      createRole(message, `JSFS ${i + 1}`);
    }
    
    // GL
    for (let i = 0 ; i < 5 ; i++) {
      createRole(message, `GL ${i + 1}`);
    }
    
    // LAAS
    for (let i = 0 ; i < 4 ; i++) {
      createRole(message, `LAAS ${i + 1}`);
    }
    
    // Logique
    for (let i = 0 ; i < 3 ; i++) {
      createRole(message, `Logique ${i + 1}`);
    }

    createRole(message, 'BIOINFO'); // 
    createRole(message, 'ICHP'); // Calcul haute performance per
    createRole(message, 'II2D'); // Image et interaction 2D 
    createRole(message, 'MAL'); // Machine Learning 
    createRole(message, 'META'); 
    createRole(message, 'PDM'); // Prog Machine
}

function createRole(message, name) {
  if (message.guild.roles.cache.find(role => role.name === name)) return;

  message.guild.roles.create({
    name, 
    data: {
      color: 'BLUE',
    },
    reason: 'Create role to make bot usable.',
  });
}

function createWelcomeChannel(message) {
  if (message.guild.channels.cache.find(channel => channel.name === "accueil")) return true;

  message.guild.channels.create({
    name: 'Accueil',
    type: ChannelType.GuildText, // The type of channel, either 'text' or 'voice'
    permissionOverwrites: [], // An array of permission overwrites for the channel
    position: 0, // The position of the channel in the channel list
  });

}

function fillWelcomeChannel(message) {
  // should never be undefined or null
  const channel = message.guild.channels.cache.find(channel => channel.name === "accueil");

  channel.send("Bienvenue !\nPour utiliser ce serveur et le bot qui lui est associé, il suffit de mettre une réaction à votre groupe, celui-ci se trouve au lien suivant : \nhttps://www.fil.univ-lille.fr/~roos/l3info/groupes/etudiants.pdf\n\nSi il y a un quelconque soucis, n'hésitez pas à harceler <@236834751325929472> en DM !\n")

  channel.send("Obligatoire (Projet/Reseau/Tec/...)")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
      message.react("4️⃣")
      message.react("5️⃣")
      message.react("6️⃣")
    })

    channel.send("JSFS")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
      message.react("4️⃣")
      message.react("5️⃣")
    })

  channel.send("GL")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
      message.react("4️⃣")
      message.react("5️⃣")
    })
  
  channel.send("Archi")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
    })

  channel.send("PDS")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
      message.react("4️⃣")
    })

  
    
  channel.send("LAAS")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
      message.react("4️⃣")
    });

  channel.send("Logique")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
    })
    
  channel.send("OPTIONS : \n*1 : BIOINFO | 2 : ICHP | 3 : II2D | 4 : MAL | 5 : META | 6 : PDM*")
    .then(message => {
      message.react("1️⃣")
      message.react("2️⃣")
      message.react("3️⃣")
      message.react("4️⃣")
      message.react("5️⃣")
      message.react("6️⃣")
    })

    channel.send("Ensuite, quand vos groupes seront cochés, il vous suffira de vous rendre dans #edt et d'y tester les commandes suivantes :\n__**Listes des commandes :**__\n`!edt` : Donne l'emploi du temps du jour\n`!edt demain` : Donne l'emploi du temps de demain\n`!edt <jour de la semaine>` : Donne l'emploi du temps du jour de la semaine en question")
}

