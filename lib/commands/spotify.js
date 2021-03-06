#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const creds = require('../credentials/config.js');
const fetch = require('node-fetch');
const prefix = "kb ";

module.exports = {
    name: prefix + 'spotify',
    aliases: prefix + 'spotify',
    description: `song that currently plays on my spotify`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {
            const refreshToken = await custom.doQuery(`
                SELECT *
                FROM access_token
                WHERE platform="spotify"
                `);

            const api = 'https://api.spotify.com/v1/me/player/currently-playing';
            const song = (await fetch(api, {
                method: "GET",
                url: api,
                headers: {
                    'Authorization': `Bearer ${refreshToken[0].access_token}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            }).then(response => response.json()));

            const search = require("youtube-search");
            const youtube = await search(`${song.item.name} by ${song.item.artists[0].name}`, {
                maxResults: 1,
                key: creds.youtube
            });

            const urlFormatted = youtube.results[0].link
                .replace('https://', '')
                .replace(/\./g, '(dot)')
                .replace('(dot)', '.');

            function minutes(input) {
                const minutes = String(Math.floor(input/1000/60));
                if (minutes.split('').length===1) {
                    return `0${minutes}`;
                }
                return minutes;
            }

            function seconds(input) {
                const seconds = String(Math.floor(input/1000 % 60));
                if (seconds.split('').length===1) {
                    return `0${seconds}`;
                }
                return seconds;
            }

            if (channel === "#forsen") {
                return `${user['username']}, current song playing on my spotify:
                ${song.item.name} by ${song.item.artists[0].name}, ${song.is_playing ? '▶ ' : '⏸ '}
                [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/
                ${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}] link 👉 ${urlFormatted}`;
            }
            return `${user['username']}, current song playing on my spotify:
            ${song.item.name} by ${song.item.artists[0].name}, ${song.is_playing ? '▶ ' : '⏸ '}
            [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/
            ${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}]
            ${youtube.results[0].link}`;

        } catch (err) {
           if (err) {
                return `${user['username']}, no song is currently playing on my spotify FeelsDankMan`;
           }
        }
    }
}
