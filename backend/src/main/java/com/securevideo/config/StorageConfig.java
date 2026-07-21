package com.securevideo.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StorageConfig {

    @Value("${securevideo.storage.path}")
    private String storagePath;

    @Value("${securevideo.storage.chunks}")
    private String chunksPath;

    @Value("${securevideo.storage.videos}")
    private String videosPath;

    @PostConstruct
    public void init() {
        try {
            createDirectoryIfNotExists(storagePath);
            createDirectoryIfNotExists(chunksPath);
            createDirectoryIfNotExists(videosPath);
            System.out.println("Storage directories initialized:");
            System.out.println("  Storage: " + Paths.get(storagePath).toAbsolutePath());
            System.out.println("  Chunks:  " + Paths.get(chunksPath).toAbsolutePath());
            System.out.println("  Videos:  " + Paths.get(videosPath).toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Failed to create storage directories: " + e.getMessage(), e);
        }
    }

    private void createDirectoryIfNotExists(String dirPath) throws IOException {
        Path path = Paths.get(dirPath);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
    }

    public String getStoragePath() {
        return storagePath;
    }

    public String getChunksPath() {
        return chunksPath;
    }

    public String getVideosPath() {
        return videosPath;
    }
}