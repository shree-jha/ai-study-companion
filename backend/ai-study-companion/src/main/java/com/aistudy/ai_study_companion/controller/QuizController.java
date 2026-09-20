package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.QuizQuestion;
import com.aistudy.ai_study_companion.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getQuiz(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "5") int count,
            Authentication authentication
    ) {

        try {

            List<QuizQuestion> questions =
                    quizService.getQuestions(
                            projectId,
                            authentication.getName(),
                            count
                    );

            return ResponseEntity.ok(
                    questions.stream()
                            .map(this::toQuestionResponse)
                            .toList()
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    @PostMapping("/project/{projectId}/question")
    public ResponseEntity<?> createQuestion(
            @PathVariable Long projectId,
            @RequestBody CreateQuestionRequest request,
            Authentication authentication
    ) {

        try {

            QuizQuestion question =
                    quizService.createQuestion(
                            projectId,
                            authentication.getName(),
                            request.questionText(),
                            request.optionA(),
                            request.optionB(),
                            request.optionC(),
                            request.optionD(),
                            request.correctAnswer(),
                            request.concept(),
                            request.difficulty()
                    );

            return ResponseEntity.ok(
                    toQuestionResponse(question)
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    @PostMapping("/project/{projectId}/submit")
    public ResponseEntity<?> submitQuiz(
            @PathVariable Long projectId,
            @RequestBody SubmitQuizRequest request,
            Authentication authentication
    ) {

        try {

            return ResponseEntity.ok(
                    quizService.submitQuiz(
                            projectId,
                            authentication.getName(),
                            request.answers()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    @GetMapping("/project/{projectId}/history")
    public ResponseEntity<?> getHistory(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            return ResponseEntity.ok(
                    quizService.getHistory(
                            projectId,
                            authentication.getName()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    private Map<String, Object> toQuestionResponse(
            QuizQuestion question
    ) {

        return Map.of(
                "id", question.getId(),
                "questionText", question.getQuestionText(),
                "optionA", question.getOptionA(),
                "optionB", question.getOptionB(),
                "optionC", question.getOptionC(),
                "optionD", question.getOptionD(),
                "concept", question.getConcept(),
                "difficulty", question.getDifficulty()
        );
    }

    public record CreateQuestionRequest(
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctAnswer,
            String concept,
            String difficulty
    ) {
    }

    public record SubmitQuizRequest(
            Map<Long, String> answers
    ) {
    }
}