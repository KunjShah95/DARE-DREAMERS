// TypeScript interfaces for the application

export interface Testimonial {
    quote: string;
    author: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
}

export interface Platform {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    metrics: string[];
    color: string;
    weightage: number;
}

export interface FAQ {
    question: string;
    answer: string;
    category: string;
}

export interface PricingTier {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted: boolean;
    cta: string;
}

export interface Stat {
    value: number;
    suffix: string;
    label: string;
}

export interface Step {
    number: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface Integration {
    name: string;
    logo: string;
}
