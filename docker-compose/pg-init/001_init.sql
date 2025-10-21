-- Initialize PostgreSQL schema for field_report app

-- Use default DB created by POSTGRES_DB env (rapport)
\connect rapport

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(100) NOT NULL
);

-- Invest table
CREATE TABLE IF NOT EXISTS invest (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(100) NOT NULL
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  users_name VARCHAR(100) NOT NULL,
  contact_refus INTEGER NOT NULL DEFAULT 0,
  annulee_interrompue INTEGER NOT NULL DEFAULT 0,
  sans_reponse INTEGER NOT NULL DEFAULT 0,
  contact_reussi INTEGER NOT NULL DEFAULT 0,
  contact_pris INTEGER NOT NULL DEFAULT 0,
  date_contact TIMESTAMP NOT NULL
);

-- Interview table
CREATE TABLE IF NOT EXISTS interview (
  id SERIAL PRIMARY KEY,
  users_name VARCHAR(100) NOT NULL,
  nom_interlocuteur VARCHAR(255) NOT NULL,
  age_interlocuteur VARCHAR(10) NOT NULL,
  sex_interlocuteur VARCHAR(10) NOT NULL,
  lieux_interlocuteur TEXT NOT NULL,
  numero_interlocuteur VARCHAR(50) NOT NULL,
  mail_interlocuteur VARCHAR(150) NOT NULL,
  date_interview TIMESTAMP NOT NULL
);

-- Projet table
CREATE TABLE IF NOT EXISTS projet (
  id SERIAL PRIMARY KEY,
  users_name VARCHAR(100) NOT NULL,
  ville VARCHAR(100) NOT NULL,
  projet VARCHAR(100) NOT NULL,
  date_projet TIMESTAMP NOT NULL
);

-- Defaults
CREATE TABLE IF NOT EXISTS defaut_projet (
  id SERIAL PRIMARY KEY,
  projet VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS defaut_ville (
  id SERIAL PRIMARY KEY,
  ville VARCHAR(100) NOT NULL UNIQUE
);

-- Seeds
INSERT INTO users (username, code) VALUES ('Camd0101', '0101')
ON CONFLICT (username) DO UPDATE SET code = EXCLUDED.code;

INSERT INTO invest (username, code) VALUES ('Camd0101', '0101')
ON CONFLICT (username) DO UPDATE SET code = EXCLUDED.code;

INSERT INTO defaut_projet (projet) VALUES ('Retail')
ON CONFLICT (projet) DO NOTHING;
INSERT INTO defaut_projet (projet) VALUES ('Mystering-shoping')
ON CONFLICT (projet) DO NOTHING;
INSERT INTO defaut_projet (projet) VALUES ('Fleuve')
ON CONFLICT (projet) DO NOTHING;

INSERT INTO defaut_ville (ville) VALUES ('Kinshasa')
ON CONFLICT (ville) DO NOTHING;
INSERT INTO defaut_ville (ville) VALUES ('Lubumbashi')
ON CONFLICT (ville) DO NOTHING;
INSERT INTO defaut_ville (ville) VALUES ('Boma')
ON CONFLICT (ville) DO NOTHING;
