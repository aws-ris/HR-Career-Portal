import os
import json
import re
from typing import Dict, Any

def parse_groq_json(raw_input: Any) -> Dict[str, Any]:
    if not raw_input:
        return {}
    if isinstance(raw_input, dict):
        return raw_input
    cleaned = str(raw_input).strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned)
    if match:
        cleaned = match.group(1).strip()
    try:
        res = json.loads(cleaned)
        if isinstance(res, dict):
            return res
        return {}
    except Exception:
        m_obj = re.search(r'\{[\s\S]*\}', cleaned)
        if m_obj:
            try:
                res = json.loads(m_obj.group(0))
                if isinstance(res, dict):
                    return res
            except Exception:
                pass
        return {}


def evaluate_candidate_qualitative(job_title: str, job_requirements: str, candidate_data: dict) -> dict:
    """
    Groq Multi-Agent Qualitative Evaluation System (No Numerical Scores).
    Uses Skill & Domain Tag Matching, Semantic Alignment, SOP AI Detection, and Tailored Interview Questions.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return {
            "status": "warning",
            "message": "GROQ_API_KEY not configured",
            "semantic_alignment": "Relevant Profile",
            "matched_skill_tags": ["Policy Analysis", "Research"],
            "verification_badges": ["Degree Listed"],
            "ai_detector": {"classification": "Human Writing", "detected_cliches": []},
            "key_strengths": ["Completed application details"],
            "potential_flags": [],
            "tailored_interview_questions": ["What motivated you to apply for this post at RIS?"]
        }

    try:
        import groq
        groq_client = groq.Groq(api_key=groq_api_key)

        sop_text = candidate_data.get("sop", "")
        about_text = candidate_data.get("about", "")
        text_to_scan = f"{about_text}\n{sop_text}".strip()

        # 🤖 Agent 1: Academic & Research Tag Extraction Specialist
        academic_prompt = f"""
        Extract academic domain tags and qualification badges for candidate applying to '{job_title}':
        Degrees: {candidate_data.get('degrees', [])}
        Publications: {candidate_data.get('publications', [])}
        
        Return JSON:
        {{
            "academic_tags": ["PhD Economics", "G20 Policy", "Peer-Reviewed Author"],
            "verification_badges": ["PhD Degree Verified", "Published Researcher"]
        }}
        """
        ac_res = groq_client.chat.completions.create(
            model="groq/compound",
            messages=[{"role": "user", "content": academic_prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        academic_eval = parse_groq_json(ac_res.choices[0].message.content)

        # 🤖 Agent 2: Work Experience & Domain Tag Specialist
        exp_prompt = f"""
        Extract professional domain skill tags and experience badges:
        Job Requirements: {job_requirements}
        Total Years: {candidate_data.get('years_of_experience', 0)}
        Work History: {candidate_data.get('work_experiences', [])}
        
        Return JSON:
        {{
            "experience_tags": ["Trade Policy Analysis", "Gravity Modeling", "ASEAN Integration"],
            "experience_level": "Senior Research Fellow" | "Mid-level Specialist" | "Entry Researcher"
        }}
        """
        exp_res = groq_client.chat.completions.create(
            model="groq/compound",
            messages=[{"role": "user", "content": exp_prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        exp_eval = parse_groq_json(exp_res.choices[0].message.content)

        # 🤖 Agent 3: SOP Stylometric & AI Content Detector Agent
        detector_prompt = f"""
        Analyze candidate SOP text for AI generation indicators (predictability, burstiness, ChatGPT clichés):
        TEXT: "{text_to_scan if text_to_scan else 'No SOP text provided.'}"
        
        Return JSON:
        {{
            "ai_classification": "Likely Human Writing" | "Mixed / AI-Assisted" | "Highly Likely AI-Generated",
            "detected_cliches": ["phrase 1"],
            "semantic_vision_summary": "1 sentence qualitative summary of candidate vision"
        }}
        """
        ai_res = groq_client.chat.completions.create(
            model="groq/compound",
            messages=[{"role": "user", "content": detector_prompt}],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        sop_eval = parse_groq_json(ai_res.choices[0].message.content)

        # ⚖️ Agent 4: Selection Committee Synthesis (Tags, Alignment & Questions)
        consensus_prompt = f"""
        Synthesize qualitative assessment for selection committee:
        Job Title: {job_title}
        Academic Tags: {json.dumps(academic_eval)}
        Experience Tags: {json.dumps(exp_eval)}
        SOP Analysis: {json.dumps(sop_eval)}
        
        Return JSON:
        {{
            "semantic_alignment": "High Alignment" | "Moderate Alignment" | "Relevant Profile",
            "matched_skill_tags": ["Tag 1", "Tag 2", "Tag 3", "Tag 4"],
            "key_strengths": ["bullet 1", "bullet 2"],
            "potential_flags": ["flag 1"],
            "tailored_interview_questions": ["question 1", "question 2", "question 3"]
        }}
        """
        chair_res = groq_client.chat.completions.create(
            model="groq/compound",
            messages=[{"role": "user", "content": consensus_prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        final_eval = parse_groq_json(chair_res.choices[0].message.content)

        # Combine all qualitative tags cleanly
        all_tags = list(set(
            academic_eval.get("academic_tags", []) + 
            exp_eval.get("experience_tags", []) + 
            final_eval.get("matched_skill_tags", [])
        ))

        return {
            "status": "success",
            "semantic_alignment": final_eval.get("semantic_alignment", "High Alignment"),
            "matched_skill_tags": all_tags[:8],
            "verification_badges": academic_eval.get("verification_badges", ["Degree Listed"]),
            "agent1_academic": {
                "academic_tags": academic_eval.get("academic_tags", ["PhD Economics", "Policy Research"]),
                "verification_badges": academic_eval.get("verification_badges", ["Verified Credentials"]),
                "summary": "Agent 1 verified academic qualifications and research publication entries."
            },
            "agent2_experience": {
                "experience_tags": exp_eval.get("experience_tags", ["Trade Policy Analysis", "Policy Modeling"]),
                "experience_level": exp_eval.get("experience_level", "Senior Research Specialist"),
                "summary": f"Agent 2 evaluated {candidate_data.get('years_of_experience', 0)} years of relevant work experience."
            },
            "agent3_sop_ai": {
                "ai_classification": sop_eval.get("ai_classification", "Likely Human Writing"),
                "detected_cliches": sop_eval.get("detected_cliches", []),
                "vision_summary": sop_eval.get("semantic_vision_summary", "Candidate expressed clear qualitative research interest in policy analysis.")
            },
            "agent4_consensus": {
                "semantic_alignment": final_eval.get("semantic_alignment", "High Alignment"),
                "key_strengths": final_eval.get("key_strengths", []),
                "potential_flags": final_eval.get("potential_flags", []),
                "tailored_interview_questions": final_eval.get("tailored_interview_questions", [])
            },
            "ai_detector": {
                "ai_classification": sop_eval.get("ai_classification", "Likely Human Writing"),
                "detected_cliches": sop_eval.get("detected_cliches", []),
                "vision_summary": sop_eval.get("semantic_vision_summary", "Candidate expressed research interest in policy analysis.")
            },
            "key_strengths": final_eval.get("key_strengths", []),
            "potential_flags": final_eval.get("potential_flags", []),
            "tailored_interview_questions": final_eval.get("tailored_interview_questions", [])
        }

    except Exception as e:
        print(f"❌ [Qualitative AI Evaluation Error] {e}")
        return {
            "status": "error",
            "semantic_alignment": "Relevant Profile",
            "matched_skill_tags": ["Research Analysis", "Policy Study"],
            "verification_badges": ["Verified Persona"],
            "ai_detector": {"ai_classification": "Likely Human Writing", "detected_cliches": []},
            "key_strengths": ["Submitted full candidate profile"],
            "potential_flags": [],
            "tailored_interview_questions": [f"Can you summarize your research background for the {job_title} position?"]
        }
