package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_question_attempts")
public class QuizQuestionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    private QuizQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_attempt_id")
    private QuizAttempt quizAttempt;

    @Column(length = 1)
    private String selectedAnswer;

    private boolean correct;

    private LocalDateTime answeredAt;

    public QuizQuestionAttempt() {
    }

    public QuizQuestionAttempt(
            User user,
            Project project,
            QuizQuestion question,
            QuizAttempt quizAttempt,
            String selectedAnswer,
            boolean correct
    ) {
        this.user = user;
        this.project = project;
        this.question = question;
        this.quizAttempt = quizAttempt;
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

    public QuizAttempt getQuizAttempt() {
        return quizAttempt;
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