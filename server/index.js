import express from 'express';
import swaggerUi from 'swagger-ui-express';
import {testConnection} from "./src/database/db.js";
import {swaggerSpec} from "./src/config/swagger.js";
import authRouter from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/user.routes.js";
import cookbookRouter from "./src/routes/cookbook.routes.js";
import recipeRouter from "./src/routes/recipe.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

await testConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

//ROUTER
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/cookbooks', cookbookRouter);
app.use('/recipes', recipeRouter);

app.use('/public', express.static('src/public'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})