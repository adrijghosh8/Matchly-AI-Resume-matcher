import io
from fastapi import FastAPI, UploadFile, File
from pypdf.generic import ContentStream
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware


from backend.modules.file_uploads import (
    pdf_to_string,
    csv_to_string,
    latex_to_string,
    docx_to_string,
    read_file
)

from backend.modules.preprocessing import(
    extract_skills,
    load_skills
)

from backend.modules.similarity import(
    calculate_similarity,
    match_skills,
    calculate_final_score
)

SKILLS_PATH = Path("backend/data/skills.txt")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://adrijghosh8.github.io/Matchly-AI-Resume-matcher/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def greet():
    return {"hello":"world"}

@app.post("/match/")
async def match_resume(
    resume: UploadFile = File(...),
    jd: UploadFile = File(...),
):
    try:
        resume_text = read_file(resume)
        jd_text = read_file(jd)
        SKILLS = load_skills(SKILLS_PATH)

        resume_skills = extract_skills(
            resume_text,
            SKILLS
        )
        
        jd_skills = extract_skills(
            jd_text,
            SKILLS
        )
        
        matched_skills, missing_skills, skill_score = match_skills(
            resume_skills=resume_skills,
            jd_skills=jd_skills
        )
        
        tfidf_score = calculate_similarity(
            resume_text=resume_text,
            jd_text=jd_text
        )
        
        final_score = calculate_final_score(
            skill_score=skill_score,
            tfidf_score=tfidf_score
        )
        
        return {
            "Final Score": f"{final_score}%",
            "Skill Match": f"{skill_score}%",
            "TF-IDF Similarity": f"{tfidf_score}%",
            "Matched Skills": matched_skills,
            "Missing Skills": missing_skills,
            "Resume Skills": resume_skills,
            "JD Skills": jd_skills
        }
    except Exception as e:
        
        return {
            "Error" : f"{e}"
        }
    