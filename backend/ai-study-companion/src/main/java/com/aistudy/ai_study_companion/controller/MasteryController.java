package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.service.MasteryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mastery")
public class MasteryController {

    private final MasteryService masteryService;

    public MasteryController(
            MasteryService masteryService
    ) {
        this.masteryService = masteryService;
    }

    /**
     * Get mastery for every concept in a project.
     *
     * GET:
     * /api/mastery/project/1
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getMastery(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            List<MasteryService.ConceptMasteryResponse> mastery =
                    masteryService.getMastery(
                            projectId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(mastery);

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

    /**
     * Get overall project mastery.
     *
     * GET:
     * /api/mastery/project/1/overall
     */
    @GetMapping("/project/{projectId}/overall")
    public ResponseEntity<?> getOverallMastery(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        try {

            MasteryService.OverallMasteryResponse response =
                    masteryService.getOverallMastery(
                            projectId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(response);

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