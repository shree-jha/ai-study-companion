package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {

    List<Space> findByUserId(Long userId);
}