package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
public class Recommendation {

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

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private String actionType;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Recommendation() {
    }

    public Recommendation(
            User user,
            Project project,
            String concept,
            String title,
            String message,
            String actionType
    ) {
        this.user = user;
        this.project = project;
        this.concept = concept;
        this.title = title;
        this.message = message;
        this.actionType = actionType;
        this.completed = false;
        this.createdAt = LocalDateTime.now();
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

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getActionType() {
        return actionType;
    }

    public boolean isCompleted() {
        return completed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}