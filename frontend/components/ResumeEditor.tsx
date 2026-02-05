'use client';

import { useState } from 'react';
import { ResumeContent, ExperienceItem, ProjectItem } from '@/lib/resume-template';

import { ResumeAnalysisResult } from '@/types/analysis';
import AnalysisResults from './AnalysisResults';
import { Loader2, Sparkles, X } from 'lucide-react';

interface ResumeEditorProps {
    content: ResumeContent;
    onUpdate: (content: ResumeContent) => void;
    onRegenerate: () => void;
    generating: boolean;
    jobDescription?: string;
    userId: string;
    jobTitle?: string;
    companyName?: string;
}

export default function ResumeEditor({
    content,
    onUpdate,
    onRegenerate,
    generating,
    jobDescription,
    userId,
    jobTitle,
    companyName
}: ResumeEditorProps) {
    const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'projects' | 'achievements'>('skills');
    const [showAddExperience, setShowAddExperience] = useState(false);
    const [showAddProject, setShowAddProject] = useState(false);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Track which item is currently generating points
    const [generatingPoints, setGeneratingPoints] = useState<{ type: 'experience' | 'project', index: number } | null>(null);

    const serializeResumeContent = (content: ResumeContent): string => {
        return `
Name: ${content.name}
Email: ${content.email}
Phone: ${content.phone}
LinkedIn: ${content.linkedin}
GitHub: ${content.github}

Skills:
${content.skills.join(', ')}

Experience:
${content.experience.map(exp => `
Title: ${exp.title}
Company: ${exp.company}
Location: ${exp.location}
Dates: ${exp.startDate} - ${exp.endDate}
Bullets:
${exp.bullets.map(b => `- ${b}`).join('\n')}
`).join('\n')}

Projects:
${content.projects.map(proj => `
Name: ${proj.name}
Technologies: ${proj.technologies.join(', ')}
Bullets:
${proj.bullets.map(b => `- ${b}`).join('\n')}
`).join('\n')}

Achievements:
${(content.achievements || []).map(a => `- ${a}`).join('\n')}
        `.trim();
    };

    const handleAnalyze = async () => {
        if (!jobDescription) return;

        setIsAnalyzing(true);
        try {
            const resumeText = serializeResumeContent(content);

            const response = await fetch('/api/resume/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    resumeText,
                    jobDescription,
                    jobTitle,
                    companyName,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setAnalysisResult(data.analysis);
                setShowAnalysis(true);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            // Optionally set an error state here
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAddKeyword = (keyword: string) => {
        // Add to skills if not present
        if (!content.skills.includes(keyword)) {
            const newSkills = [...content.skills, keyword];

            // Optimistically update analysis results
            let newAnalysis = analysisResult;
            if (analysisResult) {
                newAnalysis = {
                    ...analysisResult,
                    missing_keywords: analysisResult.missing_keywords.filter(k => k !== keyword)
                };
                setAnalysisResult(newAnalysis);
            }

            onUpdate({
                ...content,
                skills: newSkills
            });
        }
    };

    // AI Point Generation Handler
    const handleGeneratePoints = async (type: 'experience' | 'project', index: number) => {
        setGeneratingPoints({ type, index });
        try {
            const context = type === 'experience'
                ? content.experience[index]
                : content.projects[index];

            const currentPoints = type === 'experience'
                ? content.experience[index].bullets
                : content.projects[index].bullets;

            const response = await fetch('/api/resume/generate-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    context,
                    currentPoints,
                    jobDescription
                }),
            });

            if (!response.ok) throw new Error('Failed to generate points');

            const data = await response.json();

            if (data.points && Array.isArray(data.points)) {
                if (type === 'experience') {
                    const newExp = [...content.experience];
                    newExp[index].bullets = [...newExp[index].bullets, ...data.points];
                    onUpdate({ ...content, experience: newExp });
                } else {
                    const newProj = [...content.projects];
                    newProj[index].bullets = [...newProj[index].bullets, ...data.points];
                    onUpdate({ ...content, projects: newProj });
                }
            }
        } catch (error) {
            console.error('Error generating points:', error);
            alert('Failed to generate points. Please try again.');
        } finally {
            setGeneratingPoints(null);
        }
    };

    // Skills handlers
    const updateSkill = (index: number, value: string) => {
        const newSkills = [...content.skills];
        newSkills[index] = value;
        onUpdate({ ...content, skills: newSkills });
    };

    const addSkill = () => {
        onUpdate({ ...content, skills: [...content.skills, ''] });
    };

    const removeSkill = (index: number) => {
        const newSkills = content.skills.filter((_, i) => i !== index);
        onUpdate({ ...content, skills: newSkills });
    };

    // Experience handlers
    const updateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
        const newExperience = [...content.experience];
        newExperience[expIndex] = {
            ...newExperience[expIndex],
            bullets: newExperience[expIndex].bullets.map((b, i) => i === bulletIndex ? value : b),
        };
        onUpdate({ ...content, experience: newExperience });
    };

    const addExperience = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newExp: ExperienceItem = {
            company: formData.get('company') as string,
            title: formData.get('title') as string,
            location: formData.get('location') as string,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            bullets: ['Key achievement or responsibility'],
        };
        onUpdate({ ...content, experience: [newExp, ...content.experience] });
        setShowAddExperience(false);
    };

    const removeExperience = (index: number) => {
        const newExperience = content.experience.filter((_, i) => i !== index);
        onUpdate({ ...content, experience: newExperience });
    };

    // Project handlers
    const updateProjectBullet = (projIndex: number, bulletIndex: number, value: string) => {
        const newProjects = [...content.projects];
        newProjects[projIndex] = {
            ...newProjects[projIndex],
            bullets: newProjects[projIndex].bullets.map((b, i) => i === bulletIndex ? value : b),
        };
        onUpdate({ ...content, projects: newProjects });
    };

    const addProject = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newProj: ProjectItem = {
            name: formData.get('name') as string,
            technologies: (formData.get('technologies') as string).split(',').map(t => t.trim()),
            bullets: ['Project description or achievement'],
        };
        onUpdate({ ...content, projects: [newProj, ...content.projects] });
        setShowAddProject(false);
    };

    const removeProject = (index: number) => {
        const newProjects = content.projects.filter((_, i) => i !== index);
        onUpdate({ ...content, projects: newProjects });
    };

    // Achievements handlers
    const updateAchievement = (index: number, value: string) => {
        const newAchievements = [...(content.achievements || [])];
        newAchievements[index] = value;
        onUpdate({ ...content, achievements: newAchievements });
    };

    const addAchievement = () => {
        const newAchievements = [...(content.achievements || []), 'New achievement'];
        onUpdate({ ...content, achievements: newAchievements });
    };

    const removeAchievement = (index: number) => {
        const newAchievements = (content.achievements || []).filter((_, i) => i !== index);
        onUpdate({ ...content, achievements: newAchievements });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header with ATS Score */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Resume Editor</h3>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !jobDescription}
                            className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors min-h-[44px] px-4 rounded-lg font-medium"
                        >
                            {isAnalyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}</span>
                        </button>
                        <button
                            onClick={onRegenerate}
                            disabled={generating}
                            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors min-h-[44px] px-4 rounded-lg font-medium"
                        >
                            <svg className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Regenerate</span>
                        </button>
                    </div>
                </div>

                {/* Analysis Result Modal/Overlay */}
                {showAnalysis && analysisResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Analysis Results</h3>
                                <button
                                    onClick={() => setShowAnalysis(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                                <AnalysisResults
                                    analysis={analysisResult}
                                    onAddKeyword={handleAddKeyword}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-1">
                    {(['skills', 'experience', 'projects', 'achievements'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${activeTab === tab
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                            <span className="sm:hidden">{tab.slice(0, 3).charAt(0).toUpperCase() + tab.slice(1, 3)}</span>
                            {' '}({
                                tab === 'skills' ? content.skills.length :
                                    tab === 'experience' ? content.experience.length :
                                        tab === 'projects' ? content.projects.length :
                                            (content.achievements?.length || 0)
                            })
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Skills Tab */}
                {activeTab === 'skills' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {content.skills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 rounded-full px-3 py-1.5 border border-blue-200 dark:border-blue-800">
                                    <input
                                        type="text"
                                        value={skill}
                                        onChange={(e) => updateSkill(index, e.target.value)}
                                        className="bg-transparent text-sm text-blue-700 dark:text-blue-300 outline-none w-auto min-w-[60px]"
                                        style={{ width: `${Math.max(60, skill.length * 8)}px` }}
                                    />
                                    <button
                                        onClick={() => removeSkill(index)}
                                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addSkill}
                                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 px-3 py-1.5 border border-blue-300 dark:border-blue-700 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Skill
                            </button>
                        </div>
                    </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tailored experience bullets emphasizing relevance.
                            </p>
                            <button
                                onClick={() => setShowAddExperience(true)}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Experience
                            </button>
                        </div>

                        {showAddExperience && (
                            <form onSubmit={addExperience} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm animate-fade-in-down">
                                <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-400">Add New Experience</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <input name="title" placeholder="Job Title" required className="input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                    <input name="company" placeholder="Company" required className="input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                    <input name="location" placeholder="Location" className="input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                    <div className="flex gap-2">
                                        <input name="startDate" placeholder="Start Date" required className="w-1/2 input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                        <input name="endDate" placeholder="End Date" required className="w-1/2 input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <button type="button" onClick={() => setShowAddExperience(false)} className="text-sm text-gray-500 hover:text-gray-700 py-2 min-h-[44px]">Cancel</button>
                                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded hover:bg-blue-700">Add</button>
                                </div>
                            </form>
                        )}

                        {content.experience.map((exp, expIndex) => (
                            <div key={expIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors group">
                                <div className="mb-3 flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{exp.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {exp.company} • {exp.startDate} - {exp.endDate}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeExperience(expIndex)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        title="Remove experience"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {exp.bullets.map((bullet, bulletIndex) => (
                                        <div key={bulletIndex} className="flex gap-2">
                                            <span className="text-gray-400 mt-2">•</span>
                                            <textarea
                                                value={bullet}
                                                onChange={(e) => updateExperienceBullet(expIndex, bulletIndex, e.target.value)}
                                                className="flex-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-4 mt-3">
                                        <button
                                            onClick={() => {
                                                const newExp = [...content.experience];
                                                newExp[expIndex].bullets.push('New bullet point');
                                                onUpdate({ ...content, experience: newExp });
                                            }}
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <span>+ Add Bullet</span>
                                        </button>

                                        <button
                                            onClick={() => handleGeneratePoints('experience', expIndex)}
                                            disabled={generatingPoints?.type === 'experience' && generatingPoints?.index === expIndex}
                                            className="text-xs text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                                        >
                                            {generatingPoints?.type === 'experience' && generatingPoints?.index === expIndex ? (
                                                <>
                                                    <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    <span>Generate with AI</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Selected projects demonstrating relevant skills.
                            </p>
                            <button
                                onClick={() => setShowAddProject(true)}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Project
                            </button>
                        </div>

                        {showAddProject && (
                            <form onSubmit={addProject} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm animate-fade-in-down">
                                <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-400">Add New Project</h4>
                                <div className="grid grid-cols-1 gap-3 mb-3">
                                    <input name="name" placeholder="Project Name" required className="input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                    <input name="technologies" placeholder="Technologies (comma separated)" required className="input-sm border rounded px-3 py-2 min-h-[44px] dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <button type="button" onClick={() => setShowAddProject(false)} className="text-sm text-gray-500 hover:text-gray-700 py-2 min-h-[44px]">Cancel</button>
                                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-2 min-h-[44px] rounded hover:bg-blue-700">Add</button>
                                </div>
                            </form>
                        )}

                        {content.projects.map((project, projIndex) => (
                            <div key={projIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors group">
                                <div className="mb-3 flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {project.technologies.join(', ')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeProject(projIndex)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        title="Remove project"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {project.bullets.map((bullet, bulletIndex) => (
                                        <div key={bulletIndex} className="flex gap-2">
                                            <span className="text-gray-400 mt-2">•</span>
                                            <textarea
                                                value={bullet}
                                                onChange={(e) => updateProjectBullet(projIndex, bulletIndex, e.target.value)}
                                                className="flex-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-4 mt-3">
                                        <button
                                            onClick={() => {
                                                const newProj = [...content.projects];
                                                newProj[projIndex].bullets.push('New bullet point');
                                                onUpdate({ ...content, projects: newProj });
                                            }}
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <span>+ Add Bullet</span>
                                        </button>

                                        <button
                                            onClick={() => handleGeneratePoints('project', projIndex)}
                                            disabled={generatingPoints?.type === 'project' && generatingPoints?.index === projIndex}
                                            className="text-xs text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                                        >
                                            {generatingPoints?.type === 'project' && generatingPoints?.index === projIndex ? (
                                                <>
                                                    <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    <span>Generate with AI</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Key achievements and awards.
                            </p>
                            <button
                                onClick={addAchievement}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Achievement
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(content.achievements || []).map((achievement, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <span className="text-gray-400 mt-2">•</span>
                                    <textarea
                                        value={achievement}
                                        onChange={(e) => updateAchievement(index, e.target.value)}
                                        className="flex-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                    />
                                    <button
                                        onClick={() => removeAchievement(index)}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                        title="Remove achievement"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {(content.achievements?.length || 0) === 0 && (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    No achievements listed yet
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
