import express from 'express';
import {testConnection} from "./src/database/db.js";
import authRouter from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/user.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

await testConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ROUTER
app.use('/auth', authRouter);
app.use('/users', userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})