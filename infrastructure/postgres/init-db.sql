CREATE DATABASE flowable_engine;
CREATE DATABASE custom_app_db;

\connect custom_app_db

CREATE TABLE IF NOT EXISTS application_table (
    id              BIGSERIAL PRIMARY KEY,
    app_number      VARCHAR(100) NOT NULL UNIQUE,
    customer_name   VARCHAR(255) NOT NULL,
    policy_type     VARCHAR(100) NOT NULL,
    premium_amount  NUMERIC(15,2) NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    reject_reason   TEXT,
    process_instance_id VARCHAR(100),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_table (
    id              BIGSERIAL PRIMARY KEY,
    app_number      VARCHAR(100) NOT NULL UNIQUE,
    customer_name   VARCHAR(255) NOT NULL,
    policy_type     VARCHAR(100) NOT NULL,
    premium_amount  NUMERIC(15,2) NOT NULL,
    issued_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
