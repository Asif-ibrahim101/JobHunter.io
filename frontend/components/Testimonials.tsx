'use client';

const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'Product Designer',
        image: 'https://i.pravatar.cc/150?u=11',
        text: 'Found a role in 9 days. The smart search and filters are insanely fast.',
    },
    {
        name: 'Jordan Lee',
        role: 'Frontend Engineer',
        image: 'https://i.pravatar.cc/150?u=22',
        text: 'I applied to 12 jobs in one night and got 4 callbacks. Clean, focused, no fluff.',
    },
    {
        name: 'Priya Shah',
        role: 'Talent Lead',
        image: 'https://i.pravatar.cc/150?u=33',
        text: 'We posted once and saw qualified candidates the same day. The employer tools are sharp.',
    },
];

export default function Testimonials() {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-3">Success stories</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        Proof from job seekers and teams
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.role}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">"{item.text}"</p>
                            <div className="mt-4 flex text-yellow-400 text-sm">{'★'.repeat(5)}</div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mt-12 text-sm text-gray-500">
                    4.8 average rating • 12K reviews
                </div>
            </div>
        </section>
    );
}
