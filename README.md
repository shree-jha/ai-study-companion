# AI Study Companion

An AI-powered learning platform that turns personal study materials into an adaptive learning experience.

AI Study Companion allows learners to upload PDFs, ask grounded questions, practice adaptive quizzes, complete open-ended assessments, track concept mastery, analyze learning progress, and receive personalized recommendations.

## 🚀 Live Application

**Frontend:**
https://ai-study-companion-lw63kor30-sirivj265-7082.vercel.app

**Backend API:**
https://backend-production-b295.up.railway.app

**GitHub:**
https://github.com/shree-jha/ai-study-companion

---

## ✨ Core Learning Flow

The application is designed around a continuous learning loop:

```text
Space
  ↓
Project
  ↓
Study Material
  ↓
Document Processing
  ↓
AI Tutor
  ↓
Grounded Answer + Citation
  ↓
Adaptive Quiz
  ↓
Open-Ended Assessment
  ↓
Concept Mastery
  ↓
Growth Analysis
  ↓
Analytics
  ↓
Recommendation
  ↓
Continue Learning
```

The goal is to make the application behave more like a learning partner than a simple chatbot.

---

## 🎯 Features

### Authentication

* User registration and login
* JWT-based authentication
* Protected backend APIs
* User-specific data access

### Spaces & Projects

* Create learning spaces
* Create projects inside spaces
* Organize study materials by project
* Project-level data isolation

### PDF Materials

* Upload PDF study materials
* Store uploaded documents
* Process documents asynchronously
* Extract text page-by-page
* Split documents into searchable chunks
* Track processing status

### AI Tutor

* Ask questions about uploaded study material
* Retrieve relevant document chunks
* Generate grounded answers using retrieved context
* Provide source page references
* Reject unsupported questions instead of fabricating answers

### Adaptive Quiz

* AI-generated quiz questions
* Structured JSON-based AI interaction
* Multiple-choice questions
* Adaptive question selection
* Avoid unnecessary repetition
* Track quiz attempts and results

### Open-Ended Assessment

* Submit free-form answers
* AI-based evaluation
* Score answers
* Identify concepts
* Provide feedback
* Identify missing concepts and reasoning gaps

### Mastery Tracking

* Track concept-level performance
* Update mastery after assessments and quizzes
* Identify weak learning areas

### Growth & Recommendations

* Analyze learning progress
* Identify areas requiring attention
* Generate next-step learning recommendations

### Analytics

* Project analytics
* Global learning analytics
* Quiz performance
* Assessment performance
* Activity tracking

### Activity Tracking

The system records important learning events such as:

* Project creation
* Material uploads
* Tutor interactions
* Quiz activity
* Assessment activity
* Learning progress

### Admin / Operations View

The application includes an operations-oriented dashboard for viewing:

* User activity
* Projects
* Learning events
* Analytics
* System activity

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │     React + Vite    │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / REST
                               ▼
                    ┌─────────────────────┐
                    │   Spring Boot API   │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌────────────┐  ┌────────────┐  ┌─────────────┐
        │   MySQL    │  │ PDFBox /   │  │ Ollama Cloud│
        │  Database  │  │ Retrieval  │  │     AI      │
        └────────────┘  └────────────┘  └─────────────┘
```

### Deployment

```text
User
  │
  ▼
Vercel
React + Vite
  │
  │ /api/*
  ▼
Railway
Spring Boot
  │
  ├── Railway MySQL
  │
  └── Ollama Cloud
```

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* Recharts
* Lucide icons

### Backend

* Java
* Spring Boot
* Spring Web
* Spring Data JPA
* Hibernate
* Spring Security
* JWT
* Validation
* Lombok
* Maven

### Database

* MySQL

### AI

* Ollama
* `gpt-oss:20b-cloud` for deployed inference
* Local development can use Ollama models such as `llama3.2:3b`

### Document Processing

* Apache PDFBox

###
