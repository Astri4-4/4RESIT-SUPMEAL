import {testConnection} from "./src/database/db.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

await testConnection();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
