package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.service.ActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(
            ActivityService activityService
    ) {
        this.activityService = activityService;
    }

    @PostMapping("/log")
    public ResponseEntity<Map<String, Object>> log(
            @RequestBody ActivityRequest request,
            Authentication authentication
    ) {

        activityService.log(
                authentication.getName(),
                request.projectId(),
                request.eventType(),
                request.description()
        );

        return ResponseEntity.ok(
                Map.of(
                        "success",
                        true,
                        "message",
                        "Activity recorded"
                )
        );
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                activityService.getDashboard(
                        authentication.getName()
                )
        );
    }

    public record ActivityRequest(
            Long projectId,
            String eventType,
            String description
    ) {
    }
}