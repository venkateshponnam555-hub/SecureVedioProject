package com.securevideo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "share_info")
public class ShareInfo {

    @Id
    private String id;

    @Indexed(unique = true)
    private String shareToken;

    private String videoId;

    private String senderId;

    private String receiverEmail;

    private String eccPublicKey;

    private String eccPrivateKeyEncrypted;

    private String sharedSecret;

    private Instant createdAt;

    private Instant expiresAt;

    private boolean used;

    private Instant usedAt;

    private String status;

    public ShareInfo() {
        this.createdAt = Instant.now();
        this.used = false;
        this.status = "ACTIVE";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }

    public String getEccPublicKey() {
        return eccPublicKey;
    }

    public void setEccPublicKey(String eccPublicKey) {
        this.eccPublicKey = eccPublicKey;
    }

    public String getEccPrivateKeyEncrypted() {
        return eccPrivateKeyEncrypted;
    }

    public void setEccPrivateKeyEncrypted(String eccPrivateKeyEncrypted) {
        this.eccPrivateKeyEncrypted = eccPrivateKeyEncrypted;
    }

    public String getSharedSecret() {
        return sharedSecret;
    }

    public void setSharedSecret(String sharedSecret) {
        this.sharedSecret = sharedSecret;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
        if (used) {
            this.usedAt = Instant.now();
        }
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Instant usedAt) {
        this.usedAt = usedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    @Override
    public String toString() {
        return "ShareInfo{" +
                "id='" + id + '\'' +
                ", shareToken='" + shareToken + '\'' +
                ", videoId='" + videoId + '\'' +
                ", used=" + used +
                ", status='" + status + '\'' +
                '}';
    }
}