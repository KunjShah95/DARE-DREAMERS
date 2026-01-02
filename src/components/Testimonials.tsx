import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const testimonials = [
  {
    content: "We hired a senior React developer in 48 hours. The quality of talent is unmatched compared to other platforms.",
    author: "Sarah Jenkins",
    role: "CTO at TechFlow",
    image: "https://i.pravatar.cc/100?img=5"
  },
  {
    content: "The AI vetting is legit. Every candidate we interviewed was technically sound and culturally fit.",
    author: "Michael Chen",
    role: "Founder at Spark",
    image: "https://i.pravatar.cc/100?img=11"
  },
  {
    content: "Dare Dreamers handled all the compliance and payroll for our remote team in Brazil. huge time saver.",
    author: "Elena Rodriguez",
    role: "VP of People at ScaleUp",
    image: "https://i.pravatar.cc/100?img=9"
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.05),transparent_40%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Loved by <span className="text-gradient">Innovators</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-card/40 border-border/50 backdrop-blur-sm p-6 hover:border-primary/30 transition-colors">
                <CardContent className="pt-0 space-y-6">
                  <Quote className="w-8 h-8 text-primary/20 fill-primary/20" />
                  <p className="text-lg text-muted-foreground italic leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full border-2 border-primary/20"
                    />
                    <div>
                      <h4 className="font-bold text-foreground">{testimonial.author}</h4>
                      <p className="text-sm text-primary">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
