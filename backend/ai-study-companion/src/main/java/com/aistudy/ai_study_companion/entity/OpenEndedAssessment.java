package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "open_ended_assessments")
public class OpenEndedAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String studentAnswer;

    @Column(nullable = false)
    private String concept;

    private double score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String understanding;

    @Column(columnDefinition = "TEXT")
    private String missingConcepts;

    @Column(columnDefinition = "TEXT")
    private String reasoningFeedback;

    @Column(nullable = false)
    private LocalDateTime completedAt;

    public OpenEndedAssessment() {
    }

    public OpenEndedAssessment(
            User user,
            Project project,
            String question,
            String studentAnswer,
            String concept,
            double score,
            String feedback,
            String understanding,
            String missingConcepts,
            String reasoningFeedback
    ) {
        this.user = user;
        this.project = project;
        this.question = question;
        this.studentAnswer = studentAnswer;
        this.concept = concept;
        this.score = score;
        this.feedback = feedback;
        this.understanding = understanding;
        this.missingConcepts = missingConcepts;
        this.reasoningFeedback = reasoningFeedback;
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

    public String getQuestion() {
        return question;
    }

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public String getConcept() {
        return concept;
    }

    public double getScore() {
        return score;
    }

    public String getFeedback() {
        return feedback;
    }

    public String getUnderstanding() {
        return understanding;
    }

    public String getMissingConcepts() {
        return missingConcepts;
    }

    public String getReasoningFeedback() {
        return reasoningFeedback;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}