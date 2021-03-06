#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

module.exports = {
	name: prefix + "hosts",
	aliases: null,
	description: `kb hosts [input] - get users that are hosting a specified channel
	(in input), no input will return an error`,
	permission: 0,
	cooldown: 8000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

            function checkInput() {
                if (!msg[0]) {
                    return channel.replace('#', '')
                } else {
                    return msg[0]
                }
            }

			const hosts = await fetch(`https://decapi.me/twitch/hosts/${checkInput()}`)

			const hostlist = hosts.sort().map(function(e) {

				return e.replace(/^(.{2})/, "$1\u{E0000}")
					.split("")
					.reverse()
					.join("")
					.replace(/^(.{2})/, "$1\u{E0000}")
					.split("")
					.reverse()
					.join("")
			});

			if (!msg[0]) {
                if (hosts.length < 25 && hosts.length != 0) {
                    return `${user['username']}, users hosting
                    ${channel.replace(/^(.{2})/, "$1\u{E0000}")} (anti-ping) PagChomp 👉 ${hostlist.join(", ")}`;
                }
                if (hosts.length > 25) {
                    return `${user['username']}, channel
                    ${channel.replace(/^(.{2})/, "$1\u{E0000}")} is being hosted by ${hosts.length} users`;
                }
			}

			if (hosts.length < 25 && hosts.length != 0) {
				return `${user['username']}, users hosting
				${msg[0].replace(/^(.{2})/, "$1\u{E0000}")
					.split("").reverse().join("").replace(/^(.{2})/, "$1\u{E0000}")
					.split("").reverse().join("")} PagChomp 👉 ${hostlist.join(", ")}`;
			}
			if (hosts.length > 25) {
				return `${user['username']}, channel
				${msg[0].replace(/^(.{2})/, "$1\u{E0000}")
 					.split("").reverse().join("").replace(/^(.{2})/, "$1\u{E0000}")
 					.split("").reverse().join("")} is being hosted by ${hosts.length} users`;
			}
			if (hosts.length === 0) {
				return `${user['username']}, channel is not being hosted by any user :(`;
			}
			return `${user['username']}, something fucked up eShrug`;

		} catch (err) {
			custom.errorLog(err)
            return `${user['username']}, ${err} monkaS`
		}
	}
}