#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "rl",
	aliases: null,
	description: `kb rl [input] - random line from current chat, use input to get random line from a 
	specified user, no input will return a random quote -- cooldown 2s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {

			const checkChannel = await custom.doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel, 
				therefore I can't display data for this command :/`;
			}

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2);

			const serverDate = new Date().getTime();

			if (!msg[0]) {
				const maxID = await custom.doQuery(
					'SELECT MAX(ID) AS number FROM logs_' + channel.replace('#', '')
					);

				// get random ID from the range of ID's in database
				const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;
				const randomLine = await custom.doQuery(`SELECT ID, username, message, date FROM 
					logs_${channel.replace('#', '')} WHERE ID="${randNum}"`);
				if (!randomLine[0]) {
					return user['username'] + ", I don't have any logs from this channel :z";
				}

				function modifyOutput(modify) {
					if (!modify) {
						return ` ago) ${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
						${randomLine[0].message.substr(0, 350)}`;
					} else {
						return ` ago) ${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
						${randomLine[0].message.substr(0, modify)}`;
					}
				}

				const timeDifference = (Math.abs(serverDate - 
					(new Date(randomLine[0].date).getTime())))/1000/3600;
				const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine[0].date).getTime())));

				// check for banphrases...
				if (await custom.banphrasePass(randomLine[0].message).banned === true) {
					if (channel==="#nymn") {
						if (timeDifference>48) {
							kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' +
							 modifyOutput());
						} else {
							kb.whisper(user['username'], '(' + custom.formatUptime(timeDifferenceRaw/1000) + 
								modifyOutput());
						}
						return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
					}
					
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();	
					}
					return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput();
				}

				// check for channels
				if (channel === "#nymn") {
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(130);
					}
					return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput(130);
				}

				// other channels
				if (timeDifference>48) {
					return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
				}
				return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput();
				
			} else if (typeof msg[0] !== 'undefined' && msg[0] != '') {

				// check if user exists in the database
				const checkIfUserExists = await custom.doQuery(`SELECT * FROM user_list WHERE username="${msg[0]}"`);
				if (checkIfUserExists.length === 0) {
					return `${user['username']}, this user does not exist in my user list logs.`;
				}

				const randomLine = await custom.doQuery(`
					SELECT t.*
					FROM logs_${channel.replace('#', '')} AS t
					INNER JOIN
					    (SELECT ROUND(
					       RAND() * 
					      (SELECT MAX(ID) FROM logs_${channel.replace('#', '')} )) AS id
					     ) AS x
					WHERE
					    t.id >= x.id AND username="${msg[0]}"
					LIMIT 1;
					`)

				if (randomLine.length === 0) {
					return user['username'] + ', there are no logs in my database related to that user.';
				}
				const timeDifference = (Math.abs(serverDate - 
					(new Date(randomLine[0].date).getTime())))/1000/3600;
				const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine[0].date).getTime())));

				function modifyOutput(modify) {
					if (!modify) {
						return ' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' + 
						randomLine[0].message.substr(0, 350);
					} else {
						return ' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' + 
						randomLine[0].message.substr(0, modify);
					}
				}
				// check for banphrases...
				if (await custom.banphrasePass(randomLine[0].message).banned === true) {
					if (channel==="#nymn") {
						if (timeDifference>48) {
							kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' + 
								modifyOutput());
						} else {
							kb.whisper(user['username'], '(' + custom.formatUptime(timeDifferenceRaw/1000) + 
								modifyOutput());
						}
						return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
					}

					// other channels
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
					}
					return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput();
				}

				// check for channels
				if (channel === "#nymn") {
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(130);	
					}
					return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput(130);
				}

				// other channels
				if (timeDifference>48) {
					return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
				} 
				return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput();
			} 
		} catch (err) {
			custom.errorLog(err)
			return user['username'] + ' ' + err + ' FeelsDankMan !!!';
		}
	}
}