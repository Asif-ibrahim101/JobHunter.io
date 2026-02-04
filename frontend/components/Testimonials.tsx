'use client';

const testimonials = [
    {
        name: 'Mila McSabbu',
        role: 'Freelance Designer',
        image: 'https://i.pravatar.cc/150?u=1',
        text: "JobHunter.io made our hiring process seamless and efficient. Highly recommended! Need more people like this.",
    },
    {
        name: 'Robert Fox',
        role: 'UI/UX Designer',
        image: 'https://i.pravatar.cc/150?u=2',
        text: "We found our ideal candidate within days. The platform is intuitive and effective. Great job team!",
    },
    {
        name: 'Jenny Wilson',
        role: 'Web Developer',
        image: 'https://i.pravatar.cc/150?u=3',
        text: "Great experience! The quality of applicants exceeded our expectations. Will definitely use again.",
    },
];

export default function Testimonials() {
    return (
        <section className="py-20 bg-blue-50/50 dark:bg-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-blue-500 font-medium mb-3 text-sm tracking-wider uppercase">Customer Reviews</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        What our clients <br /> say <span className="underline decoration-blue-400 decoration-4 underline-offset-4">about us</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.role}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 italic">"{item.text}"</p>
                            <div className="mt-4 flex text-yellow-400 text-sm">
                                {'★'.repeat(5)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mt-12">
                    <button className="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-lg transition-all">←</button>
                    <button className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all">→</button>
                </div>
            </div>
        </section>
    );
}
