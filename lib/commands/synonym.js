#!/usr/bin/env node
'use strict';

// credits to abbreviations.com

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
    name: prefix + "synonyms",
    aliases: null,
    description: `returns synonyms for provided word`,
    permission: 0,
    cooldown: 20000,
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message);
            if (!msg) {
                return `${user['username']}, no word provided.`;
            }

            const got = require('got');
            const api = encodeURI(`https://www.abbreviations.com/services/v2/syno.php?uid=7801&tokenid=lWi928FPSu7jSQqj&word=${msg[0]}&format=json`);
            const synonyms = await got(api).json();

            if (typeof synonyms.result === "undefined") {
                if (typeof synonyms.related === 'undefined' || synonyms.related.length === 0) {
                    return `${user['username']}, provided word was not found.`;
                }
                return `${user['username']}, this word was not found. Similar terms: ${synonyms.related.map(i=>i['term']).slice(0, 5).join(', ')}`;
            }

            if (typeof synonyms.result[0].synonyms === "undefined" || Object.keys(synonyms.result[0].synonyms).length === 0) {
                return `${user['username']}, provided word has no synonyms or does not exist in database FeelsDankMan`;
            }

            if (typeof synonyms.result[0].partofspeech === "undefined") {
                return `${user['username']}, synonyms for word ${msg[0]} 🤓 👉  ${synonyms.result[0].synonyms.split(',').slice(0, 12).join(',')}`;
            }

            return `${user['username']}, synonyms for ${synonyms.result[0].partofspeech} ${msg[0]} 🤓 👉  ${synonyms.result[0].synonyms.split(',').slice(0, 12).join(',')}`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}