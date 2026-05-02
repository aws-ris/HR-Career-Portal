import sys

with open(r'c:\Users\Viraal\Desktop\HRForm\frontend\src\components\hr\FilterCenter.jsx', 'r') as f:
    content = f.read()

# Add Brain icon
icon_target = "import { Filter, User, GraduationCap, Briefcase, BookOpen } from 'lucide-react';"
icon_replace = "import { Filter, User, GraduationCap, Briefcase, BookOpen, Brain } from 'lucide-react';"
content = content.replace(icon_target, icon_replace, 1)

# Add category
cat_target = """  const categories = [
    { id: 'bio', label: 'Biographical', icon: User, color: '#f59e0b' },"""
cat_replace = """  const categories = [
    { id: 'ai_match', label: 'AI Semantic Match', icon: Brain, color: '#8b5cf6' },
    { id: 'bio', label: 'Biographical', icon: User, color: '#f59e0b' },"""
content = content.replace(cat_target, cat_replace, 1)

# Reset keys
reset_target = "const reset = { states: [], genders: [], ug_uni: '', min_ug_score: null, pg_uni: '', pg_min_score: null, phd_uni: '', phd_thesis: '', phd_min_score: null, min_experience_years: 0, min_papers: 0, min_books: 0, min_chapters: 0, min_age: 18, max_age: 65, min_x_score: null, min_xii_score: null, role_keyword: '', company_keyword: '', publication_keyword: '' };"
reset_replace = "const reset = { states: [], genders: [], ug_uni: '', min_ug_score: null, pg_uni: '', pg_min_score: null, phd_uni: '', phd_thesis: '', phd_min_score: null, min_experience_years: 0, min_papers: 0, min_books: 0, min_chapters: 0, min_age: 18, max_age: 65, min_x_score: null, min_xii_score: null, role_keyword: '', company_keyword: '', publication_keyword: '', semantic_query: '', ai_match_threshold: 0.0 };"
content = content.replace(reset_target, reset_replace, 1)

# Active count logic
count_target = """    if (id === 'scholarly') return (filters.publication_keyword ? 1 : 0) + (filters.min_papers > 0 ? 1 : 0) + (filters.min_books > 0 ? 1 : 0) + (filters.min_chapters > 0 ? 1 : 0);"""
count_replace = """    if (id === 'scholarly') return (filters.publication_keyword ? 1 : 0) + (filters.min_papers > 0 ? 1 : 0) + (filters.min_books > 0 ? 1 : 0) + (filters.min_chapters > 0 ? 1 : 0);
    if (id === 'ai_match') return filters.semantic_query ? 1 : 0;"""
content = content.replace(count_target, count_replace, 1)

# Float fields updateFilter
float_target = "['min_ug_score', 'min_experience_years', 'min_age', 'max_age', 'min_x_score', 'min_xii_score', 'pg_min_score', 'phd_min_score']"
float_replace = "['min_ug_score', 'min_experience_years', 'min_age', 'max_age', 'min_x_score', 'min_xii_score', 'pg_min_score', 'phd_min_score', 'ai_match_threshold']"
content = content.replace(float_target, float_replace, 1)

# Add UI for ai_match
ui_target = """        }}>
          {activeCategory === 'bio' && ("""
ui_replace = """        }}>
          {activeCategory === 'ai_match' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Semantic Profile Match (AI)</label>
                  <input type="text" placeholder="Type any skills or domain e.g. 'Supply Chain Logistics'..." value={filters.semantic_query} onChange={(e) => updateFilter('semantic_query', e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                </div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase' }}>Min Match Confidence: {filters.ai_match_threshold}%</label>
                <input type="range" min="0" max="100" value={filters.ai_match_threshold} onChange={(e) => updateFilter('ai_match_threshold', e.target.value)} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                <div style={{fontSize: '10px', color: '#94a3b8', marginTop: '10px'}}>Slide to filter out resumes with low semantic similarity to your query.</div>
              </div>
            </div>
          )}
          {activeCategory === 'bio' && ("""
content = content.replace(ui_target, ui_replace, 1)

with open(r'c:\Users\Viraal\Desktop\HRForm\frontend\src\components\hr\FilterCenter.jsx', 'w') as f:
    f.write(content)
print("FilterCenter.jsx patched successfully.")
