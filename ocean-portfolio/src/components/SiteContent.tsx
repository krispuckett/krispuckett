'use client';

import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// Names list - two columns
const namesLeft = [
  'Dann Petty',
  'Charli Prangley',
  'Josh Puckett',
  'Helen Tran',
  'Daniel Burka',
  'Marc Hemeon',
  'Carola Pescio Canale',
  'Dave Soderberg',
  'Cat Noone',
  'Rogie King',
  'Jasmine Christensen',
  'Ben Mezaros',
  'Brian Lovin',
  'Mia Blume',
];

const namesRight = [
  'Josh Taylor',
  'Mike Davidson',
  'Katie Dill',
  'Stephen Olmstead',
  'Josh Dunsterville',
  'Kristy Tillman',
  'Timmy Ham',
  'Emily Campbell',
  'Devin Mancuso',
  'Matt D. Smith',
  'Natalie Armendariz',
  'Anthony Armendariz',
  'Jon Gettings',
  'Katy Puckett',
];

export default function SiteContent() {
  return (
    <div className="min-h-screen bg-abyss">
      {/* About Section */}
      <section id="about" className="relative min-h-screen px-6 md:px-12 py-24 md:py-32">
        {/* Caustic light effect at top */}
        <div className="absolute inset-x-0 top-0 h-64 caustic-light pointer-events-none" />

        <div className="relative max-w-[680px] mx-auto">
          {/* Kris signature with glow */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span
              className="text-fluid-lg font-serif italic text-white/80 text-glow"
            >
              — Kris
            </span>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Main story */}
            <motion.p
              className="font-serif text-fluid-lg text-white/75 leading-[1.7]"
              variants={fadeIn}
              transition={{ duration: 0.6 }}
            >
              There once was a lonely wannabe designer. He sat in a late night coffee shop,
              nursing a decaf americano with Sketch open. He moved some shapes on a screen and
              dreamt of being part of the design industry. Over 10 years later, dozens of
              incredible apps and projects, and hundreds of new friends (more to come hopefully),
              I can&apos;t say thank you enough.
            </motion.p>

            {/* Work history with bold company names */}
            <motion.p
              className="font-serif text-fluid-lg text-white/75 leading-[1.7]"
              variants={fadeIn}
              transition={{ duration: 0.6 }}
            >
              Currently, I support design teams at <strong className="text-white font-semibold">Shopify</strong>.
              I&apos;ve led design teams for <strong className="text-white font-semibold">Mercury</strong>,
              designed for <strong className="text-white font-semibold">Dropbox</strong> and{' '}
              <strong className="text-white font-semibold">Facebook</strong>, and I&apos;m the
              retired co-host of <strong className="text-white font-semibold">Epicurrence</strong>.
            </motion.p>

            {/* Acknowledgments intro */}
            <motion.p
              className="font-serif text-fluid-lg text-white/75 leading-[1.7]"
              variants={fadeIn}
              transition={{ duration: 0.6 }}
            >
              Here&apos;s an ongoing list of people I deeply owe: for encouragement, for advice,
              for opening doors, for inviting me to go on this wild journey.
            </motion.p>

            {/* Two-column names list */}
            <motion.div
              className="grid grid-cols-2 gap-x-12 md:gap-x-20 gap-y-2 pt-10"
              variants={fadeIn}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-2">
                {namesLeft.map((name, index) => (
                  <motion.p
                    key={name}
                    className="font-mono text-fluid-sm text-white/40"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                  >
                    {name}
                  </motion.p>
                ))}
              </div>
              <div className="space-y-2">
                {namesRight.map((name, index) => (
                  <motion.p
                    key={name}
                    className="font-mono text-fluid-sm text-white/40"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03 + 0.1, duration: 0.4 }}
                  >
                    {name}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Words Section */}
      <section id="words" className="min-h-screen px-6 md:px-12 py-24 md:py-32 border-t border-white/5">
        <div className="max-w-[680px] mx-auto">
          <motion.h2
            className="text-fluid-2xl font-medium text-white/90 mb-16 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Words
          </motion.h2>

          <div className="space-y-14">
            {[
              {
                title: 'On building design teams that thrive',
                date: '2024',
                excerpt:
                  'What I\'ve learned about creating environments where designers do their best work.',
              },
              {
                title: 'The craft of coaching designers',
                date: '2023',
                excerpt:
                  'Moving from doing the work to helping others do their best work.',
              },
              {
                title: 'Why optimism is a leadership superpower',
                date: '2023',
                excerpt:
                  'How maintaining belief in possibilities changes everything.',
              },
            ].map((post, index) => (
              <motion.article
                key={post.title}
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between gap-6 mb-3">
                  <h3 className="font-serif text-fluid-lg text-white/70 group-hover:text-white transition-colors duration-300">
                    {post.title}
                  </h3>
                  <span className="text-fluid-sm text-white/30 flex-shrink-0 pt-1">{post.date}</span>
                </div>
                <p className="font-serif text-fluid-base text-white/45 leading-relaxed">
                  {post.excerpt}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-[50vh] flex items-center justify-center px-6 md:px-12 py-24 md:py-32 border-t border-white/5">
        <motion.div
          className="text-center max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-fluid-3xl text-white/80 mb-8">
            Let&apos;s chat
          </h2>
          <p className="font-serif text-fluid-lg text-white/50 mb-12 leading-relaxed">
            Always happy to connect with fellow designers, founders, and anyone
            building interesting things.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@krispuckett.com"
              className="px-8 py-4 bg-white/10 text-white/90 text-fluid-sm font-medium rounded-full hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]"
            >
              Send an Email
            </a>
            <a
              href="https://twitter.com/krispuckett"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/10 text-white/60 text-fluid-sm font-medium rounded-full hover:bg-white/5 hover:text-white/80 transition-all duration-300"
            >
              Follow on X
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-10 border-t border-white/5">
        <div className="max-w-[680px] mx-auto flex items-center justify-between">
          <p className="text-fluid-xs text-white/25 tracking-wide">
            Made with craft and optimism
          </p>
          <p className="text-fluid-xs text-white/20">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
