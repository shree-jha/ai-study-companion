package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;

    public ProjectController(
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository,
            UserRepository userRepository) {

        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/space/{spaceId}")
    public ResponseEntity<?> createProject(
            @PathVariable Long spaceId,
            @RequestBody ProjectRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        if (!space.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403)
                    .body("You do not have access to this space");
        }

        Project project = new Project(
                request.name(),
                request.description(),
                space
        );

        Project savedProject = projectRepository.save(project);

        return ResponseEntity.ok(
                new ProjectResponse(
                        savedProject.getId(),
                        savedProject.getName(),
                        savedProject.getDescription(),
                        savedProject.getCreatedAt()
                )
        );
    }

    @GetMapping("/space/{spaceId}")
    public ResponseEntity<?> getProjects(
            @PathVariable Long spaceId,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        if (!space.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403)
                    .body("You do not have access to this space");
        }

        List<ProjectResponse> projects = projectRepository
                .findBySpaceId(spaceId)
                .stream()
                .map(project -> new ProjectResponse(
                        project.getId(),
                        project.getName(),
                        project.getDescription(),
                        project.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(projects);
    }

    public record ProjectRequest(
            String name,
            String description
    ) {
    }

    public record ProjectResponse(
            Long id,
            String name,
            String description,
            LocalDateTime createdAt
    ) {
    }
}