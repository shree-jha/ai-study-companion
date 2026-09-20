package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.UserRepository;
import com.aistudy.ai_study_companion.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Name is required");
        }

        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required");
        }

        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Password is required");
        }

        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest()
                    .body("Email already registered");
        }

        String encodedPassword =
                passwordEncoder.encode(request.password());

        User user = new User(
                request.name(),
                request.email(),
                encodedPassword
        );

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Registration successful",
                        "userId", savedUser.getId(),
                        "name", savedUser.getName(),
                        "email", savedUser.getEmail()
                )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        if (request.email() == null ||
                request.password() == null) {

            return ResponseEntity.status(401)
                    .body("Email and password are required");
        }

        User existingUser =
                userRepository.findByEmail(request.email())
                        .orElse(null);

        if (existingUser == null) {
            return ResponseEntity.status(401)
                    .body("Invalid email or password");
        }

        if (!passwordEncoder.matches(
                request.password(),
                existingUser.getPassword())) {

            return ResponseEntity.status(401)
                    .body("Invalid email or password");
        }

        String token =
                jwtService.generateToken(existingUser.getEmail());

        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "userId", existingUser.getId(),
                        "name", existingUser.getName(),
                        "email", existingUser.getEmail()
                )
        );
    }

    public record RegisterRequest(
            String name,
            String email,
            String password
    ) {
    }

    public record LoginRequest(
            String email,
            String password
    ) {
    }
}