DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS user_tags;
DROP TABLE IF EXISTS shopping_list_items;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS meal_plan_items;
DROP TABLE IF EXISTS meal_plans;
DROP TABLE IF EXISTS cookbook_messages;
DROP TABLE IF EXISTS cookbook_recipe_comments;
DROP TABLE IF EXISTS cookbook_recipes;
DROP TABLE IF EXISTS recipe_steps;
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS cookbook_users;
DROP TABLE IF EXISTS cookbooks;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    rgpd BOOLEAN NOT NULL DEFAULT FALSE,
    google_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cookbooks (
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cookbook_users (
    id SERIAL PRIMARY KEY,
    cookbook_id INT NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cookbook_messages (
    id SERIAL PRIMARY KEY,
    cookbook_id INT NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    prepTime INT NOT NULL,
    cookTime INT DEFAULT 0,
    servings INT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    owner INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    key VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_tags (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) DEFAULT NULL,
    type VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_steps (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cookbook_recipes (
    id SERIAL PRIMARY KEY,
    cookbook_id INT NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cookbook_recipe_comments (
    id SERIAL PRIMARY KEY,
    cookbook_recipe_id INT NOT NULL REFERENCES cookbook_recipes(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    cookbook_id INT NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
    comment_id INT REFERENCES cookbook_recipe_comments(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    excerpt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meal_plans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    cookbook_id INT REFERENCES cookbooks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meal_plan_items (
    id SERIAL PRIMARY KEY,
    meal_plan_id INT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_tags (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, tag_id)
);

CREATE TABLE shopping_list_items (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, ingredient_id)
);





INSERT INTO tags (name, key, category) VALUES
('Je mange de tout', 'all', 'Régime'),
('Végétarien', 'vegetarian', 'Régime'),
('Vegan', 'vegan', 'Régime'),
('Flexitarien', 'flexitarian', 'Régime'),
('Pescétarien', 'pescetarian', 'Régime'),
('Keto', 'keto', 'Régime'),
('Low carbs', 'low_carbs', 'Régime'),
('Sans gluten', 'gluten_free', 'Régime'),
('Sans lactose', 'lactose', 'Allergies'),
('Sans arachides', 'peanuts', 'Allergies'),
('Sans fruits à coque', 'tree_nuts', 'Allergies'),
('Sans œufs', 'eggs', 'Allergies'),
('Sans soja', 'soy', 'Allergies'),
('Sans crustacés', 'shellfish', 'Allergies'),
('Aucun', 'none', 'Éviter'),
('Sans porc', 'pork', 'Éviter'),
('Sans produits laitiers', 'dairy', 'Éviter'),
('Sans fruits de mer', 'seafood', 'Éviter'),
('Sans poissons', 'fish', 'Éviter'),
('Sans abats', 'offal', 'Éviter'),
('Sans champignons', 'mushrooms', 'Éviter'),
('Sans oignons', 'onions', 'Éviter'),
('Poulet', 'chicken', 'Favoris'),
('Saumon', 'salmon', 'Favoris'),
('Fromage', 'cheese', 'Favoris'),
('Avocat', 'avocado', 'Favoris'),
('Courgettes', 'zucchini', 'Favoris'),
('Tomates', 'tomatoes', 'Favoris'),
('Pâtes', 'pasta', 'Favoris'),
('Riz', 'rice', 'Favoris'),
('Pommes de terre', 'potatoes', 'Favoris'),
('Chocolat', 'chocolate', 'Favoris'),
('Française', 'french', 'Cuisines'),
('Italienne', 'italian', 'Cuisines'),
('Japonaise', 'japanese', 'Cuisines'),
('Mexicaine', 'mexican', 'Cuisines'),
('Indienne', 'indian', 'Cuisines'),
('Chinoise', 'chinese', 'Cuisines'),
('Méditerranéenne', 'mediterranean', 'Cuisines'),
('Américaine', 'american', 'Cuisines'),
('Thaïlandaise', 'thai', 'Cuisines'),
('Fusion', 'fusion', 'Cuisines'),
('Express', 'express', 'Préparation'),
('Facile', 'easy', 'Préparation'),
('Batch cooking', 'batch_cooking', 'Préparation'),
('One pot', 'one_pot', 'Préparation'),
('À préparer à l’avance', 'make_ahead', 'Préparation');

