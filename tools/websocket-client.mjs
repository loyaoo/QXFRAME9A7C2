export async function getWebSocketConstructor() {
    if (typeof globalThis.WebSocket === 'function') return globalThis.WebSocket;
    const mod = await import('ws');
    const WebSocketCtor = mod.WebSocket || mod.default;
    if (typeof WebSocketCtor !== 'function') throw new Error('The `ws` devDependency does not expose a WebSocket constructor.');
    return WebSocketCtor;
}
