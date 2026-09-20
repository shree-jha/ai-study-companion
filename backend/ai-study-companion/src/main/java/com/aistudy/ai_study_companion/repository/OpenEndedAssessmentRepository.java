package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.OpenEndedAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpenEndedAssessmentRepository
        extends JpaRepository<OpenEndedAssessment, Long> {

    List<OpenEndedAssessment>
    findByUserIdAndProjectIdOrderByCompletedAtDesc(
            Long userId,
            Long projectId
    );
}