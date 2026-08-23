import {useCallback, useEffect, useRef, useState} from "react";
import cookbookApi from "../api/cookbook.js";
import {BASE_URL} from "../api/client.js";

const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");
const RECONNECT_DELAY_MS = 3000;

export default function useCookbookChat(cookbookId) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        if (!cookbookId) return;

        let cancelled = false;

        (async () => {
            try {
                const history = await cookbookApi.getMessages(cookbookId);
                if (!cancelled) setMessages(history || []);
            } catch (error) {
                console.log(error);
            }
        })();

        const connect = () => {
            const token = localStorage.getItem("token");
            const ws = new WebSocket(`${WS_BASE_URL}/ws/cookbooks/${cookbookId}?token=${encodeURIComponent(token)}`);
            wsRef.current = ws;

            ws.onopen = () => setConnected(true);

            ws.onclose = () => {
                setConnected(false);
                if (!cancelled) {
                    reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "message") {
                        setMessages((prev) => [...prev, data.message]);
                    }
                } catch (error) {
                    console.log(error);
                }
            };
        };

        connect();

        return () => {
            cancelled = true;
            clearTimeout(reconnectTimeoutRef.current);
            wsRef.current?.close();
        };
    }, [cookbookId]);

    const sendMessage = useCallback((content) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({type: "message", content}));
        }
    }, []);

    return {messages, connected, sendMessage};
}
