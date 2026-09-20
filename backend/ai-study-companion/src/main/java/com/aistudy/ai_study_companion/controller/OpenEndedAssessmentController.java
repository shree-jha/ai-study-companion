package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.service.OpenEndedAssessmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
public class OpenEndedAssessmentController {

    private final OpenEndedAssessmentService assessmentService;

    public OpenEndedAssessmentController(
            OpenEndedAssessmentService assessmentService
    ) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/open-ended")
    public ResponseEntity<?> evaluate(
            @RequestBody EvaluateRequest request,
            Authentication authentication
    ) {

        try {

            return ResponseEntity.ok(
                    assessmentService.evaluate(
                            request.projectId(),
                            authentication.getName(),
                            request.question(),
                            request.studentAnswer()
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }

    @GetMapping("/open-ended/project/{projectId}")
    public ResponseEntity<?> history(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            return ResponseEntity.ok(
                    assessmentService.getHistory(
                            projectId,
                            authentication.getName()
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }

    public record EvaluateRequest(
            Long projectId,
            String question,
            String studentAnswer
    ) {
    }
}