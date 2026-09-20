package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(
            RecommendationService recommendationService
    ) {
        this.recommendationService =
                recommendationService;
    }

    /**
     * Generate a new recommendation.
     *
     * POST:
     * /api/recommendations/project/{projectId}
     */
    @PostMapping("/project/{projectId}")
    public ResponseEntity<?> generateRecommendation(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            RecommendationService.RecommendationResponse response =
                    recommendationService
                            .generateRecommendation(
                                    projectId,
                                    authentication.getName()
                            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }

    /**
     * Get active recommendations.
     *
     * GET:
     * /api/recommendations/project/{projectId}
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getRecommendations(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            List<RecommendationService.RecommendationResponse>
                    recommendations =
                    recommendationService
                            .getRecommendations(
                                    projectId,
                                    authentication.getName()
                            );

            return ResponseEntity.ok(
                    recommendations
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }

    /**
     * Mark recommendation as completed.
     *
     * PATCH:
     * /api/recommendations/{id}/complete
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> completeRecommendation(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            recommendationService
                    .completeRecommendation(
                            id,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Recommendation completed"
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }
}