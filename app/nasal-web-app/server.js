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
const { fork } = require('child_process');
const bodyParser = require('body-parser');
const { sanitize } = require('express-xss-sanitizer');
// const helmet = require('helmet');
const compression = require('compression');

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
    .version('0.0.8')
    .argv;

const app = express();
app.use(compression());

app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json({limit:'10kb'}));
app.use(bodyParser.urlencoded({extended: true, limit:'10kb'}));

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

    // Fork the worker process with stdio stream for stderr collection
    const child = fork(path.join(__dirname, 'worker.js'), {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });
    let responded = false;
    let stderrData = '';
    let stdoutData = '';

    // Collect stderr output from the child process
    child.stderr.on('data', (data) => {
        stderrData += data.toString();
    });

    // Collect stdout output from the child process
    child.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    // Listen for the stderr stream closing (indicating that the native error was flushed)
    child.stderr.on('close', () => {
        if (!responded) {
            responded = true;
            clearTimeout(timeoutId);
            let errorMsg = stderrData + stdoutData;
            // Use collected stderr output if available.
            res.status(500).json({ error: errorMsg || 'Worker exited with possible runtime error' });
        }
    });

    const timeoutId = setTimeout(() => {
        if (!responded) {
            responded = true;
            child.kill('SIGTERM');
            res.status(408).json({ error: 'Execution timeout - exceeded 5 seconds' });
        }
    }, TIMEOUT_MS);

    child.on('message', (message) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutId);
        if (message.error && message.error !== 'null') {
            if (argv.verbose) console.log('Nasal error:', message.error);
            res.json({ error: message.error });
        } else if (message.result && message.result.trim() !== '') {
            if (argv.verbose) console.log('Nasal output:', message.result);
            res.json({ result: sanitize(message.result) });
        } else {
            res.json({ result: '' });
        }
    });

    child.on('exit', (exitCode, signal) => {
        if (!responded) {
            responded = true;
            clearTimeout(timeoutId);
            const errorMsg = stderrData || (signal ? `Worker terminated by signal: ${signal}` : `Worker exited with code: ${exitCode}`);
            res.status(500).json({ error: errorMsg });
        }
    });

    child.on('error', (err) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutId);
        if (argv.verbose) console.error('Child process error:', err);
        res.status(500).json({ error: err.message });
        child.kill();
    });

    // Send data to the worker process
    child.send({ code, showTime });
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