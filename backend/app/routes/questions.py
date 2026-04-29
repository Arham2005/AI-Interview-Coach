from fastapi import APIRouter
from fastapi import Body
from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

QUESTION_BANK = {
    "Artificial Intelligence": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your interest in AI.",
                "Why did you choose Artificial Intelligence as your field?",
                "Describe a time you worked on a team project.",
                "What is your greatest strength as an AI student?",
                "Tell me about a challenge you faced during your studies.",
            ],
            "medium": [
                "Describe a time you had to learn a new AI tool or framework quickly.",
                "Tell me about an AI project you are most proud of.",
                "How do you handle situations where your model is not performing well?",
                "Describe a time you explained a complex AI concept to a non-technical person.",
                "Tell me about a time you failed in a project and what you learned.",
            ],
            "hard": [
                "Describe a situation where you had to choose between model accuracy and interpretability.",
                "Tell me about a time you dealt with severely imbalanced data in a real project.",
                "Describe a time you had to optimize a model under strict computational constraints.",
                "Tell me about a situation where your AI model gave biased results and how you handled it.",
                "Describe a time you had to convince a team to adopt a new AI approach.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between supervised and unsupervised learning?",
                "Explain what a neural network is in simple terms.",
                "What is overfitting and how do you prevent it?",
                "What is the difference between classification and regression?",
                "Explain what a training dataset and test dataset are.",
            ],
            "medium": [
                "Explain the backpropagation algorithm and how it works.",
                "What is the difference between bagging and boosting?",
                "Explain how a convolutional neural network works.",
                "What is the vanishing gradient problem and how is it solved?",
                "Explain the difference between L1 and L2 regularization.",
            ],
            "hard": [
                "Explain the transformer architecture and why it replaced RNNs.",
                "How does attention mechanism work in deep learning models?",
                "Explain the difference between generative and discriminative models.",
                "What is the VC dimension and why does it matter in ML theory?",
                "Explain how RLHF is used to align large language models.",
            ],
        },
    },

    "Software Engineering": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your programming experience.",
                "Why did you choose Software Engineering?",
                "Describe a time you worked in a development team.",
                "What is your greatest strength as a developer?",
                "Tell me about a bug you found and fixed.",
            ],
            "medium": [
                "Describe a time you had to refactor a large codebase.",
                "Tell me about a project where you missed a deadline and how you handled it.",
                "Describe a time you disagreed with a teammate on a technical decision.",
                "Tell me about a time you had to learn a new programming language quickly.",
                "Describe a situation where you improved the performance of an application.",
            ],
            "hard": [
                "Describe a time you designed a system from scratch under tight constraints.",
                "Tell me about a time you had to handle a critical production bug.",
                "Describe a situation where you had to make a tradeoff between speed and code quality.",
                "Tell me about a time you led a technical team through a difficult project.",
                "Describe a time you identified and resolved a major security vulnerability.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between a stack and a queue?",
                "Explain what object-oriented programming is.",
                "What is the difference between an array and a linked list?",
                "Explain what version control is and why it is important.",
                "What is the difference between compiled and interpreted languages?",
            ],
            "medium": [
                "Explain the SOLID principles of software design.",
                "What is the difference between REST and GraphQL APIs?",
                "Explain what design patterns are and give two examples.",
                "What is the difference between SQL and NoSQL databases?",
                "Explain how garbage collection works in modern languages.",
            ],
            "hard": [
                "Explain the CAP theorem and its implications for distributed systems.",
                "How would you design a URL shortening service like bit.ly?",
                "Explain the difference between optimistic and pessimistic locking.",
                "How does a database index work and what are its tradeoffs?",
                "Explain event-driven architecture and when you would use it.",
            ],
        },
    },

    "Data Science": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your interest in data.",
                "Why did you choose Data Science as your career?",
                "Describe a data project you worked on recently.",
                "What tools and languages do you use for data analysis?",
                "Tell me about a time you presented data findings to others.",
            ],
            "medium": [
                "Describe a time you had to clean a very messy dataset.",
                "Tell me about a time your analysis led to an unexpected insight.",
                "Describe a situation where you had to work with incomplete data.",
                "Tell me about a time you had to explain statistical results to a non-technical audience.",
                "Describe a time you used data to solve a real business problem.",
            ],
            "hard": [
                "Describe a time you built an end-to-end data pipeline from scratch.",
                "Tell me about a time you had to choose between multiple conflicting data sources.",
                "Describe a situation where your data model had serious ethical implications.",
                "Tell me about a time you had to optimize a data processing pipeline for scale.",
                "Describe a time you disagreed with stakeholders about data interpretation.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between mean, median, and mode?",
                "Explain what a p-value is in simple terms.",
                "What is the difference between correlation and causation?",
                "What is pandas and what is it used for?",
                "Explain what data normalization is and why it matters.",
            ],
            "medium": [
                "Explain the bias-variance tradeoff in machine learning.",
                "What is PCA and when would you use it?",
                "Explain the difference between OLAP and OLTP systems.",
                "What is A/B testing and how do you design one?",
                "Explain what feature engineering is and give two examples.",
            ],
            "hard": [
                "Explain how you would detect and handle multicollinearity in regression.",
                "How would you build a real-time recommendation system?",
                "Explain the difference between frequentist and Bayesian statistics.",
                "How would you handle concept drift in a deployed ML model?",
                "Explain how you would design a data warehouse from scratch.",
            ],
        },
    },

    "Cybersecurity": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your interest in cybersecurity.",
                "Why did you choose cybersecurity as your field?",
                "Describe a time you identified a security risk.",
                "What certifications or courses have you completed in security?",
                "Tell me about a time you had to follow strict security protocols.",
            ],
            "medium": [
                "Describe a time you responded to a security incident.",
                "Tell me about a time you had to educate others about cybersecurity best practices.",
                "Describe a situation where you found a vulnerability in a system.",
                "Tell me about a time you had to balance security with usability.",
                "Describe a time you worked under pressure during a security breach.",
            ],
            "hard": [
                "Describe a time you conducted a full penetration test and what you found.",
                "Tell me about a time you had to design a zero-trust security architecture.",
                "Describe a situation where you had to respond to an advanced persistent threat.",
                "Tell me about a time you handled a ransomware attack.",
                "Describe a time you had to secure a legacy system with no documentation.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between encryption and hashing?",
                "Explain what a firewall is and how it works.",
                "What is the difference between authentication and authorization?",
                "Explain what SQL injection is.",
                "What is a VPN and how does it work?",
            ],
            "medium": [
                "Explain how public key infrastructure works.",
                "What is the difference between IDS and IPS systems?",
                "Explain the OWASP Top 10 vulnerabilities.",
                "What is cross-site scripting and how do you prevent it?",
                "Explain how TLS handshake works.",
            ],
            "hard": [
                "Explain how a buffer overflow attack works and how to prevent it.",
                "How would you design a security incident response plan?",
                "Explain the difference between symmetric and asymmetric encryption in depth.",
                "How does a man-in-the-middle attack work and how do you detect it?",
                "Explain how OAuth 2.0 works and its security implications.",
            ],
        },
    },

    "Cloud Computing": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your experience with cloud platforms.",
                "Why are you interested in cloud computing?",
                "Describe a project you deployed on a cloud platform.",
                "What cloud platforms have you worked with?",
                "Tell me about a time you had to troubleshoot a cloud service.",
            ],
            "medium": [
                "Describe a time you migrated an application to the cloud.",
                "Tell me about a time you optimized cloud costs for a project.",
                "Describe a situation where a cloud service went down and how you handled it.",
                "Tell me about a time you set up cloud infrastructure from scratch.",
                "Describe a time you had to choose between different cloud providers.",
            ],
            "hard": [
                "Describe a time you designed a highly available cloud architecture.",
                "Tell me about a time you secured a cloud environment from a breach.",
                "Describe a situation where you had to scale infrastructure under sudden load.",
                "Tell me about a time you implemented a disaster recovery plan in the cloud.",
                "Describe a time you optimized a multi-region cloud deployment.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between IaaS, PaaS, and SaaS?",
                "Explain what a virtual machine is.",
                "What is the difference between public, private, and hybrid cloud?",
                "Explain what auto-scaling is in cloud computing.",
                "What is a CDN and why is it used?",
            ],
            "medium": [
                "Explain the difference between containers and virtual machines.",
                "What is Kubernetes and what problem does it solve?",
                "Explain how AWS Lambda works and when to use it.",
                "What is the difference between horizontal and vertical scaling?",
                "Explain what a load balancer is and how it works.",
            ],
            "hard": [
                "Explain how you would design a fault-tolerant cloud architecture.",
                "How does Kubernetes handle pod scheduling and resource allocation?",
                "Explain the differences between AWS, Azure, and GCP for enterprise use.",
                "How would you implement a multi-cloud strategy?",
                "Explain how service mesh works in a microservices architecture.",
            ],
        },
    },

    "Web Development": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your web development experience.",
                "Why did you choose web development?",
                "Describe a website or web app you built.",
                "What frontend and backend technologies do you use?",
                "Tell me about a UI bug you fixed.",
            ],
            "medium": [
                "Describe a time you improved the performance of a web application.",
                "Tell me about a time you had to work with a difficult API.",
                "Describe a situation where you had to make a responsive design from scratch.",
                "Tell me about a time you handled a cross-browser compatibility issue.",
                "Describe a time you collaborated with a designer to build a UI.",
            ],
            "hard": [
                "Describe a time you architected a full-stack application from scratch.",
                "Tell me about a time you handled a major security issue in a web app.",
                "Describe a situation where you optimized a slow database query in production.",
                "Tell me about a time you built a real-time feature like chat or notifications.",
                "Describe a time you scaled a web application to handle high traffic.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between HTML, CSS, and JavaScript?",
                "Explain what the DOM is.",
                "What is the difference between GET and POST requests?",
                "Explain what responsive design is.",
                "What is a REST API?",
            ],
            "medium": [
                "Explain how React's virtual DOM works.",
                "What is the difference between session and JWT authentication?",
                "Explain what CORS is and how to handle it.",
                "What is the difference between SSR and CSR?",
                "Explain how WebSockets work.",
            ],
            "hard": [
                "Explain how you would optimize a React app for performance.",
                "How would you implement authentication with OAuth in a web app?",
                "Explain the difference between microservices and monolithic architecture for web apps.",
                "How would you design a real-time collaborative editing feature?",
                "Explain how you would implement caching in a web application.",
            ],
        },
    },

    "Electrical Engineering": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your electrical engineering background.",
                "Why did you choose electrical engineering?",
                "Describe a circuit design project you worked on.",
                "What tools and software do you use for circuit simulation?",
                "Tell me about a lab experiment that taught you something important.",
            ],
            "medium": [
                "Describe a time you debugged a complex electrical circuit.",
                "Tell me about a time you had to design a system under power constraints.",
                "Describe a situation where your circuit design did not work as expected.",
                "Tell me about a time you worked on an embedded systems project.",
                "Describe a time you improved the efficiency of an electrical system.",
            ],
            "hard": [
                "Describe a time you designed a power management system from scratch.",
                "Tell me about a time you had to troubleshoot an EMI problem in a design.",
                "Describe a situation where you had to optimize signal integrity in a PCB.",
                "Tell me about a time you worked on a high-voltage system safely.",
                "Describe a time you integrated hardware and software in a complex system.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between AC and DC current?",
                "Explain Ohm's law and its applications.",
                "What is a capacitor and how does it work?",
                "Explain the difference between a series and parallel circuit.",
                "What is a transistor and what is it used for?",
            ],
            "medium": [
                "Explain how a PID controller works.",
                "What is the difference between analog and digital signals?",
                "Explain how a transformer works.",
                "What is Fourier transform and why is it used in signal processing?",
                "Explain the difference between BJT and MOSFET transistors.",
            ],
            "hard": [
                "Explain how a phase-locked loop works.",
                "How would you design a low-noise amplifier for RF applications?",
                "Explain the concept of impedance matching and why it matters.",
                "How does a switching power supply work?",
                "Explain how you would design a motor control system.",
            ],
        },
    },

    "Mechanical Engineering": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your mechanical engineering background.",
                "Why did you choose mechanical engineering?",
                "Describe a design project you worked on.",
                "What CAD software have you used?",
                "Tell me about a time you solved a mechanical problem.",
            ],
            "medium": [
                "Describe a time you had to redesign a component due to failure.",
                "Tell me about a time you worked on a manufacturing process improvement.",
                "Describe a situation where you had to work within tight material constraints.",
                "Tell me about a time you conducted a stress analysis on a component.",
                "Describe a time you collaborated with electrical engineers on a mechatronics project.",
            ],
            "hard": [
                "Describe a time you led the full design cycle of a mechanical system.",
                "Tell me about a time you had to optimize a design for both weight and strength.",
                "Describe a situation where your design failed testing and how you fixed it.",
                "Tell me about a time you applied FEA to solve a real engineering problem.",
                "Describe a time you designed a system for extreme environmental conditions.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between stress and strain?",
                "Explain Newton's three laws of motion.",
                "What is the difference between static and dynamic loading?",
                "Explain what thermodynamics is and its laws.",
                "What is the difference between tensile and compressive stress?",
            ],
            "medium": [
                "Explain how finite element analysis works.",
                "What is the difference between laminar and turbulent flow?",
                "Explain how a heat exchanger works.",
                "What is fatigue failure and how do you design against it?",
                "Explain the difference between ductile and brittle materials.",
            ],
            "hard": [
                "Explain how you would perform a complete failure mode analysis.",
                "How would you design a lightweight structure for aerospace applications?",
                "Explain the concept of buckling and how to prevent it.",
                "How does computational fluid dynamics work?",
                "Explain how you would optimize a design using topology optimization.",
            ],
        },
    },

    "Civil Engineering": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your civil engineering background.",
                "Why did you choose civil engineering?",
                "Describe a construction project you studied or worked on.",
                "What software tools do you use for structural analysis?",
                "Tell me about a time you identified a safety concern on a project.",
            ],
            "medium": [
                "Describe a time you had to redesign a structure due to site constraints.",
                "Tell me about a time you managed multiple project stakeholders.",
                "Describe a situation where you had to work within a very tight budget.",
                "Tell me about a time you used data to make a design decision.",
                "Describe a time you had to ensure compliance with building codes.",
            ],
            "hard": [
                "Describe a time you led the structural design of a large project.",
                "Tell me about a time you solved a foundation problem on a difficult site.",
                "Describe a situation where environmental concerns changed your design.",
                "Tell me about a time you managed a construction delay effectively.",
                "Describe a time you applied sustainability principles to a civil project.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between dead load and live load?",
                "Explain what soil bearing capacity is.",
                "What is the difference between a beam and a column?",
                "Explain what concrete compressive strength means.",
                "What is the purpose of reinforcement in concrete?",
            ],
            "medium": [
                "Explain how a retaining wall works.",
                "What is the difference between shallow and deep foundations?",
                "Explain how prestressed concrete works.",
                "What is the difference between rigid and flexible pavements?",
                "Explain how water table affects foundation design.",
            ],
            "hard": [
                "Explain how you would design a bridge for seismic loads.",
                "How would you analyze a statically indeterminate structure?",
                "Explain the concept of soil liquefaction and how to mitigate it.",
                "How would you design a stormwater management system?",
                "Explain how you would perform a life cycle cost analysis for infrastructure.",
            ],
        },
    },

    "Business Analysis": {
        "behavioral": {
            "easy": [
                "Tell me about yourself and your business analysis experience.",
                "Why did you choose business analysis as your career?",
                "Describe a time you gathered requirements from stakeholders.",
                "What tools do you use for business analysis?",
                "Tell me about a time you documented a business process.",
            ],
            "medium": [
                "Describe a time you had to manage conflicting stakeholder requirements.",
                "Tell me about a time your analysis led to a significant business improvement.",
                "Describe a situation where a project requirement changed midway.",
                "Tell me about a time you had to prioritize features under budget constraints.",
                "Describe a time you facilitated a workshop to gather business requirements.",
            ],
            "hard": [
                "Describe a time you led a full business process reengineering initiative.",
                "Tell me about a time you identified a major inefficiency and quantified its impact.",
                "Describe a situation where you had to align IT solutions with business strategy.",
                "Tell me about a time you managed resistance to change in an organization.",
                "Describe a time you delivered a complex analysis under extreme time pressure.",
            ],
        },
        "technical": {
            "easy": [
                "What is the difference between functional and non-functional requirements?",
                "Explain what a use case diagram is.",
                "What is the difference between a business process and a workflow?",
                "Explain what SWOT analysis is.",
                "What is a stakeholder and why are they important?",
            ],
            "medium": [
                "Explain what gap analysis is and how you perform it.",
                "What is the difference between agile and waterfall methodologies?",
                "Explain what a business requirements document contains.",
                "What is a data flow diagram and how is it used?",
                "Explain what KPIs are and how you define them.",
            ],
            "hard": [
                "Explain how you would conduct a cost-benefit analysis for a large IT project.",
                "How would you design a requirements traceability matrix?",
                "Explain how you would model a complex business process using BPMN.",
                "How would you prioritize a product backlog with 200 items?",
                "Explain how you would measure the ROI of a business analysis initiative.",
            ],
        },
    },
}

SUPPORTED_FIELDS = list(QUESTION_BANK.keys())


def generate_with_groq(field, difficulty, category):
    prompt = f"""Generate 5 unique {difficulty} difficulty {category} interview questions 
for a {field} position.

Rules:
- Return ONLY a JSON array of 5 strings
- No numbering, no explanations
- Just the questions as a JSON array
- Make them specific to {field}
- Difficulty: {difficulty}

Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=500,
    )
    content = response.choices[0].message.content.strip()
    start = content.find("[")
    end = content.rfind("]") + 1
    return json.loads(content[start:end])


@router.get("/questions/fields")
def get_fields():
    return {"fields": SUPPORTED_FIELDS}


@router.get("/questions/{field}/{category}/{difficulty}")
def get_questions(field: str, category: str, difficulty: str):
    if difficulty == "advanced":
        try:
            questions = generate_with_groq(field, difficulty, category)
            return {"field": field, "category": category, "difficulty": difficulty,
                    "source": "groq", "questions": questions}
        except Exception as e:
            return {"error": str(e)}

    if field not in QUESTION_BANK:
        try:
            questions = generate_with_groq(field, difficulty, category)
            return {"field": field, "category": category, "difficulty": difficulty,
                    "source": "groq", "questions": questions}
        except Exception as e:
            return {"error": str(e)}

    questions = QUESTION_BANK[field][category][difficulty]
    return {"field": field, "category": category, "difficulty": difficulty,
            "source": "static", "questions": questions}


@router.post("/questions/generate")
def generate_questions(field: str, difficulty: str, category: str = "behavioral"):
    try:
        questions = generate_with_groq(field, difficulty, category)
        return {"field": field, "difficulty": difficulty,
                "category": category, "questions": questions}
    except Exception as e:
        return {"error": str(e), "questions": []}
    

@router.post("/tips/generate")
def generate_tips(summary: dict = Body(...)):
    prompt = f"""You are an expert interview coach. Analyze this candidate's interview performance data and give personalized improvement tips.

Performance Summary:
- Total attempts: {summary.get('total_attempts')}
- Average score: {summary.get('avg_score')}/100
- Average structure score: {summary.get('avg_structure')}/100
- Average content score: {summary.get('avg_content')}/100
- Average confidence score: {summary.get('avg_confidence')}/100
- Average clarity score: {summary.get('avg_clarity')}/100
- Average filler words per answer: {summary.get('avg_fillers')}
- Recent scores: {summary.get('recent_scores')}
- Question types practiced: {summary.get('question_types')}
- Most common errors: {summary.get('common_feedback')}

Return ONLY a JSON object in this exact format:
{{
  "overall_assessment": "2-3 sentence honest assessment of their current level and biggest opportunity",
  "weak_areas": [
    {{"area": "area name", "explanation": "specific explanation of the problem"}}
  ],
  "action_tips": [
    "specific actionable tip 1",
    "specific actionable tip 2",
    "specific actionable tip 3",
    "specific actionable tip 4",
    "specific actionable tip 5"
  ],
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "practice_recommendation": "specific recommendation on what to practice next based on their weak areas"
}}

Be honest, specific, and actionable. Reference their actual scores."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1000,
        )
        content = response.choices[0].message.content.strip()
        start = content.find("{")
        end = content.rfind("}") + 1
        return json.loads(content[start:end])
    except Exception as e:
        return {"error": str(e)}