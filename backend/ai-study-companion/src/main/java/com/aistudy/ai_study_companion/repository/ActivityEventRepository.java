package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.ActivityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityEventRepository
        extends JpaRepository<ActivityEvent, Long> {

    List<ActivityEvent> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndEventType(
            Long userId,
            String eventType
    );
}