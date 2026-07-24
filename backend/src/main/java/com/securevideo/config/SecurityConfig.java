package com.securevideo.config;

import com.securevideo.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                // Enable CORS configuration
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // Disable CSRF because JWT authentication is stateless
                .csrf(csrf -> csrf.disable())

                // Do not create HTTP sessions
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Allow browser CORS preflight requests
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Login, registration and refresh-token APIs
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        /*
                         * Only share-link metadata is public.
                         *
                         * Example:
                         * GET /api/share/{shareToken}
                         *
                         * send-otp, verify-otp and key-exchange
                         * still require authentication.
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/share/*"
                        ).permitAll()

                        /*
                         * Existing public video endpoints.
                         *
                         * Keep these public only when the controller
                         * validates a secure share token or another
                         * access mechanism.
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/videos/stream/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/videos/download/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/videos/metadata/**"
                        ).permitAll()

                        // Upload and every other API require JWT
                        .anyRequest().authenticated()
                )

                // Validate JWT before Spring username/password filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:3000",
                "https://secure-vedio-project.vercel.app"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));

        // Allow Authorization and multipart upload headers
        configuration.setAllowedHeaders(List.of("*"));

        configuration.setExposedHeaders(List.of(
                "Authorization",
                "Content-Disposition",
                "Content-Length",
                "Content-Range",
                "Accept-Ranges"
        ));

        configuration.setAllowCredentials(true);

        // Cache preflight response for one hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}