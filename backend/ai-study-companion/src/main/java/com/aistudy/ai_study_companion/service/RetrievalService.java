package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import com.aistudy.ai_study_companion.repository.DocumentChunkRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RetrievalService {

    private final DocumentChunkRepository documentChunkRepository;

    public RetrievalService(DocumentChunkRepository documentChunkRepository) {
        this.documentChunkRepository = documentChunkRepository;
    }

    public List<DocumentChunk> search(
            Long materialId,
            String question,
            int limit
    ) {

        // ---------------------------------------------------------
        // 1. Get all chunks belonging to this material
        // ---------------------------------------------------------

        List<DocumentChunk> chunks =
                documentChunkRepository.findByMaterialId(materialId);

        // ---------------------------------------------------------
        // DEBUG INFORMATION
        // ---------------------------------------------------------

        System.out.println();
        System.out.println("========================================");
        System.out.println("        RETRIEVAL DEBUG");
        System.out.println("========================================");
        System.out.println("Material ID : " + materialId);
        System.out.println("Question    : " + question);
        System.out.println("Chunks found: " + chunks.size());

        if (!chunks.isEmpty()) {

            DocumentChunk firstChunk = chunks.get(0);

            String content = firstChunk.getContent();

            System.out.println("First chunk ID   : " + firstChunk.getId());
            System.out.println("First chunk page : " + firstChunk.getPageNumber());
            System.out.println(
                    "First chunk size : " +
                    (content == null ? 0 : content.length())
            );

            if (content != null && !content.isBlank()) {

                String preview =
                        content.substring(
                                0,
                                Math.min(500, content.length())
                        );

                System.out.println("First chunk text:");
                System.out.println(preview);

            } else {

                System.out.println("WARNING: First chunk has EMPTY content.");

            }
        }

        System.out.println("========================================");
        System.out.println();

        // ---------------------------------------------------------
        // 2. If there are no chunks, retrieval cannot continue
        // ---------------------------------------------------------

        if (chunks.isEmpty()) {
            return Collections.emptyList();
        }

        // ---------------------------------------------------------
        // 3. Convert question into keywords
        // ---------------------------------------------------------

        Set<String> stopWords = Set.of(
                "what",
                "is",
                "are",
                "the",
                "a",
                "an",
                "of",
                "to",
                "in",
                "on",
                "for",
                "and",
                "or",
                "how",
                "why",
                "when",
                "where",
                "which",
                "can",
                "could",
                "would",
                "should",
                "explain",
                "tell",
                "me",
                "about",
                "does",
                "do",
                "define",
                "give",
                "with"
        );

        Set<String> keywords = Arrays.stream(
                        question
                                .toLowerCase()
                                .replaceAll("[^a-zA-Z0-9 ]", " ")
                                .split("\\s+")
                )
                .map(String::trim)
                .filter(word -> !word.isBlank())
                .filter(word -> word.length() > 2)
                .filter(word -> !stopWords.contains(word))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        System.out.println("Keywords: " + keywords);

        // ---------------------------------------------------------
        // 4. Score every chunk
        // ---------------------------------------------------------

        List<ScoredChunk> scoredChunks = new ArrayList<>();

        for (DocumentChunk chunk : chunks) {

            String content = chunk.getContent();

            if (content == null || content.isBlank()) {
                continue;
            }

            content = content.toLowerCase();

            int score = 0;

            for (String keyword : keywords) {

                if (content.contains(keyword)) {
                    score++;
                }
            }

            if (score > 0) {

                scoredChunks.add(
                        new ScoredChunk(chunk, score)
                );

                System.out.println(
                        "MATCH -> chunkId=" +
                        chunk.getId() +
                        ", page=" +
                        chunk.getPageNumber() +
                        ", score=" +
                        score
                );
            }
        }

        // ---------------------------------------------------------
        // 5. Sort highest score first
        // ---------------------------------------------------------

        scoredChunks.sort(
                Comparator
                        .comparingInt(ScoredChunk::score)
                        .reversed()
        );

        System.out.println(
                "Matching chunks: " +
                scoredChunks.size()
        );

        // ---------------------------------------------------------
        // 6. Return top matching chunks
        // ---------------------------------------------------------

        List<DocumentChunk> results =
                scoredChunks.stream()
                        .limit(limit)
                        .map(ScoredChunk::chunk)
                        .toList();

        System.out.println(
                "Chunks returned: " +
                results.size()
        );

        System.out.println("========================================");
        System.out.println();

        return results;
    }

    // -------------------------------------------------------------
    // Helper record
    // -------------------------------------------------------------

    private record ScoredChunk(
            DocumentChunk chunk,
            int score
    ) {
    }
}