package com.securevideo.service;

import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.model.VideoChunk;
import com.securevideo.repository.VideoChunkRepository;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class DecryptionService {

    private final VideoChunkRepository videoChunkRepository;
    private final ChunkService chunkService;

    public DecryptionService(VideoChunkRepository videoChunkRepository, ChunkService chunkService) {
        this.videoChunkRepository = videoChunkRepository;
        this.chunkService = chunkService;
    }

    /**
     * Decrypt all chunks using shared secret and encrypted AES key
     */
    public List<byte[]> decryptVideo(String videoId, String sharedSecretBase64, String encryptedAesKey) {
        List<VideoChunk> chunks = videoChunkRepository.findByVideoIdOrderByChunkIndexAsc(videoId);
        if (chunks.isEmpty()) throw new RuntimeException("No chunks found for video: " + videoId);

        // Step 1: Derive wrapping key from shared secret
        SecretKey wrappingKey = deriveKeyFromSharedSecret(sharedSecretBase64);

        // Step 2: Decrypt the encrypted AES key to get the original AES key
        byte[] aesKeyBytes = EncryptionUtil.decrypt(encryptedAesKey, wrappingKey);
        String originalAesKeyBase64 = new String(aesKeyBytes);
        byte[] decodedAesKey = Base64.getDecoder().decode(originalAesKeyBase64);
        SecretKey originalAesKey = new SecretKeySpec(decodedAesKey, 0, decodedAesKey.length, "AES");

        // Step 3: Decrypt each chunk using the ORIGINAL AES key
        List<byte[]> decryptedChunks = new ArrayList<>();
        for (VideoChunk chunk : chunks) {
            byte[] decryptedData = chunkService.decryptChunk(chunk, originalAesKey);
            if (!chunkService.verifyChunkHash(chunk, decryptedData)) {
                throw new RuntimeException("Hash verification failed for chunk " + chunk.getChunkIndex());
            }
            decryptedChunks.add(decryptedData);
        }
        return decryptedChunks;
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