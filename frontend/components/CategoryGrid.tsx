'use client';

const categories = [
    {
        name: 'IT / Computer',
        count: 482,
        icon: '💻',
        trend: 'Hot',
        trendIcon: '↑',
        trendColor: 'text-orange-500',
        employers: ['Google', 'Meta', 'Netflix', '+47 more'],
    },
    {
        name: 'Finance',
        count: 156,
        icon: '💰',
        trend: 'Growing',
        trendIcon: '→',
        trendColor: 'text-green-500',
        employers: ['Stripe', 'Robinhood', 'Wise', '+23 more'],
    },
    {
        name: 'Marketing',
        count: 203,
        icon: '📢',
        trend: 'Hot',
        trendIcon: '↑',
        trendColor: 'text-orange-500',
        employers: ['HubSpot', 'Airbnb', 'Notion', '+31 more'],
    },
    {
        name: 'Healthcare',
        count: 324,
        icon: '🏥',
        trend: 'Growing',
        trendIcon: '→',
        trendColor: 'text-green-500',
        employers: ['Kaiser', 'UnitedHealth', 'Mayo', '+52 more'],
    },
];

export default function CategoryGrid() {
    return (
        <section id="categories" className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-3">
                    Browse by category
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Find your path — from tech to healthcare
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-16">
                    Explore roles by discipline and see which companies are hiring right now.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <a
                            href={`/jobs/search?keywords=${encodeURIComponent(cat.name)}`}
                            key={cat.name}
                            className="group p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left min-h-[320px] flex flex-col"
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                                    {cat.icon}
                                </div>
                                <span className={`text-xs font-semibold ${cat.trendColor}`}>
                                    {cat.trendIcon} {cat.trend}
                                </span>
                            </div>
                            <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cat.count} jobs</p>

                            <div className="mt-5 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                {cat.employers.map((employer) => (
                                    <div key={employer}>{employer}</div>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                                Explore →
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-12">
                    <a href="/jobs/search" className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                        Explore All 24 Categories →
                    </a>
                </div>
            </div>
        </section>
    );
}
