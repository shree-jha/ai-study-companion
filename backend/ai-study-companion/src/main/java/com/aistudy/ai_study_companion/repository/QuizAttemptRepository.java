package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository
        extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdAndProjectIdOrderByCompletedAtDesc(
            Long userId,
            Long projectId
    );
}