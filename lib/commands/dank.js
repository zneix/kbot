#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
    name: prefix + "dank",
    aliases: null,
    description: `kb dank [input] - dank other person (use input) or 
    yourself (without input) FeelsDankMan`,
    permission: 0,
    cooldown: 4000,
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message);

            if (!msg.join(' ')) {
                return `${user['username']}, FeelsDankMan oh zoinks, you just got flippin'
                danked by yourself FeelsDankMan FeelsDankMan FeelsDankMan`;
            }

            // check if user exists in the database
            const checkIfUserExists = await custom.doQuery(`
                SELECT *
                FROM user_list
                WHERE username="${msg[0]}"
                `);

            if (checkIfUserExists.length === 0) {
                return `${user['username']}, this user does not exist in my user list logs.`;
            }

            return `${user['username']}, you just danked ${msg.join(' ')} FeelsDankMan 👍`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}