package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.ConceptMastery;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.QuestionAttempt;
import com.aistudy.ai_study_companion.entity.QuizAttempt;
import com.aistudy.ai_study_companion.entity.QuizQuestion;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.ConceptMasteryRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.QuestionAttemptRepository;
import com.aistudy.ai_study_companion.repository.QuizAttemptRepository;
import com.aistudy.ai_study_companion.repository.QuizQuestionRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class QuizService {

    private final QuizQuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;
    private final QuestionAttemptRepository questionAttemptRepository;
    private final ConceptMasteryRepository masteryRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final MasteryService masteryService;

    public QuizService(
            QuizQuestionRepository questionRepository,
            QuizAttemptRepository attemptRepository,
            QuestionAttemptRepository questionAttemptRepository,
            ConceptMasteryRepository masteryRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository,
            UserRepository userRepository,
            MasteryService masteryService
    ) {
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.questionAttemptRepository = questionAttemptRepository;
        this.masteryRepository = masteryRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.masteryService = masteryService;
    }

    /**
     * Adaptive question selection.
     *
     * The selector considers:
     * 1. Concept mastery / weakest concepts
     * 2. Previously answered questions
     * 3. Previously incorrect questions
     * 4. Recency of previous attempts
     * 5. Difficulty relative to mastery
     * 6. Randomized tie-breaking so the quiz does not feel identical
     */
    @Transactional(readOnly = true)
    public List<QuizQuestion> getQuestions(
            Long projectId,
            String email,
            int count
    ) {

        Project project = getOwnedProject(projectId, email);
        User user = getUser(email);

        if (count <= 0) {
            count = 5;
        }

        List<QuizQuestion> allQuestions =
                new ArrayList<>(
                        questionRepository.findByProjectId(project.getId())
                );

        if (allQuestions.isEmpty()) {
            return List.of();
        }

        List<QuestionAttempt> history =
                questionAttemptRepository
                        .findByUserIdAndProjectIdOrderByAnsweredAtDesc(
                                user.getId(),
                                project.getId()
                        );

        Map<Long, QuestionAttempt> latestAttemptByQuestion =
                new HashMap<>();

        Set<Long> answeredQuestionIds = new HashSet<>();

        for (QuestionAttempt attempt : history) {
            Long questionId = attempt.getQuestion().getId();
            answeredQuestionIds.add(questionId);
            latestAttemptByQuestion.putIfAbsent(questionId, attempt);
        }

        List<ConceptMastery> masteryRecords =
                masteryRepository.findByUserIdAndProjectIdOrderByMasteryLevelAsc(
                        user.getId(),
                        project.getId()
                );

        Map<String, Double> masteryByConcept = new HashMap<>();

        for (ConceptMastery mastery : masteryRecords) {
            String concept = normalizeConcept(mastery.getConcept());
            masteryByConcept.put(concept, mastery.getMasteryLevel());
        }

        LocalDateTime now = LocalDateTime.now();

        // Shuffle first so questions with equal adaptive scores vary naturally.
        Collections.shuffle(allQuestions);

        allQuestions.sort(
                Comparator.comparingDouble(
                        (QuizQuestion question) ->
                                adaptiveScore(
                                        question,
                                        answeredQuestionIds,
                                        latestAttemptByQuestion,
                                        masteryByConcept,
                                        now
                                )
                ).reversed()
        );

        // Prefer not-yet-seen questions. If the bank is exhausted, allow repeats.
        List<QuizQuestion> unseen = allQuestions.stream()
                .filter(question -> !answeredQuestionIds.contains(question.getId()))
                .toList();

        if (unseen.size() >= count) {
            return unseen.stream().limit(count).toList();
        }

        List<QuizQuestion> selected = new ArrayList<>(unseen);

        for (QuizQuestion question : allQuestions) {
            if (selected.size() >= count) {
                break;
            }

            if (!selected.contains(question)) {
                selected.add(question);
            }
        }

        return selected;
    }

    /**
     * Create a quiz question.
     */
    @Transactional
    public QuizQuestion createQuestion(
            Long projectId,
            String email,
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctAnswer,
            String concept,
            String difficulty
    ) {

        Project project = getOwnedProject(projectId, email);

        if (
                correctAnswer == null
                        || !Set.of("A", "B", "C", "D")
                        .contains(correctAnswer.toUpperCase())
        ) {
            throw new RuntimeException(
                    "Correct answer must be A, B, C, or D"
            );
        }

        if (
                difficulty == null
                        || !Set.of("EASY", "MEDIUM", "HARD")
                        .contains(difficulty.toUpperCase())
        ) {
            throw new RuntimeException(
                    "Difficulty must be EASY, MEDIUM, or HARD"
            );
        }

        if (questionText == null || questionText.isBlank()) {
            throw new RuntimeException("Question text is required");
        }

        if (concept == null || concept.isBlank()) {
            concept = "General";
        }

        QuizQuestion question =
                new QuizQuestion(
                        questionText,
                        optionA,
                        optionB,
                        optionC,
                        optionD,
                        correctAnswer.toUpperCase(),
                        concept,
                        difficulty.toUpperCase(),
                        project
                );

        return questionRepository.save(question);
    }

    /**
     * Submit a quiz and record question-level learning history.
     */
    @Transactional
    public Map<String, Object> submitQuiz(
            Long projectId,
            String email,
            Map<Long, String> answers
    ) {

        Project project = getOwnedProject(projectId, email);

        if (answers == null || answers.isEmpty()) {
            throw new RuntimeException("Please answer at least one question");
        }

        List<QuizQuestion> allQuestions =
                questionRepository.findByProjectId(project.getId());

        Map<Long, QuizQuestion> questionMap = new HashMap<>();

        for (QuizQuestion question : allQuestions) {
            questionMap.put(question.getId(), question);
        }

        int correctAnswers = 0;
        int totalQuestions = 0;
        List<Map<String, Object>> feedback = new ArrayList<>();
        List<QuizQuestion> answeredQuestions = new ArrayList<>();
        List<QuestionAttempt> questionAttempts = new ArrayList<>();

        User user = getUser(email);

        for (Map.Entry<Long, String> entry : answers.entrySet()) {

            Long questionId = entry.getKey();
            String submittedAnswer = entry.getValue();
            QuizQuestion question = questionMap.get(questionId);

            if (question == null) {
                continue;
            }

            totalQuestions++;
            answeredQuestions.add(question);

            boolean correct =
                    submittedAnswer != null
                            && submittedAnswer.equalsIgnoreCase(
                            question.getCorrectAnswer()
                    );

            if (correct) {
                correctAnswers++;
            }

            questionAttempts.add(
                    new QuestionAttempt(
                            user,
                            project,
                            question,
                            submittedAnswer,
                            correct
                    )
            );

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("questionId", question.getId());
            item.put("correct", correct);
            item.put("selectedAnswer", submittedAnswer);
            item.put("correctAnswer", question.getCorrectAnswer());
            item.put("concept", question.getConcept());
            feedback.add(item);
        }

        if (totalQuestions == 0) {
            throw new RuntimeException("No valid questions were submitted");
        }

        double score =
                ((double) correctAnswers / totalQuestions) * 100.0;

        score = Math.round(score * 100.0) / 100.0;

        QuizAttempt attempt =
                new QuizAttempt(
                        user,
                        project,
                        totalQuestions,
                        correctAnswers
                );

        QuizAttempt savedAttempt = attemptRepository.save(attempt);
        questionAttemptRepository.saveAll(questionAttempts);

        masteryService.updateFromQuiz(
                project.getId(),
                email,
                answeredQuestions,
                answers
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("attemptId", savedAttempt.getId());
        response.put("totalQuestions", totalQuestions);
        response.put("correctAnswers", correctAnswers);
        response.put("score", score);
        response.put("feedback", feedback);

        return response;
    }

    /**
     * Get quiz history.
     */
    @Transactional(readOnly = true)
    public List<QuizAttempt> getHistory(
            Long projectId,
            String email
    ) {

        Project project = getOwnedProject(projectId, email);
        User user = getUser(email);

        return attemptRepository
                .findByUserIdAndProjectIdOrderByCompletedAtDesc(
                        user.getId(),
                        project.getId()
                );
    }

    private double adaptiveScore(
            QuizQuestion question,
            Set<Long> answeredQuestionIds,
            Map<Long, QuestionAttempt> latestAttemptByQuestion,
            Map<String, Double> masteryByConcept,
            LocalDateTime now
    ) {

        String concept = normalizeConcept(question.getConcept());
        double mastery = masteryByConcept.getOrDefault(concept, 50.0);
        double score = 0.0;

        // Stronger weight for concepts that need attention.
        score += Math.max(0.0, 100.0 - mastery) * 0.80;

        String difficulty =
                question.getDifficulty() == null
                        ? "MEDIUM"
                        : question.getDifficulty().toUpperCase();

        // Difficulty is selected relative to current mastery.
        if (mastery < 40.0) {
            if ("EASY".equals(difficulty)) {
                score += 35.0;
            } else if ("MEDIUM".equals(difficulty)) {
                score += 20.0;
            }
        } else if (mastery < 70.0) {
            if ("MEDIUM".equals(difficulty)) {
                score += 35.0;
            } else if ("EASY".equals(difficulty)) {
                score += 15.0;
            }
        } else {
            if ("HARD".equals(difficulty)) {
                score += 35.0;
            } else if ("MEDIUM".equals(difficulty)) {
                score += 15.0;
            }
        }

        QuestionAttempt latest = latestAttemptByQuestion.get(question.getId());

        if (latest == null) {
            // Fresh question: strongly preferred before repetition.
            score += 90.0;
        } else {
            long daysAgo = Math.max(
                    0,
                    Duration.between(latest.getAnsweredAt(), now).toDays()
            );

            // Recent mistakes deserve deliberate re-practice.
            if (!latest.isCorrect()) {
                if (daysAgo <= 7) {
                    score += 70.0;
                } else if (daysAgo <= 30) {
                    score += 45.0;
                } else {
                    score += 25.0;
                }
            } else {
                // Correct questions are still revisited, but less aggressively.
                if (daysAgo >= 14) {
                    score += 20.0;
                }
            }

            // Small penalty for a very recent repetition.
            if (daysAgo <= 2) {
                score -= 80.0;
            }
        }

        if (!answeredQuestionIds.contains(question.getId())) {
            score += 40.0;
        }

        return score;
    }

    private String normalizeConcept(String concept) {
        if (concept == null || concept.isBlank()) {
            return "General";
        }
        return concept.trim();
    }

    private User getUser(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException("User not found")
                );
    }

    private Project getOwnedProject(
            Long projectId,
            String email
    ) {

        User user = getUser(email);

        List<Space> spaces =
                spaceRepository.findByUserId(user.getId());

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
