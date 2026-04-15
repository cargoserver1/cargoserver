package com.logistics.app.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SchemaPatchRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        patchShipmentTable();
        createPasswordResetTokenTable();
        createAssistantTables();
    }

    private void patchShipmentTable() {
        if (!tableExists("shipment")) {
            return;
        }

        addColumnIfMissing("shipment", "accepted_offer_id", "bigint");
        addColumnIfMissing("shipment", "agreed_price", "integer");
        addColumnIfMissing("shipment", "paid", "boolean");
        addColumnIfMissing("shipment", "payment_completed_at", "timestamp");
        addColumnIfMissing("shipment", "payment_method", "varchar(255)");
        addColumnIfMissing("shipment", "scheduled_start_at", "timestamp");

        if (tableExists("money_transaction")) {
            addColumnIfMissing("money_transaction", "payment_method", "varchar(255)");
        }

        jdbcTemplate.execute("UPDATE shipment SET paid = false WHERE paid IS NULL");
        jdbcTemplate.execute("ALTER TABLE shipment ALTER COLUMN paid SET DEFAULT false");
        jdbcTemplate.execute("ALTER TABLE shipment ALTER COLUMN paid SET NOT NULL");
    }


    private void createAssistantTables() {
        jdbcTemplate.execute(""
                + "CREATE TABLE IF NOT EXISTS assistant_guideline ("
                + "id BIGSERIAL PRIMARY KEY, "
                + "title VARCHAR(150) NOT NULL, "
                + "instruction VARCHAR(4000) NOT NULL, "
                + "active BOOLEAN NOT NULL DEFAULT TRUE, "
                + "sort_order INTEGER NOT NULL DEFAULT 0, "
                + "created_at TIMESTAMP, "
                + "updated_at TIMESTAMP"
                + ")");

        jdbcTemplate.execute(""
                + "CREATE TABLE IF NOT EXISTS assistant_chat_log ("
                + "id BIGSERIAL PRIMARY KEY, "
                + "user_id BIGINT, "
                + "question VARCHAR(2000) NOT NULL, "
                + "answer VARCHAR(8000) NOT NULL, "
                + "mode VARCHAR(50) NOT NULL, "
                + "response_mode VARCHAR(50) NOT NULL DEFAULT 'FALLBACK', "
                + "used_ai BOOLEAN NOT NULL DEFAULT FALSE, "
                + "fallback_used BOOLEAN NOT NULL DEFAULT FALSE, "
                + "matched_knowledge VARCHAR(5000), "
                + "review_status VARCHAR(30), "
                + "admin_memo VARCHAR(4000), "
                + "recommended_answer VARCHAR(8000), "
                + "created_at TIMESTAMP, "
                + "updated_at TIMESTAMP"
                + ")");

        addColumnIfMissing("assistant_guideline", "title", "varchar(150)");
        addColumnIfMissing("assistant_guideline", "instruction", "varchar(4000)");
        addColumnIfMissing("assistant_guideline", "active", "boolean");
        addColumnIfMissing("assistant_guideline", "sort_order", "integer");
        addColumnIfMissing("assistant_guideline", "created_at", "timestamp");
        addColumnIfMissing("assistant_guideline", "updated_at", "timestamp");

        addColumnIfMissing("assistant_chat_log", "user_id", "bigint");
        addColumnIfMissing("assistant_chat_log", "question", "varchar(2000)");
        addColumnIfMissing("assistant_chat_log", "answer", "varchar(8000)");
        addColumnIfMissing("assistant_chat_log", "mode", "varchar(50)");
        addColumnIfMissing("assistant_chat_log", "response_mode", "varchar(50)");
        addColumnIfMissing("assistant_chat_log", "used_ai", "boolean");
        addColumnIfMissing("assistant_chat_log", "fallback_used", "boolean");
        addColumnIfMissing("assistant_chat_log", "matched_knowledge", "varchar(5000)");
        addColumnIfMissing("assistant_chat_log", "review_status", "varchar(30)");
        addColumnIfMissing("assistant_chat_log", "admin_memo", "varchar(4000)");
        addColumnIfMissing("assistant_chat_log", "recommended_answer", "varchar(8000)");
        addColumnIfMissing("assistant_chat_log", "created_at", "timestamp");
        addColumnIfMissing("assistant_chat_log", "updated_at", "timestamp");

        jdbcTemplate.execute("UPDATE assistant_guideline SET active = TRUE WHERE active IS NULL");
        jdbcTemplate.execute("UPDATE assistant_guideline SET sort_order = 0 WHERE sort_order IS NULL");
        jdbcTemplate.execute("ALTER TABLE assistant_guideline ALTER COLUMN active SET DEFAULT TRUE");
        jdbcTemplate.execute("ALTER TABLE assistant_guideline ALTER COLUMN sort_order SET DEFAULT 0");

        jdbcTemplate.execute("UPDATE assistant_chat_log SET used_ai = FALSE WHERE used_ai IS NULL");
        jdbcTemplate.execute("UPDATE assistant_chat_log SET fallback_used = FALSE WHERE fallback_used IS NULL");
        jdbcTemplate.execute("UPDATE assistant_chat_log SET response_mode = COALESCE(NULLIF(mode, ''), 'FALLBACK') WHERE response_mode IS NULL OR response_mode = ''");
        jdbcTemplate.execute("UPDATE assistant_chat_log SET review_status = 'NEW' WHERE review_status IS NULL OR review_status = ''");
        jdbcTemplate.execute("ALTER TABLE assistant_chat_log ALTER COLUMN used_ai SET DEFAULT FALSE");
        jdbcTemplate.execute("ALTER TABLE assistant_chat_log ALTER COLUMN fallback_used SET DEFAULT FALSE");
        jdbcTemplate.execute("ALTER TABLE assistant_chat_log ALTER COLUMN response_mode SET DEFAULT 'FALLBACK'");
        jdbcTemplate.execute("ALTER TABLE assistant_chat_log ALTER COLUMN fallback_used SET NOT NULL");
        jdbcTemplate.execute("ALTER TABLE assistant_chat_log ALTER COLUMN response_mode SET NOT NULL");

        addForeignKeyIfMissing(
                "assistant_chat_log",
                "fk_assistant_chat_log_user",
                "FOREIGN KEY (user_id) REFERENCES users(id)"
        );
    }

    private void createPasswordResetTokenTable() {
        jdbcTemplate.execute(""
                + "CREATE TABLE IF NOT EXISTS password_reset_token ("
                + "id BIGSERIAL PRIMARY KEY, "
                + "email VARCHAR(255) NOT NULL UNIQUE, "
                + "code_hash VARCHAR(255), "
                + "expires_at TIMESTAMP, "
                + "daily_request_count INTEGER NOT NULL DEFAULT 0, "
                + "request_count_date TIMESTAMP, "
                + "failed_attempt_count INTEGER NOT NULL DEFAULT 0, "
                + "locked_until TIMESTAMP, "
                + "verified_at TIMESTAMP, "
                + "reset_token VARCHAR(255), "
                + "reset_token_expires_at TIMESTAMP, "
                + "used BOOLEAN NOT NULL DEFAULT FALSE, "
                + "last_sent_at TIMESTAMP, "
                + "created_at TIMESTAMP, "
                + "updated_at TIMESTAMP"
                + ")");
    }

    private void addColumnIfMissing(String tableName, String columnName, String columnDefinition) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.columns where table_name = ? and column_name = ?",
                Integer.class,
                tableName,
                columnName
        );

        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDefinition);
        }
    }

    private void addForeignKeyIfMissing(String tableName, String constraintName, String constraintDefinition) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.table_constraints where table_name = ? and constraint_name = ?",
                Integer.class,
                tableName,
                constraintName
        );

        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD CONSTRAINT " + constraintName + " " + constraintDefinition);
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_name = ?",
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }
}
