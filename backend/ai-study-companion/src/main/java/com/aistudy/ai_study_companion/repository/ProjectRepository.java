package com.aistudy.ai_study_companion.repository;

import com.aistudy.ai_study_companion.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findBySpaceId(Long spaceId);

    Optional<Project> findByIdAndSpaceId(Long projectId, Long spaceId);
}