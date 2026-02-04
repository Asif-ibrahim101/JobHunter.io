// Jake's Resume LaTeX Template
// Source: https://github.com/jakegut/resume

export const JAKES_RESUME_TEMPLATE = `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape {{NAME}}} \\\\ \\vspace{1pt}
    \\small {{PHONE}} $|$ \\href{mailto:{{EMAIL}}}{\\underline{{{EMAIL}}}} $|$ 
    \\href{{{LINKEDIN}}}{\\underline{LinkedIn}} $|$
    \\href{{{GITHUB}}}{\\underline{GitHub}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
{{EDUCATION}}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
{{EXPERIENCE}}
  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
{{PROJECTS}}
    \\resumeSubHeadingListEnd

%-----------ACHIEVEMENTS-----------
{{ACHIEVEMENTS_SECTION}}

%-----------SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     {{SKILLS}}
    }}
 \\end{itemize}

\\end{document}
`;

export interface ResumeContent {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  achievements?: string[];
  atsScore?: number;
  analysis?: {
    matchedKeywords: string[];
    missingKeywords: string[];
  };
}

export interface ExperienceItem {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  technologies: string[];
  bullets: string[];
}

export interface EducationItem {
  school: string;
  degree: string;
  location: string;
  dates: string;
}

// Escape special LaTeX characters
function escapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Format skills as LaTeX
function formatSkills(skills: string[]): string {
  if (!skills || !skills.length) return '';
  const escaped = skills.map(s => escapeLatex(s)).join(', ');
  return '\\textbf{Languages \\& Technologies:} ' + escaped;
}

// Format experience as LaTeX
function formatExperience(experience: ExperienceItem[]): string {
  if (!experience || !experience.length) return '';

  return experience.map(exp => {
    const bullets = exp.bullets
      .map(b => '          \\resumeItem{' + escapeLatex(b) + '}')
      .join('\n');

    return `    \\resumeSubheading
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
      {${escapeLatex(exp.title)}}{${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)}}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
  }).join('\n');
}

// Format projects as LaTeX
function formatProjects(projects: ProjectItem[]): string {
  if (!projects || !projects.length) return '';

  return projects.map(proj => {
    const bullets = proj.bullets
      .map(b => '          \\resumeItem{' + escapeLatex(b) + '}')
      .join('\n');
    const techStack = proj.technologies.map(t => escapeLatex(t)).join(', ');

    return `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.name)}} $|$ \\emph{${techStack}}}{}
          \\resumeItemListStart
${bullets}
          \\resumeItemListEnd`;
  }).join('\n');
}

// Format education as LaTeX
function formatEducation(education: EducationItem[]): string {
  if (!education || !education.length) return '';

  return education.map(edu => `    \\resumeSubheading
      {${escapeLatex(edu.school)}}{${escapeLatex(edu.location)}}
      {${escapeLatex(edu.degree)}}{${escapeLatex(edu.dates)}}`).join('\n');
}

// Format achievements as LaTeX
function formatAchievements(achievements?: string[]): string {
  if (!achievements || !achievements.length) return '';

  const items = achievements
    .map(a => '    \\resumeItem{' + escapeLatex(a) + '}')
    .join('\n');

  return `\\section{Achievements}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
      \\begin{itemize}
${items}
      \\end{itemize}
    }
 \\end{itemize}`;
}

// Generate complete LaTeX from content
export function generateLatex(content: ResumeContent): string {
  let latex = JAKES_RESUME_TEMPLATE;

  // Replace placeholders
  latex = latex.replace(/\{\{NAME\}\}/g, escapeLatex(content.name));
  latex = latex.replace(/\{\{EMAIL\}\}/g, content.email);
  latex = latex.replace(/\{\{PHONE\}\}/g, escapeLatex(content.phone));
  latex = latex.replace(/\{\{LINKEDIN\}\}/g, content.linkedin);
  latex = latex.replace(/\{\{GITHUB\}\}/g, content.github);
  latex = latex.replace(/\{\{SKILLS\}\}/g, formatSkills(content.skills));
  latex = latex.replace(/\{\{EXPERIENCE\}\}/g, formatExperience(content.experience));
  latex = latex.replace(/\{\{PROJECTS\}\}/g, formatProjects(content.projects));
  latex = latex.replace(/\{\{EDUCATION\}\}/g, formatEducation(content.education));
  latex = latex.replace(/\{\{ACHIEVEMENTS_SECTION\}\}/g, formatAchievements(content.achievements));

  return latex;
}
