from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from sentence_transformers import SentenceTransformer, util
import re

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI model once
model = SentenceTransformer("all-MiniLM-L6-v2")

# Predefined technical skills list
SKILLS_DB = [
    "python", "java", "c++", "javascript", "react", "nodejs",
    "html", "css", "sql", "mysql", "postgresql", "mongodb",
    "docker", "aws", "git", "machine learning", "deep learning",
    "data analysis", "pandas", "numpy", "flask", "fastapi"
]


# Extract text from PDF
def extract_resume_text(file):
    text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text += content.lower()
    return text


# Extract skills from text
def extract_skills(text):
    found = []
    for skill in SKILLS_DB:
        if skill in text:
            found.append(skill)
    return list(set(found))


@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):

    # Extract resume text
    resume_text = extract_resume_text(resume)

    # Extract skills
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(job_description.lower())

    # Skill match
    matched = list(set(resume_skills) & set(jd_skills))
    missing = list(set(jd_skills) - set(resume_skills))

    skill_score = 0
    if len(jd_skills) > 0:
        skill_score = (len(matched) / len(jd_skills)) * 100

    # Semantic similarity
    emb1 = model.encode(resume_text, convert_to_tensor=True)
    emb2 = model.encode(job_description, convert_to_tensor=True)
    semantic_score = float(util.cos_sim(emb1, emb2)[0][0]) * 100

    # Final score (50% semantic + 50% skill)
    final_score = (semantic_score * 0.5) + (skill_score * 0.5)

    return {
        "final_score": round(final_score, 2),
        "semantic_score": round(semantic_score, 2),
        "skill_score": round(skill_score, 2),
        "matched": matched,
        "missing": missing
    }


