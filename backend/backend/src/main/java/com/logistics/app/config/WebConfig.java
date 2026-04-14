package com.logistics.app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public WebConfig(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        String resourceLocation = uploadRoot.toUri().toString();
        if (!resourceLocation.endsWith("/")) {
            resourceLocation = resourceLocation + "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
