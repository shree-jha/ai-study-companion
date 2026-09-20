package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.service.QuizGenerationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/quiz-generation")
public class QuizGenerationController {

    private final QuizGenerationService quizGenerationService;

    public QuizGenerationController(QuizGenerationService quizGenerationService) {
        this.quizGenerationService = quizGenerationService;
    }

    @PostMapping("/project/{projectId}")
    public Map<String, Object> generateQuiz(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "5") int count,
            Authentication authentication
    ) {
        return quizGenerationService.generateQuestions(
                projectId,
                authentication.getName(),
                count
        );
    }
}