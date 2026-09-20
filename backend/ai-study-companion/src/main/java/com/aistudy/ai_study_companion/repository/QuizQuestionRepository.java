package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository
        extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByProjectId(Long projectId);
}