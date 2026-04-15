package com.logistics.app.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class RoundsLiteSchemaInitializer {

    @Bean
    public ApplicationRunner ensureRoundsLiteSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_name = 'rounds_lite_room'
                      AND column_name = 'matchmaking_room'
                    """,
                    Integer.class
            );

            if (count == null || count == 0) {
                jdbcTemplate.execute(
                        """
                        ALTER TABLE rounds_lite_room
                        ADD COLUMN matchmaking_room boolean NOT NULL DEFAULT false
                        """
                );
            }
        };
    }
}