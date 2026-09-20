package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import com.aistudy.ai_study_companion.entity.Material;
import com.aistudy.ai_study_companion.entity.OpenEndedAssessment;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.DocumentChunkRepository;
import com.aistudy.ai_study_companion.repository.MaterialRepository;
import com.aistudy.ai_study_companion.repository.OpenEndedAssessmentRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OpenEndedAssessmentService {

    private final OpenEndedAssessmentRepository assessmentRepository;
    private final MaterialRepository materialRepository;
    private final DocumentChunkRepository chunkRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final OpenAIService openAIService;
    private final MasteryService masteryService;
    private final RecommendationService recommendationService;
    private final ObjectMapper objectMapper;

    public OpenEndedAssessmentService(
            OpenEndedAssessmentRepository assessmentRepository,
            MaterialRepository materialRepository,
            DocumentChunkRepository chunkRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository,
            UserRepository userRepository,
            OpenAIService openAIService,
            MasteryService masteryService,
            RecommendationService recommendationService,
            ObjectMapper objectMapper
    ) {
        this.assessmentRepository = assessmentRepository;
        this.materialRepository = materialRepository;
        this.chunkRepository = chunkRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.openAIService = openAIService;
        this.masteryService = masteryService;
        this.recommendationService = recommendationService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> evaluate(
            Long projectId,
            String email,
            String question,
            String studentAnswer
    ) {

        Project project =
                getOwnedProject(
                        projectId,
                        email
                );

        if (question == null || question.isBlank()) {
            throw new RuntimeException(
                    "Question is required"
            );
        }

        if (studentAnswer == null ||
                studentAnswer.isBlank()) {
            throw new RuntimeException(
                    "Please provide an answer"
            );
        }

        // ================================================
        // FIND READY MATERIAL
        // ================================================

        List<Material> materials =
                materialRepository.findByProjectId(
                        projectId
                );

        List<DocumentChunk> chunks =
                materials.stream()
                        .filter(material ->
                                "READY".equalsIgnoreCase(
                                        material.getStatus()
                                )
                        )
                        .flatMap(material ->
                                chunkRepository
                                        .findByMaterialId(
                                                material.getId()
                                        )
                                        .stream()
                        )
                        .toList();

        if (chunks.isEmpty()) {
            throw new RuntimeException(
                    "No processed study material is available."
            );
        }

        // ================================================
        // BUILD CONTEXT
        // ================================================

        StringBuilder contextBuilder =
                new StringBuilder();

        int maxCharacters = 12000;

        for (DocumentChunk chunk : chunks) {

            if (contextBuilder.length() >=
                    maxCharacters) {
                break;
            }

            if (chunk.getContent() == null ||
                    chunk.getContent().isBlank()) {
                continue;
            }

            contextBuilder
                    .append("\n[Source Page ")
                    .append(chunk.getPageNumber())
                    .append("]\n")
                    .append(chunk.getContent())
                    .append("\n");
        }

        String context =
                contextBuilder.toString();

        if (context.isBlank()) {
            throw new RuntimeException(
                    "Study material contains no usable text."
            );
        }

        // ================================================
        // AI EVALUATION
        // ================================================

        String aiResponse =
                openAIService.evaluateOpenEndedAnswer(
                        question,
                        studentAnswer,
                        context
                );

        try {

            JsonNode json =
                    objectMapper.readTree(
                            aiResponse
                    );

            double score =
                    json.path("score")
                            .asDouble();

            score =
                    Math.max(
                            0,
                            Math.min(
                                    100,
                                    score
                            )
                    );

            String concept =
                    json.path("concept")
                            .asText("General")
                            .trim();

            if (concept.isBlank()) {
                concept = "General";
            }

            String feedback =
                    json.path("feedback")
                            .asText();

            String understanding =
                    json.path("understanding")
                            .asText();

            String missingConcepts =
                    json.path("missingConcepts")
                            .asText();

            String reasoningFeedback =
                    json.path("reasoningFeedback")
                            .asText();

            // ============================================
            // SAVE ASSESSMENT
            // ============================================

            User user =
                    getUser(email);

            OpenEndedAssessment assessment =
                    new OpenEndedAssessment(
                            user,
                            project,
                            question,
                            studentAnswer,
                            concept,
                            score,
                            feedback,
                            understanding,
                            missingConcepts,
                            reasoningFeedback
                    );

            OpenEndedAssessment saved =
                    assessmentRepository.save(
                            assessment
                    );

            // ============================================
            // UPDATE MASTERY
            // ============================================

            masteryService.updateFromOpenEnded(
                    projectId,
                    email,
                    concept,
                    score
            );

            // ============================================
            // UPDATE RECOMMENDATION
            // ============================================

            RecommendationService.RecommendationResponse recommendation =
                    recommendationService.generateRecommendation(
                            projectId,
                            email
                    );

            // ============================================
            // BUILD RESPONSE
            // ============================================

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put(
                    "assessmentId",
                    saved.getId()
            );

            response.put(
                    "question",
                    question
            );

            response.put(
                    "studentAnswer",
                    studentAnswer
            );

            response.put(
                    "concept",
                    concept
            );

            response.put(
                    "score",
                    score
            );

            response.put(
                    "feedback",
                    feedback
            );

            response.put(
                    "understanding",
                    understanding
            );

            response.put(
                    "missingConcepts",
                    missingConcepts
            );

            response.put(
                    "reasoningFeedback",
                    reasoningFeedback
            );

            response.put(
                    "masteryUpdated",
                    true
            );

            response.put(
                    "recommendation",
                    recommendation
            );

            return response;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Could not process AI assessment response: "
                            + aiResponse,
                    e
            );
        }
    }

    @Transactional(readOnly = true)
    public List<OpenEndedAssessment> getHistory(
            Long projectId,
            String email
    ) {

        Project project =
                getOwnedProject(
                        projectId,
                        email
                );

        User user =
                getUser(email);

        return assessmentRepository
                .findByUserIdAndProjectIdOrderByCompletedAtDesc(
                        user.getId(),
                        project.getId()
                );
    }

    private User getUser(
            String email
    ) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "User not found"
                                )
                );
    }

    private Project getOwnedProject(
            Long projectId,
            String email
    ) {

        User user =
                getUser(email);

        List<Space> spaces =
                spaceRepository.findByUserId(
                        user.getId()
                );

        for (Space space : spaces) {

            Optional<Project> project =
                    projectRepository.findByIdAndSpaceId(
                            projectId,
                            space.getId()
                    );

            if (project.isPresent()) {
                return project.get();
            }
        }

        throw new RuntimeException(
                "Project not found or access denied"
        );
    }
}