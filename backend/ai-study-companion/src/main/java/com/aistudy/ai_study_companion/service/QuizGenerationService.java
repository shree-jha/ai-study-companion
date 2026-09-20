package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import com.aistudy.ai_study_companion.entity.Material;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.QuizQuestion;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.DocumentChunkRepository;
import com.aistudy.ai_study_companion.repository.MaterialRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.QuizQuestionRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;

import org.springframework.stereotype.Service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class QuizGenerationService {

    private final MaterialRepository materialRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final OpenAIService openAIService;
    private final ObjectMapper objectMapper;

    public QuizGenerationService(
            MaterialRepository materialRepository,
            DocumentChunkRepository documentChunkRepository,
            QuizQuestionRepository quizQuestionRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository,
            UserRepository userRepository,
            OpenAIService openAIService,
            ObjectMapper objectMapper
    ) {
        this.materialRepository = materialRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.openAIService = openAIService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> generateQuestions(
            Long projectId,
            String email,
            int numberOfQuestions
    ) {

        // --------------------------------------------------
        // 1. Validate number of questions
        // --------------------------------------------------

        if (numberOfQuestions <= 0) {
            numberOfQuestions = 10;
        }

        if (numberOfQuestions > 20) {
            numberOfQuestions = 20;
        }

        // --------------------------------------------------
        // 2. Check project ownership
        // --------------------------------------------------

        Project project = getOwnedProject(projectId, email);

        // --------------------------------------------------
        // 3. Get READY materials
        // --------------------------------------------------

        List<Material> materials =
                materialRepository.findByProjectId(projectId);

        List<Material> readyMaterials = materials.stream()
                .filter(material ->
                        "READY".equalsIgnoreCase(material.getStatus())
                )
                .toList();

        if (readyMaterials.isEmpty()) {
            throw new RuntimeException(
                    "No processed study material is available for this project."
            );
        }

        // --------------------------------------------------
        // 4. Collect document chunks
        // --------------------------------------------------

        List<DocumentChunk> allChunks = new ArrayList<>();

        for (Material material : readyMaterials) {

            List<DocumentChunk> chunks =
                    documentChunkRepository.findByMaterialId(
                            material.getId()
                    );

            if (chunks != null) {
                allChunks.addAll(chunks);
            }
        }

        if (allChunks.isEmpty()) {
            throw new RuntimeException(
                    "The uploaded material is READY, but no document chunks were found."
            );
        }

        // --------------------------------------------------
        // 5. Build context for AI
        // --------------------------------------------------

        StringBuilder contextBuilder = new StringBuilder();

        /*
         * Keep the context reasonably sized for the local
         * llama3.2:3b model.
         *
         * This is not the final adaptive retrieval design.
         * It is our reliable baseline generation pipeline.
         */
        int maxCharacters = 12000;

        for (DocumentChunk chunk : allChunks) {

            if (contextBuilder.length() >= maxCharacters) {
                break;
            }

            String chunkText = chunk.getContent();

            if (chunkText == null || chunkText.isBlank()) {
                continue;
            }

            String sourceMarker =
                    "\n[Source Page " +
                    chunk.getPageNumber() +
                    "]\n";

            contextBuilder.append(sourceMarker);
            contextBuilder.append(chunkText);
            contextBuilder.append("\n");

            if (contextBuilder.length() >= maxCharacters) {
                break;
            }
        }

        String context = contextBuilder.toString();

        if (context.isBlank()) {
            throw new RuntimeException(
                    "No usable text was found in the processed study material."
            );
        }

        // --------------------------------------------------
        // 6. Ask Ollama to generate questions
        // --------------------------------------------------

        String aiResponse =
                openAIService.generateQuizQuestions(
                        context,
                        numberOfQuestions
                );

        if (aiResponse == null || aiResponse.isBlank()) {
            throw new RuntimeException(
                    "AI returned an empty quiz response."
            );
        }

        // --------------------------------------------------
        // 7. Clean AI response
        // --------------------------------------------------

        String json = cleanJsonResponse(aiResponse);

        // --------------------------------------------------
        // 8. Parse JSON object
        // --------------------------------------------------

        GeneratedQuizResponse generatedQuiz;

        try {

            generatedQuiz =
                    objectMapper.readValue(
                            json,
                            GeneratedQuizResponse.class
                    );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Could not parse AI quiz response as JSON. AI response: "
                            + aiResponse
            );
        }

        if (generatedQuiz == null ||
                generatedQuiz.questions() == null ||
                generatedQuiz.questions().isEmpty()) {

            throw new RuntimeException(
                    "AI did not generate any valid quiz questions."
            );
        }

        List<GeneratedQuestion> generatedQuestions =
                generatedQuiz.questions();

        // --------------------------------------------------
        // 9. Save generated questions
        // --------------------------------------------------

        int savedCount = 0;

        for (GeneratedQuestion generated :
                generatedQuestions) {

            if (!isValidQuestion(generated)) {
                continue;
            }

            QuizQuestion question =
                    new QuizQuestion();

            question.setQuestionText(
                    generated.questionText()
            );

            question.setOptionA(
                    generated.optionA()
            );

            question.setOptionB(
                    generated.optionB()
            );

            question.setOptionC(
                    generated.optionC()
            );

            question.setOptionD(
                    generated.optionD()
            );

            question.setCorrectAnswer(
                    generated.correctAnswer()
            );

            question.setConcept(
                    generated.concept()
            );

            question.setDifficulty(
                    generated.difficulty()
            );

            question.setProject(project);

            quizQuestionRepository.save(question);

            savedCount++;
        }

        if (savedCount == 0) {
            throw new RuntimeException(
                    "AI generated questions, but none passed validation."
            );
        }

        // --------------------------------------------------
        // 10. Return result
        // --------------------------------------------------

        return Map.of(
                "projectId", projectId,
                "generated", savedCount,
                "message",
                "AI quiz questions generated successfully."
        );
    }

    // ======================================================
    // Validate generated question
    // ======================================================

    private boolean isValidQuestion(
            GeneratedQuestion question
    ) {

        if (question == null) {
            return false;
        }

        if (isBlank(question.questionText())) {
            return false;
        }

        if (isBlank(question.optionA())) {
            return false;
        }

        if (isBlank(question.optionB())) {
            return false;
        }

        if (isBlank(question.optionC())) {
            return false;
        }

        if (isBlank(question.optionD())) {
            return false;
        }

        if (isBlank(question.correctAnswer())) {
            return false;
        }

        if (isBlank(question.concept())) {
            return false;
        }

        if (isBlank(question.difficulty())) {
            return false;
        }

        String answer =
                question.correctAnswer()
                        .trim()
                        .toUpperCase();

        if (!answer.equals("A") &&
                !answer.equals("B") &&
                !answer.equals("C") &&
                !answer.equals("D")) {

            return false;
        }

        String difficulty =
                question.difficulty()
                        .trim()
                        .toUpperCase();

        if (!difficulty.equals("EASY") &&
                !difficulty.equals("MEDIUM") &&
                !difficulty.equals("HARD")) {

            return false;
        }

        return true;
    }

    // ======================================================
    // Check blank
    // ======================================================

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    // ======================================================
    // Clean AI JSON response
    // ======================================================

    private String cleanJsonResponse(String response) {

        String json = response.trim();

        // Remove markdown code fences if the model somehow adds them

        if (json.startsWith("```json")) {
            json = json.substring(7).trim();
        }

        if (json.startsWith("```")) {
            json = json.substring(3).trim();
        }

        if (json.endsWith("```")) {
            json = json.substring(
                    0,
                    json.length() - 3
            ).trim();
        }

        /*
         * Our new Ollama response should be:
         *
         * {
         *   "questions": [...]
         * }
         *
         * Therefore we extract the JSON OBJECT,
         * not the JSON ARRAY.
         */

        int start = json.indexOf("{");
        int end = json.lastIndexOf("}");

        if (start >= 0 && end > start) {
            json = json.substring(
                    start,
                    end + 1
            );
        }

        return json.trim();
    }

    // ======================================================
    // Project ownership
    // ======================================================

    private Project getOwnedProject(
            Long projectId,
            String email
    ) {

        User user =
                userRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        List<Space> spaces =
                spaceRepository.findByUserId(user.getId());

        for (Space space : spaces) {

            var project =
                    projectRepository.findByIdAndSpaceId(
                            projectId,
                            space.getId()
                    );

            if (project.isPresent()) {
                return project.get();
            }
        }

        throw new RuntimeException(
                "You do not have access to this project."
        );
    }

    // ======================================================
    // AI-generated quiz response
    // ======================================================

    public record GeneratedQuizResponse(
            List<GeneratedQuestion> questions
    ) {
    }

    // ======================================================
    // AI-generated question structure
    // ======================================================

    public record GeneratedQuestion(
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
}