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
            System.out.println("========================================");
            System.out.println("UPLOAD FAILED");
            System.out.println("Reason: " + e.getMessage());
            System.out.println("========================================");
            throw new RuntimeException("Failed to create storage directories: " + e.getMessage(), e);
        }
    }

    private int getAdaptiveChunkSize(double networkSpeedMbps) {
        System.out.println("========================================");
        System.out.println("NETWORK ANALYSIS");
        System.out.println("========================================");
        
        int chunkSize;
         
        if (networkSpeedMbps < 5) {
            chunkSize = 512 * 1024; // 512 KB for slow connections
        } else if (networkSpeedMbps < 20) {
            chunkSize = 2 * 1024 * 1024; // 2 MB for medium connections
        } else {
            chunkSize = 4 * 1024 * 1024; // 4 MB for fast connections
        }
        System.out.println("Network Speed: " + networkSpeedMbps + " Mbps");
        if (chunkSize >= 1024 * 1024) {
            System.out.println("Selected Chunk Size: " + (chunkSize / (1024 * 1024)) + " MB");
        } else {
            System.out.println("Selected Chunk Size: " + (chunkSize / 1024) + " KB");
        }
        return chunkSize;
    }

    public Map<String, Object> uploadVideo(MultipartFile file, String title, String description,
                                            String tags, String userId, boolean encrypt,
                                            double networkSpeedMbps) {
        try {
            String videoId = KeyGeneratorUtil.generateVideoId();

            Path videoDir = Paths.get(videosPath);
            if (!Files.exists(videoDir)) {
                Files.createDirectories(videoDir);
            }

            Path tempFilePath = videoDir.resolve(videoId + "_original");
            file.transferTo(tempFilePath.toFile());

            System.out.println("========================================");
            System.out.println("VIDEO UPLOAD STARTED");
            System.out.println("========================================");
            System.out.println("Video ID: " + videoId);
            System.out.println("Title: " + title);
            System.out.println("Original File: " + file.getOriginalFilename());
            System.out.println("File Size: " + file.getSize() + " bytes");
            System.out.println("Storage Path: " + tempFilePath.toAbsolutePath());
            System.out.println("========================================");

            File tempFile = tempFilePath.toFile();

            int chunkSize = getAdaptiveChunkSize(networkSpeedMbps);
            List<VideoChunk> chunks = chunkService.splitVideo(tempFile, videoId, userId, chunkSize);

            System.out.println("========================================");
            System.out.println("VIDEO CHUNKING COMPLETED");
            System.out.println("========================================");
            System.out.println("Video ID: " + videoId);
            System.out.println("Total Chunks: " + chunks.size());
            if (chunkSize >= 1024 * 1024) {
                System.out.println("Chunk Size: " + (chunkSize / (1024 * 1024)) + " MB");
            } else {
                System.out.println("Chunk Size: " + (chunkSize / 1024) + " KB");
            }
            System.out.println("========================================");

            SecretKey aesKey = KeyGeneratorUtil.generateAESKey();
            String aesKeyBase64 = KeyGeneratorUtil.secretKeyToBase64(aesKey);

            KeyPair eccKeyPair = KeyGeneratorUtil.generateECCKeyPair();
            String eccPublicKey = KeyGeneratorUtil.publicKeyToBase64(eccKeyPair.getPublic());
            String eccPrivateKey = KeyGeneratorUtil.privateKeyToBase64(eccKeyPair.getPrivate());

            if (encrypt) {
                System.out.println("Stage 1: Setting all chunks to ENCRYPTING_AES");
                for (int i = 0; i < chunks.size(); i++) {
                    VideoChunk chunk = chunks.get(i);
                    chunk.setChunkSizeBytes(chunkSize);
                    chunk.setEncryptionStatus("ENCRYPTING_AES");
                    videoChunkRepository.save(chunk);
                }

                System.out.println("Stage 2: Encrypting all chunks with AES");
                for (int i = 0; i < chunks.size(); i++) {
                    VideoChunk chunk = chunks.get(i);
                    try {
                        chunkService.encryptChunk(chunk, aesKey);
                        chunk.setAesKeyEncrypted(aesKeyBase64);
                        chunk.setEncryptionStatus("AES_DONE");
                        videoChunkRepository.save(chunk);
                    } catch (Exception e) {
                        System.err.println("Failed to encrypt chunk " + i + ": " + e.getMessage());
                        chunk.setEncryptionStatus("FAILED");
                        videoChunkRepository.save(chunk);
                        System.out.println("========================================");
                        System.out.println("UPLOAD FAILED");
                        System.out.println("Reason: Encryption failed for chunk " + i + " - " + e.getMessage());
                        System.out.println("========================================");
                        throw new RuntimeException("Encryption failed for chunk " + i + ": " + e.getMessage(), e);
                    }
                }

                System.out.println("Stage 3: Setting all chunks to ENCRYPTED");
                for (int i = 0; i < chunks.size(); i++) {
                    VideoChunk chunk = chunks.get(i);
                    chunk.setEncryptionStatus("ENCRYPTED");
                    videoChunkRepository.save(chunk);
                }

                System.out.println("========================================");
                System.out.println("VIDEO ENCRYPTION COMPLETED");
                System.out.println("========================================");
                System.out.println("Encrypted Chunks: " + chunks.size());
                System.out.println("AES Encryption : SUCCESS");
                System.out.println("========================================");
            } else {
                for (VideoChunk chunk : chunks) {
                    chunk.setChunkSizeBytes(chunkSize);
                    videoChunkRepository.save(chunk);
                }
            }

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

            System.out.println("========================================");
            System.out.println("UPLOAD COMPLETED SUCCESSFULLY");
            System.out.println("========================================");
            System.out.println("Video ID: " + videoId);
            System.out.println("Title: " + title);
            System.out.println("File Size: " + file.getSize() + " bytes");
            System.out.println("Total Chunks: " + chunks.size());
            System.out.println("Encryption Status: " + (encrypt ? "ENCRYPTED" : "UNENCRYPTED"));
            System.out.println("ECC Public Key Generated: YES");
            System.out.println("========================================");

            return response;
        } catch (IOException e) {
            System.out.println("========================================");
            System.out.println("UPLOAD FAILED");
            System.out.println("Reason: " + e.getMessage());
            System.out.println("========================================");
            throw new RuntimeException("Video upload failed: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getEncryptionStatus(String videoId) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);
        if (chunks.isEmpty()) throw new RuntimeException("Video not found: " + videoId);
        int totalChunks = chunks.size();
        long encryptedCount = chunks.stream().filter(c -> "ENCRYPTED".equals(c.getEncryptionStatus())).count();
        long aesDoneCount = chunks.stream().filter(c -> "AES_DONE".equals(c.getEncryptionStatus())).count();
        long encryptingCount = chunks.stream().filter(c -> "ENCRYPTING_AES".equals(c.getEncryptionStatus())).count();
        String stage;
        if (encryptedCount == totalChunks) stage = "ENCRYPTED";
        else if (aesDoneCount == totalChunks) stage = "AES_DONE";
        else if (encryptingCount > 0 || aesDoneCount > 0 || encryptedCount > 0) stage = "ENCRYPTING_AES";
        else stage = "CHUNKED";
        Map<String, Object> status = new HashMap<>();
        status.put("stage", stage);
        status.put("videoId", videoId);
        status.put("totalChunks", totalChunks);
        status.put("encryptedChunks", (int) encryptedCount);
        return status;
    }

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
            long encryptedCount = videoChunks.stream().filter(c -> "ENCRYPTED".equals(c.getEncryptionStatus())).count();
            String overallStatus;
            if (encryptedCount == totalChunks) overallStatus = "ENCRYPTED";
            else if (encryptedCount > 0) overallStatus = "PROCESSING";
            else {
                long aesDoneCount = videoChunks.stream().filter(c -> "AES_DONE".equals(c.getEncryptionStatus())).count();
                long processingCount = videoChunks.stream().filter(c -> "ENCRYPTING_AES".equals(c.getEncryptionStatus())).count();
                if (aesDoneCount > 0 || processingCount > 0) overallStatus = "PROCESSING";
                else overallStatus = metadataChunk.getEncryptionStatus() != null ? metadataChunk.getEncryptionStatus() : "UNENCRYPTED";
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

    public Map<String, Object> getVideoById(String videoId, String userId) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);
        if (chunks.isEmpty()) throw new RuntimeException("Video not found");
        VideoChunk firstChunk = chunks.get(0);
        int totalChunks = chunks.size();
        long encryptedCount = chunks.stream().filter(c -> "ENCRYPTED".equals(c.getEncryptionStatus())).count();
        String overallStatus;
        if (encryptedCount == totalChunks) overallStatus = "ENCRYPTED";
        else if (encryptedCount > 0) overallStatus = "PROCESSING";
        else {
            long aesDoneCount = chunks.stream().filter(c -> "AES_DONE".equals(c.getEncryptionStatus())).count();
            long processingCount = chunks.stream().filter(c -> "ENCRYPTING_AES".equals(c.getEncryptionStatus())).count();
            if (aesDoneCount > 0 || processingCount > 0) overallStatus = "PROCESSING";
            else overallStatus = firstChunk.getEncryptionStatus() != null ? firstChunk.getEncryptionStatus() : "UNENCRYPTED";
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

    public void deleteVideo(String videoId, String userId) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);
        for (VideoChunk chunk : chunks) {
            try {
                if (chunk.getChunkStoragePath() != null) Files.deleteIfExists(Paths.get(chunk.getChunkStoragePath()));
                if (chunk.getEncryptedStoragePath() != null) Files.deleteIfExists(Paths.get(chunk.getEncryptedStoragePath()));
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