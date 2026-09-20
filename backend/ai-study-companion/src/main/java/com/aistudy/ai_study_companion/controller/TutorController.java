package com.aistudy.ai_study_companion.controller;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import com.aistudy.ai_study_companion.service.OpenAIService;
import com.aistudy.ai_study_companion.service.RetrievalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    private final RetrievalService retrievalService;
    private final OpenAIService openAIService;

    public TutorController(
            RetrievalService retrievalService,
            OpenAIService openAIService) {

        this.retrievalService = retrievalService;
        this.openAIService = openAIService;
    }

    @PostMapping("/ask")
    public ResponseEntity<?> askTutor(
            @RequestBody TutorRequest request,
            Authentication authentication) {

        List<DocumentChunk> chunks =
                retrievalService.search(
                        request.materialId(),
                        request.question(),
                        5
                );

        if (chunks.isEmpty()) {
            return ResponseEntity.ok(
                    new TutorResponse(
                            "I couldn't find enough relevant information in the uploaded material to answer that question.",
                            List.of()
                    )
            );
        }

        StringBuilder context = new StringBuilder();

        for (DocumentChunk chunk : chunks) {

            context.append(
                    "\n--- Source: Page "
                            + chunk.getPageNumber()
                            + " ---\n"
            );

            context.append(chunk.getContent());
            context.append("\n");
        }

        String answer = openAIService.askTutor(
                request.question(),
                context.toString()
        );

        List<SourceResponse> sources = chunks.stream()
                .map(chunk -> new SourceResponse(
                        chunk.getId(),
                        chunk.getPageNumber()
                ))
                .toList();

        return ResponseEntity.ok(
                new TutorResponse(
                        answer,
                        sources
                )
        );
    }

    public record TutorRequest(
            Long materialId,
            String question
    ) {
    }

    public record TutorResponse(
            String answer,
            List<SourceResponse> sources
    ) {
    }

    public record SourceResponse(
            Long chunkId,
            Integer pageNumber
    ) {
    }
}