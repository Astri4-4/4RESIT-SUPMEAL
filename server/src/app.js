import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import {swaggerSpec} from "./config/swagger.js";
import passport from "./config/passport.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cookbookRouter from "./routes/cookbook.routes.js";
import recipeRouter from "./routes/recipe.routes.js";
import planRouter from "./routes/plan.routes.js";
import favoriteRouter from "./routes/favorite.routes.js";
import tagRouter from "./routes/tag.routes.js";
import aiRouter from "./routes/ai.routes.js";

const app = express();

app.set('etag', false);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/cookbooks', cookbookRouter);
app.use('/recipes', recipeRouter);
app.use('/plans', planRouter);
app.use('/favorites', favoriteRouter);
app.use('/tags', tagRouter);
app.use('/ai', aiRouter);

app.use('/public', express.static('src/public'));

export default app;
