package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.QuizQuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionAttemptRepository
        extends JpaRepository<QuizQuestionAttempt, Long> {

    List<QuizQuestionAttempt>
    findByUserIdAndProjectIdOrderByAnsweredAtDesc(
            Long userId,
            Long projectId
    );

    List<QuizQuestionAttempt>
    findByUserIdAndProjectIdAndQuestionIdOrderByAnsweredAtDesc(
            Long userId,
            Long projectId,
            Long questionId
    );
}