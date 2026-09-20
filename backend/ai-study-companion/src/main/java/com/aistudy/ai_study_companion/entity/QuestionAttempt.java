package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "question_attempts")
public class QuestionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @Column(length = 1)
    private String selectedAnswer;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private LocalDateTime answeredAt;

    public QuestionAttempt() {
    }

    public QuestionAttempt(
            User user,
            Project project,
            QuizQuestion question,
            String selectedAnswer,
            boolean correct
    ) {
        this.user = user;
        this.project = project;
        this.question = question;
        this.selectedAnswer = selectedAnswer;
        this.correct = correct;
        this.answeredAt = LocalDateTime.now();
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

    public QuizQuestion getQuestion() {
        return question;
    }

    public String getSelectedAnswer() {
        return selectedAnswer;
    }

    public boolean isCorrect() {
        return correct;
    }

    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }
}
