package com.securevideo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class VideoReconstructionService {

    @Value("${securevideo.storage.videos}")
    private String videosPath;

    /**
     * Merge decrypted chunks into a single video file
     */
    public Path reconstructVideo(List<byte[]> decryptedChunks, String videoId) throws IOException {
        String outputFileName = videoId + "_reconstructed_" + UUID.randomUUID().toString().substring(0, 8);
        Path outputPath = Paths.get(videosPath, outputFileName);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            for (byte[] chunk : decryptedChunks) {
                baos.write(chunk);
            }
            Files.write(outputPath, baos.toByteArray());
        }

        return outputPath;
    }

    /**
     * Merge chunks and return as byte array for streaming
     */
    public byte[] reconstructToBytes(List<byte[]> decryptedChunks) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            for (byte[] chunk : decryptedChunks) {
                baos.write(chunk);
            }
            return baos.toByteArray();
        }
    }
}