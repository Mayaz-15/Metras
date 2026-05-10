# METRAS – AI-Powered Software Requirements Risk Analysis Platform

METRAS is an AI-powered software requirements risk analysis platform designed to identify potential vulnerabilities and security risks during the early stages of software development.

Instead of detecting issues after implementation, METRAS focuses on analyzing software requirements before development begins. Using Natural Language Processing (NLP), Machine Learning, and real-world vulnerability intelligence from the National Vulnerability Database (NVD), the platform predicts risk severity, likelihood, and impact while matching requirements with related CVEs.

The system provides an intelligent environment for development teams to review, validate, and manage potential vulnerabilities collaboratively through AI-assisted analysis and human validation workflows.

By combining AI-driven risk assessment with real-world vulnerability data, METRAS aims to improve software security awareness, support proactive risk analysis practices, and reduce potential vulnerabilities early in the Software Development Lifecycle (SDLC).

---

# Technologies Used

## Programming Languages
- Python
- HTML
- CSS
- JavaScript
- JSON

---

## Frameworks & Libraries
- Flask
- Scikit-learn
- Sentence Transformers
- FAISS

---

## AI & Machine Learning
- TF-IDF Vectorization
- Logistic Regression
- NLP-based Risk Prediction
- CVE Similarity Matching
- AI-powered Requirement Analysis

---

## Database
- MySQL

---

## External Data Sources
- National Vulnerability Database (NVD)
- CVE JSON Feed
- Kaggle Software Requirements Risk Dataset

---

# Key Features

- AI-based requirement risk analysis
- Severity, likelihood, and impact prediction
- CVE vulnerability matching using NVD data
- AI-generated risk reports
- Requirement comparison and tracking
- Human-in-the-loop validation workflow
- Team collaboration and task tracking
- Interactive AI chatbot assistant
- Real-time project monitoring dashboard

---

# System Architecture

The METRAS platform consists of the following main components:

1. Frontend User Interface  
2. Backend API Services  
3. AI Risk Prediction Engine  
4. CVE Vulnerability Matching Module  
5. Database Management System  

The architecture combines NLP-based machine learning models with real-world vulnerability intelligence to support automated risk analysis and collaborative risk handling workflows.

---

# 1. Frontend – Getting Started

## Prerequisites

Before running the frontend application, ensure you have the following installed:

- Python 3.10+
- Visual Studio Code (Recommended)
- Git
- Modern browser (Chrome or Edge)

---

## Installation & Launch Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Mayaz-15/2026_GP1_9.git
```

### 2. Navigate to the Project Folder

```bash
cd metras
```

### 3. Open Frontend Files

Open the `frontend` folder using VS Code or any local server extension.

Example:

```bash
cd frontend
```

### 4. Run Frontend

You can run the frontend using:

- Live Server Extension (VS Code)
- XAMPP / MAMP
- Any local web server

---

# 2. Backend & AI Engine – Getting Started

## Prerequisites

Before running the backend, ensure you have:

- Python installed
- pip package manager
- Virtual environment support

---

## Installation & Launch Steps

### 1. Navigate to Backend Folder

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### macOS / Linux

```bash
source venv/bin/activate
```

### 4. Install Required Packages

```bash
pip install -r requirements.txt
```

### 5. Run Flask Server

```bash
python app.py
```

---

# AI Model Workflow

The AI engine inside METRAS performs the following workflow:

1. Requirement text preprocessing
2. NLP feature extraction using TF-IDF
3. Risk classification using Machine Learning models
4. CVE similarity matching using embeddings and FAISS
5. Risk severity, likelihood, and impact prediction
6. AI-generated risk analysis reporting

---

# Repository Structure

```bash
/frontend        -> User interface files
/backend         -> Flask backend APIs
/models          -> AI and NLP models
/datasets        -> Training and CVE datasets
/docs            -> Project documentation
```

---

# Contributors

- Sarah Alsubaihi
- Mayaz Aljuraid
- Muneerah Alhowekan
- Bouchra Baboune

---

# Future Enhancements

- Advanced collaborative workflows
- Enhanced AI risk analysis models
- Improved project monitoring features
- Sector-specific risk analysis support
- Expanded CVE intelligence integration
- Advanced analytics dashboard

---

# Notes

- METRAS focuses on identifying potential vulnerabilities during early software development stages.
- The platform combines AI automation with human validation to improve analysis accuracy.
- NVD CVE data is regularly updated to improve vulnerability matching results.
