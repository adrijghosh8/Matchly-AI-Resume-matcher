from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.modules.preprocessing import(
    text_preprocessing,
    load_skills,
    extract_skills
)
from backend.modules.file_uploads import read_file


vectorizer = TfidfVectorizer(
    stop_words="english",
    ngram_range=(1, 2)
)

def calculate_similarity(resume_text, jd_text):

    #   TF - IDF PART
    documents = [resume_text, jd_text]

    tfidf_matrix = vectorizer.fit_transform(documents)

    tfidf_score = cosine_similarity(
        tfidf_matrix[0], # type: ignore
        tfidf_matrix[1] # type: ignore
    )[0][0]

    tfidf_score_pct = tfidf_score*100
    
    return round(tfidf_score_pct,2)
    


def match_skills(resume_skills: list[str],jd_skills: list[str]):
    resume_set = set(resume_skills)
    jd_set = set(jd_skills)
    
    matched_skills = resume_set.intersection(jd_set)
    missing_skills = jd_set.difference(resume_set)
    
    if len(jd_set) == 0:
        skill_score = 0
    else:
        skill_score = (len(matched_skills)/len(jd_set)) * 100
        
    return (
        list(matched_skills),
        list(missing_skills),
        round(skill_score,2)
    )
    
def calculate_final_score(skill_score, tfidf_score):

    final_score = (
        0.60 * skill_score +
        0.40 * tfidf_score
    )

    return round(final_score, 2)