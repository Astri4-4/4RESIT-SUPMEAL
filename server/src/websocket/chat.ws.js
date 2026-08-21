import {WebSocketServer} from "ws";
import jwt from "jsonwebtoken";
import {isInCookbook} from "../services/cookbook.service.js";
import {createMessage} from "../services/message.service.js";

const COOKBOOK_CHAT_PATH = /^\/ws\/cookbooks\/(\d+)$/;
const MAX_MESSAGE_LENGTH = 500;
const HEARTBEAT_INTERVAL_MS = 30000;

const rooms = new Map();

function addToRoom(cookbookId, ws) {
    if (!rooms.has(cookbookId)) {
        rooms.set(cookbookId, new Set());
    }
    rooms.get(cookbookId).add(ws);
}

function removeFromRoom(cookbookId, ws) {
    const room = rooms.get(cookbookId);
    if (!room) return;
    room.delete(ws);
    if (room.size === 0) {
        rooms.delete(cookbookId);
    }
}

function broadcastToRoom(cookbookId, payload) {
    const room = rooms.get(cookbookId);
    if (!room) return;
    const data = JSON.stringify(payload);
    for (const client of room) {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    }
}

export function initChatWebSocket(server) {
    const wss = new WebSocketServer({noServer: true});

    server.on("upgrade", (req, socket, head) => {
        const url = new URL(req.url, "http://localhost");
        const match = url.pathname.match(COOKBOOK_CHAT_PATH);
        if (!match) {
            socket.destroy();
            return;
        }

        const cookbookId = match[1];
        const token = url.searchParams.get("token");

        let user;
        try {
            user = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        isInCookbook(cookbookId, user.id)
            .then((isMember) => {
                if (!isMember) {
                    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
                    socket.destroy();
                    return;
                }

                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit("connection", ws, {cookbookId, user});
                });
            })
            .catch(() => {
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            });
    });

    wss.on("connection", (ws, {cookbookId, user}) => {
        addToRoom(cookbookId, ws);
        ws.isAlive = true;
        ws.on("pong", () => {
            ws.isAlive = true;
        });

        ws.on("message", async (raw) => {
            let data;
            try {
                data = JSON.parse(raw.toString());
            } catch {
                return;
            }

            if (data.type !== "message") return;

            const content = typeof data.content === "string" ? data.content.trim() : "";
            if (!content || content.length > MAX_MESSAGE_LENGTH) return;

            try {
                const created = await createMessage(cookbookId, user.id, content);
                broadcastToRoom(cookbookId, {
                    type: "message",
                    message: {
                        id: created.id,
                        cookbook_id: Number(cookbookId),
                        user_id: user.id,
                        username: user.username,
                        message: created.message,
                        created_at: created.created_at,
                    },
                });
            } catch (error) {
                console.error(error);
            }
        });

        ws.on("close", () => {
            removeFromRoom(cookbookId, ws);
        });
    });

    const heartbeat = setInterval(() => {
        for (const room of rooms.values()) {
            for (const ws of room) {
                if (!ws.isAlive) {
                    ws.terminate();
                    continue;
                }
                ws.isAlive = false;
                ws.ping();
            }
        }
    }, HEARTBEAT_INTERVAL_MS);

    wss.on("close", () => clearInterval(heartbeat));

    return wss;
}
