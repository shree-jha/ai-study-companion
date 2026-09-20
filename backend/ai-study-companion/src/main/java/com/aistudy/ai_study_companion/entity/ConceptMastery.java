package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "concept_mastery",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"user_id", "project_id", "concept"}
                )
        }
)
public class ConceptMastery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String concept;

    @Column(nullable = false)
    private int correctAnswers;

    @Column(nullable = false)
    private int totalAnswers;

    @Column(nullable = false)
    private double masteryLevel;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public ConceptMastery() {
    }

    public ConceptMastery(
            User user,
            Project project,
            String concept
    ) {
        this.user = user;
        this.project = project;
        this.concept = concept;
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        this.masteryLevel = 0.0;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Project getProject() {
        return project;
    }

    public String getConcept() {
        return concept;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public int getTotalAnswers() {
        return totalAnswers;
    }

    public double getMasteryLevel() {
        return masteryLevel;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void addEvidence(
            int correct,
            int total
    ) {
        this.correctAnswers += correct;
        this.totalAnswers += total;

        if (this.totalAnswers > 0) {
            this.masteryLevel =
                    ((double) this.correctAnswers / this.totalAnswers) * 100.0;
        }

        this.updatedAt = LocalDateTime.now();
    }
}