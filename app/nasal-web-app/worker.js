const { parentPort } = require('worker_threads');
const path = require('path');
const koffi = require('koffi');

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
    parentPort.postMessage({ error: `Failed to load nasal library: ${err.message}` });
    process.exit(1);
}

parentPort.on('message', ({ code, showTime }) => {
    const ctx = nasalLib.nasal_init();
    try {
        const result = nasalLib.nasal_eval(ctx, code, showTime ? 1 : 0);
        const error = nasalLib.nasal_get_error(ctx);
        parentPort.postMessage({ result, error });
    } catch (err) {
        parentPort.postMessage({ error: err.message });
    } finally {
        nasalLib.nasal_cleanup(ctx);
    }
});
