package com.securevideo.service;

import com.securevideo.crypto.EncryptionUtil;
import com.securevideo.crypto.HashUtil;
import com.securevideo.crypto.KeyGeneratorUtil;
import com.securevideo.model.VideoChunk;
import com.securevideo.repository.VideoChunkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class ChunkService {

    @Value("${securevideo.storage.chunks}")
    private String chunksPath;

    private final VideoChunkRepository videoChunkRepository;

    public ChunkService(VideoChunkRepository videoChunkRepository) {
        this.videoChunkRepository = videoChunkRepository;
    }


    /**
     * Split video file into chunks
     */
    public List<VideoChunk> splitVideo(File videoFile,
                                       String videoId,
                                       String userId,
                                       int chunkSizeBytes) throws IOException {

        List<VideoChunk> chunks = new ArrayList<>();

        byte[] buffer = new byte[chunkSizeBytes];
        int chunkIndex = 0;


        try (FileInputStream fis = new FileInputStream(videoFile);
             BufferedInputStream bis = new BufferedInputStream(fis)) {


            int bytesRead;

            while ((bytesRead = bis.read(buffer)) > 0) {

                byte[] chunkData = new byte[bytesRead];

                System.arraycopy(
                        buffer,
                        0,
                        chunkData,
                        0,
                        bytesRead
                );


                String chunkFileName =
                        videoId + "_chunk_" + chunkIndex;


                Path chunkFilePath =
                        Paths.get(chunksPath, chunkFileName);


                Files.write(chunkFilePath, chunkData);


                String chunkHash =
                        HashUtil.sha512(chunkData);



                VideoChunk videoChunk = new VideoChunk();

                videoChunk.setVideoId(videoId);
                videoChunk.setChunkIndex(chunkIndex);
                videoChunk.setChunkStoragePath(chunkFilePath.toString());
                videoChunk.setChunkHash(chunkHash);
                videoChunk.setUserId(userId);
                videoChunk.setChunkSizeBytes(chunkSizeBytes);
                videoChunk.setEncryptionStatus("CHUNKED");


                chunks.add(videoChunk);
                String size;
                if (bytesRead >= 1024 * 1024) {
                    size = (bytesRead / (1024 * 1024)) + " MB";
                } else {
                    size = (bytesRead / 1024) + " KB";
                }
                System.out.println("Created chunk: " + chunkFileName + " | Size: " + size);


                chunkIndex++;
            }
        }


        for(VideoChunk chunk : chunks){
            chunk.setTotalChunks(chunks.size());
        }


        return videoChunkRepository.saveAll(chunks);
    }



    /**
     * Encrypt a single chunk
     */
    public VideoChunk encryptChunk(VideoChunk chunk, SecretKey aesKey) {

        try {

            Path chunkPath =
                    Paths.get(chunk.getChunkStoragePath());


            byte[] chunkData =
                    Files.readAllBytes(chunkPath);



            // Encrypt video chunk using AES
            byte[] encryptedData =
                    EncryptionUtil.encryptToBytes(
                            chunkData,
                            aesKey
                    );



            String encryptedFileName =
                    chunk.getVideoId()
                            + "_encrypted_"
                            + chunk.getChunkIndex();



            Path encryptedPath =
                    Paths.get(
                            chunksPath,
                            encryptedFileName
                    );



            Files.write(
                    encryptedPath,
                    encryptedData
            );



            /*
             * Store AES key
             * This key is required later for decryption
             */
            String aesKeyBase64 =
                    Base64.getEncoder()
                            .encodeToString(
                                    aesKey.getEncoded()
                            );


            chunk.setAesKeyEncrypted(aesKeyBase64);



            chunk.setEncryptedStoragePath(
                    encryptedPath.toString()
            );


            chunk.setEncryptionStatus(
                    "ENCRYPTED"
            );


            return videoChunkRepository.save(chunk);



        } catch(IOException e){

            throw new RuntimeException(
                    "Failed to encrypt chunk: "
                            + e.getMessage(),
                    e
            );
        }
    }




    /**
     * Get all chunks for a video
     */
    public List<VideoChunk> getChunksByVideoId(String videoId){

        return videoChunkRepository
                .findByVideoIdOrderByChunkIndexAsc(videoId);
    }




    /**
     * Get encrypted chunk data
     */
    public byte[] getEncryptedChunkData(String chunkId){

        VideoChunk chunk =
                videoChunkRepository
                        .findById(chunkId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Chunk not found: "
                                                + chunkId
                                )
                        );


        try{

            return Files.readAllBytes(
                    Paths.get(
                            chunk.getEncryptedStoragePath()
                    )
            );

        }catch(IOException e){

            throw new RuntimeException(
                    "Failed to read encrypted chunk: "
                            + e.getMessage(),
                    e
            );
        }
    }




    /**
     * Decrypt a single chunk
     */
    public byte[] decryptChunk(VideoChunk chunk,
                               SecretKey aesKey){

        try{

            byte[] encryptedData =
                    Files.readAllBytes(
                            Paths.get(
                                    chunk.getEncryptedStoragePath()
                            )
                    );


            return EncryptionUtil.decryptFromBytes(
                    encryptedData,
                    aesKey
            );


        }catch(IOException e){

            throw new RuntimeException(
                    "Failed to decrypt chunk: "
                            + e.getMessage(),
                    e
            );
        }
    }




    /**
     * Verify chunk hash
     */
    public boolean verifyChunkHash(VideoChunk chunk,
                                   byte[] data){

        String computedHash =
                HashUtil.sha512(data);


        return computedHash.equals(
                chunk.getChunkHash()
        );
    }
}