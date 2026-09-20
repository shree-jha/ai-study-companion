package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByProjectId(Long projectId);
  

    Optional<Material> findByIdAndProjectId(Long materialId, Long projectId);
}