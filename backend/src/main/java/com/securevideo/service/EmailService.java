package com.securevideo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final String RESEND_API_URL =
            "https://api.resend.com/emails";

    private static final String FROM_EMAIL =
            "Secure Video <onboarding@resend.dev>";

    @Value("${resend.api.key}")
    private String resendApiKey;

    private final RestTemplate restTemplate =
            new RestTemplate();

    // =========================================================
    // Send initial secure video share-link email
    // =========================================================

    public void sendShareEmail(
            String receiverEmail,
            String senderName,
            String videoTitle,
            String shareLink) {

        try {
            System.out.println("====================================");
            System.out.println("RESEND SHARE EMAIL STARTED");
            System.out.println("Receiver Email : " + receiverEmail);
            System.out.println("Video Title    : " + videoTitle);
            System.out.println("====================================");

            String emailHtml =
                    "<div style=\"font-family:Arial,sans-serif;" +
                    "max-width:600px;margin:auto;padding:24px;" +
                    "border:1px solid #e5e7eb;border-radius:10px;\">" +

                    "<h2 style=\"color:#1d4ed8;\">" +
                    "Secure Video Shared With You" +
                    "</h2>" +

                    "<p>Hello,</p>" +

                    "<p><strong>" +
                    escapeHtml(senderName) +
                    "</strong> has shared a secure video with you.</p>" +

                    "<p><strong>Video Title:</strong> " +
                    escapeHtml(videoTitle) +
                    "</p>" +

                    "<p>Click the button below to access the video.</p>" +

                    "<p style=\"margin:28px 0;\">" +
                    "<a href=\"" +
                    escapeHtml(shareLink) +
                    "\" style=\"" +
                    "display:inline-block;" +
                    "padding:12px 20px;" +
                    "background:#2563eb;" +
                    "color:white;" +
                    "text-decoration:none;" +
                    "border-radius:6px;" +
                    "font-weight:bold;\">" +
                    "Open Secure Video" +
                    "</a>" +
                    "</p>" +

                    "<p style=\"color:#6b7280;\">" +
                    "After opening the link, you must login or register " +
                    "using this receiver email address. An OTP will then " +
                    "be sent to verify your identity." +
                    "</p>" +

                    "<p style=\"color:#6b7280;\">" +
                    "This secure link expires in 24 hours and can be used " +
                    "only once." +
                    "</p>" +

                    "<hr style=\"border:none;border-top:1px solid #e5e7eb;\">" +

                    "<p style=\"font-size:13px;color:#9ca3af;\">" +
                    "Do not forward this email or share the secure link." +
                    "</p>" +

                    "<p>Regards,<br>" +
                    "Secure Video Sharing System</p>" +

                    "</div>";

            sendEmail(
                    receiverEmail,
                    "Secure Video Shared With You",
                    emailHtml
            );

            System.out.println("====================================");
            System.out.println("SHARE EMAIL SENT SUCCESSFULLY");
            System.out.println("Receiver : " + receiverEmail);
            System.out.println("====================================");

        } catch (Exception e) {

            System.out.println("====================================");
            System.out.println("SHARE EMAIL SEND FAILED");
            System.out.println("Reason : " + e.getMessage());
            System.out.println("====================================");

            throw e;
        }
    }

    // =========================================================
    // Send receiver verification OTP
    // =========================================================

    public void sendOtpEmail(
            String receiverEmail,
            String otp,
            int expiryMinutes) {

        try {
            System.out.println("====================================");
            System.out.println("RESEND OTP EMAIL STARTED");
            System.out.println("Receiver Email : " + receiverEmail);
            System.out.println("====================================");

            String emailHtml =
                    "<div style=\"font-family:Arial,sans-serif;" +
                    "max-width:600px;margin:auto;padding:24px;" +
                    "border:1px solid #e5e7eb;border-radius:10px;\">" +

                    "<h2 style=\"color:#1d4ed8;\">" +
                    "Receiver Verification Code" +
                    "</h2>" +

                    "<p>Hello,</p>" +

                    "<p>Use the following one-time password to verify " +
                    "your identity and access the secure video.</p>" +

                    "<div style=\"" +
                    "font-size:34px;" +
                    "font-weight:bold;" +
                    "letter-spacing:10px;" +
                    "text-align:center;" +
                    "padding:20px;" +
                    "margin:24px 0;" +
                    "background:#eff6ff;" +
                    "border:1px solid #bfdbfe;" +
                    "border-radius:8px;" +
                    "color:#1d4ed8;\">" +
                    escapeHtml(otp) +
                    "</div>" +

                    "<p><strong>This OTP is valid for " +
                    expiryMinutes +
                    " minutes.</strong></p>" +

                    "<p style=\"color:#6b7280;\">" +
                    "Return to the OTP verification page in your browser " +
                    "and enter this code. You do not need to open the " +
                    "share link again." +
                    "</p>" +

                    "<p style=\"color:#dc2626;\">" +
                    "Never share this OTP with anyone." +
                    "</p>" +

                    "<hr style=\"border:none;border-top:1px solid #e5e7eb;\">" +

                    "<p style=\"font-size:13px;color:#9ca3af;\">" +
                    "If you did not request this code, ignore this email." +
                    "</p>" +

                    "<p>Regards,<br>" +
                    "Secure Video Sharing System</p>" +

                    "</div>";

            sendEmail(
                    receiverEmail,
                    "Your Secure Video OTP is " + otp,
                    emailHtml
            );

            System.out.println("====================================");
            System.out.println("OTP EMAIL SENT SUCCESSFULLY");
            System.out.println("Receiver : " + receiverEmail);
            System.out.println("====================================");

        } catch (Exception e) {

            System.out.println("====================================");
            System.out.println("OTP EMAIL SEND FAILED");
            System.out.println("Reason : " + e.getMessage());
            System.out.println("====================================");

            throw e;
        }
    }

    // =========================================================
    // Common Resend API method
    // =========================================================

    private void sendEmail(
            String receiverEmail,
            String subject,
            String emailHtml) {

        validateConfiguration();
        validateEmail(receiverEmail);

        Map<String, Object> requestBody =
                new HashMap<>();

        requestBody.put(
                "from",
                FROM_EMAIL
        );

        requestBody.put(
                "to",
                List.of(receiverEmail)
        );

        requestBody.put(
                "subject",
                subject
        );

        requestBody.put(
                "html",
                emailHtml
        );

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.setBearerAuth(
                resendApiKey.trim()
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(
                        requestBody,
                        headers
                );

        try {
            ResponseEntity<String> response =
                    restTemplate.exchange(
                            RESEND_API_URL,
                            HttpMethod.POST,
                            request,
                            String.class
                    );

            if (!response
                    .getStatusCode()
                    .is2xxSuccessful()) {

                throw new RuntimeException(
                        "Resend returned status: " +
                        response.getStatusCode()
                );
            }

            System.out.println(
                    "Resend Response : " +
                    response.getBody()
            );

        } catch (HttpClientErrorException e) {

            System.out.println("====================================");
            System.out.println("RESEND API ERROR");
            System.out.println("Status   : " + e.getStatusCode());
            System.out.println(
                    "Response : " +
                    e.getResponseBodyAsString()
            );
            System.out.println("====================================");

            throw new RuntimeException(
                    "Failed to send email: " +
                    e.getResponseBodyAsString(),
                    e
            );

        } catch (Exception e) {

            System.out.println("====================================");
            System.out.println("EMAIL SEND FAILED");
            System.out.println("Reason : " + e.getMessage());
            e.printStackTrace();
            System.out.println("====================================");

            throw new RuntimeException(
                    "Failed to send email",
                    e
            );
        }
    }

    private void validateConfiguration() {

        if (resendApiKey == null ||
                resendApiKey.trim().isEmpty()) {

            throw new RuntimeException(
                    "Resend API key is not configured"
            );
        }
    }

    private void validateEmail(
            String receiverEmail) {

        if (receiverEmail == null ||
                receiverEmail.trim().isEmpty() ||
                !receiverEmail.contains("@")) {

            throw new RuntimeException(
                    "Invalid receiver email address"
            );
        }
    }

    private String escapeHtml(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}