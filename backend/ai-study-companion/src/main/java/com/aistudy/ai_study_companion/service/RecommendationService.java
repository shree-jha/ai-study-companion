package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.ConceptMastery;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.Recommendation;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.ConceptMasteryRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.RecommendationRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final ConceptMasteryRepository masteryRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;

    public RecommendationService(
            RecommendationRepository recommendationRepository,
            ConceptMasteryRepository masteryRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository
    ) {
        this.recommendationRepository = recommendationRepository;
        this.masteryRepository = masteryRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
    }

    /**
     * Generate a recommendation from the learner's
     * current concept mastery.
     */
    @Transactional
    public RecommendationResponse generateRecommendation(
            Long projectId,
            String email
    ) {

        User user = getUser(email);

        Project project =
                getOwnedProject(projectId, user);

        List<ConceptMastery> masteryRecords =
                masteryRepository
                        .findByUserIdAndProjectIdOrderByMasteryLevelAsc(
                                user.getId(),
                                project.getId()
                        );

        /*
         * No assessment data yet.
         */
        if (masteryRecords.isEmpty()) {

            return new RecommendationResponse(
                    null,
                    "Start Learning",
                    "Complete your first quiz so we can understand your strengths and areas that need practice.",
                    "TAKE_QUIZ",
                    null,
                    0.0
            );
        }

        /*
         * The repository already sorts mastery
         * from lowest to highest.
         *
         * Therefore the first record is the
         * concept currently requiring the most attention.
         */
        ConceptMastery weakest =
                masteryRecords.get(0);

        double mastery =
                weakest.getMasteryLevel();

        String concept =
                weakest.getConcept();

        String title;

        String message;

        String actionType;

        if (mastery < 40) {

            title =
                    "Practice " + concept;

            message =
                    "Your current mastery of "
                            + concept
                            + " is "
                            + formatPercentage(mastery)
                            + "%. Focus on this concept with a short practice quiz.";

            actionType =
                    "PRACTICE_CONCEPT";

        } else if (mastery < 60) {

            title =
                    "Strengthen " + concept;

            message =
                    "Your mastery of "
                            + concept
                            + " is "
                            + formatPercentage(mastery)
                            + "%. Review the concept and complete another assessment.";

            actionType =
                    "REVIEW_CONCEPT";

        } else if (mastery < 80) {

            title =
                    "Improve " + concept;

            message =
                    "Your mastery of "
                            + concept
                            + " is "
                            + formatPercentage(mastery)
                            + "%. Try a few more questions to strengthen your understanding.";

            actionType =
                    "PRACTICE_CONCEPT";

        } else {

            /*
             * If the weakest concept is already strong,
             * recommend a mixed challenge instead.
             */
            title =
                    "Try a Mixed Challenge";

            message =
                    "Your tracked concepts are currently strong. Try a mixed quiz to maintain your understanding and challenge yourself.";

            actionType =
                    "MIXED_QUIZ";

            concept = "Mixed Concepts";
            mastery = 100.0;
        }

        Recommendation recommendation =
                new Recommendation(
                        user,
                        project,
                        concept,
                        title,
                        message,
                        actionType
                );

        Recommendation saved =
                recommendationRepository.save(
                        recommendation
                );

        return toResponse(
                saved,
                mastery
        );
    }

    /**
     * Get currently active recommendations.
     */
    @Transactional(readOnly = true)
    public List<RecommendationResponse> getRecommendations(
            Long projectId,
            String email
    ) {

        User user = getUser(email);

        Project project =
                getOwnedProject(projectId, user);

        return recommendationRepository
                .findByUserIdAndProjectIdAndCompletedFalseOrderByCreatedAtDesc(
                        user.getId(),
                        project.getId()
                )
                .stream()
                .map(recommendation ->
                        toResponse(
                                recommendation,
                                findMastery(
                                        user.getId(),
                                        project.getId(),
                                        recommendation.getConcept()
                                )
                        )
                )
                .toList();
    }

    /**
     * Mark a recommendation as completed.
     */
    @Transactional
    public void completeRecommendation(
            Long recommendationId,
            String email
    ) {

        User user = getUser(email);

        Recommendation recommendation =
                recommendationRepository
                        .findById(recommendationId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Recommendation not found"
                                        )
                        );

        /*
         * Ownership check.
         */
        if (
                !recommendation
                        .getUser()
                        .getId()
                        .equals(user.getId())
        ) {

            throw new RuntimeException(
                    "Access denied"
            );
        }

        recommendation.setCompleted(true);

        recommendationRepository.save(
                recommendation
        );
    }

    private double findMastery(
            Long userId,
            Long projectId,
            String concept
    ) {

        if ("Mixed Concepts".equals(concept)) {
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

    private RecommendationResponse toResponse(
            Recommendation recommendation,
            double mastery
    ) {

        return new RecommendationResponse(
                recommendation.getId(),
                recommendation.getTitle(),
                recommendation.getMessage(),
                recommendation.getActionType(),
                recommendation.getConcept(),
                Math.round(mastery * 100.0) / 100.0
        );
    }

    private String formatPercentage(
            double value
    ) {

        return Math.round(value * 100.0) / 100.0 + "%";
    }

    private User getUser(String email) {

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

    public record RecommendationResponse(
            Long id,
            String title,
            String message,
            String actionType,
            String concept,
            double masteryLevel
    ) {
    }
}