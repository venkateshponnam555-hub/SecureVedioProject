package com.securevideo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("\n========================================");
        System.out.println("JWT AUTHENTICATION FILTER");
        System.out.println("========================================");

        System.out.println("Request URI    : " + request.getRequestURI());
        System.out.println("Request Method : " + request.getMethod());

        String authHeader = request.getHeader("Authorization");
        System.out.println("Authorization Header : " + authHeader);

        String token = extractTokenFromRequest(request);

        if (token == null) {
            System.out.println("❌ No JWT token found.");
        } else {
            System.out.println("✅ Token extracted successfully.");
            System.out.println("Token Length : " + token.length());

            try {
                boolean valid = JwtUtil.validateToken(token);
                System.out.println("Token Valid : " + valid);

                if (valid) {
                    String userId = JwtUtil.getUserIdFromToken(token);
                    String email = JwtUtil.getEmailFromToken(token);

                    System.out.println("User ID : " + userId);
                    System.out.println("Email   : " + email);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    Collections.emptyList()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    System.out.println("✅ Authentication SUCCESS");
                } else {
                    System.out.println("❌ Authentication FAILED - Invalid Token");
                }

            } catch (Exception e) {
                System.out.println("❌ JWT Validation Exception");
                System.out.println("Exception Type : " + e.getClass().getName());
                System.out.println("Exception Msg  : " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("========================================\n");

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}