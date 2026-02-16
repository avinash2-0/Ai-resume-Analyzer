import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const resultRef = useRef(null);   // 👈 reference to result section

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file || !jobDesc) {
      alert("Please upload resume and enter job description");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDesc);

    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      // 👇 Auto scroll after result is set
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);

    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">🚀 AI Resume Analyzer</h1>
        <p className="subtitle">
          AI-powered resume analysis for smarter job applications
        </p>

        {/* Upload */}
        <label className="upload-btn">
          Upload Resume
          <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
        </label>

        {file && <p className="file-name">{file.name}</p>}

        {/* Job Description */}
        <textarea
          placeholder="Paste Job Description Here..."
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
        />

        {/* Analyze */}
        <button className="analyze-btn" onClick={handleAnalyze}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {/* RESULT SECTION */}
        {result && (
          <div className="result-box" ref={resultRef}>
            <h2 className="result-title">Final Match Result</h2>

            <div className="match-score">
              {Math.round(result.final_score)}%
            </div>

            <p>Semantic Match: {Math.round(result.semantic_score)}%</p>
            <p>Skill Match: {result.skill_score}%</p>

            <div className="section-title">Matched Skills</div>
            <ul className="skill-list">
              {result.matched?.length > 0 ? (
                result.matched.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))
              ) : (
                <li>No matched skills</li>
              )}
            </ul>

            <div className="section-title">Missing Skills</div>
            <ul className="skill-list">
              {result.missing?.length > 0 ? (
                result.missing.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))
              ) : (
                <li>No missing skills</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

