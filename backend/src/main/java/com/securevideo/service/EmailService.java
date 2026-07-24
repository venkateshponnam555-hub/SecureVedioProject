package com.securevideo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // =========================================================
    // Send initial secure video share-link email
    // =========================================================

    public void sendShareEmail(
            String receiverEmail,
            String senderName,
            String videoTitle,
            String shareLink) {

        validateEmail(receiverEmail);

        System.out.println("====================================");
        System.out.println("GMAIL SHARE EMAIL STARTED");
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

        sendHtmlEmail(
                receiverEmail,
                "Secure Video Shared With You",
                emailHtml
        );

        System.out.println("====================================");
        System.out.println("SHARE EMAIL SENT SUCCESSFULLY");
        System.out.println("Receiver : " + receiverEmail);
        System.out.println("====================================");
    }

    // =========================================================
    // Send receiver verification OTP
    // =========================================================

    public void sendOtpEmail(
            String receiverEmail,
            String otp,
            int expiryMinutes) {

        validateEmail(receiverEmail);

        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "OTP must not be empty"
            );
        }

        System.out.println("====================================");
        System.out.println("GMAIL OTP EMAIL STARTED");
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

        sendHtmlEmail(
                receiverEmail,
                "Your Secure Video OTP is " + otp,
                emailHtml
        );

        System.out.println("====================================");
        System.out.println("OTP EMAIL SENT SUCCESSFULLY");
        System.out.println("Receiver : " + receiverEmail);
        System.out.println("====================================");
    }

    // =========================================================
    // Common Gmail SMTP method
    // =========================================================

    private void sendHtmlEmail(
            String receiverEmail,
            String subject,
            String emailHtml) {

        validateConfiguration();

        try {
            MimeMessage mimeMessage =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            mimeMessage,
                            true,
                            "UTF-8"
                    );

            helper.setFrom(
                    fromEmail.trim(),
                    "Secure Video Sharing System"
            );

            helper.setTo(
                    receiverEmail.trim()
            );

            helper.setSubject(
                    subject
            );

            helper.setText(
                    emailHtml,
                    true
            );

            mailSender.send(
                    mimeMessage
            );

        } catch (MailAuthenticationException e) {

            System.out.println("====================================");
            System.out.println("GMAIL AUTHENTICATION FAILED");
            System.out.println(
                    "Check GMAIL_USERNAME and GMAIL_APP_PASSWORD"
            );
            System.out.println("Reason : " + e.getMessage());
            System.out.println("====================================");

            throw new RuntimeException(
                    "Gmail authentication failed. " +
                    "Check the Gmail username and App Password.",
                    e
            );

        } catch (MessagingException e) {

            System.out.println("====================================");
            System.out.println("EMAIL MESSAGE CREATION FAILED");
            System.out.println("Reason : " + e.getMessage());
            System.out.println("====================================");

            throw new RuntimeException(
                    "Failed to create email message",
                    e
            );

        } catch (MailException e) {

            System.out.println("====================================");
            System.out.println("GMAIL EMAIL SEND FAILED");
            System.out.println("Reason : " + e.getMessage());
            System.out.println("====================================");

            throw new RuntimeException(
                    "Failed to send email using Gmail SMTP",
                    e
            );

        } catch (Exception e) {

            System.out.println("====================================");
            System.out.println("UNEXPECTED EMAIL ERROR");
            System.out.println("Reason : " + e.getMessage());
            e.printStackTrace();
            System.out.println("====================================");

            throw new RuntimeException(
                    "Unexpected error while sending email",
                    e
            );
        }
    }

    // =========================================================
    // Validation methods
    // =========================================================

    private void validateConfiguration() {

        if (fromEmail == null ||
                fromEmail.trim().isEmpty()) {

            throw new RuntimeException(
                    "GMAIL_USERNAME is not configured"
            );
        }
    }

    private void validateEmail(
            String receiverEmail) {

        if (receiverEmail == null ||
                receiverEmail.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Receiver email address is required"
            );
        }

        String trimmedEmail =
                receiverEmail.trim();

        if (!trimmedEmail.matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {

            throw new IllegalArgumentException(
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