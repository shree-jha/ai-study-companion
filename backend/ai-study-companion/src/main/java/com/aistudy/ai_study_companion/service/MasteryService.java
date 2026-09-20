package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.ConceptMastery;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.QuizQuestion;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.ConceptMasteryRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class MasteryService {

    private final ConceptMasteryRepository masteryRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;

    public MasteryService(
            ConceptMasteryRepository masteryRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository
    ) {
        this.masteryRepository = masteryRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
    }

    /**
     * Updates concept mastery using the answers from a completed quiz.
     */
    @Transactional
    public void updateFromQuiz(
            Long projectId,
            String email,
            List<QuizQuestion> questions,
            Map<Long, String> answers
    ) {

        User user = getUser(email);

        Project project = getOwnedProject(
                projectId,
                user
        );

        if (questions == null || questions.isEmpty()) {
            return;
        }

        if (answers == null) {
            answers = new HashMap<>();
        }

        Map<String, ConceptResult> conceptResults =
                new HashMap<>();

        for (QuizQuestion question : questions) {

            String concept = question.getConcept();

            if (concept == null || concept.isBlank()) {
                concept = "General";
            }

            ConceptResult result =
                    conceptResults.computeIfAbsent(
                            concept,
                            key -> new ConceptResult()
                    );

            result.total++;

            String submittedAnswer =
                    answers.get(question.getId());

            if (
                    submittedAnswer != null
                            &&
                    submittedAnswer.equalsIgnoreCase(
                            question.getCorrectAnswer()
                    )
            ) {
                result.correct++;
            }
        }

        for (
                Map.Entry<String, ConceptResult> entry
                : conceptResults.entrySet()
        ) {

            String concept = entry.getKey();

            ConceptResult result =
                    entry.getValue();

            ConceptMastery mastery =
                    masteryRepository
                            .findByUserIdAndProjectIdAndConcept(
                                    user.getId(),
                                    project.getId(),
                                    concept
                            )
                            .orElseGet(
                                    () ->
                                            new ConceptMastery(
                                                    user,
                                                    project,
                                                    concept
                                            )
                            );

            mastery.addEvidence(
                    result.correct,
                    result.total
            );

            masteryRepository.save(mastery);
        }
    }

    /**
     * Updates concept mastery using an open-ended assessment.
     *
     * Score >= 70 -> treated as correct evidence.
     * Score < 70  -> treated as incorrect evidence.
     */
    @Transactional
    public void updateFromOpenEnded(
            Long projectId,
            String email,
            String concept,
            double score
    ) {

        User user = getUser(email);

        Project project = getOwnedProject(
                projectId,
                user
        );

        // Normalize concept first.
        String normalizedConcept =
                (concept == null || concept.isBlank())
                        ? "General"
                        : concept.trim();

        score = Math.max(
                0.0,
                Math.min(
                        100.0,
                        score
                )
        );

        /*
         * normalizedConcept is never reassigned,
         * so it is effectively final and can safely
         * be used inside orElseGet().
         */
        ConceptMastery mastery =
                masteryRepository
                        .findByUserIdAndProjectIdAndConcept(
                                user.getId(),
                                project.getId(),
                                normalizedConcept
                        )
                        .orElseGet(
                                () ->
                                        new ConceptMastery(
                                                user,
                                                project,
                                                normalizedConcept
                                        )
                        );

        int correct =
                score >= 70.0
                        ? 1
                        : 0;

        mastery.addEvidence(
                correct,
                1
        );

        masteryRepository.save(mastery);
    }

    /**
     * Returns all concept mastery records for a project.
     */
    @Transactional(readOnly = true)
    public List<ConceptMasteryResponse> getMastery(
            Long projectId,
            String email
    ) {

        User user = getUser(email);

        Project project = getOwnedProject(
                projectId,
                user
        );

        return masteryRepository
                .findByUserIdAndProjectIdOrderByMasteryLevelAsc(
                        user.getId(),
                        project.getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns the overall mastery across all concepts.
     */
    @Transactional(readOnly = true)
    public OverallMasteryResponse getOverallMastery(
            Long projectId,
            String email
    ) {

        User user = getUser(email);

        Project project = getOwnedProject(
                projectId,
                user
        );

        List<ConceptMastery> records =
                masteryRepository
                        .findByUserIdAndProjectIdOrderByMasteryLevelAsc(
                                user.getId(),
                                project.getId()
                        );

        if (records.isEmpty()) {

            return new OverallMasteryResponse(
                    0.0,
                    0,
                    0,
                    0
            );
        }

        double totalMastery = 0.0;

        int totalCorrect = 0;

        int totalQuestions = 0;

        for (ConceptMastery mastery : records) {

            totalMastery += mastery.getMasteryLevel();

            totalCorrect += mastery.getCorrectAnswers();

            totalQuestions += mastery.getTotalAnswers();
        }

        double overallMastery =
                totalMastery / records.size();

        return new OverallMasteryResponse(
                Math.round(overallMastery * 100.0) / 100.0,
                records.size(),
                totalCorrect,
                totalQuestions
        );
    }

    private ConceptMasteryResponse toResponse(
            ConceptMastery mastery
    ) {

        String status;

        double level =
                mastery.getMasteryLevel();

        if (level >= 80) {
            status = "STRONG";
        } else if (level >= 60) {
            status = "DEVELOPING";
        } else {
            status = "NEEDS_PRACTICE";
        }

        return new ConceptMasteryResponse(
                mastery.getId(),
                mastery.getConcept(),
                Math.round(level * 100.0) / 100.0,
                mastery.getCorrectAnswers(),
                mastery.getTotalAnswers(),
                status,
                mastery.getUpdatedAt()
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

    /**
     * Makes sure the project belongs to the logged-in user.
     */
    private Project getOwnedProject(
            Long projectId,
            User user
    ) {

        List<com.aistudy.ai_study_companion.entity.Space> spaces =
                spaceRepository.findByUserId(
                        user.getId()
                );

        for (
                com.aistudy.ai_study_companion.entity.Space space
                : spaces
        ) {

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

    private static class ConceptResult {

        int correct = 0;

        int total = 0;
    }

    public record ConceptMasteryResponse(
            Long id,
            String concept,
            double masteryLevel,
            int correctAnswers,
            int totalAnswers,
            String status,
            java.time.LocalDateTime updatedAt
    ) {
    }

    public record OverallMasteryResponse(
            double overallMastery,
            int conceptsTracked,
            int totalCorrectAnswers,
            int totalAnswers
    ) {
    }
}