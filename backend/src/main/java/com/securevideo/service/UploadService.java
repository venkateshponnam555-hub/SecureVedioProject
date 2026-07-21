package com.securevideo.service;

import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.crypto.ECCKeyExchange;
import com.securevideo.crypto.HashUtil;
import com.securevideo.crypto.KeyGeneratorUtil;
import com.securevideo.model.VideoChunk;
import com.securevideo.repository.VideoChunkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.time.Instant;
import java.util.*;

@Service
public class UploadService {

    private static final int CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk

    private final ChunkService chunkService;
    private final VideoChunkRepository videoChunkRepository;

    private final String storagePath;
    private final String chunksPath;
    private final String videosPath;

    public UploadService(ChunkService chunkService,
                         VideoChunkRepository videoChunkRepository,
                         @Value("${securevideo.storage.path:./storage}") String storagePath,
                         @Value("${securevideo.storage.chunks:./storage/chunks}") String chunksPath,
                         @Value("${securevideo.storage.videos:./storage/videos}") String videosPath) {
        this.chunkService = chunkService;
        this.videoChunkRepository = videoChunkRepository;

        String projectRoot = System.getProperty("user.dir");
        this.storagePath = Paths.get(projectRoot, storagePath).toAbsolutePath().toString();
        this.chunksPath = Paths.get(projectRoot, chunksPath).toAbsolutePath().toString();
        this.videosPath = Paths.get(projectRoot, videosPath).toAbsolutePath().toString();

        createDirectories();

        System.out.println("============================================");
        System.out.println("  Storage Paths Initialized:");
        System.out.println("  Storage: " + this.storagePath);
        System.out.println("  Chunks:  " + this.chunksPath);
        System.out.println("  Videos:  " + this.videosPath);
        System.out.println("============================================");
    }

    private void createDirectories() {
        try {
            Files.createDirectories(Paths.get(storagePath));
            Files.createDirectories(Paths.get(chunksPath));
            Files.createDirectories(Paths.get(videosPath));
        } catch (IOException e) {
            throw new RuntimeException("Failed to create storage directories: " + e.getMessage(), e);
        }
    }

    /**
     * Upload video file, split into chunks, encrypt each chunk
     */
    public Map<String, Object> uploadVideo(MultipartFile file, String title, String description,
                                            String tags, String userId, boolean encrypt) {
        try {
            String videoId = KeyGeneratorUtil.generateVideoId();

            // Ensure directories exist before saving
            Path videoDir = Paths.get(videosPath);
            if (!Files.exists(videoDir)) {
                Files.createDirectories(videoDir);
            }

            // Save original video using absolute path
            Path tempFilePath = videoDir.resolve(videoId + "_original");
            System.out.println("Saving video to: " + tempFilePath.toAbsolutePath());
            file.transferTo(tempFilePath.toFile());

            File tempFile = tempFilePath.toFile();

            // Split into chunks - status becomes CHUNKED in database
            List<VideoChunk> chunks = chunkService.splitVideo(tempFile, videoId, userId, CHUNK_SIZE);

            // Generate AES key for this video
            SecretKey aesKey = KeyGeneratorUtil.generateAESKey();
            String aesKeyBase64 = KeyGeneratorUtil.secretKeyToBase64(aesKey);

            // Generate ECC key pair for sender
            KeyPair eccKeyPair = KeyGeneratorUtil.generateECCKeyPair();
            String eccPublicKey = KeyGeneratorUtil.publicKeyToBase64(eccKeyPair.getPublic());
            String eccPrivateKey = KeyGeneratorUtil.privateKeyToBase64(eccKeyPair.getPrivate());

            // Encrypt each chunk if requested
            if (encrypt) {
                // Stage 1: ENCRYPTING_AES
                System.out.println("Stage 1: Setting all chunks to ENCRYPTING_AES");
                for (int i = 0; i < chunks.size(); i++) {
                    VideoChunk chunk = chunks.get(i);
                    chunk.setEncryptionStatus("ENCRYPTING_AES");
                    videoChunkRepository.save(chunk);
                    System.out.println("Chunk " + i + " status set to ENCRYPTING_AES");
                }

                // Stage 2: Perform AES encryption -> AES_DONE
                System.out.println("Stage 2: Encrypting all chunks with AES");
                for (int i = 0; i < chunks.size(); i++) {
                    VideoChunk chunk = chunks.get(i);
                    try {
                        chunkService.encryptChunk(chunk, aesKey);
                        chunk.setAesKeyEncrypted(aesKeyBase64);
                        chunk.setEncryptionStatus("AES_DONE");
                        videoChunkRepository.save(chunk);
                        System.out.println("Chunk " + i + " encrypted successfully, status: AES_DONE");
                    } catch (Exception e) {
                        System.err.println("Failed to encrypt chunk " + i + ": " + e.getMessage());
                        chunk.setEncryptionStatus("FAILED");
                        videoChunkRepository.save(chunk);
                        throw new RuntimeException("Encryption failed for chunk " + i + ": " + e.getMessage(), e);
                    }
                }

                // Stage 3: Final -> ENCRYPTED
                System.out.println("Stage 3: Setting all chunks to ENCRYPTED");
                for (int i = 0; i < chunks.size(); i++) {
                    VideoChunk chunk = chunks.get(i);
                    System.out.println("Chunk " + i + " current status before final update: " + chunk.getEncryptionStatus());
                    chunk.setEncryptionStatus("ENCRYPTED");
                    videoChunkRepository.save(chunk);
                    System.out.println("Chunk " + i + " status after save: ENCRYPTED");
                }

                // Verification
                System.out.println("Verifying final status of all chunks...");
                List<VideoChunk> verifyChunks = videoChunkRepository.findByVideoId(videoId);
                for (int i = 0; i < verifyChunks.size(); i++) {
                    System.out.println("Verification - Chunk " + i + " status: " + verifyChunks.get(i).getEncryptionStatus());
                }
            }

            // Set metadata on first chunk
            if (!chunks.isEmpty()) {
                VideoChunk firstChunk = chunks.get(0);
                firstChunk.setTitle(title);
                firstChunk.setDescription(description);
                firstChunk.setTags(tags);
                firstChunk.setOriginalFileName(file.getOriginalFilename());
                firstChunk.setFileSize(file.getSize());
                firstChunk.setFormat(getFileExtension(file.getOriginalFilename()));
                videoChunkRepository.save(firstChunk);
            }

            // Clean up temp file
            tempFile.delete();

            Map<String, Object> response = new HashMap<>();
            response.put("_id", videoId);
            response.put("id", videoId);
            response.put("title", title);
            response.put("fileSize", file.getSize());
            response.put("format", getFileExtension(file.getOriginalFilename()));
            response.put("totalChunks", chunks.size());
            response.put("encryptionStatus", encrypt ? "ENCRYPTED" : "UNENCRYPTED");
            response.put("eccPublicKey", eccPublicKey);
            response.put("createdAt", Instant.now());

            return response;
        } catch (IOException e) {
            throw new RuntimeException("Video upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Get encryption status for polling
     * Returns stages: CHUNKED -> ENCRYPTING_AES -> AES_DONE -> ENCRYPTED
     */
    public Map<String, Object> getEncryptionStatus(String videoId) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);

        if (chunks.isEmpty()) {
            throw new RuntimeException("Video not found: " + videoId);
        }

        int totalChunks = chunks.size();

        long encryptedCount = chunks.stream()
                .filter(c -> "ENCRYPTED".equals(c.getEncryptionStatus()))
                .count();
        long aesDoneCount = chunks.stream()
                .filter(c -> "AES_DONE".equals(c.getEncryptionStatus()))
                .count();
        long encryptingCount = chunks.stream()
                .filter(c -> "ENCRYPTING_AES".equals(c.getEncryptionStatus()))
                .count();

        String stage;
        if (encryptedCount == totalChunks) {
            stage = "ENCRYPTED";
        } else if (aesDoneCount == totalChunks) {
            stage = "AES_DONE";
        } else if (encryptingCount > 0 || aesDoneCount > 0 || encryptedCount > 0) {
            stage = "ENCRYPTING_AES";
        } else {
            stage = "CHUNKED";
        }

        Map<String, Object> status = new HashMap<>();
        status.put("stage", stage);
        status.put("videoId", videoId);
        status.put("totalChunks", totalChunks);
        status.put("encryptedChunks", (int) encryptedCount);
        return status;
    }

    /**
     * Get all videos for a user
     */
    public List<Map<String, Object>> getUserVideos(String userId) {
        List<VideoChunk> allChunks = videoChunkRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Map<String, List<VideoChunk>> groupedByVideo = new LinkedHashMap<>();
        for (VideoChunk chunk : allChunks) {
            groupedByVideo.computeIfAbsent(chunk.getVideoId(), k -> new ArrayList<>()).add(chunk);
        }

        List<Map<String, Object>> videos = new ArrayList<>();
        for (Map.Entry<String, List<VideoChunk>> entry : groupedByVideo.entrySet()) {
            String videoId = entry.getKey();
            List<VideoChunk> videoChunks = entry.getValue();

            if (videoChunks.isEmpty()) continue;

            VideoChunk metadataChunk = videoChunks.get(0);

            int totalChunks = videoChunks.size();
            long encryptedCount = videoChunks.stream()
                    .filter(c -> "ENCRYPTED".equals(c.getEncryptionStatus()))
                    .count();

            String overallStatus;
            if (encryptedCount == totalChunks) {
                overallStatus = "ENCRYPTED";
            } else if (encryptedCount > 0) {
                overallStatus = "PROCESSING";
            } else {
                long aesDoneCount = videoChunks.stream()
                        .filter(c -> "AES_DONE".equals(c.getEncryptionStatus()))
                        .count();
                long processingCount = videoChunks.stream()
                        .filter(c -> "ENCRYPTING_AES".equals(c.getEncryptionStatus()))
                        .count();
                if (aesDoneCount > 0 || processingCount > 0) {
                    overallStatus = "PROCESSING";
                } else {
                    overallStatus = metadataChunk.getEncryptionStatus() != null
                            ? metadataChunk.getEncryptionStatus() : "UNENCRYPTED";
                }
            }

            Map<String, Object> video = new HashMap<>();
            video.put("_id", videoId);
            video.put("id", videoId);
            video.put("title", metadataChunk.getTitle() != null ? metadataChunk.getTitle() : "Untitled");
            video.put("description", metadataChunk.getDescription());
            video.put("fileSize", metadataChunk.getFileSize());
            video.put("format", metadataChunk.getFormat());
            video.put("encryptionStatus", overallStatus);
            video.put("createdAt", metadataChunk.getCreatedAt());
            video.put("uploadDate", metadataChunk.getCreatedAt());
            video.put("totalChunks", metadataChunk.getTotalChunks());
            videos.add(video);
        }

        return videos;
    }

    /**
     * Get single video metadata
     */
    public Map<String, Object> getVideoById(String videoId, String userId) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);

        if (chunks.isEmpty()) {
            throw new RuntimeException("Video not found");
        }

        VideoChunk firstChunk = chunks.get(0);

        int totalChunks = chunks.size();
        long encryptedCount = chunks.stream()
                .filter(c -> "ENCRYPTED".equals(c.getEncryptionStatus()))
                .count();

        String overallStatus;
        if (encryptedCount == totalChunks) {
            overallStatus = "ENCRYPTED";
        } else if (encryptedCount > 0) {
            overallStatus = "PROCESSING";
        } else {
            long aesDoneCount = chunks.stream()
                    .filter(c -> "AES_DONE".equals(c.getEncryptionStatus()))
                    .count();
            long processingCount = chunks.stream()
                    .filter(c -> "ENCRYPTING_AES".equals(c.getEncryptionStatus()))
                    .count();
            if (aesDoneCount > 0 || processingCount > 0) {
                overallStatus = "PROCESSING";
            } else {
                overallStatus = firstChunk.getEncryptionStatus() != null
                        ? firstChunk.getEncryptionStatus() : "UNENCRYPTED";
            }
        }

        Map<String, Object> video = new HashMap<>();
        video.put("_id", videoId);
        video.put("id", videoId);
        video.put("title", firstChunk.getTitle() != null ? firstChunk.getTitle() : "Untitled");
        video.put("description", firstChunk.getDescription());
        video.put("tags", firstChunk.getTags());
        video.put("fileSize", firstChunk.getFileSize());
        video.put("format", firstChunk.getFormat());
        video.put("encryptionStatus", overallStatus);
        video.put("createdAt", firstChunk.getCreatedAt());
        video.put("totalChunks", totalChunks);
        video.put("userId", firstChunk.getUserId());
        return video;
    }

    /**
     * Delete a video and all its chunks
     */
    public void deleteVideo(String videoId, String userId) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);

        for (VideoChunk chunk : chunks) {
            try {
                if (chunk.getChunkStoragePath() != null) {
                    Files.deleteIfExists(Paths.get(chunk.getChunkStoragePath()));
                }
                if (chunk.getEncryptedStoragePath() != null) {
                    Files.deleteIfExists(Paths.get(chunk.getEncryptedStoragePath()));
                }
            } catch (IOException e) {
                System.err.println("Failed to delete chunk file: " + e.getMessage());
            }
        }

        videoChunkRepository.deleteByVideoId(videoId);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return "mp4";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot == -1) return "mp4";
        return fileName.substring(lastDot + 1).toLowerCase();
    }
}