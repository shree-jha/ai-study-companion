package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.ConceptMastery;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.QuizAttempt;
import com.aistudy.ai_study_companion.entity.Recommendation;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.ConceptMasteryRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.QuizAttemptRepository;
import com.aistudy.ai_study_companion.repository.RecommendationRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ConceptMasteryRepository masteryRepository;
    private final RecommendationRepository recommendationRepository;

    public DashboardService(
            UserRepository userRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository,
            QuizAttemptRepository quizAttemptRepository,
            ConceptMasteryRepository masteryRepository,
            RecommendationRepository recommendationRepository
    ) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.masteryRepository = masteryRepository;
        this.recommendationRepository = recommendationRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getProjectDashboard(
            Long projectId,
            String email
    ) {

        User user = getUser(email);

        Project project =
                getOwnedProject(
                        projectId,
                        user
                );

        List<QuizAttempt> attempts =
                quizAttemptRepository
                        .findByUserIdAndProjectIdOrderByCompletedAtDesc(
                                user.getId(),
                                project.getId()
                        );

        List<ConceptMastery> masteryRecords =
                masteryRepository
                        .findByUserIdAndProjectIdOrderByMasteryLevelAsc(
                                user.getId(),
                                project.getId()
                        );

        List<Recommendation> recommendations =
                recommendationRepository
                        .findByUserIdAndProjectIdAndCompletedFalseOrderByCreatedAtDesc(
                                user.getId(),
                                project.getId()
                        );

        /*
         * -----------------------------
         * QUIZ ANALYTICS
         * -----------------------------
         */

        int quizAttempts =
                attempts.size();

        int totalQuestions =
                0;

        int totalCorrect =
                0;

        double totalScore =
                0.0;

        for (QuizAttempt attempt : attempts) {

            totalQuestions +=
                    attempt.getTotalQuestions();

            totalCorrect +=
                    attempt.getCorrectAnswers();

            totalScore +=
                    attempt.getScore();
        }

        double averageScore =
                quizAttempts == 0
                        ? 0.0
                        : totalScore / quizAttempts;

        averageScore =
                round(averageScore);

        /*
         * -----------------------------
         * MASTERY ANALYTICS
         * -----------------------------
         */

        double overallMastery =
                0.0;

        int strongConcepts =
                0;

        int needsAttention =
                0;

        for (ConceptMastery mastery : masteryRecords) {

            overallMastery +=
                    mastery.getMasteryLevel();

            if (
                    mastery.getMasteryLevel()
                            >= 80
            ) {
                strongConcepts++;
            }

            if (
                    mastery.getMasteryLevel()
                            < 60
            ) {
                needsAttention++;
            }
        }

        if (!masteryRecords.isEmpty()) {

            overallMastery =
                    overallMastery
                            / masteryRecords.size();
        }

        overallMastery =
                round(overallMastery);

        /*
         * -----------------------------
         * WEAKEST CONCEPT
         * -----------------------------
         */

        ConceptSummary weakestConcept =
                null;

        if (!masteryRecords.isEmpty()) {

            ConceptMastery weakest =
                    masteryRecords.get(0);

            weakestConcept =
                    new ConceptSummary(
                            weakest.getConcept(),
                            round(
                                    weakest.getMasteryLevel()
                            ),
                            weakest.getCorrectAnswers(),
                            weakest.getTotalAnswers()
                    );
        }

        /*
         * -----------------------------
         * LATEST QUIZ
         * -----------------------------
         */

        QuizSummary latestQuiz =
                null;

        if (!attempts.isEmpty()) {

            QuizAttempt latest =
                    attempts.get(0);

            latestQuiz =
                    new QuizSummary(
                            latest.getId(),
                            latest.getScore(),
                            latest.getCorrectAnswers(),
                            latest.getTotalQuestions(),
                            latest.getCompletedAt()
                    );
        }

        /*
         * -----------------------------
         * LATEST RECOMMENDATION
         * -----------------------------
         */

        RecommendationSummary latestRecommendation =
                null;

        if (!recommendations.isEmpty()) {

            Recommendation recommendation =
                    recommendations.get(0);

            double mastery =
                    findConceptMastery(
                            user.getId(),
                            project.getId(),
                            recommendation.getConcept()
                    );

            latestRecommendation =
                    new RecommendationSummary(
                            recommendation.getId(),
                            recommendation.getTitle(),
                            recommendation.getMessage(),
                            recommendation.getActionType(),
                            recommendation.getConcept(),
                            round(mastery)
                    );
        }

        /*
         * -----------------------------
         * RESPONSE
         * -----------------------------
         */

        return new DashboardResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),

                overallMastery,

                masteryRecords.size(),

                strongConcepts,

                needsAttention,

                quizAttempts,

                totalQuestions,

                totalCorrect,

                averageScore,

                latestQuiz,

                weakestConcept,

                latestRecommendation
        );
    }

    private double findConceptMastery(
            Long userId,
            Long projectId,
            String concept
    ) {

        if (
                concept == null
                        ||
                "Mixed Concepts".equals(
                        concept
                )
        ) {
            return 100.0;
        }

        return masteryRepository
                .findByUserIdAndProjectIdAndConcept(
                        userId,
                        projectId,
                        concept
                )
                .map(
                        ConceptMastery::getMasteryLevel
                )
                .orElse(0.0);
    }

    private double round(
            double value
    ) {

        return Math.round(
                value * 100.0
        ) / 100.0;
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
            User user
    ) {

        List<Space> spaces =
                spaceRepository.findByUserId(
                        user.getId()
                );

        for (Space space : spaces) {

            Optional<Project> project =
                    projectRepository
                            .findByIdAndSpaceId(
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

    public record DashboardResponse(

            Long projectId,

            String projectName,

            String projectDescription,

            double overallMastery,

            int conceptsTracked,

            int strongConcepts,

            int conceptsNeedingAttention,

            int quizAttempts,

            int totalQuestionsAnswered,

            int totalCorrectAnswers,

            double averageQuizScore,

            QuizSummary latestQuiz,

            ConceptSummary weakestConcept,

            RecommendationSummary latestRecommendation
    ) {
    }

    public record QuizSummary(

            Long attemptId,

            double score,

            int correctAnswers,

            int totalQuestions,

            java.time.LocalDateTime completedAt
    ) {
    }

    public record ConceptSummary(

            String concept,

            double masteryLevel,

            int correctAnswers,

            int totalAnswers
    ) {
    }

    public record RecommendationSummary(

            Long id,

            String title,

            String message,

            String actionType,

            String concept,

            double masteryLevel
    ) {
    }
}