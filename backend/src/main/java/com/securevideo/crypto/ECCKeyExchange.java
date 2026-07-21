package com.securevideo.crypto;

import javax.crypto.KeyAgreement;
import java.security.*;
import java.util.Base64;

public class ECCKeyExchange {

    /**
     * Perform ECC key agreement to derive shared secret
     * @param privateKey Local private key
     * @param publicKey Remote public key
     * @return Base64 encoded shared secret
     */
    public static String deriveSharedSecret(PrivateKey privateKey, PublicKey publicKey) {
        try {
            KeyAgreement keyAgreement = KeyAgreement.getInstance("ECDH");
            keyAgreement.init(privateKey);
            keyAgreement.doPhase(publicKey, true);
            byte[] sharedSecret = keyAgreement.generateSecret();
            return Base64.getEncoder().encodeToString(sharedSecret);
        } catch (Exception e) {
            throw new RuntimeException("ECC key agreement failed: " + e.getMessage(), e);
        }
    }

    /**
     * Derive shared secret and convert to AES SecretKey
     * @param privateKey Local private key
     * @param publicKey Remote public key
     * @return SecretKey derived from shared secret
     */
    public static javax.crypto.SecretKey deriveAESKey(PrivateKey privateKey, PublicKey publicKey) {
        try {
            KeyAgreement keyAgreement = KeyAgreement.getInstance("ECDH");
            keyAgreement.init(privateKey);
            keyAgreement.doPhase(publicKey, true);
            byte[] sharedSecret = keyAgreement.generateSecret();

            // Hash the shared secret to get 256-bit AES key
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] aesKeyBytes = sha256.digest(sharedSecret);

            return new javax.crypto.spec.SecretKeySpec(aesKeyBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("ECC AES key derivation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Convert Base64 string to PublicKey
     */
    public static PublicKey base64ToPublicKey(String base64PublicKey) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64PublicKey);
            java.security.spec.X509EncodedKeySpec keySpec = new java.security.spec.X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            return keyFactory.generatePublic(keySpec);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode public key: " + e.getMessage(), e);
        }
    }

    /**
     * Convert Base64 string to PrivateKey
     */
    public static PrivateKey base64ToPrivateKey(String base64PrivateKey) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64PrivateKey);
            java.security.spec.PKCS8EncodedKeySpec keySpec = new java.security.spec.PKCS8EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            return keyFactory.generatePrivate(keySpec);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode private key: " + e.getMessage(), e);
        }
    }
}