# Matchly — AI Resume Matcher

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=25&duration=3000&pause=1000&color=36BCF7&center=true&vCenter=true&width=650&lines=AI-Powered+Resume+Matcher;Match+Your+Resume+With+The+Right+Job;Find+Your+Skill+Gaps;Built+With+Python+%26+NLP" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
  <img src="https://img.shields.io/badge/NLTK-154F5B?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

<p align="center">
  <b>Understand how well your resume matches a job — and find out what skills you're missing.</b>
</p>

---

## 📌 About

**Matchly** is an AI-powered resume matching tool that compares your resume with a job description.

It looks at both the **skills** and the **text** in your resume and job description to give you a better idea of how closely they match.

The goal is simple:

> **Upload your resume → Add a job description → Get your match → Understand your skill gaps.**

---

## ✨ Features

- 📄 Upload your resume
- 💼 Add a job description
- 🎯 Get a resume–job match score
- 🧠 Match skills between your resume and the job
- 🔍 See matched and missing skills
- 📊 Compare resume and job text using TF-IDF
- 💡 Find areas where your resume can be improved
- 💼 Select from predefined job roles

---

## ⚙️ How It Works

```text
        Resume
           │
           ▼
   Text Processing
           │
           ├──────────────┐
           ▼              ▼
    Skill Matching    TF-IDF
           │              │
           └──────┬───────┘
                  ▼
            Match Score
                  │
          ┌───────┴───────┐
          ▼               ▼
   Matched Skills    Missing Skills
```

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=python,fastapi,html,css,js,git,github" />
</p>

### AI / NLP

- **Python**
- **NLTK**
- **Scikit-learn**
- **TF-IDF**
- **Cosine Similarity**
- **Skill-based matching**

### Backend

- **FastAPI**
- **Uvicorn**
- **Python**

### Frontend

- **HTML**
- **CSS**
- **JavaScript**

---

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/adrijghosh8/Matchly-AI-Resume-matcher.git
cd Matchly-AI-Resume-matcher
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the backend

```bash
uvicorn backend.main:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

### 4. Open the frontend

Open the frontend in your browser and start matching your resume with a job description.

---

## 📊 Matching Approach

Matchly currently combines two main signals:

### 1. Skill Matching

The system extracts skills from the resume and job description and checks which required skills are present.

This helps answer:

```text
What skills do I already have?
What skills am I missing?
```

### 2. TF-IDF Similarity

TF-IDF is used to compare the important words in the resume and job description.

The similarity is calculated using **cosine similarity**.

The two signals are then combined to create the overall matching result.

---

## 🎯 Project Goal

I built Matchly to explore how **NLP can be used to solve a real-world job search problem**.

Instead of relying only on keyword matching, the project combines **skill matching and text similarity** to give a more useful view of resume–job compatibility.

---

## 🔮 Future Improvements

- 🤖 Better semantic matching using sentence embeddings
- 📚 More job roles and skill data
- 📈 Resume improvement suggestions
- 🧠 Better skill extraction
- 💼 Job recommendation system
- 📊 Match history and analytics

---

## 👨‍💻 Author

### Adrij Ghosh

**B.Tech CSE | AI/ML & Software Development**

<p align="left">
  <a href="https://github.com/adrijghosh8">
    <img src="https://img.shields.io/badge/GitHub-Adrij%20Ghosh-181717?style=for-the-badge&logo=github" />
  </a>
</p>

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" />
</p>

<p align="center">
  ⭐ If you find Matchly interesting, consider giving the repository a star!
</p>
