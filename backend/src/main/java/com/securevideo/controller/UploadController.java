package com.securevideo.controller;

import com.securevideo.service.UploadService;
import com.securevideo.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(@RequestParam("video") MultipartFile file,
                                          @RequestParam("title") String title,
                                          @RequestParam(value = "description", defaultValue = "") String description,
                                          @RequestParam(value = "tags", defaultValue = "[]") String tags,
                                          @RequestParam(value = "encrypt", defaultValue = "true") boolean encrypt,
                                          @RequestParam(value = "networkSpeedMbps", defaultValue = "10") double networkSpeedMbps,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Please select a video file"));
            }

            String token = authHeader.substring(7);
            String userId = JwtUtil.getUserIdFromToken(token);

            Map<String, Object> response = uploadService.uploadVideo(
                    file, title, description, tags, userId, encrypt, networkSpeedMbps);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.out.println("========== UPLOAD ERROR ==========");
            e.printStackTrace();
            System.out.println("==================================");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllVideos(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userId = JwtUtil.getUserIdFromToken(token);
            List<Map<String, Object>> videos = uploadService.getUserVideos(userId);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-videos")
    public ResponseEntity<?> getMyVideos(@RequestHeader("Authorization") String authHeader,
                                          @RequestParam(defaultValue = "12") int limit,
                                          @RequestParam(defaultValue = "newest") String sort,
                                          @RequestParam(required = false) String search,
                                          @RequestParam(required = false) String status) {
        try {
            String token = authHeader.substring(7);
            String userId = JwtUtil.getUserIdFromToken(token);
            List<Map<String, Object>> videos = uploadService.getUserVideos(userId);
            return ResponseEntity.ok(Map.of("videos", videos));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVideoById(@PathVariable String id,
                                           @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userId = JwtUtil.getUserIdFromToken(token);
            Map<String, Object> video = uploadService.getVideoById(id, userId);
            return ResponseEntity.ok(video);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/status/{id}")
    public ResponseEntity<?> getEncryptionStatus(@PathVariable String id) {
        try {
            Map<String, Object> status = uploadService.getEncryptionStatus(id);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/encrypt/{id}")
    public ResponseEntity<?> encryptVideo(@PathVariable String id) {
        try {
            Map<String, Object> status = uploadService.getEncryptionStatus(id);
            return ResponseEntity.ok(Map.of("message", "Encryption started", "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVideo(@PathVariable String id,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userId = JwtUtil.getUserIdFromToken(token);
            uploadService.deleteVideo(id, userId);
            return ResponseEntity.ok(Map.of("message", "Video deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}