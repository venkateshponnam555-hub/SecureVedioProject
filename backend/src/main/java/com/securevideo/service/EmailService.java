package com.securevideo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendShareEmail(String receiverEmail,
                               String senderName,
                               String videoTitle,
                               String shareLink) {

        try {

            System.out.println("====================================");
            System.out.println("EMAIL SERVICE STARTED");
            System.out.println("MailSender Class : " + mailSender.getClass().getName());
            System.out.println("Sender Email     : " + senderEmail);
            System.out.println("Receiver Email   : " + receiverEmail);
            System.out.println("====================================");

            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(senderEmail);
            message.setTo(receiverEmail);
            message.setSubject("Secure Video Shared With You");

            message.setText(
                    "Hello,\n\n" +
                    senderName + " has shared a secure video with you.\n\n" +

                    "Video Title : " + videoTitle + "\n\n" +

                    "Click the secure link below to access the video:\n\n" +

                    shareLink + "\n\n" +

                    "This secure link expires in 24 hours.\n\n" +

                    "Regards,\n" +
                    "Secure Video Sharing System"
            );

            System.out.println("Sending Email...");

            mailSender.send(message);

            System.out.println("====================================");
            System.out.println("EMAIL SENT SUCCESSFULLY");
            System.out.println("To      : " + receiverEmail);
            System.out.println("Video   : " + videoTitle);
            System.out.println("Link    : " + shareLink);
            System.out.println("====================================");

        } catch (Exception e) {

            System.out.println("====================================");
            System.out.println("EMAIL SEND FAILED");
            System.out.println("Reason : " + e.getMessage());
            e.printStackTrace();
            System.out.println("====================================");

            throw new RuntimeException("Failed to send email", e);
        }
    }
}