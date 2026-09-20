
package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import com.aistudy.ai_study_companion.service.RetrievalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retrieval")
public class RetrievalController {

    private final RetrievalService retrievalService;

    public RetrievalController(RetrievalService retrievalService) {
        this.retrievalService = retrievalService;
    }

    @GetMapping("/material/{materialId}")
    public ResponseEntity<?> search(
            @PathVariable Long materialId,
            @RequestParam String question,
            @RequestParam(defaultValue = "5") int limit,
            Authentication authentication) {

        List<DocumentChunk> results =
                retrievalService.search(materialId, question, limit);

        return ResponseEntity.ok(
                results.stream()
                        .map(chunk -> new RetrievalResponse(
                                chunk.getId(),
                                chunk.getPageNumber(),
                                chunk.getContent()
                        ))
                        .toList()
        );
    }

    public record RetrievalResponse(
            Long chunkId,
            Integer pageNumber,
            String content
    ) {
    }
}