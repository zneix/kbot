#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const bot = require('../handler.js')
const prefix = "kb ";
function sleepGlob(milliseconds) {
    const start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

module.exports = {
    name: prefix + "channels",
    aliases: prefix + "chn",
    description: `amount of channels the bot is currently in. |
    Permitted users syntax: kb chn [join-save/part-session/join-session] [channel] -- cooldown 5s`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message);

            const shell = require('child_process')

            const getBotChannels = await custom.doQuery(`
                SELECT COUNT(ID) As query
                FROM channels
                `)

            const getLoggerChannels = await custom.doQuery(`
                SELECT count(ID) As query
                FROM channels_logger
                `)

            const getDBSize = await custom.doQuery(`
                SELECT table_schema "kbot",
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) "size"
                FROM information_schema.tables
                WHERE table_schema="kbot"
                GROUP BY table_schema;
                `)

            // response for non-admin users
            if (user['user-id'] != "178087241") {
                return `${user['username']}, Bot is active in ${getBotChannels[0].query} channels, logger is in
                ${getLoggerChannels[0].query} channels and has collected ${getDBSize[0].size}MiB of data.
                List of channels: https://kunszg.xyz/ 4Head`;
            }

            // parameters for admins
            // check for wrong parameters
            if (msg[0] && !msg[1]) {
                return `${user['username']}, invalid parameter or no channel provided`;
            }

            // check if logger is in specified channel
            const checkRepeatedInsert = await custom.doQuery(`
                SELECT *
                FROM channels_logger
                WHERE channel="${msg[1]}"
                `)

            const checkRepeatedInsertBot = await custom.doQuery(`
                SELECT *
                FROM channels
                WHERE channel="${msg[1]}"
                `)

            switch (msg[0]) {

                // join the channel "permanently" by appending it to a file which is being imported after process restarts
                case 'join-save':
                case 'join':

                    if (checkRepeatedInsertBot.length != 0) {
                        return `${user['username']}, I'm already in this channel.`
                    }

                    // add the channel to the table
                    await custom.doQuery(`
                        INSERT INTO channels (channel, added)
                        VALUES ("${msg[1].toLowerCase()}", CURRENT_TIMESTAMP)
                        `);

                    bot.kb.join(msg[1].toLowerCase());
                    return `successfully joined ${msg[1].toLowerCase().replace(/^(.{2})/, "$1\u{E0000}")} :) 👍`;

                // leave the channel for this session, if channel is saved in the file it will be rejoined after session restarts
                case 'part-session':
                    bot.kb.part(msg[1]);
                    return `parted the channel ${msg[1].replace(/^(.{2})/, "$1\u{E0000}")} for this session`;

                // if nothing was provided by an admin, display a default message
                case 'part-save':
                case 'part':

                    if (checkRepeatedInsertBot.length === 0) {
                        return `${user['username']}, I'm not joined in that channel.`
                    }

                    // delete the row with provided channel
                    await custom.doQuery(`
                        DELETE FROM channels
                        WHERE channel="${msg[1]}"
                        `)

                    bot.kb.part(msg[1]);
                    return `parted the channel ${msg[1].replace(/^(.{2})/, "$1\u{E0000}")} via database.`;

                // join channel to logger's channel database and restart to apply changes
                case 'join-logger':

                    if (checkRepeatedInsert.length != 0) {
                        return `${user['username']}, I'm already in this channel.`;
                    }

                    const checkTables = await custom.doQuery(`
                        SHOW TABLES LIKE 'logs_${msg[1]}';
                        `)
                    if (checkTables.length != 0) {
                        return `${user['username']}, I'm already in this channel.`;
                    }

                    // create table with logs for the specified channel
                    bot.kb.say(channel, `${user['username']}, creating table "logs_${msg[1]}"`)
                    await custom.doQuery(
                        `CREATE TABLE logs_${msg[1]} (
                            ID INT(11) NOT NULL AUTO_INCREMENT,
                            username VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            message LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (ID) USING BTREE,
                            FULLTEXT INDEX message (message)
                        )
                        COLLATE='utf8mb4_general_ci'
                        ENGINE=InnoDB
                        ROW_FORMAT=COMPACT
                        ;
                        `)

                    // add the channel to the database
                    sleepGlob(1500)
                    await custom.doQuery(`
                        INSERT INTO channels_logger (channel, added)
                        VALUES ("${msg[1].toLowerCase()}", CURRENT_TIMESTAMP)
                        `)

                    shell.execSync('pm2 restart logger')
                    sleepGlob(700)
                    return `done SeemsGood`;

                // part channel from logger's channel database and restart to apply changes
                case 'part-logger':

                    if (checkRepeatedInsert.length === 0) {
                        return `${user['username']}, I'm not in that channel.`
                    }

                    // add the channel to the database
                    await custom.doQuery(`
                        DELETE FROM channels_logger
                        WHERE channel="${msg[1]}"
                        `)

                    shell.execSync('pm2 restart logger')
                    return `done SeemsGood`;
            }

            if (!msg[0] && !msg[1]) {
                return `${user['username']}, Bot is active in ${getBotChannels[0].query} channels, logger is in
                ${getLoggerChannels[0].query} channels and has collected ${getDBSize[0].size}MiB of data.
                List of channels: https://kunszg.xyz/ 4Head`;
            }

            return `${user['username']}, Bot is active in ${getBotChannels[0].query} channels, logger is in
            ${getLoggerChannels[0].query} channels and has collected ${getDBSize[0].size}MiB of data.
            List of channels: https://kunszg.xyz/ 4Head`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}