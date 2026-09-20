package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.ActivityEvent;
import com.aistudy.ai_study_companion.entity.Project;
import com.aistudy.ai_study_companion.entity.Space;
import com.aistudy.ai_study_companion.entity.User;
import com.aistudy.ai_study_companion.repository.ActivityEventRepository;
import com.aistudy.ai_study_companion.repository.ProjectRepository;
import com.aistudy.ai_study_companion.repository.SpaceRepository;
import com.aistudy.ai_study_companion.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ActivityService {

    private final ActivityEventRepository activityEventRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SpaceRepository spaceRepository;

    public ActivityService(
            ActivityEventRepository activityEventRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            SpaceRepository spaceRepository
    ) {
        this.activityEventRepository = activityEventRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.spaceRepository = spaceRepository;
    }

    @Transactional
    public void log(
            String email,
            Long projectId,
            String eventType,
            String description
    ) {
        User user = getUser(email);

        Project project =
                projectId == null
                        ? null
                        : getOwnedProject(projectId, user);

        String safeType =
                eventType == null || eventType.isBlank()
                        ? "ACTIVITY"
                        : eventType.trim().toUpperCase();

        String safeDescription =
                description == null || description.isBlank()
                        ? "Learning activity recorded."
                        : description.trim();

        if (safeDescription.length() > 500) {
            safeDescription =
                    safeDescription.substring(0, 500);
        }

        activityEventRepository.save(
                new ActivityEvent(
                        user,
                        project,
                        safeType,
                        safeDescription
                )
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(
            String email
    ) {
        User user = getUser(email);

        List<ActivityEvent> events =
                activityEventRepository
                        .findTop50ByUserIdOrderByCreatedAtDesc(
                                user.getId()
                        );

        long totalEvents =
                activityEventRepository.countByUserId(
                        user.getId()
                );

        long quizCompletions =
                activityEventRepository
                        .countByUserIdAndEventType(
                                user.getId(),
                                "QUIZ_COMPLETED"
                        );

        long tutorInteractions =
                activityEventRepository
                        .countByUserIdAndEventType(
                                user.getId(),
                                "TUTOR_QUESTION"
                        );

        long materialUploads =
                activityEventRepository
                        .countByUserIdAndEventType(
                                user.getId(),
                                "MATERIAL_UPLOADED"
                        );

        long projectCreations =
                activityEventRepository
                        .countByUserIdAndEventType(
                                user.getId(),
                                "PROJECT_CREATED"
                        );

        long assessments =
                activityEventRepository
                        .countByUserIdAndEventType(
                                user.getId(),
                                "OPEN_ENDED_ASSESSMENT"
                        );

        List<Map<String, Object>> recent =
                new ArrayList<>();

        for (ActivityEvent event : events) {

            Map<String, Object> item =
                    new LinkedHashMap<>();

            item.put(
                    "id",
                    event.getId()
            );

            item.put(
                    "eventType",
                    event.getEventType()
            );

            item.put(
                    "description",
                    event.getDescription()
            );

            item.put(
                    "projectId",
                    event.getProject() == null
                            ? null
                            : event.getProject().getId()
            );

            item.put(
                    "createdAt",
                    event.getCreatedAt()
            );

            recent.add(item);
        }

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "totalEvents",
                totalEvents
        );

        response.put(
                "quizCompletions",
                quizCompletions
        );

        response.put(
                "tutorInteractions",
                tutorInteractions
        );

        response.put(
                "materialUploads",
                materialUploads
        );

        response.put(
                "projectCreations",
                projectCreations
        );

        response.put(
                "openEndedAssessments",
                assessments
        );

        response.put(
                "recentActivity",
                recent
        );

        return response;
    }

    private User getUser(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException(
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
}