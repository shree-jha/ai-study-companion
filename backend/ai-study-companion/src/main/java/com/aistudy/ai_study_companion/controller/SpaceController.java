package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/spaces")
public class SpaceController {

    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;

    public SpaceController(
            SpaceRepository spaceRepository,
            UserRepository userRepository) {

        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createSpace(
            @RequestBody SpaceRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Space space = new Space(request.name(), user);

        Space savedSpace = spaceRepository.save(space);

        return ResponseEntity.ok(
                new SpaceResponse(
                        savedSpace.getId(),
                        savedSpace.getName(),
                        savedSpace.getCreatedAt()
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<SpaceResponse>> getMySpaces(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SpaceResponse> spaces = spaceRepository
                .findByUserId(user.getId())
                .stream()
                .map(space -> new SpaceResponse(
                        space.getId(),
                        space.getName(),
                        space.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(spaces);
    }

    public record SpaceRequest(String name) {
    }

    public record SpaceResponse(
            Long id,
            String name,
            LocalDateTime createdAt
    ) {
    }
}