import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import FloatingCTA from '../components/FloatingCTA';

const Home = () => {
    return (
        <div className="relative flex flex-col w-full overflow-x-hidden">
            <Hero />
            <Stats />
            <HowItWorks />
            <Features />
            <Testimonials />
            <FloatingCTA />
        </div>
    );
};

export default Home;
