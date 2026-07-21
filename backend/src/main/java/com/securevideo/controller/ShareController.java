package com.securevideo.controller;

import com.securevideo.service.ShareService;
import com.securevideo.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/share")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @PostMapping("/generate/{videoId}")
    public ResponseEntity<?> generateShareLink(@PathVariable String videoId,
                                                @RequestBody Map<String, String> request,
                                                @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String senderId = JwtUtil.getUserIdFromToken(token);
            String receiverEmail = request.get("receiverEmail");

            if (receiverEmail == null || receiverEmail.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Receiver email is required"));
            }

            Map<String, Object> response = shareService.generateShareLink(
                    videoId, senderId, receiverEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{shareToken}")
    public ResponseEntity<?> accessSharedVideo(@PathVariable String shareToken) {
        try {
            Map<String, Object> response = shareService.accessSharedVideo(shareToken);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if (message != null && message.contains("expired")) {
                return ResponseEntity.status(HttpStatus.GONE)
                        .body(Map.of("message", message));
            }
            if (message != null && message.contains("used")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", message));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", message));
        }
    }

    @PostMapping("/key-exchange/{shareToken}")
    public ResponseEntity<?> performKeyExchange(@PathVariable String shareToken,
                                                  @RequestBody Map<String, String> request) {
        try {
            String receiverPublicKey = request.get("receiverPublicKey");

            if (receiverPublicKey == null || receiverPublicKey.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Receiver public key is required"));
            }

            Map<String, Object> response = shareService.performKeyExchange(
                    shareToken, receiverPublicKey);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}