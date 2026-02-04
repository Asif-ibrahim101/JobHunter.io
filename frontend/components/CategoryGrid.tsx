'use client';

const categories = [
    { name: 'IT/Computer', count: '48 Jobs', icon: '💻', color: 'bg-blue-100 text-blue-600' },
    { name: 'Financial Associate', count: '36 Jobs', icon: '💰', color: 'bg-orange-100 text-orange-600' },
    { name: 'Advertising / Media', count: '52 Jobs', icon: '📢', color: 'bg-pink-100 text-pink-600' },
    { name: 'Nurse Educator', count: '20 Jobs', icon: '⚕️', color: 'bg-green-100 text-green-600' },
    { name: 'Office Executive', count: '16 Jobs', icon: '🏢', color: 'bg-purple-100 text-purple-600' },
    { name: 'Engineer / Architect', count: '28 Jobs', icon: '🏗️', color: 'bg-red-100 text-red-600' },
    { name: 'Garments', count: '85 Jobs', icon: '👕', color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Receptionist', count: '24 Jobs', icon: '📞', color: 'bg-yellow-100 text-yellow-600' },
];

export default function CategoryGrid() {
    return (
        <section className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-red-500 font-medium mb-3 text-sm tracking-wider uppercase">Popular Job Categories</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Let's help you <span className="relative">
                        choose
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                        </svg>
                    </span> the <br /> category you want
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-16">
                    Fully layered dolor sit amet, nobis id expedita dolores officiis layered dolor sit amet laboriosam.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat, index) => (
                        <a
                            href={`/jobs/search?keywords=${encodeURIComponent(cat.name)}`}
                            key={index}
                            className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 text-left bg-white dark:bg-gray-800"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${cat.color} group-hover:scale-110 transition-transform`}>
                                {cat.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{cat.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{cat.count}</p>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-12">
                    <a href="/jobs/search" className="inline-flex items-center text-red-500 font-semibold hover:text-red-600 transition-colors group">
                        See All Categories
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
