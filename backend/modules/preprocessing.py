from locale import normalize
from os import path, replace
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from pathlib import Path


nltk.download("punkt")
nltk.download("punkt_tab")
nltk.download("stopwords")
nltk.download("wordnet")
nltk.download("omw-1.4")

stop_words = set(stopwords.words("english"))

def text_preprocessing(txt):
    
    #1. Lowercase
    txt = txt.lower()

    #2. Noise removal
    txt = re.sub(r'[^a-zA-Z0-9\s]', ' ', txt)

    #3. Tokenization
    tokens = word_tokenize(txt)

    #4. Stopword removal
    tokens = [word for word in tokens if word not in stop_words]

    return " ".join(tokens)
    
    
def normalize_skills(skill):
    skill = skill.lower().strip()
    
    replacements = {
        "react.js": "react",
        "vue.js": "vue",
        "node.js": "node",
        "express.js": "express",
        "tf-idf": "tf idf",
        "tcp/ip": "tcp ip",
        "c++": "cpp",
        "c#": "csharp",
        "scikit-learn": "scikit learn",
        "sklearn": "scikit learn",
        "golang": "go",
    }
    
    return replacements.get(skill,skill)


def load_skills(Skills_path: Path) -> list[str]:
    with open(Skills_path,'r',encoding='utf-8') as file:
        skills = set()
        
        for line in file:
            skill = line.strip().strip(',').strip('"')
            
            if skill:
                skill = normalize_skills(skill)
                skills.add(skill)
    
    return list(skills)

def extract_skills(text: str, skills: list[str]) -> list[str]:    
    found_skills = []
    text = text.lower()
    
    for skill in skills:        
        pattern = r'(?<!\w)' + re.escape(skill) + r'(?!\w)'
        
        if re.search(pattern,text):
            found_skills.append(skill)
    
    return found_skills