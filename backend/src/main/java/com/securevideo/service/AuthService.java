package com.securevideo.service;

import com.securevideo.model.User;
import com.securevideo.repository.UserRepository;
import com.securevideo.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * Register a new user
     */
    public Map<String, Object> register(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email.toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("USER");
        user.setCreatedAt(Instant.now());

        user = userRepository.save(user);

        String token = JwtUtil.generateToken(user.getId(), user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", token);
        response.put("refreshToken", token);
        response.put("user", userToMap(user));
        return response;
    }

    /**
     * Login user
     */
    public Map<String, Object> login(String email, String password) {
        Optional<User> optionalUser = userRepository.findByEmail(email.toLowerCase().trim());

        if (optionalUser.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = JwtUtil.generateToken(user.getId(), user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", token);
        response.put("refreshToken", token);
        response.put("user", userToMap(user));
        return response;
    }

    /**
     * Get current user by ID
     */
    public Map<String, Object> getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userToMap(user);
    }

    /**
     * Update user profile
     */
    public Map<String, Object> updateProfile(String userId, Map<String, Object> profileData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (profileData.containsKey("name")) {
            user.setName((String) profileData.get("name"));
        }

        user = userRepository.save(user);
        return userToMap(user);
    }

    /**
     * Change password
     */
    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private Map<String, Object> userToMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }
}