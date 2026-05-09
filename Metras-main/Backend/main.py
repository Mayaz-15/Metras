# main.py
import os, json, re
import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sentence_transformers import SentenceTransformer
from langdetect import detect as detect_language, LangDetectException
import faiss
from PyPDF2 import PdfReader
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── CONFIG ───────────────────────────────────────────────
DATASET_PATH        = "software_requirements_extended.csv"
NVD_PATH            = "nvdcve-2.0-modified.json"
SIM_THRESHOLD       = 0.3
DUPLICATE_THRESHOLD = 0.92

# ── LIKELIHOOD KEYWORD WEIGHTS ───────────────────────────
# Requirements mentioning insecure practices → higher likelihood
HIGH_LIKELIHOOD_KEYWORDS = [
    "no validation", "no sanitiz", "without validation", "without sanitiz",
    "plain text", "plaintext", "no encryption", "without encryption",
    "no authentication", "without authentication", "no authorization",
    "hardcoded", "hard-coded", "no rate limit", "unlimited attempt",
    "no access control", "without access control", "directly into",
    "unencrypted", "no mfa", "without mfa", "no password policy",
    "no session", "without session", "no firewall", "no logging"
]

MEDIUM_LIKELIHOOD_KEYWORDS = [
    "should encrypt", "should validate", "should authenticate",
    "weak password", "simple password", "basic auth", "http ",
    "no csrf", "missing csrf", "no httponly", "insecure cookie",
    "outdated", "third party", "third-party", "external library"
]

# ── CVE IMPACT DIMENSION MAPPING ────────────────────────
def map_impact_value(val):
    """Maps CVSS impact string to numeric score."""
    if not val: return 1.0
    val = str(val).upper()
    if val in ["HIGH", "COMPLETE"]:    return 3.0
    if val in ["LOW", "PARTIAL"]:      return 2.0
    if val in ["NONE"]:                return 1.0
    return 1.0

# ── FORMULA: SEVERITY ────────────────────────────────────
CRITICAL_KEYWORDS = [
    "plain text", "plaintext", "no encryption", "without encryption",
    "sql injection", "without validation", "without sanitiz",
    "no authentication", "hardcoded", "hard-coded",
    "command injection", "remote code execution", "unencrypted"
]
HIGH_KEYWORDS = [
    "xss", "cross-site scripting", "no access control", "path traversal",
    "no rate limit", "unlimited attempt", "privilege escalation",
    "broken access", "no authorization"
]
MEDIUM_KEYWORDS = [
    "weak password", "no mfa", "missing mfa", "insecure cookie",
    "no csrf", "missing csrf", "verbose error", "outdated library"
]

def formula_severity(cvss_score, requirement):
    """
    Combines CVE CVSS score with requirement keyword boost.
    Keywords override if they indicate a worse severity than CVSS suggests.
    """
    req_lower = requirement.lower()

    # Keyword-based severity
    if any(kw in req_lower for kw in CRITICAL_KEYWORDS):
        keyword_severity = "Critical"
    elif any(kw in req_lower for kw in HIGH_KEYWORDS):
        keyword_severity = "High"
    elif any(kw in req_lower for kw in MEDIUM_KEYWORDS):
        keyword_severity = "Medium"
    else:
        keyword_severity = None

    # CVSS-based severity
    cvss_severity = "Low"
    if cvss_score is not None:
        try:
            score = float(cvss_score)
            if score >= 9.0:   cvss_severity = "Critical"
            elif score >= 7.0: cvss_severity = "High"
            elif score >= 4.0: cvss_severity = "Medium"
            else:              cvss_severity = "Low"
        except: pass

    # Take the worse of the two
    scale = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    if keyword_severity:
        if scale[keyword_severity] > scale[cvss_severity]:
            return keyword_severity
    return cvss_severity


# ── FORMULA: LIKELIHOOD ──────────────────────────────────
def formula_likelihood(requirement, cve_obj):
    """
    Likelihood = exploitability_ratio × keyword_weight
    CVSSv3 exploitability max = 3.9, CVSSv2 max = 10
    """
    exploitability  = 2.0  # default
    max_exploit     = 3.9  # CVSSv3 scale

    if cve_obj:
        metrics = cve_obj.get("metrics", {})
        for key in ["cvssMetricV31", "cvssMetricV30"]:
            arr = metrics.get(key)
            if arr and len(arr) > 0:
                exp = arr[0].get("exploitabilityScore")
                if exp is not None:
                    exploitability = float(exp)
                    max_exploit    = 3.9
                    break
        else:
            arr = metrics.get("cvssMetricV2")
            if arr and len(arr) > 0:
                exp = arr[0].get("exploitabilityScore")
                if exp is not None:
                    exploitability = float(exp)
                    max_exploit    = 10.0

    exploitability_ratio = min(exploitability / max_exploit, 1.0)

    req_lower = requirement.lower()
    if any(kw in req_lower for kw in HIGH_LIKELIHOOD_KEYWORDS):
        keyword_weight = 1.0
    elif any(kw in req_lower for kw in MEDIUM_LIKELIHOOD_KEYWORDS):
        keyword_weight = 0.6
    else:
        keyword_weight = 0.5  # raised default from 0.4

    score = exploitability_ratio * keyword_weight

    if score >= 0.65: return "High"
    if score >= 0.35: return "Medium"
    return "Low"

# ── FORMULA: IMPACT ──────────────────────────────────────
def formula_impact(cve_obj):
    """
    Calculates impact from CVE's CIA triad metrics.
    Impact = average(Confidentiality, Integrity, Availability)
    Each dimension: High=3, Low/Medium=2, None=1
    """
    if not cve_obj:
        return "Low"

    metrics = cve_obj.get("metrics", {})

    # Try CVSSv3 first
    for key in ["cvssMetricV31", "cvssMetricV30"]:
        arr = metrics.get(key)
        if arr and len(arr) > 0:
            data = arr[0].get("cvssData", {})
            c = map_impact_value(data.get("confidentialityImpact"))
            i = map_impact_value(data.get("integrityImpact"))
            a = map_impact_value(data.get("availabilityImpact"))
            avg = (c + i + a) / 3.0
            if avg > 2.5: return "High"
            if avg > 1.5: return "Medium"
            return "Low"

    # Fallback to CVSSv2
    arr = metrics.get("cvssMetricV2")
    if arr and len(arr) > 0:
        data = arr[0].get("cvssData", {})
        c = map_impact_value(data.get("confidentialityImpact"))
        i = map_impact_value(data.get("integrityImpact"))
        a = map_impact_value(data.get("availabilityImpact"))
        avg = (c + i + a) / 3.0
        if avg > 2.5: return "High"
        if avg > 1.5: return "Medium"
        return "Low"

    return "Low"

# ── FORMULA: RISK LEVEL ──────────────────────────────────
def formula_risk_level(severity, impact):
    """
    Risk Score = Severity × Impact (numeric)
    Critical=4, High=3, Medium=2, Low=1

    Score ≥ 12 → Critical Risk
    Score ≥ 6  → High Risk
    Score ≥ 3  → Medium Risk
    Score < 3  → Low Risk
    """
    scale = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    score = scale.get(severity, 1) * scale.get(impact, 1)
    if score >= 12: return "Critical Risk"
    if score >= 6:  return "High Risk"
    if score >= 3:  return "Medium Risk"
    return "Low Risk"

# ── INPUT VALIDATION & FILTERING ────────────────────────
MIN_LINE_LENGTH   = 15
MAX_LINE_LENGTH   = 1000
MIN_WORD_COUNT    = 4
MIN_ALPHA_RATIO   = 0.55
REQUIREMENT_KEYWORDS = [
    "shall", "must", "should", "will", "system", "user", "application",
    "the ", "data", "service", "software", "product", "platform",
    "interface", "module", "component", "database", "server", "client"
]

def validate_document(lines):
    """
    Validates the uploaded document before processing.
    Returns (is_valid, error_message, valid_lines)
    """
    if not lines:
        return False, "The document appears to be empty. Please upload a file with content.", []

    # Check minimum content
    if len(lines) < 1:
        return False, "No readable text found in the document.", []

    # Check language on a sample of lines
    sample_text = " ".join(lines[:20])
    try:
        lang = detect_language(sample_text)
        if lang != "en":
            lang_names = {
                "ar": "Arabic", "fr": "French", "es": "Spanish",
                "de": "German", "zh-cn": "Chinese", "zh-tw": "Chinese",
                "ja": "Japanese", "ko": "Korean", "pt": "Portuguese",
                "it": "Italian", "ru": "Russian"
            }
            lang_name = lang_names.get(lang, f"non-English (detected: {lang})")
            return False, (
                f"The document appears to be written in {lang_name}. "
                f"Metras currently supports English documents only. "
                f"Please upload a requirements document in English."
            ), []
    except LangDetectException:
        pass  # Can't detect, proceed anyway

    # Filter individual lines
    valid_lines = []
    rejected_count = 0

    for line in lines:
        line = line.strip()

        # Skip empty
        if not line:
            continue

        # Skip too short
        if len(line) < MIN_LINE_LENGTH:
            rejected_count += 1
            continue

        # Skip too long (likely a paragraph, not a requirement)
        if len(line) > MAX_LINE_LENGTH:
            rejected_count += 1
            continue

        # Skip lines with too few words
        words = line.split()
        if len(words) < MIN_WORD_COUNT:
            rejected_count += 1
            continue

        # Skip lines that are mostly numbers/symbols
        alpha_ratio = sum(c.isalpha() for c in line) / len(line)
        if alpha_ratio < MIN_ALPHA_RATIO:
            rejected_count += 1
            continue

        # Skip lines that don't look like requirements
        line_lower = line.lower()
        if not any(kw in line_lower for kw in REQUIREMENT_KEYWORDS):
            rejected_count += 1
            continue

        # Skip lines that look like headers/titles (ALL CAPS, very short)
        if line.isupper() and len(words) <= 5:
            rejected_count += 1
            continue

        # Skip page numbers, dates, author lines
        if re.match(r'^(page\s+\d+|\d+\s+of\s+\d+|version\s+[\d.]+|date:|author:|revision:)', line_lower):
            rejected_count += 1
            continue

        valid_lines.append(line)

    if not valid_lines:
        return False, (
            "No valid requirements were found in the document. "
            "Requirements should be clear sentences describing system behavior, "
            "for example: 'The system shall require users to authenticate before accessing data.'"
        ), []

    # Warn if too many lines were rejected
    total = len(valid_lines) + rejected_count
    rejection_ratio = rejected_count / total if total > 0 else 0
    if rejection_ratio > 0.8 and len(valid_lines) < 3:
        return False, (
            f"Only {len(valid_lines)} valid requirement(s) were found out of {total} lines. "
            f"Please make sure the document contains software requirements written in English."
        ), []

    return True, None, valid_lines

# ── TEXT PROCESSING ──────────────────────────────────────
def extract_requirements(text):
    """Joins continuation lines so multi-line requirements stay as one."""
    raw_lines = text.split("\n")
    requirements = []
    current = ""

    for line in raw_lines:
        line = line.strip()
        if not line:
            if current:
                requirements.append(current)
                current = ""
            continue

        starts_new = bool(re.match(r'^(\d+[\.\)]\s|[-•*]\s|[A-Z])', line))

        if starts_new and current:
            requirements.append(current)
            current = line
        elif current:
            current += " " + line
        else:
            current = line

    if current:
        requirements.append(current)

    return [r.strip() for r in requirements if r.strip()]

def pick_english_desc(desc_list):
    if not desc_list: return None
    for d in desc_list:
        if d.get("lang") == "en": return d.get("value")
    return desc_list[0].get("value")

def extract_cvss_score(cve_obj):
    metrics = cve_obj.get("metrics", {})
    for key in ["cvssMetricV31", "cvssMetricV30", "cvssMetricV2"]:
        arr = metrics.get(key)
        if arr and len(arr) > 0:
            cvss = arr[0].get("cvssData", {})
            return cvss.get("baseScore"), cvss.get("baseSeverity")
    return None, None

# ── LOAD DATASET AND TRAIN SECURITY CLASSIFIER ──────────
print("Loading dataset and training security classifier...")

df = pd.read_csv(DATASET_PATH)
df = df.dropna(subset=["Requirement", "Type"]).copy()
df["Requirement"] = df["Requirement"].astype(str).str.strip()
df = df[df["Requirement"].str.len() > 5]

# Binary label: SE = security requirement, everything else = general
df["is_security"] = (df["Type"].str.strip().str.upper() == "SE").astype(int)

X = df["Requirement"]
y = df["is_security"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

security_classifier = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=8000, ngram_range=(1, 2))),
    ("clf",   LogisticRegression(max_iter=1000, class_weight="balanced"))
])
security_classifier.fit(X_train, y_train)

from sklearn.metrics import classification_report
y_pred = security_classifier.predict(X_test)
print("Security Classifier Report:")
print(classification_report(y_test, y_pred, target_names=["General", "Security"]))

# ── LOAD NVD CVE DATA ────────────────────────────────────
print("Loading CVE data and building FAISS index...")

with open(NVD_PATH, "r", encoding="utf-8", errors="ignore") as f:
    nvd = json.load(f)

# Store full CVE objects for formula calculations
cve_records = []
for item in nvd.get("vulnerabilities", []):
    cve_obj = item.get("cve", {})
    cve_id  = cve_obj.get("id")
    desc    = pick_english_desc(cve_obj.get("descriptions", []))
    score, sev = extract_cvss_score(cve_obj)
    if cve_id and desc:
        cve_records.append({
            "cve_id":     cve_id,
            "description": desc,
            "cvss_score":  score,
            "cvss_severity": sev,
            "cve_obj":    cve_obj   # full object for formula calculations
        })

cve_df = pd.DataFrame(cve_records).drop_duplicates(subset=["cve_id"]).reset_index(drop=True)

embedder       = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
cve_embeddings = embedder.encode(cve_df["description"].tolist(), show_progress_bar=True)
cve_embeddings = cve_embeddings / np.linalg.norm(cve_embeddings, axis=1, keepdims=True)

dim   = cve_embeddings.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(cve_embeddings.astype("float32"))

print("✅ Model ready!")

# ── CVE MATCHING ─────────────────────────────────────────
SECURITY_CONCEPTS = {
    "password":       ["password", "credential", "authentication", "plaintext", "passphrase"],
    "encryption":     ["encrypt", "crypto", "tls", "ssl", "cipher", "decrypt", "key"],
    "injection":      ["injection", "sql", "xss", "command", "input", "query", "sanitize"],
    "access control": ["access", "privilege", "authorization", "permission", "role", "rbac"],
    "logging":        ["log", "audit", "monitor", "record", "trail"],
    "session":        ["session", "token", "cookie", "timeout", "expiry"],
    "data exposure":  ["exposure", "disclosure", "sensitive", "leak", "personal", "pii"],
    "upload":         ["upload", "file", "path", "directory", "traversal"],
    "api":            ["api", "endpoint", "request", "response", "rest"],
    "dos":            ["denial", "dos", "ddos", "availability", "flood", "rate limit"],
    "integrity":      ["integrity", "tamper", "checksum", "hash", "signature"],
    "network":        ["network", "firewall", "port", "protocol", "traffic"],
    "third party":    ["third party", "library", "dependency", "plugin", "component"],
}

def semantic_topk(text, k=5):
    vec = embedder.encode([text])
    vec = vec / np.linalg.norm(vec, axis=1, keepdims=True)
    D, I = index.search(vec.astype("float32"), k)
    results = []
    for dist, idx in zip(D[0], I[0]):
        row = cve_df.iloc[idx]
        results.append({
            "cve_id":          row["cve_id"],
            "cve_description": row["description"],
            "cvss_score":      row["cvss_score"],
            "cvss_severity":   row["cvss_severity"],
            "cve_obj":         row["cve_obj"],
            "similarity":      float(dist)
        })
    return results

def rerank_cve_match(requirement, cve_matches):
    """Reranks CVE candidates by security concept alignment."""
    req_lower = requirement.lower()
    req_concepts = set()
    for concept, keywords in SECURITY_CONCEPTS.items():
        if any(kw in req_lower for kw in keywords):
            req_concepts.add(concept)

    scored = []
    for match in cve_matches:
        desc_lower = (match["cve_description"] or "").lower()
        concept_score = sum(
            1 for concept, keywords in SECURITY_CONCEPTS.items()
            if concept in req_concepts and any(kw in desc_lower for kw in keywords)
        )
        combined = match["similarity"] + (concept_score * 0.05)
        scored.append((combined, match))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]

def detect_duplicates(requirements):
    """Detects near-duplicate requirements using cosine similarity."""
    if len(requirements) < 2:
        return {}

    vecs = embedder.encode(requirements)
    vecs = vecs / np.linalg.norm(vecs, axis=1, keepdims=True)

    duplicate_map = {}
    group_id = 1

    for i in range(len(requirements)):
        for j in range(i + 1, len(requirements)):
            sim = float(np.dot(vecs[i], vecs[j]))
            if sim >= DUPLICATE_THRESHOLD:
                gi = duplicate_map.get(i)
                gj = duplicate_map.get(j)
                if gi is None and gj is None:
                    duplicate_map[i] = group_id
                    duplicate_map[j] = group_id
                    group_id += 1
                elif gi is None:
                    duplicate_map[i] = gj
                elif gj is None:
                    duplicate_map[j] = gi

    return duplicate_map

# ── FULL ANALYSIS ────────────────────────────────────────
def analyze_requirement(line):
    """
    Full pipeline for one requirement:
    1. Check if security-related using trained classifier
    2. Match to CVE using semantic search + reranking
    3. Calculate severity, impact, likelihood using formulas
    4. Calculate risk level
    """
    line = str(line).strip()
    if not line: return None

    # Step 1: Security classification
    is_security = bool(security_classifier.predict([line])[0])
    security_prob = float(security_classifier.predict_proba([line])[0][1])

    # Step 2: CVE semantic matching
    cve_matches = semantic_topk(line, k=5)
    best = rerank_cve_match(line, cve_matches)
    has_cve_match = best["similarity"] >= SIM_THRESHOLD

    # Step 3: Formula-based scoring
    cve_obj   = best["cve_obj"] if has_cve_match else None
    severity  = formula_severity(best["cvss_score"] if has_cve_match else None, line)
    impact    = formula_impact(cve_obj)
    likelihood = formula_likelihood(line, cve_obj)
    risk_level = formula_risk_level(severity, impact)

    return {
        "Requirement":          line,
        "Is Security":          is_security,
        "Security Confidence":  round(security_prob, 3),
        "Predicted Severity":   severity,
        "Predicted Impact":     impact,
        "Predicted Likelihood": likelihood,
        "Risk Level":           risk_level,
        "Top CVE":              best["cve_id"] if has_cve_match else "No strong semantic match",
        "Similarity":           round(best["similarity"], 3),
        "CVSS Score":           best["cvss_score"] if has_cve_match else None,
        "CVSS Severity":        best["cvss_severity"] if has_cve_match else None,
        "CVE Description":      best["cve_description"] if has_cve_match else None
    }

# ── API ENDPOINTS ────────────────────────────────────────
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    content = await file.read()

    # ── Extract text ─────────────────────────────────────
    filename = file.filename or ""
    if filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join([p.extract_text() or "" for p in reader.pages])
        except Exception:
            return JSONResponse(status_code=400, content={
                "error": "Could not read the PDF file. Please make sure it is a valid, non-corrupted PDF."
            })
    else:
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            return JSONResponse(status_code=400, content={
                "error": "Could not read the file. Please upload a valid UTF-8 text file."
            })

    # ── Check file is not empty ───────────────────────────
    if not text.strip():
        return JSONResponse(status_code=400, content={
            "error": "The uploaded file is empty. Please upload a file with content."
        })

    # ── Extract and validate lines ────────────────────────
    raw_lines = extract_requirements(text)
    is_valid, error_msg, valid_lines = validate_document(raw_lines)

    if not is_valid:
        return JSONResponse(status_code=400, content={"error": error_msg})

    # ── Detect duplicates ─────────────────────────────────
    duplicate_map = detect_duplicates(valid_lines)

    # ── Analyze each requirement ──────────────────────────
    results = []
    for i, ln in enumerate(valid_lines):
        out = analyze_requirement(ln)
        if out:
            # Clean NaN values
            cleaned = {
                k: (None if (v is None or (isinstance(v, float) and v != v)) else v)
                for k, v in out.items()
            }
            cleaned["Is Duplicate"]    = i in duplicate_map
            cleaned["Duplicate Group"] = duplicate_map.get(i, None)
            results.append(cleaned)

    if not results:
        return JSONResponse(status_code=400, content={
            "error": "No requirements could be analyzed. Please check your document."
        })

    return results

@app.get("/health")
def health():
    return {"status": "ok"}