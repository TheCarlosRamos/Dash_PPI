-- Cria o banco de dados se não existir
SELECT 'CREATE DATABASE ppi_database' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ppi_database')\gexec

-- Cria o usuário se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
    END IF;
END
$$;

-- Concede permissões
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;

-- Conecta ao banco de dados
\c postgres

-- Cria a tabela de projetos se não existir
CREATE TABLE IF NOT EXISTS "Projects" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sourceId" VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sector VARCHAR(100) NOT NULL,
    "subSector" VARCHAR(100),
    status VARCHAR(50),
    "estimatedCost" FLOAT,
    progress INTEGER,
    "currentSituation" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- Cria a tabela de perguntas se não existir
CREATE TABLE IF NOT EXISTS "Questions" (
    id SERIAL PRIMARY KEY,
    "cod_source" VARCHAR(50) NOT NULL UNIQUE,
    "question_id" VARCHAR(50),
    "dsc_type" VARCHAR(50) NOT NULL,
    "dsc_title" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Concede permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Cria um índice para melhorar consultas por sourceId
CREATE INDEX IF NOT EXISTS idx_projects_source_id ON "Projects"("sourceId");
