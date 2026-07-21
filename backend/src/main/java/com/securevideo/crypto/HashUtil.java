package com.securevideo.crypto;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class HashUtil {

    private static final String SHA_512 = "SHA-512";
    private static final String SHA_256 = "SHA-256";

    /**
     * Generate SHA-512 hash of byte array
     */
    public static String sha512(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance(SHA_512);
            byte[] hash = digest.digest(data);
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-512 algorithm not available: " + e.getMessage(), e);
        }
    }

    /**
     * Generate SHA-256 hash of byte array
     */
    public static String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance(SHA_256);
            byte[] hash = digest.digest(data);
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available: " + e.getMessage(), e);
        }
    }

    /**
     * Verify if the hash of data matches the expected hash
     */
    public static boolean verifyHash(byte[] data, String expectedHash) {
        String computedHash = sha512(data);
        return computedHash.equals(expectedHash);
    }

    /**
     * Generate SHA-512 hash of a file path (for file integrity)
     */
    public static String sha512FromBytes(byte[] data) {
        return sha512(data);
    }

    /**
     * Hash a string input
     */
    public static String hashString(String input) {
        return sha512(input.getBytes());
    }
}