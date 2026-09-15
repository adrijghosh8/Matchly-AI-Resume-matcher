import io
from fastapi import UploadFile
from numpy import full
import pandas as pd
from docx import Document
from pypdf import PdfReader
from pylatexenc.latex2text import LatexNodes2Text

def pdf_to_string(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()

def csv_to_string(file):
    contents = file.read()
    file_text = io.StringIO(contents.decode('utf-8'))

    df = pd.read_csv(file_text)
    return df.to_string()

def latex_to_string(file):
    contents = file.read()
    latex_code = contents.decode('utf-8')
    return LatexNodes2Text().latex_to_text(latex_code)

def docx_to_string(file):
    doc = Document(file)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)

    return "\n".join(full_text)

def txt_to_string(file):
    text = file.read().decode('utf-8')
    return text


def read_file(file: UploadFile) -> str:

    if not file.filename:
        return "Error : File Couldn't load"

    filename = file.filename.lower()

    try: 
        if filename.endswith(".pdf"):
            text = pdf_to_string(file.file)

        elif filename.endswith(".docx"):
            text = docx_to_string(file.file)

        elif filename.endswith(".csv"):
            text = csv_to_string(file.file)

        elif filename.endswith((".tex",".latex")):
            text = latex_to_string(file.file)
            
        elif filename.endswith(".txt"):
            text = txt_to_string(file.file)
            
        else:
            
            return "Error : Unsupported File type"
        
    except Exception as e:
        
        return f"Error : {e}"

    return text
