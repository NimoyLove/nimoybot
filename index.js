// new checkout run: npm install
// update/check dependancies: npm-check-updates

// TASKS FOR BOT 
/*
 * Listen/respond to certain phrases
 * Auto-assign roles
 * Allow a user to create a group voice/text channel
   - Creator has voice/text channel rights
   - Creator can "open" or "close" it to others
   - Players and request access to "closed" group
/*/


const Discord = require("discord.js");
const fs = require('fs');
// const sqlite3 = require('sqlite3').verbose();
const Sequelize = require('sequelize');
const config = require('./config.json');
const spamlist = require('./spamlist.json');
const bot = new Discord.Client();
const greetinglist = config.greetinglist;

const sequelize = new Sequelize('discord', '', '', {
  host: 'localhost',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // SQLite only
  storage: './db/database.sqlite',
  // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
  operatorsAliases: false
});

/** Objects **/
const Guild = sequelize.define('guild', {
  id: { type: Sequelize.INTEGER, primaryKey: true },
  date_added: Sequelize.DATE,
  date_modified: Sequelize.DATE,
  date_deleted: Sequelize.DATE
});

let exemptlist =[];


function init(){
  exemptlist = config.owner_ids;
  exemptlist.push(bot.user.id);

  return true;
}

function utlStrMatch(str, arraylist){
  for (const arrayitem of arraylist) {
    if (str.match(arrayitem)) {
      return true;
    }
  }
  return false;
}

function isExempt(discord_id){
  //console.log(`Exemptlist: ${exemptlist}`);

  for (const exempt_id of exemptlist) {
    if (exempt_id == discord_id) return true;
  }
  return false;
}


function isSpam(msg) {
  //console.log(`Author: ${msg.author.id}, Bot: ${bot.user.id}`);
  
  if (isExempt(msg.author.id)) return false;
  return utlStrMatch(msg.content, spamlist);
}

function writeLogChannel(guild_id, msg){  // NEED TO GET GUILD_ID FROM OBJECT
  const logChannel = config.guild[guild_id]["log_channel"];

 if (!logChannel){
    console.log(`log_channel: ${logChannel} not available of missing`);
    return;
 }

 const logChannelWrite = bot.channels.get(logChannel);
  logChannelWrite.send(msg);
}

function setAllowedRole(msg, args){
  console.log(`${args[1]}`);
  return;
  if(utlStrMatch(args[1], arraylist)){

  }


  bot.addMemberToRole(msg.author, role, function (err) {
    if (err) {
      console.log(err);
    }
  })
}

function listenerHelp(msg){

}

function userGreet(member){

}


// Look for events

bot.on("ready", () => {
  if(init()) {
    console.log(`Ready to serve in ${bot.channels.size} channels on ${bot.guilds.size} servers, for a total of ${bot.users.size} users.`);
//    logChannel.send("I'm online!");
  }
  else console.log('Error during startup');
});

/** GUILD EVENTS **/

bot.on("guildCreate", (guild) => {
  Guild.sync({force: true}).then(() => {
    return Guild.create({
      guild_id: guild.id,
      date_added: guild.joinedTimestamp,
      date_modified: guild.joinedTimestamp
    })
  })

  console.log(`New Guild "${guild.name}" has joined at ${guild.joinedTimestamp}, ID: "${guild.id}"`);
  writeLogChannel(config.owner_guild_id, `New Guild "${guild.name}" has joined at ${guild.joinedTimestamp}, ID: "${guild.id}"`);
});

bot.on("guildDelete", (guild) => {
  /*
  Guild.sync({force: true}).then(() => {
    return Guild.create({
      guild_id: guild.id,
      date_deleted: new Date(),
      date_modified: guild.joinedTimestamp
    })
  })
  */
  console.log(`Guild deleted "${guild.name}", ID: "${guild.id}"`);
  writeLogChannel(config.owner_guild_id, `Guild deleted "${guild.name}", ID: "${guild.id}"`);
});

bot.on("guildMemberAdd", (member) => {
  console.log(`New User "${member.user.username}" has joined "${member.guild.name}"` );
  writeLogChannel(member.guild.id,`"${member.user.username}" has joined this server`);
});

bot.on("guildMemberRemove", (member) => {

  console.log(`"${member.user.username}" has left "${member.guild.name}"` );
  writeLogChannel(member.guild.id,`"${member.user.username}" has left this server`);
});

/** END GUILD EVENTS **/

bot.on("message", msg => {
  const prefix = config.prefix;

  //const messageCheck = msg.content.split(' ').slice(2).join(' ');
  if (isSpam(msg)) writeLogChannel(msg.guild.id,`${msg.author} said: "${msg.content}"` );

  // Exit and stop if it's not there

  if(!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(1).split(" ")


  if (args[0].startsWith("ping")) {
      msg.channel.send("pong!");
  }

  else if (args[0].startsWith("foo")) {
    msg.channel.send("bar!");
  }

  else if (msg.content.startsWith(prefix + "setRole")){
    setAllowedRole(msg, args);
  }
});

bot.on('error', e => { console.error(e); });
// these have not yet been re-added afaik
//bot.on('warn', e => { console.warn(e); });
// bot.on('debug', e => { console.info(e); });

bot.login(config.token);