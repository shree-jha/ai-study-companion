package com.aistudy.ai_study_companion.service;

import com.aistudy.ai_study_companion.entity.DocumentChunk;
import com.aistudy.ai_study_companion.entity.Material;
import com.aistudy.ai_study_companion.repository.DocumentChunkRepository;
import com.aistudy.ai_study_companion.repository.MaterialRepository;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfProcessingService {

    private final MaterialRepository materialRepository;
    private final DocumentChunkRepository documentChunkRepository;

    private static final String TESSERACT_PATH =
            "C:\\Program Files\\Tesseract-OCR";

    public PdfProcessingService(
            MaterialRepository materialRepository,
            DocumentChunkRepository documentChunkRepository) {

        this.materialRepository = materialRepository;
        this.documentChunkRepository = documentChunkRepository;
    }

    @Async
    public void processPdf(Long materialId) {

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() ->
                        new RuntimeException("Material not found"));

        try {

            material.setStatus("PROCESSING");
            materialRepository.save(material);

            File pdfFile = new File(material.getFilePath());

            System.out.println("========================================");
            System.out.println("PDF PROCESSING");
            System.out.println("Material ID : " + materialId);
            System.out.println("File        : " + pdfFile.getAbsolutePath());
            System.out.println("File exists : " + pdfFile.exists());
            System.out.println("File size   : " + pdfFile.length());
            System.out.println("========================================");

            if (!pdfFile.exists()) {
                throw new RuntimeException(
                        "PDF file does not exist: "
                                + pdfFile.getAbsolutePath()
                );
            }

            List<DocumentChunk> chunks = new ArrayList<>();

            try (PDDocument document = Loader.loadPDF(pdfFile)) {

                PDFTextStripper stripper = new PDFTextStripper();

                PDFRenderer renderer = new PDFRenderer(document);

                int totalPages = document.getNumberOfPages();

                System.out.println(
                        "Total pages: " + totalPages
                );

                /*
                 * Tesseract configuration
                 */
                ITesseract tesseract = new Tesseract();

                tesseract.setDatapath(
                        TESSERACT_PATH + "\\tessdata"
                );

                tesseract.setLanguage("eng");

                /*
                 * Process every page
                 */
                for (int page = 1; page <= totalPages; page++) {

                    System.out.println(
                            "Processing page " + page
                                    + "/" + totalPages
                    );

                    /*
                     * First attempt:
                     * Extract normal PDF text.
                     */
                    stripper.setStartPage(page);
                    stripper.setEndPage(page);

                    String text = stripper
                            .getText(document);

                    if (text == null) {
                        text = "";
                    }

                    text = text.trim();

                    /*
                     * If normal text extraction failed,
                     * use OCR.
                     */
                    if (text.isEmpty()) {

                        System.out.println(
                                "Page " + page
                                        + ": No text found."
                        );

                        System.out.println(
                                "Page " + page
                                        + ": Running OCR..."
                        );

                        BufferedImage image =
                                renderer.renderImageWithDPI(
                                        page - 1,
                                        200,
                                        ImageType.RGB
                                );

                        text = tesseract.doOCR(image);

                        if (text == null) {
                            text = "";
                        }

                        text = text.trim();

                        System.out.println(
                                "Page " + page
                                        + ": OCR text length = "
                                        + text.length()
                        );

                    } else {

                        System.out.println(
                                "Page " + page
                                        + ": PDF text length = "
                                        + text.length()
                        );
                    }

                    /*
                     * If even OCR couldn't extract anything,
                     * skip this page.
                     */
                    if (text.isEmpty()) {

                        System.out.println(
                                "Page " + page
                                        + ": No text extracted."
                        );

                        continue;
                    }

                    /*
                     * Split text into chunks.
                     */
                    int chunkSize = 1200;

                    for (
                            int start = 0;
                            start < text.length();
                            start += chunkSize
                    ) {

                        int end = Math.min(
                                start + chunkSize,
                                text.length()
                        );

                        String chunkText =
                                text.substring(
                                        start,
                                        end
                                ).trim();

                        if (!chunkText.isEmpty()) {

                            chunks.add(
                                    new DocumentChunk(
                                            chunkText,
                                            page,
                                            material
                                    )
                            );
                        }
                    }
                }
            }

            System.out.println("----------------------------------------");

            System.out.println(
                    "Total chunks created: "
                            + chunks.size()
            );

            /*
             * Never mark a material READY if
             * nothing was extracted.
             */
            if (chunks.isEmpty()) {

                throw new RuntimeException(
                        "No text could be extracted from the PDF "
                                + "even after OCR."
                );
            }

            /*
             * Save chunks.
             */
            documentChunkRepository.saveAll(chunks);

            /*
             * Mark material ready.
             */
            material.setStatus("READY");
            materialRepository.save(material);

            System.out.println(
                    "PDF processing completed successfully."
            );

            System.out.println(
                    "Material ID : " + materialId
            );

            System.out.println(
                    "Chunks saved : " + chunks.size()
            );

            System.out.println("========================================");

        } catch (Exception e) {

            material.setStatus("FAILED");
            materialRepository.save(material);

            System.err.println("========================================");
            System.err.println("PDF PROCESSING FAILED");
            System.err.println("Material ID: " + materialId);
            System.err.println(
                    "Reason: " + e.getMessage()
            );
            System.err.println("========================================");

            e.printStackTrace();
        }
    }
}