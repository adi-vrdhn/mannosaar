'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { BOOKABLE_SERVICES } from '@/lib/services';

const ServicesSection = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="home-services-heading" className="bg-[#cbb7df] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col justify-between gap-6 border-t border-[#34213f]/30 pt-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b267a]">Our services</p>
            <h2 id="home-services-heading" className="mt-4 font-playfair text-3xl font-bold leading-tight tracking-[-0.035em] text-[#34213f] sm:text-4xl">
              Choose the support that feels right for you.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#4c4052]">
              Private online counselling for personal concerns and relationships, with a straightforward booking process.
            </p>
          </div>
          <Link href="/services" className="w-fit border-b border-[#5b267a]/60 pb-1 text-sm font-semibold text-[#5b267a] transition-colors hover:border-[#34213f] hover:text-[#34213f]">
            View services &amp; pricing
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {BOOKABLE_SERVICES.map((service, index) => (
            <motion.article
              key={service.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              className="flex flex-col rounded-[24px] border border-[#5b267a]/25 bg-[#eee5f3] px-6 py-9 sm:px-8 sm:py-10"
            >
              <div className="flex items-center gap-4 text-[#5b267a]">
                <span className="font-playfair text-2xl leading-none" aria-hidden="true">0{index + 1}</span>
                <span className="h-px w-10 bg-[#5b267a]/45" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">Online counselling</span>
              </div>

              <h3 className="mt-8 font-playfair text-3xl font-bold tracking-[-0.03em] text-[#34213f] sm:text-[2.1rem]">
                {service.name}
              </h3>
              <p className="mt-4 max-w-[29rem] flex-1 text-base leading-7 text-[#4c4052]">
                {service.description}
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-5 border-t border-[#34213f]/20 pt-5">
                <p className="text-sm font-medium text-[#62576b]">{service.durationMinutes} minutes · Online</p>
                <Link
                  href={`/book-session?service=${service.id}`}
                  aria-label={`Book ${service.name}`}
                  className="group inline-flex min-h-11 items-center gap-3 font-semibold text-[#5b267a] transition-colors hover:text-[#34213f] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5b267a]"
                >
                  Book a session
                  <span className="flex size-9 items-center justify-center rounded-full border border-[#5b267a]/55 transition-colors group-hover:border-[#34213f] group-hover:bg-[#34213f] group-hover:text-white">
                    <ArrowUpRight size={17} strokeWidth={1.8} className="motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
