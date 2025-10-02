import { EventEmitter } from "events";

// Singleton event bus used to push payment status updates to SSE listeners
const bus = new EventEmitter();
bus.setMaxListeners(0); // unlimited listeners per key

function makeKey(ref1, ref2, ref3) {
    return [ref1 || "", ref2 || "", ref3 || ""].join(":");
}

export function publishPaymentSuccess(ref1, ref2, ref3, payload) {
    const key = makeKey(ref1, ref2, ref3);
    bus.emit(key, payload);
}

export function subscribePayment(ref1, ref2, ref3, handler) {
    const key = makeKey(ref1, ref2, ref3);
    bus.on(key, handler);
    return () => bus.off(key, handler);
}


