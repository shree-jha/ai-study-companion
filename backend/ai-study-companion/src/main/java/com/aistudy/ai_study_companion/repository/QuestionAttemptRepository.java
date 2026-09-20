package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionAttemptRepository extends JpaRepository<QuestionAttempt, Long> {

    List<QuestionAttempt> findByUserIdAndProjectIdOrderByAnsweredAtDesc(
            Long userId,
            Long projectId
    );

    List<QuestionAttempt> findByUserIdAndProjectIdAndCorrectFalseOrderByAnsweredAtDesc(
            Long userId,
            Long projectId
    );
}
