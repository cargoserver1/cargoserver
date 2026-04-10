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

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_name = ?",
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }
}
