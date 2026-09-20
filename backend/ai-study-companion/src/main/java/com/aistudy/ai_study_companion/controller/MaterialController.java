package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.Material;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.MaterialRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import com.aistudy.ai_study_companion.service.PdfProcessingService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialRepository materialRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final PdfProcessingService pdfProcessingService;

    private final String uploadDirectory = "uploads";

    public MaterialController(
            MaterialRepository materialRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository,
            UserRepository userRepository,
            PdfProcessingService pdfProcessingService) {

        this.materialRepository = materialRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.pdfProcessingService = pdfProcessingService;
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<?> uploadMaterial(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Space space = project.getSpace();

        if (!space.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403)
                    .body("You do not have access to this project");
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("File is empty");
        }

        String contentType = file.getContentType();

        if (!"application/pdf".equals(contentType)) {
            return ResponseEntity.badRequest()
                    .body("Only PDF files are allowed");
        }

        Path uploadPath = Paths.get(uploadDirectory);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis()
                + "_" + file.getOriginalFilename();

        Path filePath = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), filePath);

        Material material = new Material(
                file.getOriginalFilename(),
                filePath.toString(),
                "QUEUED",
                project
        );

        Material savedMaterial = materialRepository.save(material);

        // Start PDF processing in the background
        pdfProcessingService.processPdf(savedMaterial.getId());

        return ResponseEntity.ok(
                new MaterialResponse(
                        savedMaterial.getId(),
                        savedMaterial.getFileName(),
                        savedMaterial.getStatus(),
                        savedMaterial.getUploadedAt()
                )
        );
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getMaterials(
            @PathVariable Long projectId,
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Space space = project.getSpace();

        if (!space.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403)
                    .body("You do not have access to this project");
        }

        List<MaterialResponse> materials = materialRepository
                .findByProjectId(projectId)
                .stream()
                .map(material -> new MaterialResponse(
                        material.getId(),
                        material.getFileName(),
                        material.getStatus(),
                        material.getUploadedAt()
                ))
                .toList();

        return ResponseEntity.ok(materials);
    }

    public record MaterialResponse(
            Long id,
            String fileName,
            String status,
            LocalDateTime uploadedAt
    ) {
    }
}