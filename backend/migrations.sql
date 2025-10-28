-- migrations SQL placeholder
CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT, email TEXT UNIQUE, password_hash TEXT);
CREATE TABLE IF NOT EXISTS results (id SERIAL PRIMARY KEY, user_id INT, score INT, total INT, created_at TIMESTAMP DEFAULT NOW());
