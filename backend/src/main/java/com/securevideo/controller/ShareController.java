package com.securevideo.controller;

import com.securevideo.security.JwtUtil;
import com.securevideo.service.ShareService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/share")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000",
        "https://secure-vedio-project.vercel.app"
})
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    // =========================================================
    // Sender generates share link
    // =========================================================

    @PostMapping("/generate/{videoId}")
    public ResponseEntity<?> generateShareLink(
            @PathVariable String videoId,
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {

        try {
            String senderId = extractUserId(authHeader);
            String receiverEmail = request.get("receiverEmail");

            if (receiverEmail == null || receiverEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Receiver email is required"
                        ));
            }

            Map<String, Object> response =
                    shareService.generateShareLink(
                            videoId,
                            senderId,
                            receiverEmail.trim().toLowerCase()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (SecurityException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));
        }
    }

    // =========================================================
    // Public share-link information
    // This must NOT mark the link as used
    // =========================================================

    @GetMapping("/{shareToken}")
    public ResponseEntity<?> accessSharedVideo(
            @PathVariable String shareToken) {

        try {
            Map<String, Object> response =
                    shareService.accessSharedVideo(shareToken);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            String message = safeMessage(e).toLowerCase();

            if (message.contains("expired")) {
                return ResponseEntity
                        .status(HttpStatus.GONE)
                        .body(Map.of(
                                "success", false,
                                "message", safeMessage(e)
                        ));
            }

            if (message.contains("used")) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "success", false,
                                "message", safeMessage(e)
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));
        }
    }

    // =========================================================
    // Send OTP after receiver login/register
    // Backend checks:
    // logged-in user email == intended receiver email
    // =========================================================

    @PostMapping("/send-otp/{shareToken}")
    public ResponseEntity<?> sendReceiverOtp(
            @PathVariable String shareToken,
            @RequestHeader("Authorization") String authHeader) {

        try {
            String receiverUserId = extractUserId(authHeader);

            Map<String, Object> response =
                    shareService.sendReceiverOtp(
                            shareToken,
                            receiverUserId
                    );

            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));

        } catch (IllegalAccessException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));
        }
    }

    // =========================================================
    // Verify receiver OTP
    // =========================================================

    @PostMapping("/verify-otp/{shareToken}")
    public ResponseEntity<?> verifyReceiverOtp(
            @PathVariable String shareToken,
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {

        try {
            String receiverUserId = extractUserId(authHeader);
            String otp = request.get("otp");

            if (otp == null || !otp.matches("\\d{6}")) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Enter a valid 6-digit OTP"
                        ));
            }

            Map<String, Object> response =
                    shareService.verifyReceiverOtp(
                            shareToken,
                            receiverUserId,
                            otp
                    );

            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));

        } catch (IllegalAccessException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));
        }
    }

    // =========================================================
    // ECC key exchange
    // Allowed only after login + email match + OTP verification
    // =========================================================

    @PostMapping("/key-exchange/{shareToken}")
    public ResponseEntity<?> performKeyExchange(
            @PathVariable String shareToken,
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {

        try {
            String receiverUserId = extractUserId(authHeader);
            String receiverPublicKey = request.get("receiverPublicKey");

            if (receiverPublicKey == null ||
                    receiverPublicKey.trim().isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "success", false,
                                "message",
                                "Receiver public key is required"
                        ));
            }

            Map<String, Object> response =
                    shareService.performKeyExchange(
                            shareToken,
                            receiverPublicKey,
                            receiverUserId
                    );

            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));

        } catch (IllegalAccessException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", safeMessage(e)
                    ));
        }
    }

    // =========================================================
    // Helper methods
    // =========================================================

    private String extractUserId(String authHeader) {

        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            throw new SecurityException(
                    "Login is required to access this feature"
            );
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            throw new SecurityException(
                    "Invalid authentication token"
            );
        }

        try {
            return JwtUtil.getUserIdFromToken(token);
        } catch (Exception e) {
            throw new SecurityException(
                    "Invalid or expired authentication token"
            );
        }
    }

    private String safeMessage(Exception e) {
        return e.getMessage() == null
                ? "Something went wrong"
                : e.getMessage();
    }
}