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

    @Value("${resend.api.key}")
    private String resendApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendShareEmail(String receiverEmail,
                               String senderName,
                               String videoTitle,
                               String shareLink) {

        try {
            System.out.println("====================================");
            System.out.println("RESEND EMAIL SERVICE STARTED");
            System.out.println("Receiver Email : " + receiverEmail);
            System.out.println("Video Title    : " + videoTitle);
            System.out.println("====================================");

            String emailHtml =
                    "<h2>Secure Video Shared With You</h2>" +
                    "<p>Hello,</p>" +
                    "<p><strong>" + escapeHtml(senderName) +
                    "</strong> has shared a secure video with you.</p>" +
                    "<p><strong>Video Title:</strong> " +
                    escapeHtml(videoTitle) + "</p>" +
                    "<p>Click the button below to access the video:</p>" +
                    "<p><a href=\"" + escapeHtml(shareLink) +
                    "\" style=\"display:inline-block;padding:12px 20px;" +
                    "background:#2563eb;color:white;text-decoration:none;" +
                    "border-radius:6px;\">Open Secure Video</a></p>" +
                    "<p>This secure link expires in 24 hours and can be used only once.</p>" +
                    "<p>Regards,<br>Secure Video Sharing System</p>";

            Map<String, Object> requestBody = new HashMap<>();

            requestBody.put(
                    "from",
                    "Secure Video <onboarding@resend.dev>"
            );

            requestBody.put(
                    "to",
                    List.of(receiverEmail)
            );

            requestBody.put(
                    "subject",
                    "Secure Video Shared With You"
            );

            requestBody.put(
                    "html",
                    emailHtml
            );

            HttpHeaders headers = new HttpHeaders();

            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.resend.com/emails",
                    HttpMethod.POST,
                    request,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException(
                        "Resend returned status: " + response.getStatusCode()
                );
            }

            System.out.println("====================================");
            System.out.println("EMAIL SENT SUCCESSFULLY");
            System.out.println("Receiver : " + receiverEmail);
            System.out.println("Response : " + response.getBody());
            System.out.println("====================================");

        } catch (HttpClientErrorException e) {

            System.out.println("====================================");
            System.out.println("RESEND API ERROR");
            System.out.println("Status   : " + e.getStatusCode());
            System.out.println("Response : " + e.getResponseBodyAsString());
            System.out.println("====================================");

            throw new RuntimeException(
                    "Failed to send email: " + e.getResponseBodyAsString(),
                    e
            );

        } catch (Exception e) {

            System.out.println("====================================");
            System.out.println("EMAIL SEND FAILED");
            System.out.println("Reason : " + e.getMessage());
            e.printStackTrace();
            System.out.println("====================================");

            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String escapeHtml(String value) {

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