package com.securevideo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SecureVideoApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureVideoApplication.class, args);
        System.out.println("===========================================");
        System.out.println("  SecureVideo - Video Sharing System");
        System.out.println("  ECC P-521 + AES-256-GCM + SHA-512");
        System.out.println("  Server started on port 8080");
        System.out.println("===========================================");
    }
}