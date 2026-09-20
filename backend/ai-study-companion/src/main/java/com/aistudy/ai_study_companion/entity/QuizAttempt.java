package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

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
    private int totalQuestions;

    @Column(nullable = false)
    private int correctAnswers;

    @Column(nullable = false)
    private double score;

    @Column(nullable = false)
    private LocalDateTime completedAt;

    public QuizAttempt() {
    }

    public QuizAttempt(
            User user,
            Project project,
            int totalQuestions,
            int correctAnswers
    ) {
        this.user = user;
        this.project = project;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.score = totalQuestions == 0
                ? 0
                : ((double) correctAnswers / totalQuestions) * 100;
        this.completedAt = LocalDateTime.now();
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

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public double getScore() {
        return score;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}