package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByMaterialId(Long materialId);
    
}