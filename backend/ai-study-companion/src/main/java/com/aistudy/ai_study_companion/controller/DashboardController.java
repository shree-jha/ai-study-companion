package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(
            DashboardService dashboardService
    ) {
        this.dashboardService =
                dashboardService;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectDashboard(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            DashboardService.DashboardResponse response =
                    dashboardService
                            .getProjectDashboard(
                                    projectId,
                                    authentication.getName()
                            );

            return ResponseEntity.ok(
                    response
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    e.getMessage()
                            )
                    );
        }
    }
}
