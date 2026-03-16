// MessageChannel polyfill for Cloudflare Workers
if (typeof MessageChannel === "undefined") {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = {
        postMessage: () => {},
        onmessage: null,
        close: () => {},
      };
      this.port2 = {
        postMessage: () => {},
        onmessage: null,
        close: () => {},
      };
    }
  };
}
