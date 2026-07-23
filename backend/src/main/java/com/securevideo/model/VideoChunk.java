package com.securevideo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "video_chunks")
public class VideoChunk {

    @Id
    private String id;
    private String videoId;
    private String fileName;
    private String title;
    private String description;
    private String tags;
    private String originalFileName;
    private long fileSize;
    private String format;
    private String resolution;
    private int chunkIndex;
    private int totalChunks;
    private String chunkStoragePath;
    private String encryptedStoragePath;
    private String aesKeyEncrypted;
    private String chunkHash;
    private String encryptionStatus;
    private String userId;
    private int chunkSizeBytes;
    private Instant createdAt;
    private Instant updatedAt;

    public VideoChunk() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.encryptionStatus = "PENDING";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public int getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(int chunkIndex) { this.chunkIndex = chunkIndex; }
    public int getTotalChunks() { return totalChunks; }
    public void setTotalChunks(int totalChunks) { this.totalChunks = totalChunks; }
    public String getChunkStoragePath() { return chunkStoragePath; }
    public void setChunkStoragePath(String chunkStoragePath) { this.chunkStoragePath = chunkStoragePath; }
    public String getEncryptedStoragePath() { return encryptedStoragePath; }
    public void setEncryptedStoragePath(String encryptedStoragePath) { this.encryptedStoragePath = encryptedStoragePath; }
    public String getAesKeyEncrypted() { return aesKeyEncrypted; }
    public void setAesKeyEncrypted(String aesKeyEncrypted) { this.aesKeyEncrypted = aesKeyEncrypted; }
    public String getChunkHash() { return chunkHash; }
    public void setChunkHash(String chunkHash) { this.chunkHash = chunkHash; }
    public String getEncryptionStatus() { return encryptionStatus; }
    public void setEncryptionStatus(String encryptionStatus) { this.encryptionStatus = encryptionStatus; this.updatedAt = Instant.now(); }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public int getChunkSizeBytes() { return chunkSizeBytes; }
    public void setChunkSizeBytes(int chunkSizeBytes) { this.chunkSizeBytes = chunkSizeBytes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return "VideoChunk{" +
                "id='" + id + '\'' +
                ", videoId='" + videoId + '\'' +
                ", chunkIndex=" + chunkIndex +
                ", totalChunks=" + totalChunks +
                ", encryptionStatus='" + encryptionStatus + '\'' +
                '}';
    }
}