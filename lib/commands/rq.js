#!/usr/bin/env node
'use strict';

/* TODO:
 *	-refactor the code so its more universal
 * 	-make parameters pipeable not hardcoded
 */
const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + 'rq',
	aliases: null,
	description: `Your random quote from the current chat`,
	permission: 0,
	cooldown: 3000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			// check if user points to other channel
			let getChannel = msg.find(i=>i.startsWith('#'));

			if (typeof getChannel != 'undefined') {
				if (getChannel === '#supinic' || getChannel === "#haxk") {
					return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
				}

				// check if user exists in the database
				const checkChannel2 = await custom.doQuery(`SHOW TABLES LIKE "logs_${getChannel.replace('#', '')}"`)
				if (checkChannel2.length === 0) {
					return `${user['username']}, I'm not logging the channel you specified :/`;
				}

				const getRows = await custom.doQuery(`
                    SELECT @min := MIN(id) as min, @max := MAX(id) as max
                    FROM logs_${getChannel.replace('#', '')};
                    `);
                const randomResults = await custom.doQuery(`
                    SELECT a.*
                    FROM logs_${getChannel.replace('#', '')} a
                    JOIN ( SELECT id FROM
                        ( SELECT id
                            FROM ( SELECT ${getRows[0].min} + (${getRows[0].max} - ${getRows[0].min} + 1 - 50) * RAND()
                            AS start FROM DUAL ) AS init
                            JOIN logs_${getChannel.replace('#', '')} y
                            WHERE    y.id > init.start AND username="${user['username']}"
                            ORDER BY y.id
                            LIMIT 50
                        ) z ORDER BY RAND()
                        LIMIT 50
                    ) r ON a.id = r.id;
                    `);

                const randomRow = custom.random(randomResults);
                const randomLine = [];
                randomLine.push(randomRow);

				if (randomLine.length === 0) {
					return `${user['username']}, I don't have any logs from this channel related to you :z`;
				}

				const modifyOutput = (modify) => {
					return `${randomLine[0].username}: ${randomLine[0].message.substr(0, modify)}`;
				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

				getChannel = getChannel.replace(/^(.{2})/, "$1\u{E0000}");

                if (channel === "#forsen") {
                    return (timeDifference>172800) ?
                    `${getChannel} (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(93).length>93 ? modifyOutput(93) + '(...)' : modifyOutput(93)}` :
                    `${getChannel} (${custom.format(timeDifference)} ago) ${modifyOutput(93).length>93 ? modifyOutput(93) + '(...)' : modifyOutput(93)}`;
                }

				return (timeDifference>172800) ?
				`${getChannel} (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` :
				`${getChannel} (${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;
			}

			const checkChannel = await custom.doQuery(`
				SHOW TABLES LIKE "logs_${channel.replace('#', '')}"
				`);
			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel, therefore I can't display
				data for this command :/`;
			}

			const getRows = await custom.doQuery(`
                SELECT @min := MIN(id) as min, @max := MAX(id) as max
                FROM logs_${channel.replace('#', '')};
                `);
            const randomResults = await custom.doQuery(`
                SELECT a.*
                FROM logs_${channel.replace('#', '')} a
                JOIN ( SELECT id FROM
                    ( SELECT id
                        FROM ( SELECT ${getRows[0].min} + (${getRows[0].max} - ${getRows[0].min} + 1 - 50) * RAND()
                        AS start FROM DUAL ) AS init
                        JOIN logs_${channel.replace('#', '')} y
                        WHERE    y.id > init.start AND username="${user['username']}"
                        ORDER BY y.id
                        LIMIT 50
                    ) z ORDER BY RAND()
                    LIMIT 50
                ) r ON a.id = r.id;
                `);

            const randomRow = custom.random(randomResults);
            const randomLine = [];
            randomLine.push(randomRow);

			if (randomLine.length === 0) {
				return `${user['username']}, I don't have any logs from this channel :z`;
			}

			const modifyOutput = (modify) => {
				return `${randomLine[0].username}: ${randomLine[0].message.substr(0, modify)}`;
			}

			const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

            if (channel === "#forsen") {
                return (timeDifference>172800) ?
                ` (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(93).length>93 ? modifyOutput(93) + '(...)' : modifyOutput(93)}` :
                `(${custom.format(timeDifference)} ago) ${modifyOutput(93).length>93 ? modifyOutput(93) + '(...)' : modifyOutput(93)}`;
            }

 			return (timeDifference>172800) ?
			` (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` :
			`(${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;

		} catch (err) {
			custom.errorLog(err)
			return ``;
		}
	}
}
