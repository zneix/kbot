#!/usr/bin/env node

'use strict';

const api = require('./config.js');

// parse the channel list
// check for empty items in an array

const options = {
    options: {
        debug: false,
    },
    connection: {
        cluster: 'aws',
    },
    identity: {
        username: 'kunszgbot',
        password: api.oauth,
    },
    channels: ['kunszg', 'kunszgbot'],
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const repeatedMessages = {
    supinic: null
};

function sleepGlob(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

kb.connect();
kb.on('connected', (adress, port) => {

    kb.say('kunszg', 'reminders reconnected KKona')
    const mysql = require('mysql2');
    const con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: api.db_pass,
        database: "kbot"
    });
    con.on('error', function(err) {console.log(err)});
    con.connect(function(err) {
        if (err) {
            kb.say('supinic', '@kunszg, database connection error monkaS')
            console.log(err)
        } else {
            console.log("Connected!");
        }
    });

    const doQuery = (query) => new Promise((resolve, reject) => {
        con.query(query, (err, results, fields) => {
            if (err) {
                const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
                const insert = [JSON.stringify(err), new Date()];
                con.query(mysql.format(sql, insert),
                    function(error, results, fields) {
                        if (error) {
                            console.log(error)
                            reject(error)
                        } else {
                            resolve(results)
                        }
                    })
                reject(err);
            }
            else {
                resolve(results);
            }
        });
    });

    async function errorLog(err) {
        console.log(err)
        const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
        const insert = [JSON.stringify(err), new Date()];
        await doQuery(mysql.format(sql, insert));
    }

    async function kden() {
        await doQuery(`
            UPDATE memory SET memory="${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)}" WHERE module="reminders"
            `)
    }
    kden()
    setInterval(() => {
        kden()
    }, 600000)

    // unfire clogging reminders
    async function unfireCookie() {

        // cookies
        const unfire = await doQuery('SELECT username, channel, fires, status FROM cookie_reminders WHERE status!="fired" ORDER BY fires ASC');

        if (!unfire[0]) {
            return;
        }

        // some KKona shit going out there
        const serverDate = new Date();
        const fires = new Date(unfire[0].fires);
        const diff = serverDate - fires
        const differenceToSec = diff/1000;

        if (differenceToSec>20) {

            // update the database with fired reminder
            const selectUnfiredUsers = await doQuery('SELECT * FROM cookie_reminders WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
            if (!selectUnfiredUsers[0]) {
                return;
            }

            const checkChannelStatus = await doQuery(`SELECT * FROM channels WHERE channel="${selectUnfiredUsers[0].channel}"`);
            if (checkChannelStatus[0].status === "live") {
                await doQuery('UPDATE cookie_reminders SET status="fired" WHERE fires < TIMESTAMPADD(SECOND, -20, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
                return;
            }

            await doQuery('UPDATE cookie_reminders SET status="fired" WHERE fires < TIMESTAMPADD(SECOND, -20, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
            const dateUnfiredUsers = new Date(selectUnfiredUsers[0].fires)
            const unfiredDiff = (serverDate - dateUnfiredUsers)/1000/60
            kb.whisper(selectUnfiredUsers[0].username, ' you had an unfired cookie reminder ' + unfiredDiff.toFixed(0) + ' minutes ago, sorry about that and eat your cookie please :)');
        }
    }
    setInterval(() => {
        unfireCookie()
    }, 20000)

    // unfire clogging reminders
    async function unfireEd() {

        // ed
        const unfire = await doQuery('SELECT * FROM ed_reminders WHERE status!="fired" ORDER BY fires ASC');
        if (!unfire[0]) {
            return;
        }
        const serverDate = new Date();
        const fires = new Date(unfire[0].fires);
        const diff = serverDate - fires
        const differenceToSec = diff/1000;

        if (differenceToSec>20) {

            // update the database with fired reminder
            const selectUnfiredUsers = await doQuery('SELECT * FROM ed_reminders WHERE fires < TIMESTAMPADD(SECOND, -20, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
            if (!selectUnfiredUsers[0]) {
                return;
            }

            const getUsername = await doQuery(`SELECT * FROM user_list WHERE ID="${unfire[0].user_alias}"`)
            await doQuery('UPDATE ed_reminders SET status="fired" WHERE fires < TIMESTAMPADD(SECOND, -20, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
            const dateUnfiredUsers = new Date(selectUnfiredUsers[0].fires)
            const unfiredDiff = (serverDate - dateUnfiredUsers)/1000/60
            kb.whisper(getUsername[0].username, 'You had an unfired dungeon reminder ' + unfiredDiff.toFixed(0) + ' minutes ago, sorry about that and enter the dungeon please :)');
        }
    }
    setInterval(() => {
        unfireEd()
    }, 20000)

    // check and send reminders - cookie
    async function reminder() {
        const userData = await doQuery('SELECT * FROM cookie_reminders WHERE status!="fired" ORDER BY fires ASC');

        // if there is no "fired" argument, ignore
        if (!userData[0]) {
            return;
        }

        // some KKona shit going out there
        const serverDate = new Date();
        const fires = new Date(userData[0].fires);
        const diff = serverDate - fires
        const differenceToSec = diff/1000;

        // consider only cases where reminder is apart from current date by 15 seconds
        if ((differenceToSec<=15) && !(differenceToSec<0)) {
            const limit = new Set();

            // make sure not to repeat the same reminder by adding a unique user_alias
            // to the Set Object and delete it after 10s
            if (limit.has(userData[0].user_alias)) {
                return;
            }

            const getUsername = await doQuery(`SELECT * FROM user_list WHERE ID="${userData[0].user_alias}"`)
            const checkChannelStatus = await doQuery(`SELECT * FROM channels WHERE channel="${userData[0].channel}"`)
            if (checkChannelStatus[0].status === "live") {
                limit.add(userData[0].user_alias)
                await doQuery(`UPDATE cookie_reminders SET status="fired" WHERE user_alias="${userData[0].user_alias}" AND status="scheduled"`);
                kb.whisper(getUsername[0].username, `cookie reminder - eat cookie please :) 🍪 (this reminder fired in a channel that is live [${userData[0].channel}])`)
                setTimeout(() => {limit.delete(userData[0].user_alias)}, 10000);
                return;
            }

            limit.add(userData[0].user_alias);

            // update the database with fired reminder
            await doQuery(`UPDATE cookie_reminders SET status="fired" WHERE user_alias="${userData[0].user_alias}" AND status="scheduled"`);
            await doQuery(`
                UPDATE user_list t1, cookie_reminders t2
                SET t2.username=t1.username
                WHERE t1.ID="${userData[0].user_alias}" AND t2.user_alias="${userData[0].user_alias}"
            `);
            sleepGlob(500);
            if (userData[0].channel === "forsen" || userData[0].channel === "nymn") {
                kb.whisper(userData[0].username, `(cookie reminder from channel ${userData[0].channel}) eat cookie please :) 🍪`);
                setTimeout(() => {limit.delete(userData[0].user_alias)}, 10000);
            } else {
                if (userData[0].initplatform === "whisper") {
                    kb.whisper(userData[0].username, '(cookie reminder) eat cookie please :) 🍪');
                    setTimeout(() => {limit.delete(userData[0].user_alias)}, 10000);
                } else {
                    kb.say(userData[0].channel, '(cookie reminder) ' + getUsername[0].username + ', eat cookie please :) 🍪');
                    setTimeout(() => {limit.delete(userData[0].user_alias)}, 10000);
                }
            }
        }
    }

    setInterval(() => {
        reminder()
    }, 3500)

    async function reminder2() {
        const userData = await doQuery('SELECT * FROM ed_reminders WHERE status!="fired" ORDER BY fires ASC');

        // if there is no "fired" argument, ignore
        if (!userData[0]) {
            return;
        }

        // some KKona shit going out there
        const serverDate = new Date();
        const fires = new Date(userData[0].fires);
        const diff = serverDate - fires
        const differenceToSec = diff/1000;

        // consider only cases where reminder is apart from current date by 7 seconds
        if ((differenceToSec<=15) && !(differenceToSec<0)) {
            const limit = new Set();

            // make sure not to repeat the same reminder by adding a unique username
            // to the Set Object and delete it after 10s
            if (limit.has(userData[0].user_alias)) {
                return;
            }

            limit.add(userData[0].user_alias);

            // update the database with fired reminder
            const getUsername = await doQuery(`SELECT * FROM user_list WHERE ID="${userData[0].user_alias}"`);
            await doQuery(`UPDATE ed_reminders SET status="fired" WHERE user_alias="${userData[0].user_alias}" AND status="scheduled"`);
            await doQuery(`
                UPDATE user_list t1, ed_reminders t2
                SET t2.username=t1.username
                WHERE t1.ID="${userData[0].user_alias}" AND t2.user_alias="${userData[0].user_alias}"
            `);
            sleepGlob(500);
            kb.whisper(userData[0].username, '(ed reminder) enter dungeon please :) 🏰 ');
            setTimeout(() => {limit.delete(userData[0].user_alias)}, 10000);
        }
    }
    setInterval(() => {
        reminder2()
    }, 3500)

    async function statusCheck() {
        await doQuery(`
            UPDATE stats
            SET date="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
            WHERE type="module" AND sha="reminders"
            `)
    }
    statusCheck();
    setInterval(()=>{statusCheck()}, 600000);
})