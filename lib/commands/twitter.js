#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "twitter",
	aliases: null,
	description: `syntax: kb twitter [account] | no parameter - returns an error |
	account - returns latest tweet from specified user`,
	permission: 0,
	cooldown: 6000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			const got = require('got');
			const tweet = await got(`https://decapi.me/twitter/latest/${msg[0]}?howlong`);

			if (!msg[0]) {
				return `${user['username']}, no account	name provided, see "kb help twitter" for explanation`;
			}
			return `${user['username']}, ${tweet.body.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')}`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')} FeelsDankMan !!!`;
		}
	}
}