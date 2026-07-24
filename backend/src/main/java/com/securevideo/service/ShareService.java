package com.securevideo.service;

import com.securevideo.crypto.ECCKeyExchange;
import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.crypto.KeyGeneratorUtil;
import com.securevideo.model.ShareInfo;
import com.securevideo.model.User;
import com.securevideo.model.VideoChunk;
import com.securevideo.repository.ShareRepository;
import com.securevideo.repository.UserRepository;
import com.securevideo.repository.VideoChunkRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShareService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_OTP_ATTEMPTS = 3;

    @Value("${securevideo.share.expiration-hours}")
    private int expirationHours;

    @Value("${securevideo.share.base-url}")
    private String shareBaseUrl;

    private final ShareRepository shareRepository;
    private final VideoChunkRepository videoChunkRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ShareService(
            ShareRepository shareRepository,
            VideoChunkRepository videoChunkRepository,
            UserRepository userRepository,
            EmailService emailService) {

        this.shareRepository = shareRepository;
        this.videoChunkRepository = videoChunkRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // =========================================================
    // Generate share link and send it to receiver
    // =========================================================

    public Map<String, Object> generateShareLink(
            String videoId,
            String senderId,
            String receiverEmail) {

        if (videoId == null || videoId.trim().isEmpty()) {
            throw new RuntimeException("Video ID is required");
        }

        if (senderId == null || senderId.trim().isEmpty()) {
            throw new RuntimeException("Sender authentication is required");
        }

        if (receiverEmail == null || receiverEmail.trim().isEmpty()) {
            throw new RuntimeException("Receiver email is required");
        }

        String normalizedReceiverEmail =
                receiverEmail.trim().toLowerCase();

        List<VideoChunk> chunks =
                videoChunkRepository.findByVideoId(videoId);

        if (chunks.isEmpty()) {
            throw new RuntimeException("Video not found");
        }

        KeyPair eccKeyPair =
                KeyGeneratorUtil.generateECCKeyPair();

        String eccPublicKey =
                KeyGeneratorUtil.publicKeyToBase64(
                        eccKeyPair.getPublic()
                );

        String eccPrivateKey =
                KeyGeneratorUtil.privateKeyToBase64(
                        eccKeyPair.getPrivate()
                );

        String shareToken =
                KeyGeneratorUtil.generateShareToken();

        ShareInfo shareInfo = new ShareInfo();

        shareInfo.setShareToken(shareToken);
        shareInfo.setVideoId(videoId);
        shareInfo.setSenderId(senderId);
        shareInfo.setReceiverEmail(normalizedReceiverEmail);

        shareInfo.setEccPublicKey(eccPublicKey);
        shareInfo.setEccPrivateKeyEncrypted(eccPrivateKey);

        shareInfo.setCreatedAt(Instant.now());
        shareInfo.setExpiresAt(
                Instant.now().plus(
                        expirationHours,
                        ChronoUnit.HOURS
                )
        );

        shareInfo.setUsed(false);
        shareInfo.setStatus("ACTIVE");

        shareInfo.setReceiverVerified(false);
        shareInfo.setReceiverUserId(null);
        shareInfo.setReceiverVerifiedAt(null);

        shareInfo.setOtp(null);
        shareInfo.setOtpExpiry(null);
        shareInfo.setOtpSentAt(null);
        shareInfo.setOtpAttempts(0);

        shareRepository.save(shareInfo);

        String shareLink =
                shareBaseUrl + "/" + shareToken;

        String senderName = senderId;

        emailService.sendShareEmail(
                normalizedReceiverEmail,
                senderName,
                chunks.get(0).getTitle(),
                shareLink
        );

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Share link sent successfully"
        );
        response.put("expiresAt", shareInfo.getExpiresAt());

        return response;
    }

    // =========================================================
    // Public share information
    // Opening this page must not mark link as used
    // =========================================================

    public Map<String, Object> accessSharedVideo(
            String shareToken) {

        ShareInfo shareInfo =
                getValidShareInfo(shareToken);

        List<VideoChunk> chunks =
                videoChunkRepository.findByVideoId(
                        shareInfo.getVideoId()
                );

        if (chunks.isEmpty()) {
            throw new RuntimeException("Video not found");
        }

        VideoChunk firstChunk = chunks.get(0);

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("shareToken", shareToken);
        response.put("videoId", shareInfo.getVideoId());
        response.put("title", firstChunk.getTitle());
        response.put(
                "description",
                firstChunk.getDescription()
        );
        response.put(
                "fileSize",
                firstChunk.getFileSize()
        );
        response.put("format", firstChunk.getFormat());
        response.put("totalChunks", chunks.size());
        response.put("senderId", shareInfo.getSenderId());
        response.put(
                "receiverVerified",
                shareInfo.isReceiverVerified()
        );
        response.put("status", shareInfo.getStatus());
        response.put("expiresAt", shareInfo.getExpiresAt());

        Instant now = Instant.now();
        boolean otpPending =
                !shareInfo.isReceiverVerified()
                        && shareInfo.getOtp() != null
                        && shareInfo.getOtpExpiry() != null
                        && now.isBefore(shareInfo.getOtpExpiry());

        response.put("otpPending", otpPending);
        response.put(
                "otpExpiresAt",
                otpPending ? shareInfo.getOtpExpiry() : null
        );
        response.put(
                "resendAvailableAt",
                shareInfo.getOtpSentAt() == null
                        ? null
                        : shareInfo.getOtpSentAt().plus(
                                OTP_RESEND_COOLDOWN_SECONDS,
                                ChronoUnit.SECONDS
                        )
        );

        /*
         * Do not expose receiver's complete email.
         * Frontend can display masked email.
         */
        response.put(
                "receiverEmailMasked",
                maskEmail(shareInfo.getReceiverEmail())
        );

        return response;
    }

    // =========================================================
    // Send receiver OTP
    // Login email must match intended receiver email
    // =========================================================

    public Map<String, Object> sendReceiverOtp(
            String shareToken,
            String receiverUserId)
            throws IllegalAccessException {

        ShareInfo shareInfo =
                getValidShareInfo(shareToken);

        User receiver =
                getReceiverUser(receiverUserId);

        verifyReceiverEmailMatch(
                shareInfo,
                receiver
        );

        if (shareInfo.isReceiverVerified()) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put("success", true);
            response.put(
                    "message",
                    "Receiver is already verified"
            );
            response.put("alreadyVerified", true);

            return response;
        }

        Instant now = Instant.now();

        /*
         * Mobile workflow fix:
         * When a valid OTP already exists for this account, do not
         * generate or email another OTP. Restore the same OTP session.
         */
        boolean existingOtpIsValid =
                shareInfo.getOtp() != null
                        && shareInfo.getOtpExpiry() != null
                        && now.isBefore(shareInfo.getOtpExpiry())
                        && receiverUserId.equals(
                                shareInfo.getReceiverUserId()
                        );

        if (existingOtpIsValid) {
            long remainingSeconds =
                    Math.max(
                            0,
                            ChronoUnit.SECONDS.between(
                                    now,
                                    shareInfo.getOtpExpiry()
                            )
                    );

            Instant resendAvailableAt =
                    shareInfo.getOtpSentAt() == null
                            ? now
                            : shareInfo.getOtpSentAt().plus(
                                    OTP_RESEND_COOLDOWN_SECONDS,
                                    ChronoUnit.SECONDS
                            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put("success", true);
            response.put(
                    "message",
                    "OTP was already sent and is still valid"
            );
            response.put("alreadySent", true);
            response.put(
                    "receiverEmailMasked",
                    maskEmail(shareInfo.getReceiverEmail())
            );
            response.put(
                    "otpExpiresAt",
                    shareInfo.getOtpExpiry()
            );
            response.put(
                    "otpExpiresInSeconds",
                    remainingSeconds
            );
            response.put(
                    "resendAvailableAt",
                    resendAvailableAt
            );
            response.put(
                    "resendCooldownSeconds",
                    Math.max(
                            0,
                            ChronoUnit.SECONDS.between(
                                    now,
                                    resendAvailableAt
                            )
                    )
            );

            return response;
        }

        if (shareInfo.getOtpExpiry() != null
                && !now.isBefore(shareInfo.getOtpExpiry())) {

            clearOtp(shareInfo);
            shareInfo.setStatus("OTP_EXPIRED");
        }

        String otp = generateOtp();
        String otpHash = hashOtp(otp);

        shareInfo.setOtp(otpHash);
        shareInfo.setOtpSentAt(now);
        shareInfo.setOtpExpiry(
                now.plus(
                        OTP_EXPIRY_MINUTES,
                        ChronoUnit.MINUTES
                )
        );
        shareInfo.setOtpAttempts(0);
        shareInfo.setReceiverUserId(receiverUserId);
        shareInfo.setStatus("OTP_SENT");

        shareRepository.save(shareInfo);

        emailService.sendOtpEmail(
                shareInfo.getReceiverEmail(),
                otp,
                OTP_EXPIRY_MINUTES
        );

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "OTP sent successfully"
        );
        response.put("alreadySent", false);
        response.put(
                "receiverEmailMasked",
                maskEmail(shareInfo.getReceiverEmail())
        );
        response.put(
                "otpExpiresInMinutes",
                OTP_EXPIRY_MINUTES
        );
        response.put(
                "otpExpiresAt",
                shareInfo.getOtpExpiry()
        );
        response.put(
                "resendCooldownSeconds",
                OTP_RESEND_COOLDOWN_SECONDS
        );
        response.put(
                "resendAvailableAt",
                now.plus(
                        OTP_RESEND_COOLDOWN_SECONDS,
                        ChronoUnit.SECONDS
                )
        );

        return response;
    }

    // =========================================================
    // Verify receiver OTP
    // =========================================================

    public Map<String, Object> verifyReceiverOtp(
            String shareToken,
            String receiverUserId,
            String enteredOtp)
            throws IllegalAccessException {

        ShareInfo shareInfo =
                getValidShareInfo(shareToken);

        User receiver =
                getReceiverUser(receiverUserId);

        verifyReceiverEmailMatch(
                shareInfo,
                receiver
        );

        if (shareInfo.isReceiverVerified()) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put("success", true);
            response.put(
                    "message",
                    "Receiver already verified"
            );
            response.put("verified", true);

            return response;
        }

        if (shareInfo.getReceiverUserId() == null ||
                !shareInfo.getReceiverUserId()
                        .equals(receiverUserId)) {

            throw new IllegalAccessException(
                    "This OTP was not generated for your account"
            );
        }

        if (enteredOtp == null ||
                !enteredOtp.matches("\\d{6}")) {

            throw new RuntimeException(
                    "Enter a valid 6-digit OTP"
            );
        }

        if (shareInfo.getOtp() == null ||
                shareInfo.getOtpExpiry() == null) {

            throw new RuntimeException(
                    "OTP was not requested"
            );
        }

        if (Instant.now().isAfter(
                shareInfo.getOtpExpiry())) {

            clearOtp(shareInfo);
            shareInfo.setStatus("OTP_EXPIRED");

            shareRepository.save(shareInfo);

            throw new RuntimeException(
                    "OTP has expired. Request a new OTP"
            );
        }

        if (shareInfo.getOtpAttempts() >=
                MAX_OTP_ATTEMPTS) {

            throw new RuntimeException(
                    "Maximum OTP attempts exceeded. Request a new OTP"
            );
        }

        String enteredOtpHash =
                hashOtp(enteredOtp);

        if (!MessageDigest.isEqual(
                shareInfo.getOtp().getBytes(
                        StandardCharsets.UTF_8
                ),
                enteredOtpHash.getBytes(
                        StandardCharsets.UTF_8
                ))) {

            int updatedAttempts =
                    shareInfo.getOtpAttempts() + 1;

            shareInfo.setOtpAttempts(
                    updatedAttempts
            );

            shareRepository.save(shareInfo);

            int remainingAttempts =
                    MAX_OTP_ATTEMPTS -
                            updatedAttempts;

            if (remainingAttempts <= 0) {
                throw new RuntimeException(
                        "Maximum OTP attempts exceeded. Request a new OTP"
                );
            }

            throw new RuntimeException(
                    "Invalid OTP. " +
                            remainingAttempts +
                            " attempt(s) remaining"
            );
        }

        shareInfo.setReceiverVerified(true);
        shareInfo.setReceiverUserId(receiverUserId);
        shareInfo.setReceiverVerifiedAt(
                Instant.now()
        );
        shareInfo.setStatus("OTP_VERIFIED");

        clearOtp(shareInfo);

        shareRepository.save(shareInfo);

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Receiver verified successfully"
        );
        response.put("verified", true);
        response.put(
                "nextStep",
                "KEY_EXCHANGE"
        );

        return response;
    }

    // =========================================================
    // ECC key exchange
    // Only OTP-verified receiver can perform it
    // =========================================================

    public Map<String, Object> performKeyExchange(
            String shareToken,
            String receiverPublicKeyBase64,
            String receiverUserId)
            throws IllegalAccessException {

        ShareInfo shareInfo =
                getValidShareInfo(shareToken);

        User receiver =
                getReceiverUser(receiverUserId);

        verifyReceiverEmailMatch(
                shareInfo,
                receiver
        );

        if (!shareInfo.isReceiverVerified()) {
            throw new IllegalAccessException(
                    "Receiver OTP verification is required"
            );
        }

        if (shareInfo.getReceiverUserId() == null ||
                !shareInfo.getReceiverUserId()
                        .equals(receiverUserId)) {

            throw new IllegalAccessException(
                    "This share link is not verified for your account"
            );
        }

        if (receiverPublicKeyBase64 == null ||
                receiverPublicKeyBase64
                        .trim()
                        .isEmpty()) {

            throw new RuntimeException(
                    "Receiver public key is required"
            );
        }

        PrivateKey senderPrivateKey =
                ECCKeyExchange.base64ToPrivateKey(
                        shareInfo
                                .getEccPrivateKeyEncrypted()
                );

        PublicKey receiverPublicKey =
                ECCKeyExchange.base64ToPublicKey(
                        receiverPublicKeyBase64
                );

        String sharedSecret =
                ECCKeyExchange.deriveSharedSecret(
                        senderPrivateKey,
                        receiverPublicKey
                );

        List<VideoChunk> chunks =
                videoChunkRepository.findByVideoId(
                        shareInfo.getVideoId()
                );

        if (chunks.isEmpty()) {
            throw new RuntimeException(
                    "Video chunks not found"
            );
        }

        String originalAesKeyBase64 =
                chunks.get(0)
                        .getAesKeyEncrypted();

        if (originalAesKeyBase64 == null ||
                originalAesKeyBase64.isEmpty()) {

            throw new RuntimeException(
                    "Video encryption key not found"
            );
        }

        SecretKey wrappingKey =
                deriveKeyFromSharedSecret(
                        sharedSecret
                );

        String encryptedAesKey =
                EncryptionUtil.encrypt(
                        originalAesKeyBase64.getBytes(
                                StandardCharsets.UTF_8
                        ),
                        wrappingKey
                );

        shareInfo.setSharedSecret(sharedSecret);
        shareInfo.setStatus(
                "EXCHANGE_COMPLETED"
        );

        /*
         * Do not mark the link as used here.
         * It should be marked as used only when
         * video streaming successfully starts.
         */
        shareRepository.save(shareInfo);

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "sharedSecret",
                sharedSecret
        );
        response.put(
                "encryptedAesKey",
                encryptedAesKey
        );
        response.put(
                "videoId",
                shareInfo.getVideoId()
        );
        response.put(
                "status",
                "KEY_EXCHANGED"
        );

        return response;
    }

    // =========================================================
    // Mark link as used
    // Call this only after stream successfully starts
    // =========================================================

    public void markShareAsUsed(
            String shareToken,
            String receiverUserId)
            throws IllegalAccessException {

        ShareInfo shareInfo =
                getValidShareInfo(shareToken);

        if (!shareInfo.isReceiverVerified()) {
            throw new IllegalAccessException(
                    "Receiver verification is required"
            );
        }

        if (shareInfo.getReceiverUserId() == null ||
                !shareInfo.getReceiverUserId()
                        .equals(receiverUserId)) {

            throw new IllegalAccessException(
                    "This share link does not belong to your account"
            );
        }

        shareInfo.setUsed(true);
        shareInfo.setStatus("ACCESSED");

        shareRepository.save(shareInfo);
    }

    // =========================================================
    // Helper methods
    // =========================================================

    private ShareInfo getValidShareInfo(
            String shareToken) {

        if (shareToken == null ||
                shareToken.trim().isEmpty()) {

            throw new RuntimeException(
                    "Invalid share link"
            );
        }

        ShareInfo shareInfo =
                shareRepository
                        .findByShareToken(shareToken)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Invalid share link"
                                )
                        );

        if (shareInfo.isUsed()) {
            throw new RuntimeException(
                    "This share link has already been used"
            );
        }

        if (shareInfo.getExpiresAt() == null ||
                shareInfo.isExpired()) {

            shareInfo.setStatus("EXPIRED");
            shareRepository.save(shareInfo);

            throw new RuntimeException(
                    "This share link has expired"
            );
        }

        return shareInfo;
    }

    private User getReceiverUser(
            String receiverUserId) {

        if (receiverUserId == null ||
                receiverUserId.trim().isEmpty()) {

            throw new SecurityException(
                    "Receiver login is required"
            );
        }

        return userRepository
                .findById(receiverUserId)
                .orElseThrow(
                        () -> new SecurityException(
                                "Logged-in receiver account not found"
                        )
                );
    }

    private void verifyReceiverEmailMatch(
            ShareInfo shareInfo,
            User receiver)
            throws IllegalAccessException {

        if (receiver.getEmail() == null ||
                shareInfo.getReceiverEmail() == null) {

            throw new IllegalAccessException(
                    "Receiver email verification failed"
            );
        }

        String loggedInEmail =
                receiver.getEmail()
                        .trim()
                        .toLowerCase();

        String intendedReceiverEmail =
                shareInfo.getReceiverEmail()
                        .trim()
                        .toLowerCase();

        if (!loggedInEmail.equals(
                intendedReceiverEmail)) {

            throw new IllegalAccessException(
                    "Access denied. This video was shared with another email account"
            );
        }
    }

    private String generateOtp() {
        SecureRandom secureRandom =
                new SecureRandom();

        int otpNumber =
                secureRandom.nextInt(1_000_000);

        return String.format(
                "%06d",
                otpNumber
        );
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest =
                    MessageDigest.getInstance(
                            "SHA-256"
                    );

            byte[] hash =
                    digest.digest(
                            otp.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return Base64
                    .getEncoder()
                    .encodeToString(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(
                    "Unable to secure OTP",
                    e
            );
        }
    }

    private void clearOtp(
            ShareInfo shareInfo) {

        shareInfo.setOtp(null);
        shareInfo.setOtpExpiry(null);
        shareInfo.setOtpSentAt(null);
        shareInfo.setOtpAttempts(0);
    }

    private String maskEmail(
            String email) {

        if (email == null ||
                !email.contains("@")) {

            return "******";
        }

        String[] parts =
                email.split("@", 2);

        String name = parts[0];
        String domain = parts[1];

        if (name.length() <= 1) {
            return "*" + "@" + domain;
        }

        if (name.length() == 2) {
            return name.charAt(0) +
                    "*" +
                    "@" +
                    domain;
        }

        return name.charAt(0) +
                "*****" +
                name.charAt(
                        name.length() - 1
                ) +
                "@" +
                domain;
    }

    private List<Map<String, Object>>
    getChunkInfoList(
            List<VideoChunk> chunks) {

        List<Map<String, Object>> chunkList =
                new ArrayList<>();

        for (VideoChunk chunk : chunks) {
            Map<String, Object> info =
                    new HashMap<>();

            info.put(
                    "chunkId",
                    chunk.getId()
            );
            info.put(
                    "chunkIndex",
                    chunk.getChunkIndex()
            );
            info.put(
                    "chunkHash",
                    chunk.getChunkHash()
            );

            chunkList.add(info);
        }

        return chunkList;
    }

    private SecretKey deriveKeyFromSharedSecret(
            String sharedSecretBase64) {

        try {
            byte[] sharedSecretBytes =
                    Base64.getDecoder()
                            .decode(
                                    sharedSecretBase64
                            );

            MessageDigest sha256 =
                    MessageDigest.getInstance(
                            "SHA-256"
                    );

            byte[] hashedBytes =
                    sha256.digest(
                            sharedSecretBytes
                    );

            return new SecretKeySpec(
                    hashedBytes,
                    "AES"
            );

        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Invalid shared secret format",
                    e
            );

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(
                    "SHA-256 algorithm not available",
                    e
            );
        }
    }
}