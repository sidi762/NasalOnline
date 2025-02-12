const path = require('path');
const koffi = require('koffi');

// Load and initialize Nasal library
let nasalLib;
try {
    const lib = koffi.load(path.join(__dirname, '../nasal-interpreter/module/libnasal-web.so'));
    nasalLib = {
        nasal_init: lib.func('nasal_init', 'void*', []),
        nasal_cleanup: lib.func('nasal_cleanup', 'void', ['void*']),
        nasal_eval: lib.func('nasal_eval', 'const char*', ['void*', 'const char*', 'int']),
        nasal_get_error: lib.func('nasal_get_error', 'const char*', ['void*'])
    };
} catch (err) {
    process.send({ error: `Failed to load nasal library: ${err.message}` });
    process.exit(1);
}

// Handle uncaught exceptions to ensure clean exit
process.on('uncaughtException', (err) => {
    process.send({ error: `Uncaught Exception: ${err.message}` });
    process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

let ctx = null;

function cleanup() {
    if (ctx) {
        try {
            nasalLib.nasal_cleanup(ctx);
            ctx = null;
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }
    process.exit(0);
}

// Memory usage monitoring
const MAX_MEMORY_MB = 100;
function checkMemory() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    if (used > MAX_MEMORY_MB) {
        process.send({ error: 'Memory limit exceeded' });
        cleanup();
    }
}

process.on('message', ({ code, showTime }) => {
    try {
        ctx = nasalLib.nasal_init();
        if (!ctx) {
            throw new Error('Failed to initialize Nasal context');
        }

        // Monitor memory usage
        const memoryInterval = setInterval(checkMemory, 1000);

        // Evaluate code with timeout
        const result = nasalLib.nasal_eval(ctx, code, showTime ? 1 : 0);
        clearInterval(memoryInterval);

        const error = nasalLib.nasal_get_error(ctx);
        
        if (error && error !== 'null') {
            process.send({ error });
        } else if (!result || result.trim() === '') {
            process.send({ error: 'No output generated' });
        } else {
            process.send({ result });
        }
    } catch (err) {
        process.send({ error: `Execution error: ${err.message}` });
    } finally {
        cleanup();
    }
});
