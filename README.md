# MedInsight AI

MedInsight AI is an AI-powered medical report analyzer that simplifies complex lab and imaging reports into actionable insights and recommendations. It uses LangGraph and Gemini AI to provide a compassionate and clear understanding of health data.

## Features

- **AI-Powered Extraction**: Automatically extracts key information from PDF or image-based medical reports.
- **Multilingual Support**: Get results in **English**, **Hindi**, or **Marathi**.
- **Simplified Summaries**: Translates medical jargon into plain, patient-friendly language.
- **Actionable Insights**: Provides personalized health recommendations and follow-up questions for your doctor.
- **Trusted Resources**: Links to reputable health organizations (Mayo Clinic, NIH, etc.) for further learning.
- **Secure & Private**: Processes data securely using state-of-the-art AI.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion
- **AI Orchestration**: LangChain, LangGraph
- **LLM**: Gemini 3 Flash (via @google/genai)
- **Icons**: Lucide React
- **Formatting**: React Markdown

## Application Screens

### 1. Upload Screen
The entry point where users can select their preferred language and upload their medical reports (PDF, PNG, JPG).

![Upload Screen](/public/image-1.png)

### 2. Processing Screen
A real-time feedback screen that keeps users informed while the AI extracts data, translates terminology, and generates recommendations.

![Processing Screen](/public/image-2.png)

### 3. Result Screen
A comprehensive dashboard featuring:
- **Report Summary**: A structured, easy-to-read breakdown of the findings.
- **Personalized Insights**: Encouraging insights and specific health recommendations.
- **Doctor's Visit Prep**: A curated list of questions to ask during the next consultation.
- **Trusted Resources**: Direct links to authoritative medical information.

![Result Screen 1](/public/image-3.png)
![Result Screen 2](/public/image-4.png)

## Disclaimer

This application is for informational purposes only. It is not a medical diagnosis or professional medical advice. Always consult with a qualified healthcare provider regarding any medical condition or test results.
