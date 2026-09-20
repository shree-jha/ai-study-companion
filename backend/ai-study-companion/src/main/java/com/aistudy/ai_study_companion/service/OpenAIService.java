package com.aistudy.ai_study_companion.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {

    private final RestClient restClient;
    private final String model;

    public OpenAIService(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:llama3.2:3b}") String model,
            @Value("${ollama.api-key:}") String apiKey) {

        this.model = model;

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(
                        "Content-Type",
                        MediaType.APPLICATION_JSON_VALUE
                );

        // Local Ollama does not require authentication.
        // Ollama Cloud requires a Bearer API key.
        if (apiKey != null && !apiKey.isBlank()) {
            builder.defaultHeader(
                    "Authorization",
                    "Bearer " + apiKey
            );
        }

        this.restClient = builder.build();
    }

    // =========================================================
    // AI TUTOR
    // =========================================================

    public String askTutor(String question, String context) {

        String prompt = """
                You are an AI Study Companion.

                Answer the student's question using ONLY the provided study material.

                Rules:
                1. Use only the provided study material.
                2. Do not invent information.
                3. If the material does not contain enough information,
                   clearly say that the material does not provide enough
                   information to answer the question.
                4. Explain the answer clearly and simply.
                5. Mention relevant source page numbers when available.
                6. Do not use outside knowledge.

                STUDY MATERIAL:
                %s

                STUDENT QUESTION:
                %s

                ANSWER:
                """.formatted(context, question);

        return generate(prompt);
    }


    // =========================================================
    // AI QUIZ GENERATION
    // =========================================================

    public String generateQuizQuestions(
            String context,
            int numberOfQuestions
    ) {

        String prompt = """
                Generate exactly %d multiple-choice questions
                using ONLY the study material below.

                Return the result as a JSON object.

                Rules:
                - Generate exactly %d questions.
                - Each question must have four options.
                - Only one option is correct.
                - correctAnswer must be A, B, C, or D.
                - difficulty must be EASY, MEDIUM, or HARD.
                - Use different concepts when possible.
                - Do not create duplicate questions.
                - Use ONLY the provided study material.
                - Do not use outside knowledge.
                - Test understanding where possible.
                - Keep questions concise.
                - Return no explanations.

                STUDY MATERIAL:

                %s
                """.formatted(
                numberOfQuestions,
                numberOfQuestions,
                context
        );

        return generateQuizJson(
                prompt,
                numberOfQuestions
        );
    }


    // =========================================================
    // NORMAL OLLAMA GENERATION
    // =========================================================

    private String generate(String prompt) {

        Map<String, Object> requestBody =
                new HashMap<>();

        requestBody.put(
                "model",
                model
        );

        requestBody.put(
                "prompt",
                prompt
        );

        requestBody.put(
                "stream",
                false
        );

        Map<?, ?> response = restClient.post()
                .uri("/api/generate")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new RuntimeException(
                    "Empty response from Ollama"
            );
        }

        Object responseText =
                response.get("response");

        if (responseText == null) {
            throw new RuntimeException(
                    "Could not extract response from Ollama"
            );
        }

        String answer =
                responseText.toString().trim();

        if (answer.isEmpty()) {
            throw new RuntimeException(
                    "Ollama returned an empty response"
            );
        }

        return answer;
    }


    // =========================================================
    // STRUCTURED QUIZ GENERATION
    // =========================================================

    private String generateQuizJson(
            String prompt,
            int numberOfQuestions
    ) {

        Map<String, Object> requestBody =
                new HashMap<>();

        requestBody.put(
                "model",
                model
        );

        requestBody.put(
                "prompt",
                prompt
        );

        requestBody.put(
                "stream",
                false
        );


        // =====================================================
        // Question properties
        // =====================================================

        Map<String, Object> questionProperties =
                new HashMap<>();

        questionProperties.put(
                "questionText",
                Map.of(
                        "type",
                        "string"
                )
        );

        questionProperties.put(
                "optionA",
                Map.of(
                        "type",
                        "string"
                )
        );

        questionProperties.put(
                "optionB",
                Map.of(
                        "type",
                        "string"
                )
        );

        questionProperties.put(
                "optionC",
                Map.of(
                        "type",
                        "string"
                )
        );

        questionProperties.put(
                "optionD",
                Map.of(
                        "type",
                        "string"
                )
        );

        questionProperties.put(
                "correctAnswer",
                Map.of(
                        "type",
                        "string",
                        "enum",
                        List.of(
                                "A",
                                "B",
                                "C",
                                "D"
                        )
                )
        );

        questionProperties.put(
                "concept",
                Map.of(
                        "type",
                        "string"
                )
        );

        questionProperties.put(
                "difficulty",
                Map.of(
                        "type",
                        "string",
                        "enum",
                        List.of(
                                "EASY",
                                "MEDIUM",
                                "HARD"
                        )
                )
        );


        // =====================================================
        // Question schema
        // =====================================================

        Map<String, Object> questionSchema =
                new HashMap<>();

        questionSchema.put(
                "type",
                "object"
        );

        questionSchema.put(
                "properties",
                questionProperties
        );

        questionSchema.put(
                "required",
                List.of(
                        "questionText",
                        "optionA",
                        "optionB",
                        "optionC",
                        "optionD",
                        "correctAnswer",
                        "concept",
                        "difficulty"
                )
        );

        questionSchema.put(
                "additionalProperties",
                false
        );


        // =====================================================
        // Questions array
        // =====================================================

        Map<String, Object> questionsArray =
                new HashMap<>();

        questionsArray.put(
                "type",
                "array"
        );

        questionsArray.put(
                "items",
                questionSchema
        );

        /*
         * THIS IS THE IMPORTANT FIX.
         *
         * If count=1:
         *   minItems = 1
         *   maxItems = 1
         *
         * If count=3:
         *   minItems = 3
         *   maxItems = 3
         */
        questionsArray.put(
                "minItems",
                numberOfQuestions
        );

        questionsArray.put(
                "maxItems",
                numberOfQuestions
        );


        // =====================================================
        // Root schema
        // =====================================================

        Map<String, Object> rootProperties =
                new HashMap<>();

        rootProperties.put(
                "questions",
                questionsArray
        );

        Map<String, Object> rootSchema =
                new HashMap<>();

        rootSchema.put(
                "type",
                "object"
        );

        rootSchema.put(
                "properties",
                rootProperties
        );

        rootSchema.put(
                "required",
                List.of(
                        "questions"
                )
        );

        rootSchema.put(
                "additionalProperties",
                false
        );


        // =====================================================
        // Send schema to Ollama
        // =====================================================

        requestBody.put(
                "format",
                rootSchema
        );


        // =====================================================
        // Generation options
        // =====================================================

        /*
         * 1200 tokens is enough for one question and gives
         * the model enough room to finish the JSON.
         *
         * We will increase this automatically for larger quizzes.
         */
        int maxTokens =
                Math.max(
                        1200,
                        numberOfQuestions * 700
                );

        requestBody.put(
                "options",
                Map.of(
                        "temperature",
                        0.2,
                        "num_predict",
                        maxTokens
                )
        );


        // =====================================================
        // Call Ollama
        // =====================================================

        Map<?, ?> response =
                restClient.post()
                        .uri("/api/generate")
                        .body(requestBody)
                        .retrieve()
                        .body(Map.class);

        if (response == null) {
            throw new RuntimeException(
                    "Empty response from Ollama"
            );
        }

        Object responseText =
                response.get("response");

        if (responseText == null) {
            throw new RuntimeException(
                    "Ollama did not return a response"
            );
        }

        String answer =
                responseText.toString().trim();

        if (answer.isEmpty()) {
            throw new RuntimeException(
                    "Ollama returned an empty quiz response"
            );
        }

        return answer;
    }
    public String evaluateOpenEndedAnswer(
        String question,
        String studentAnswer,
        String context
) {

    String prompt = """
            You are an AI learning assessment evaluator.

            Evaluate the student's answer using ONLY the provided study material.

            STUDY MATERIAL:
            %s

            QUESTION:
            %s

            STUDENT ANSWER:
            %s

            Evaluate the answer based on:
            - understanding
            - accuracy
            - relevance
            - key concepts covered
            - missing concepts
            - reasoning

            Return ONLY valid JSON in this exact structure:

            {
              "score": 0,
              "concept": "concept name",
              "feedback": "clear overall feedback",
              "understanding": "what the student understood",
              "missingConcepts": "what is missing or incorrect",
              "reasoningFeedback": "feedback about reasoning"
            }

            Score from 0 to 100.

            Do not use outside knowledge.
            """.formatted(
            context,
            question,
            studentAnswer
    );

    Map<String, Object> requestBody =
            new HashMap<>();

    requestBody.put("model", model);
    requestBody.put("prompt", prompt);
    requestBody.put("stream", false);

    Map<String, Object> properties =
            new HashMap<>();

    properties.put(
            "score",
            Map.of(
                    "type", "number",
                    "minimum", 0,
                    "maximum", 100
            )
    );

    properties.put(
            "concept",
            Map.of("type", "string")
    );

    properties.put(
            "feedback",
            Map.of("type", "string")
    );

    properties.put(
            "understanding",
            Map.of("type", "string")
    );

    properties.put(
            "missingConcepts",
            Map.of("type", "string")
    );

    properties.put(
            "reasoningFeedback",
            Map.of("type", "string")
    );

    Map<String, Object> schema =
            new HashMap<>();

    schema.put("type", "object");
    schema.put("properties", properties);

    schema.put(
            "required",
            List.of(
                    "score",
                    "concept",
                    "feedback",
                    "understanding",
                    "missingConcepts",
                    "reasoningFeedback"
            )
    );

    schema.put(
            "additionalProperties",
            false
    );

    requestBody.put("format", schema);

    requestBody.put(
            "options",
            Map.of(
                    "temperature", 0.1,
                    "num_predict", 700
            )
    );

    Map<?, ?> response =
            restClient.post()
                    .uri("/api/generate")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

    if (response == null) {
        throw new RuntimeException(
                "Empty response from Ollama"
        );
    }

    Object responseText =
            response.get("response");

    if (responseText == null) {
        throw new RuntimeException(
                "Ollama did not return an evaluation"
        );
    }

    return responseText.toString().trim();
}
}