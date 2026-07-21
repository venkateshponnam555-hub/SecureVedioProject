package com.securevideo.controller;

import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.crypto.HashUtil;
import com.securevideo.model.VideoChunk;
import com.securevideo.security.JwtUtil;
import com.securevideo.service.ChunkService;
import com.securevideo.service.DecryptionService;
import com.securevideo.service.VideoReconstructionService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DownloadController {

    private final ChunkService chunkService;
    private final DecryptionService decryptionService;
    private final VideoReconstructionService videoReconstructionService;

    public DownloadController(ChunkService chunkService,
                               DecryptionService decryptionService,
                               VideoReconstructionService videoReconstructionService) {
        this.chunkService = chunkService;
        this.decryptionService = decryptionService;
        this.videoReconstructionService = videoReconstructionService;
    }

    @GetMapping("/stream/{id}")
    public ResponseEntity<?> streamVideo(@PathVariable String id,
                                          @RequestParam(required = false) String sharedSecret,
                                          @RequestParam(required = false) String encryptedAesKey,
                                          @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            List<VideoChunk> chunks = chunkService.getChunksByVideoId(id);
            if (chunks.isEmpty()) return ResponseEntity.notFound().build();

            VideoChunk firstChunk = chunks.get(0);
            String encryptionStatus = firstChunk.getEncryptionStatus();
            String videoOwnerId = firstChunk.getUserId();

            String currentUserId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (JwtUtil.validateToken(token)) currentUserId = JwtUtil.getUserIdFromToken(token);
            }

            boolean isOwner = (currentUserId != null && currentUserId.equals(videoOwnerId));
            byte[] videoData;

            if ("ENCRYPTED".equals(encryptionStatus)) {
                if (isOwner) {
                    videoData = decryptForOwner(chunks);
                } else if (sharedSecret != null && !sharedSecret.isEmpty()
                        && encryptedAesKey != null && !encryptedAesKey.isEmpty()) {
                    List<byte[]> decryptedChunks = decryptionService.decryptVideo(id, sharedSecret, encryptedAesKey);
                    videoData = videoReconstructionService.reconstructToBytes(decryptedChunks);
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Shared secret and encrypted AES key required"));
                }
            } else {
                videoData = combineRawChunks(chunks);
            }

            String format = firstChunk.getFormat() != null ? firstChunk.getFormat() : "mp4";
            ByteArrayResource resource = new ByteArrayResource(videoData);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("video/" + format))
                    .contentLength(videoData.length)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"video." + format + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Stream failed: " + e.getMessage()));
        }
    }

    @GetMapping("/stream/decrypted/{id}")
    public ResponseEntity<Resource> streamDecryptedVideo(@PathVariable String id,
                                                           @RequestParam String sharedSecret,
                                                           @RequestParam String encryptedAesKey) {
        try {
            List<VideoChunk> chunks = chunkService.getChunksByVideoId(id);
            if (chunks.isEmpty()) return ResponseEntity.notFound().build();
            VideoChunk firstChunk = chunks.get(0);
            List<byte[]> decryptedChunks = decryptionService.decryptVideo(id, sharedSecret, encryptedAesKey);
            byte[] videoData = videoReconstructionService.reconstructToBytes(decryptedChunks);
            String format = firstChunk.getFormat() != null ? firstChunk.getFormat() : "mp4";
            ByteArrayResource resource = new ByteArrayResource(videoData);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("video/" + format))
                    .contentLength(videoData.length)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"video." + format + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadVideo(@PathVariable String id,
                                            @RequestParam(required = false) String sharedSecret,
                                            @RequestParam(required = false) String encryptedAesKey,
                                            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            List<VideoChunk> chunks = chunkService.getChunksByVideoId(id);
            if (chunks.isEmpty()) return ResponseEntity.notFound().build();

            VideoChunk firstChunk = chunks.get(0);
            String encryptionStatus = firstChunk.getEncryptionStatus();
            String videoOwnerId = firstChunk.getUserId();

            String currentUserId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (JwtUtil.validateToken(token)) currentUserId = JwtUtil.getUserIdFromToken(token);
            }

            boolean isOwner = (currentUserId != null && currentUserId.equals(videoOwnerId));
            byte[] videoData;
            if ("ENCRYPTED".equals(encryptionStatus)) {
    videoData = decryptForOwner(chunks);
} else {
    videoData = combineRawChunks(chunks);
}

           
            

            String format = firstChunk.getFormat() != null ? firstChunk.getFormat() : "mp4";
            String fileName = (firstChunk.getTitle() != null ? firstChunk.getTitle() : "video") + "." + format;
            ByteArrayResource resource = new ByteArrayResource(videoData);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(videoData.length)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Download failed: " + e.getMessage()));
        }
    }

    @GetMapping("/metadata/{id}")
    public ResponseEntity<?> getVideoMetadata(@PathVariable String id) {
        try {
            List<VideoChunk> chunks = chunkService.getChunksByVideoId(id);
            if (chunks.isEmpty()) return ResponseEntity.notFound().build();
            VideoChunk firstChunk = chunks.get(0);
            return ResponseEntity.ok(Map.of(
                    "videoId", id, "title", firstChunk.getTitle(),
                    "description", firstChunk.getDescription(), "fileSize", firstChunk.getFileSize(),
                    "format", firstChunk.getFormat(), "totalChunks", chunks.size(),
                    "encryptionStatus", firstChunk.getEncryptionStatus()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    private byte[] decryptForOwner(List<VideoChunk> chunks) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        for (VideoChunk chunk : chunks) {
            String aesKeyBase64 = chunk.getAesKeyEncrypted();
            if (aesKeyBase64 == null || aesKeyBase64.isEmpty())
                throw new RuntimeException("AES key not found for chunk " + chunk.getChunkIndex());
            byte[] decodedKey = Base64.getDecoder().decode(aesKeyBase64);
            SecretKey aesKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, "AES");
            Path encryptedPath = Paths.get(chunk.getEncryptedStoragePath());
            byte[] encryptedData = Files.readAllBytes(encryptedPath);
            byte[] decryptedData = EncryptionUtil.decryptFromBytes(encryptedData, aesKey);
            String computedHash = HashUtil.sha512(decryptedData);
            if (chunk.getChunkHash() != null && !computedHash.equals(chunk.getChunkHash()))
                throw new RuntimeException("Hash verification failed for chunk " + chunk.getChunkIndex());
            baos.write(decryptedData);
        }
        return baos.toByteArray();
    }

    private byte[] combineRawChunks(List<VideoChunk> chunks) throws IOException {
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
            for (VideoChunk chunk : chunks) {
                String chunkPath = chunk.getChunkStoragePath();
                if (chunkPath != null) {
                    Path path = Paths.get(chunkPath);
                    if (Files.exists(path)) baos.write(Files.readAllBytes(path));
                }
            }
            return baos.toByteArray();
        }
    }
}