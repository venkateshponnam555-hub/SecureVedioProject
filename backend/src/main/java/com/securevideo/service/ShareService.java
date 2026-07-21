package com.securevideo.service;

import com.securevideo.crypto.ECCKeyExchange;
import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.crypto.KeyGeneratorUtil;
import com.securevideo.model.ShareInfo;
import com.securevideo.model.VideoChunk;
import com.securevideo.repository.ShareRepository;
import com.securevideo.repository.VideoChunkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.KeyPair;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ShareService {

    @Value("${securevideo.share.expiration-hours}")
    private int expirationHours;

    @Value("${securevideo.share.base-url}")
    private String shareBaseUrl;

    private final ShareRepository shareRepository;
    private final VideoChunkRepository videoChunkRepository;

    public ShareService(ShareRepository shareRepository, VideoChunkRepository videoChunkRepository) {
        this.shareRepository = shareRepository;
        this.videoChunkRepository = videoChunkRepository;
    }

    public Map<String, Object> generateShareLink(String videoId, String senderId, String receiverEmail) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(videoId);
        if (chunks.isEmpty()) throw new RuntimeException("Video not found");

        KeyPair eccKeyPair = KeyGeneratorUtil.generateECCKeyPair();
        String eccPublicKey = KeyGeneratorUtil.publicKeyToBase64(eccKeyPair.getPublic());
        String eccPrivateKey = KeyGeneratorUtil.privateKeyToBase64(eccKeyPair.getPrivate());

        String shareToken = KeyGeneratorUtil.generateShareToken();

        ShareInfo shareInfo = new ShareInfo();
        shareInfo.setShareToken(shareToken);
        shareInfo.setVideoId(videoId);
        shareInfo.setSenderId(senderId);
        shareInfo.setReceiverEmail(receiverEmail);
        shareInfo.setEccPublicKey(eccPublicKey);
        shareInfo.setEccPrivateKeyEncrypted(eccPrivateKey);
        shareInfo.setCreatedAt(Instant.now());
        shareInfo.setExpiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS));
        shareInfo.setUsed(false);
        shareInfo.setStatus("ACTIVE");
        shareRepository.save(shareInfo);

        String shareLink = shareBaseUrl + "/" + shareToken;

        Map<String, Object> response = new HashMap<>();
        response.put("shareToken", shareToken);
        response.put("shareLink", shareLink);
        response.put("expiresAt", shareInfo.getExpiresAt());
        response.put("eccPublicKey", eccPublicKey);
        return response;
    }

    public Map<String, Object> accessSharedVideo(String shareToken) {
        ShareInfo shareInfo = shareRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Invalid share link"));
        if (shareInfo.isUsed()) throw new RuntimeException("This share link has already been used");
        if (shareInfo.isExpired()) {
            shareInfo.setStatus("EXPIRED");
            shareRepository.save(shareInfo);
            throw new RuntimeException("This share link has expired");
        }

        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(shareInfo.getVideoId());
        if (chunks.isEmpty()) throw new RuntimeException("Video not found");
        VideoChunk firstChunk = chunks.get(0);

        Map<String, Object> response = new HashMap<>();
        response.put("shareToken", shareToken);
        response.put("videoId", shareInfo.getVideoId());
        response.put("title", firstChunk.getTitle());
        response.put("description", firstChunk.getDescription());
        response.put("fileSize", firstChunk.getFileSize());
        response.put("format", firstChunk.getFormat());
        response.put("totalChunks", chunks.size());
        response.put("eccPublicKey", shareInfo.getEccPublicKey());
        response.put("senderId", shareInfo.getSenderId());
        response.put("chunks", getChunkInfoList(chunks));
        return response;
    }

    /**
     * Receiver performs ECC key exchange.
     * Returns sharedSecret AND the original AES key encrypted with the shared secret.
     */
    public Map<String, Object> performKeyExchange(String shareToken, String receiverPublicKeyBase64) {
        ShareInfo shareInfo = shareRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Invalid share link"));
        if (shareInfo.isUsed()) throw new RuntimeException("Share link already used");

        PrivateKey senderPrivateKey = ECCKeyExchange.base64ToPrivateKey(shareInfo.getEccPrivateKeyEncrypted());
        PublicKey receiverPublicKey = ECCKeyExchange.base64ToPublicKey(receiverPublicKeyBase64);

        // Derive shared secret via ECDH
        String sharedSecret = ECCKeyExchange.deriveSharedSecret(senderPrivateKey, receiverPublicKey);

        // Get the ORIGINAL AES key stored during upload
        List<VideoChunk> chunks = videoChunkRepository.findByVideoId(shareInfo.getVideoId());
        if (chunks.isEmpty()) throw new RuntimeException("Video chunks not found");
        String originalAesKeyBase64 = chunks.get(0).getAesKeyEncrypted();

        // Derive a wrapping key from the shared secret
        SecretKey wrappingKey = deriveKeyFromSharedSecret(sharedSecret);

        // Encrypt the original AES key with the wrapping key
        String encryptedAesKey = EncryptionUtil.encrypt(originalAesKeyBase64.getBytes(), wrappingKey);

        shareInfo.setUsed(true);
        shareInfo.setSharedSecret(sharedSecret);
        shareInfo.setStatus("ACCESSED");
        shareRepository.save(shareInfo);

        Map<String, Object> response = new HashMap<>();
        response.put("sharedSecret", sharedSecret);
        response.put("encryptedAesKey", encryptedAesKey);
        response.put("videoId", shareInfo.getVideoId());
        response.put("status", "KEY_EXCHANGED");
        return response;
    }

    private List<Map<String, Object>> getChunkInfoList(List<VideoChunk> chunks) {
        List<Map<String, Object>> chunkList = new ArrayList<>();
        for (VideoChunk chunk : chunks) {
            Map<String, Object> info = new HashMap<>();
            info.put("chunkId", chunk.getId());
            info.put("chunkIndex", chunk.getChunkIndex());
            info.put("chunkHash", chunk.getChunkHash());
            chunkList.add(info);
        }
        return chunkList;
    }

    private SecretKey deriveKeyFromSharedSecret(String sharedSecretBase64) {
        try {
            byte[] sharedSecretBytes = Base64.getDecoder().decode(sharedSecretBase64);
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = sha256.digest(sharedSecretBytes);
            return new SecretKeySpec(hashedBytes, "AES");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}