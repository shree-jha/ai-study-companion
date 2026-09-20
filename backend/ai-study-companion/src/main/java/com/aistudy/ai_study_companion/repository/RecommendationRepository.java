package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository
        extends JpaRepository<Recommendation, Long> {

    List<Recommendation>
    findByUserIdAndProjectIdAndCompletedFalseOrderByCreatedAtDesc(
            Long userId,
            Long projectId
    );
}