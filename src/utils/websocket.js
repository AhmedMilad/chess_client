let socket = null;

export function connectWebSocket(url, onMessage, onOpen, onClose, onError) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.warn("WebSocket is already connected");
        return socket;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
        if (onOpen) onOpen();
    };

    socket.onmessage = (event) => {
        if (onMessage) onMessage(event.data);
    };

    socket.onclose = () => {
        console.log("WebSocket closed");
        if (onClose) onClose();
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (onError) onError(error);
    };

    return socket;
}

export function sendMessage(data) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected");
        return;
    }
    const message = typeof data === "object" ? JSON.stringify(data) : data;
    socket.send(message);
    console.log("Sent message:", message);
}

export function closeWebSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

export { socket };
