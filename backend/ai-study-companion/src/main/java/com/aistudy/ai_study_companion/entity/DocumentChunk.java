package com.aistudy.ai_study_companion.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "document_chunks")
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    private Integer pageNumber;

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    public DocumentChunk() {
    }

    public DocumentChunk(String content, Integer pageNumber, Material material) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.material = material;
    }

    public Long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
    }

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }
}