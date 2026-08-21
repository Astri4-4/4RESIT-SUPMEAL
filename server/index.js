import http from "http";
import {testConnection} from "./src/database/db.js";
import app from "./src/app.js";
import {initChatWebSocket} from "./src/websocket/chat.ws.js";

const PORT = process.env.PORT || 3000;

await testConnection();

const server = http.createServer(app);
initChatWebSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
