package com.securevideo.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    /**
     * Send share notification (simulated - prints to console)
     * In production, this would send an email with the share link
     */
    public Map<String, Object> sendShareNotification(String receiverEmail, String shareLink,
                                                      String senderName, String videoTitle) {
        System.out.println("============================================");
        System.out.println("  SECURE VIDEO SHARE NOTIFICATION");
        System.out.println("============================================");
        System.out.println("  From: " + senderName);
        System.out.println("  To: " + receiverEmail);
        System.out.println("  Video: " + videoTitle);
        System.out.println("  Link: " + shareLink);
        System.out.println("  Status: SENT (Simulated)");
        System.out.println("============================================");

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SENT");
        response.put("receiverEmail", receiverEmail);
        response.put("shareLink", shareLink);
        response.put("message", "Share link sent successfully to " + receiverEmail);
        return response;
    }
}