#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch')

module.exports = {
    name: prefix + 'cookie',
    aliases: null,
    description: `ThePositiveBot's cookie reminders, (NOTE: this command is not a minigame, 
    it's just a REMINDER for ThePositiveBot's cookies) see usage on my website: https://kunszg.xyz/commands#cookie_opt`,
    description_formatted: `ThePositiveBot's cookie reminders, (NOTE: this is not a minigame, 
    it's just a REMINDER for ThePositiveBot's cookies), see usage on my website: kunszg (dot) xyz/commands#cookie_opt`,
    permission: 0,
    cooldown: 8000,
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message);

            const getAlias = await custom.doQuery(`
                SELECT *
                FROM user_list
                WHERE userId=${user['user-id']}
                `);

            const resultsRegister = await custom.doQuery(`
                SELECT *
                FROM cookie_reminders
                WHERE user_alias="${getAlias[0].ID}"
                `);

            switch (msg[0]) {

                case 'module':
                    if (await custom.checkPermissions(user['username'])<3) {
                        return '';
                    }
                    await custom.doQuery(`
                        UPDATE cookieModule
                        SET reminders="${msg[1]}"
                        WHERE type="cookie"
                        `);

                    return `updated "cookie" module status to ${msg[1]}`;

                case 'force':
                    const cookieApi = await fetch(`https://api.roaringiron.com/cooldown/${user['username']}`)
                        .then(response => response.json());

                    const regCheck = await custom.doQuery(`
                        SELECT *
                        FROM cookie_reminders
                        WHERE user_alias="${getAlias[0].ID}"
                        `);

                    const now = new Date();

                    // check if user is registered
                    if (regCheck.length === 0) {
                        return `${user['username']}, you are not registered in the database,
                        use "kb cookie register" to do so.`;
                    }

                    if (cookieApi.seconds_left === 0) {
                        return `${user['username']}, you can eat your cookie right now! (?cookie)`;
                    }

                    Date.prototype.addMinutes = function(minutes) {
                        const copiedDate = new Date(this.getTime());
                        return new Date(copiedDate.getTime() + minutes * 1000);
                    }

                    async function updateReminder(time) {
                        await custom.doQuery(`
                            UPDATE cookie_reminders
                            SET channel="${channel.replace('#', '')}",
                                fires="${now.addMinutes(time).toISOString().slice(0, 19).replace('T', ' ')}",
                                status="scheduled"
                            WHERE user_alias="${getAlias[0].ID}"
                            `);

                        await custom.doQuery(`
                            UPDATE cookie_reminders
                            SET cookie_count="${resultsRegister[0].cookie_count + 1}"
                            WHERE user_alias="${getAlias[0].ID}"
                            `)
                    }

                    updateReminder(cookieApi.seconds_left.toFixed(0))
                    return `${user['username']}, I will remind you to eat the cookie in
                    ${custom.format(cookieApi.seconds_left.toFixed(0))} (forced reminder)`;

                case 'register':
                    // check if user is new and insert a new row in database
                    if (resultsRegister.length === 0) {

                        await custom.doQuery(`
                            INSERT INTO cookies (username, created)
                            VALUES ("${user['username']}", CURRENT_TIMESTAMP)
                            `);

                        await custom.doQuery(`
                            INSERT INTO cookie_reminders (username)
                            VALUES ("${user['username']}")
                            `);

                        await custom.doQuery(`
                            UPDATE user_list t1, cookie_reminders t2
                            SET t2.user_alias=t1.ID
                            WHERE t2.username="${user['username']}" AND t1.userId=${user['user-id']}
                            `);

                        if (channel === "#forsen") {
                            return `${user['username']}, you have been successfully registered for
                            a cookie reminder, see https://kunszg (dot) xyz/commands#cookie_opt for command options`;
                        }
                        return `${user['username']}, you have been successfully registered for
                        a cookie reminder, see https://kunszg.xyz/commands#cookie_opt for command options`;
                    }

                    // check if user is already registered
                    if (resultsRegister[0].user_alias == getAlias[0].ID) {
                        return `${user['username']}, you are already registered for cookie reminders, use
                        "kb help cookie" for command syntax.`;
                    }
                    return '';

                case 'unregister':
                    // check if user is registered and delete rows from database
                    if (resultsRegister.length === 0) {
                        return `${user['username']}, you are not registered for a
                        cookie reminder, therefore you can't be unregistered FeelsDankMan`;
                    }

                    await custom.doQuery(`
                        INSERT INTO trash (username, channel, cmd, added)
                        VALUES ("${user['username']}", "${channel.replace('#', '')}", "cookie", CURRENT_TIMESTAMP)
                        `);
                    await custom.doQuery(`
                        DELETE FROM cookie_reminders
                        WHERE user_alias="${getAlias[0].ID}"
                        `);
                    return `${user['username']}, you are no longer registered for a cookie reminder.`;

                case 'whisper':
                    // check if user is registered
                    if (resultsRegister.length === 0 ||
                        resultsRegister[0].username === 0) {
                            return `${user['username']}, you are not registered in my database,
                            check out "kb help cookie" to do so.`;
                            }

                        // when user uses command the first time (feedback in whispers)
                        if (resultsRegister[0].user_alias === getAlias[0].ID &&
                            resultsRegister[0].initplatform === 'channel') {

                                await custom.doQuery(`
                                    UPDATE cookie_reminders
                                    SET initplatform="whisper"
                                    WHERE user_alias="${getAlias[0].ID}"
                                    `);

                                return `${user['username']}, you have changed your feedback and reminder message to appear in
                                whispers. Type this command again to undo it. (these channels have forced whisper reminders: for${'\u{E0000}'}sen, ny${'\u{E0000}'}mn)`;
                        }

                    // when user uses the command 2nd time (feedback as default in channel)
                    if (resultsRegister[0].user_alias === getAlias[0].ID &&
                        resultsRegister[0].initplatform === 'whisper') {

                            await custom.doQuery(`
                                UPDATE cookie_reminders
                                SET initplatform="channel"
                                WHERE user_alias="${getAlias[0].ID}"
                                `);

                                return `${user['username']}, you have changed your feedback message to appear in
                                your own channel. Your next cookie reminders will appear in channel where you executed the command.
                                Type this command again to undo it.`;
                            }

                        // swap from silence to default feedback message
                        if (resultsRegister[0].user_alias === getAlias[0].ID &&
                            resultsRegister[0].initplatform === "silence") {

                                await custom.doQuery(`
                                    UPDATE cookie_reminders
                                    SET initplatform="channel"
                                    WHERE user_alias="${getAlias[0].ID}"
                                    `);

                                return `${user['username']}, you have changed your feedback message to appear in
                                your own channel. Type this command again to set them to whispers.`;
                        }
                    return '';

                case 'silence':
                    // check if user is registered
                    if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {
                        return `${user['username']}, you are not registered in my database,
                        check out "kb help cookie" to do so.`;
                        }

                        // change the feedback message to silence if it's already not set
                        if (resultsRegister[0].user_alias === getAlias[0].ID &&
                            resultsRegister[0].initplatform != 'silence') {

                                await custom.doQuery(`
                                    UPDATE cookie_reminders
                                    SET initplatform="silence"
                                    WHERE user_alias="${getAlias[0].ID}"
                                    `);

                                return `${user['username']}, you will no longer receive
                                feedback from the cookie command.`;
                            }
                    return `${user['username']}, you are already marked to not receive the feedback.`;

                case 'status':
                    // check if user is registered
                    if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {
                        return `${user['username']}, you are not registered in my database,
                        check out "kb help cookie" to do so.`;
                    }

                    const getData = await custom.doQuery(`
                        SELECT * FROM cookie_reminders
                         WHERE user_alias="${getAlias[0].ID}"
                         `)

                    return `${user['username']}, you have used cookie reminders ${getData[0].cookie_count}
                    times | feedback message is set to ${getData[0].initplatform} | your current reminder
                    status - ${getData[0].status}`;

                default:
                    if (channel==="#forsen") {
                        return `${user['username']}, invalid syntax. See kunszg(dot)xyz/commands#cookie_opt for command options.`;
                    }
                    return `${user['username']}, invalid syntax. See https://kunszg.xyz/commands#cookie_opt for command options.`;
            }
            return '';
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}
