package com.securevideo.repository;

import com.securevideo.model.VideoChunk;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoChunkRepository extends MongoRepository<VideoChunk, String> {

    List<VideoChunk> findByVideoIdOrderByChunkIndexAsc(String videoId);

    List<VideoChunk> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<VideoChunk> findByVideoIdAndChunkIndex(String videoId, int chunkIndex);

    List<VideoChunk> findByVideoId(String videoId);

    long countByVideoId(String videoId);

    void deleteByVideoId(String videoId);

    Optional<VideoChunk> findFirstByVideoIdOrderByChunkIndexDesc(String videoId);

    List<VideoChunk> findByUserIdAndEncryptionStatus(String userId, String encryptionStatus);

    List<VideoChunk> findByUserIdAndTitleContainingIgnoreCase(String userId, String title);
}