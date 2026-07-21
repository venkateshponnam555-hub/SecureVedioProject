package com.securevideo.repository;

import com.securevideo.model.ShareInfo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShareRepository extends MongoRepository<ShareInfo, String> {

    Optional<ShareInfo> findByShareToken(String shareToken);

    List<ShareInfo> findByVideoId(String videoId);

    List<ShareInfo> findBySenderId(String senderId);

    List<ShareInfo> findByReceiverEmail(String receiverEmail);

    List<ShareInfo> findByVideoIdAndUsed(String videoId, boolean used);

    boolean existsByShareToken(String shareToken);

    void deleteByShareToken(String shareToken);
}