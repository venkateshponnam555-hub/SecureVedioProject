package com.securevideo.crypto;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

public class KeyGeneratorUtil {

    private static final String ECC_CURVE = "secp521r1";
    private static final String AES_ALGORITHM = "AES";
    private static final int AES_KEY_SIZE = 256;

    /**
     * Generate an ECC key pair using P-521 curve
     */
    public static KeyPair generateECCKeyPair() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("EC");
            ECGenParameterSpec ecSpec = new ECGenParameterSpec(ECC_CURVE);
            keyPairGenerator.initialize(ecSpec, new SecureRandom());
            return keyPairGenerator.generateKeyPair();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate ECC key pair: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a 256-bit AES key
     */
    public static SecretKey generateAESKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance(AES_ALGORITHM);
            keyGen.init(AES_KEY_SIZE, new SecureRandom());
            return keyGen.generateKey();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate AES key: " + e.getMessage(), e);
        }
    }

    /**
     * Convert PublicKey to Base64 string
     */
    public static String publicKeyToBase64(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    /**
     * Convert PrivateKey to Base64 string
     */
    public static String privateKeyToBase64(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    /**
     * Convert SecretKey to Base64 string
     */
    public static String secretKeyToBase64(SecretKey secretKey) {
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }

    /**
     * Convert Base64 string back to SecretKey
     */
    public static SecretKey base64ToSecretKey(String base64Key) {
        byte[] decodedKey = Base64.getDecoder().decode(base64Key);
        return new javax.crypto.spec.SecretKeySpec(decodedKey, 0, decodedKey.length, AES_ALGORITHM);
    }

    /**
     * Generate a unique video ID
     */
    public static String generateVideoId() {
        return "vid_" + java.util.UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Generate a unique share token
     */
    public static String generateShareToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Generate a unique chunk ID
     */
    public static String generateChunkId() {
        return "chk_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}