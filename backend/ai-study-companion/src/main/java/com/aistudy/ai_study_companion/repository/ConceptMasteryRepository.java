package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.ConceptMastery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConceptMasteryRepository
        extends JpaRepository<ConceptMastery, Long> {

    List<ConceptMastery> findByUserIdAndProjectIdOrderByMasteryLevelAsc(
            Long userId,
            Long projectId
    );

    Optional<ConceptMastery> findByUserIdAndProjectIdAndConcept(
            Long userId,
            Long projectId,
            String concept
    );
}