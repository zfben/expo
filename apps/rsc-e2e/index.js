
const __expo_metro_load_chunk__ = global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`];

globalThis.__waku_module_cache__ = new Map();
globalThis.__webpack_chunk_load__ = (id) => {
    const url = new URL(id);
    const numericMetroId = parseInt(url.hash.slice(1));
    console.log('__webpack_chunk_load__', id, numericMetroId);
    return __expo_metro_load_chunk__(id).then(() => {
        console.log('loaded module.1:', id)
        try {
            const m = __r(numericMetroId);
            console.log('loaded module.2:', id, m)
            globalThis.__waku_module_cache__.set(id, m);
            return m;
        } catch (e) {
            console.log('failed to load module:', e)
            throw e;
        }
    })
};
globalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);

import 'expo-router/entry';
