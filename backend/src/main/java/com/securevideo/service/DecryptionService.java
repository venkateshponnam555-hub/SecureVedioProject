package com.securevideo.service;

import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.model.VideoChunk;
import com.securevideo.repository.VideoChunkRepository;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class DecryptionService {

    private final VideoChunkRepository videoChunkRepository;
    private final ChunkService chunkService;

    public DecryptionService(VideoChunkRepository videoChunkRepository,
                             ChunkService chunkService) {
        this.videoChunkRepository = videoChunkRepository;
        this.chunkService = chunkService;
    }

    /**
     * Decrypt all chunks using shared secret and encrypted AES key
     */
    public List<byte[]> decryptVideo(String videoId,
                                     String sharedSecretBase64,
                                     String encryptedAesKey) {

        System.out.println("========================================");
        System.out.println("DOWNLOAD REQUEST RECEIVED");
        System.out.println("========================================");
        System.out.println("Video ID : " + videoId);
        System.out.println("========================================");

        List<VideoChunk> chunks =
                videoChunkRepository.findByVideoIdOrderByChunkIndexAsc(videoId);

        if (chunks.isEmpty()) {
            throw new RuntimeException("No chunks found for video: " + videoId);
        }

        System.out.println("========================================");
        System.out.println("LOADING ENCRYPTED CHUNKS");
        System.out.println("========================================");
        System.out.println("Total Chunks : " + chunks.size());
        System.out.println("========================================");

        // Step 1: Derive wrapping key from shared secret
        SecretKey wrappingKey = deriveKeyFromSharedSecret(sharedSecretBase64);

        System.out.println("========================================");
        System.out.println("ECC SHARED SECRET DERIVED");
        System.out.println("========================================");
        System.out.println("Wrapping Key Generated Successfully");
        System.out.println("========================================");

        // Step 2: Recover original AES key
        byte[] aesKeyBytes = EncryptionUtil.decrypt(encryptedAesKey, wrappingKey);

        String originalAesKeyBase64 = new String(aesKeyBytes);

        byte[] decodedAesKey =
                Base64.getDecoder().decode(originalAesKeyBase64);

        SecretKey originalAesKey =
                new SecretKeySpec(decodedAesKey, 0,
                        decodedAesKey.length, "AES");

        System.out.println("========================================");
        System.out.println("AES-256 KEY RECOVERED");
        System.out.println("========================================");
        System.out.println("Original AES Key Decrypted Successfully");
        System.out.println("========================================");

        System.out.println("========================================");
        System.out.println("AES-256 DECRYPTION STARTED");
        System.out.println("========================================");

        List<byte[]> decryptedChunks = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {

            VideoChunk chunk = chunks.get(i);

            System.out.println(
                    "Decrypting Chunk "
                            + (i + 1)
                            + "/"
                            + chunks.size());

            byte[] decryptedData =
                    chunkService.decryptChunk(
                            chunk,
                            originalAesKey
                    );

            System.out.println(
                    "Verifying SHA-512 Hash for Chunk "
                            + (i + 1));

            if (!chunkService.verifyChunkHash(chunk, decryptedData)) {

                System.out.println(
                        "Chunk "
                                + (i + 1)
                                + " : HASH VERIFICATION FAILED");

                throw new RuntimeException(
                        "Hash verification failed for chunk "
                                + chunk.getChunkIndex());
            }

            System.out.println(
                    "Chunk "
                            + (i + 1)
                            + " : VERIFIED");

            decryptedChunks.add(decryptedData);
        }

        System.out.println("========================================");
        System.out.println("VIDEO DECRYPTION COMPLETED");
        System.out.println("========================================");
        System.out.println("All Chunks Decrypted Successfully");
        System.out.println("SHA-512 Integrity Check : PASSED");
        System.out.println("Total Chunks : " + decryptedChunks.size());
        System.out.println("========================================");

        return decryptedChunks;
    }

    private SecretKey deriveKeyFromSharedSecret(String sharedSecretBase64) {

        try {

            byte[] sharedSecretBytes =
                    Base64.getDecoder().decode(sharedSecretBase64);

            MessageDigest sha256 =
                    MessageDigest.getInstance("SHA-256");

            byte[] hashedBytes =
                    sha256.digest(sharedSecretBytes);

            return new SecretKeySpec(hashedBytes, "AES");

        } catch (NoSuchAlgorithmException e) {

            throw new RuntimeException(
                    "SHA-256 algorithm not available",
                    e
            );
        }
    }
}