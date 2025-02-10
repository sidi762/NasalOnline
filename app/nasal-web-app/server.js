/*
    Nasal Web Interpreter - A web-based interface for the Nasal programming language
    server.js - Express server for the Nasal Web Interpreter
    Copyright (C) 2025 LIANG Sidi

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

const express = require('express');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Worker } = require('worker_threads');

const inAlphaTesting = true;

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging'
    })
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the server on',
        default: 3000
    })
    .option('host', {
        type: 'string',
        description: 'Host to run the server on',
        default: 'localhost'
    })
    .help()
    .alias('help', 'h')
    .version('0.0.3')
    .argv;

const app = express();

app.use(express.json());
app.use(express.static('public'));

const TIMEOUT_MS = 5000; // 5 seconds timeout

app.post('/eval', (req, res) => {
    const { code, showTime = false } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    if (argv.verbose) {
        console.log('Received code evaluation request:', code);
        console.log('Show time:', showTime);
    }

    const worker = new Worker(path.join(__dirname, 'worker.js'));
    const timeoutId = setTimeout(() => {
        worker.terminate();
        res.status(408).json({ error: 'Execution timeout - exceeded 5 seconds' });
    }, TIMEOUT_MS);

    worker.on('message', ({ result, error }) => {
        clearTimeout(timeoutId);
        if (error && error !== 'null') {
            if (argv.verbose) console.log('Nasal error:', error);
            res.json({ error: error });
        } else if (result && result.trim() !== '') {
            if (argv.verbose) console.log('Nasal output:', result);
            res.json({ result: result });
        } else {
            if (argv.verbose) console.log('No output or error returned');
            res.json({ error: 'No output or error returned' });
        }
        worker.terminate();
    });

    worker.on('error', (err) => {
        clearTimeout(timeoutId);
        if (argv.verbose) console.error('Worker error:', err);
        res.status(500).json({ error: err.message });
        worker.terminate();
    });

    worker.postMessage({ code, showTime });
});

const PORT = argv.port || 3000;
app.listen(PORT, () => {
    console.log('Nasal Web Interpreter');
    // Print system date and time, precise to the second
    console.log('System date and time: ' + new Date().toLocaleString());
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the Nasal interpreter`);
    if (inAlphaTesting) {
        argv.verbose = true;
        console.log('this is an alpha version, verbose logging enabled');
    }
    if (argv.verbose) console.log('Verbose logging enabled');
});