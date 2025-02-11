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

process.on('message', ({ code, showTime }) => {
    let ctx = null;
    try {
        ctx = nasalLib.nasal_init();
        if (!ctx) {
            throw new Error('Failed to initialize Nasal context');
        }

        // Evaluate code and get results
        const result = nasalLib.nasal_eval(ctx, code, showTime ? 1 : 0);
        const error = nasalLib.nasal_get_error(ctx);
        
        // Send response back to parent process
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
        // Clean up resources
        if (ctx) {
            try {
                nasalLib.nasal_cleanup(ctx);
            } catch (cleanupErr) {
                console.error('Cleanup error:', cleanupErr);
            }
        }
        process.exit(0);
    }
});
