# Candidate Profile Scoring System Guide

This document explains the automatic candidate profile evaluation scoring system implemented in the RIS Hiring Portal. The system evaluates applicants out of a total of **85 marks** based on academic credentials, university tier, and relevant work experience.

The remaining **15 marks** are reserved for a manual interview component (making the final assessment out of **100 marks**).

---

## 📊 Summary of the Scoring Rubric (85 Marks Max)

| Category                | Component                    |  Max Marks  | Basis of Calculation                                                                           |
| :---------------------- | :--------------------------- | :----------: | :--------------------------------------------------------------------------------------------- |
| **1. Schooling**  | Class X                      | **5** | `Percentage × 0.05`                                                                         |
|                         | Class XII                    | **5** | `Percentage × 0.05`                                                                         |
| **2. Education**  | Essential Qualification (EQ) | **30** | `Percentage × 0.30` (on highest completed degree)                                           |
|                         | Desirable Qualification (DQ) | **10** | `Percentage × 0.10` (on secondary higher degree)                                            |
| **3. Prestige**   | University Brand Tier        | **10** | Tier-1 =**10**, Central Uni = **7**, NIRF < 50 = **3**, Others = **0** |
| **4. Experience** | Domain Work Experience       | **25** | Meeting job requirement =**15**, `+2` per additional year (max `+10`)                |
| **TOTAL**         | **Profile Score**      | **85** |                                                                                                |

---

## 🛠️ Detailed Category Breakdown & Formulas

### 1. Schooling (Max 10 Marks)

Evaluates school-level performance. If the score is entered in **CGPA**, it is converted to a percentage using the standard multiplier: `Percentage = CGPA × 9.5`.

* **Class X Score (Max 5 Marks)**
  * **Formula**: `Class X Percentage × 0.05`
  * *Example*: 90% in Class X = `90 × 0.05` = **4.5 Marks**.
  * *Example (CGPA)*: CGPA 9.2 = `(9.2 × 9.5) × 0.05` = `87.4% × 0.05` = **4.37 Marks**.
* **Class XII Score (Max 5 Marks)**
  * **Formula**: `Class XII Percentage × 0.05`
  * *Example*: 80% in Class XII = `80 × 0.05` = **4.0 Marks**.

---

### 2. Higher Education Degrees (Max 40 Marks)

Determined by parsing the candidate's higher education history. If scores are entered in **CGPA**, they are converted to a percentage using: `Percentage = CGPA × 10`.

* **Essential Qualification (EQ) Score (Max 30 Marks)**
  * Evaluates the candidate's **highest completed degree** (Postgraduate if present, otherwise Undergraduate).
  * **Formula**: `EQ Degree Percentage × 0.30`
  * *Example*: 80% in a Master’s degree = `80 × 0.3` = **24.0 Marks**.
* **Desirable Qualification (DQ) Score (Max 10 Marks)**
  * Evaluates the secondary degree if the candidate has more than one:
    * If the highest degree is Postgraduate: Undergraduate degree acts as the DQ.
    * If they have a Ph.D.: Ph.D. acts as the DQ, and Postgraduate acts as the EQ.
    * If they only have one degree (e.g., Undergraduate only): DQ score defaults to **0.0 Marks**.
  * **Formula**: `DQ Degree Percentage × 0.10`
  * *Example*: 75% in a Bachelor's degree (acting as DQ) = `75 × 0.1` = **7.5 Marks**.

---

### 3. University Brand Score (Max 10 Marks)

Evaluated against the university of the candidate's **highest completed degree (EQ)**. Points are assigned as follows:

* **10 Marks (Tier-1)**: IIT, NIT, IIM, IISc, or other Institutes of National Importance (INI).
* **7 Marks (Central University)**: Registered central universities (e.g., JNU, Delhi University, BHU, AMU).
* **3 Marks (NIRF Top 50)**: Other public or private universities with a National Institutional Ranking Framework (NIRF) Rank under 50 (e.g., BITS Pilani, VIT, Amity, Manipal).
* **0 Marks (Other College)**: All other unranked private, state, or local colleges.

---

### 4. Domain Work Experience Score (Max 25 Marks)

Evaluated against the candidate's total years of experience compared to the job posting's minimum experience requirement (`min_experience` - defaults to 1.0 year if not specified).

* **Essential Experience (15 Marks flat)**:
  * If the candidate's total years of experience is **greater than or equal to** the job requirement, they receive **15 Marks** flat.
  * *Important*: If they have less than the requirement, they receive **0 Marks** for the entire experience category.
* **Additional Experience (Max 10 Marks)**:
  * Candidates receive **2 Marks** for each full year of experience *above* the minimum requirement.
  * **Formula**: `(Total Years - Required Years) × 2` (Capped at 5 extra years max).
  * *Example*: If a job requires 2 years of experience and the candidate has 5 years:
    * Met requirement = **15 Marks**
    * 3 extra years = `3 × 2` = **6 Marks**
    * Total Experience Score = `15 + 6` = **21.0 Marks**.

---

## 📝 Candidate Scoring Example

### Candidate Profile:

* **Applying for**: Job requiring **2 years of experience**.
* **Class X**: CGPA 9.2 (converted to 87.4%)
* **Class XII**: 85.0%
* **Bachelor's (DQ)**: 78.0%
* **Master's (EQ)**: 82.0%
* **Master's University**: University of Delhi (Central University)
* **Total Work Experience**: 4 years and 6 months (4.5 years)

### Calculation:

1. **Class X Score**: `87.4% × 0.05` = **4.37 Marks**
2. **Class XII Score**: `85.0% × 0.05` = **4.25 Marks**
3. **EQ Score (Master's)**: `82.0% × 0.30` = **24.60 Marks**
4. **DQ Score (Bachelor's)**: `78.0% × 0.10` = **7.80 Marks**
5. **University Brand Score (DU)**: Central University flat = **7.00 Marks**
6. **Work Experience Score**:
   * Has 4.5 years (Met 2-year requirement) = **15.00 Marks**
   * Has 2.5 additional years (2 full extra years) = `2 × 2` = **4.00 Marks**
   * Experience Score = `15.00 + 4.00` = **19.00 Marks**

### Final Profile Score:

$$
\text{Total Score} = 4.37 + 4.25 + 24.60 + 7.80 + 7.00 + 19.00 = \mathbf{67.02\text{ out of }85}
$$
