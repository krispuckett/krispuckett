'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function SiteContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001020] via-[#001830] to-[#002040]">
      {/* Intro Section */}
      <section className="min-h-screen flex items-center justify-center px-8 py-20">
        <motion.div
          className="max-w-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerChildren}
        >
          <motion.p
            className="text-white/90 text-lg md:text-xl lg:text-2xl leading-relaxed mb-8"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            There once was a lonely wannabe designer. He sat in a late night coffee shop,
            nursing a decaf americano with Sketch open. He moved some shapes on a screen
            and dreamt of being part of the design industry.
          </motion.p>

          <motion.p
            className="text-white/90 text-lg md:text-xl lg:text-2xl leading-relaxed mb-8"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            Over 10 years later, dozens of incredible apps and projects, and hundreds of
            new friends (more to come hopefully), I can&apos;t say thank you enough.
          </motion.p>

          <motion.p
            className="text-white/70 text-base md:text-lg leading-relaxed"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            Currently, I support design teams at{' '}
            <span className="text-white font-medium">Shopify</span>. I&apos;ve led design
            teams for <span className="text-white font-medium">Mercury</span>, designed
            for <span className="text-white font-medium">Dropbox</span> and{' '}
            <span className="text-white font-medium">Facebook</span>, and I&apos;m the
            retired co-host of{' '}
            <span className="text-white font-medium">Epicurrence</span>.
          </motion.p>
        </motion.div>
      </section>

      {/* Work Section */}
      <section id="work" className="min-h-screen px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Selected Work
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Shopify',
                role: 'Design Leadership',
                description:
                  'Supporting and growing design teams building commerce experiences for millions.',
              },
              {
                title: 'Mercury',
                role: 'Head of Design',
                description:
                  'Led design for the banking platform helping startups scale.',
              },
              {
                title: 'Dropbox',
                role: 'Product Designer',
                description: 'Designed collaboration features for the file sharing platform.',
              },
              {
                title: 'Facebook',
                role: 'Product Designer',
                description: 'Early work on social platform features and experiences.',
              },
            ].map((project, index) => (
              <motion.div
                key={project.title}
                className="group p-8 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                  <span className="text-white/50 text-sm">{project.role}</span>
                </div>
                <p className="text-white/70">{project.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Words Section */}
      <section id="words" className="min-h-screen px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Words
          </motion.h2>

          <div className="space-y-8">
            {[
              {
                title: 'On building design teams that thrive',
                date: '2024',
                excerpt:
                  'What I&apos;ve learned about creating environments where designers do their best work.',
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
                className="group p-8 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-white/90">
                    {post.title}
                  </h3>
                  <span className="text-white/50 text-sm">{post.date}</span>
                </div>
                <p className="text-white/70">{post.excerpt}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-screen flex items-center justify-center px-8 py-20">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8">
            Let&apos;s Chat
          </h2>
          <p className="text-white/70 text-lg mb-12">
            Always happy to connect with fellow designers, founders, and anyone
            building interesting things.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="mailto:hello@example.com"
              className="px-8 py-4 bg-white text-[#001830] font-semibold rounded-full hover:bg-white/90 transition-colors"
            >
              Send an Email
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/30 text-white rounded-full hover:bg-white/10 transition-colors"
            >
              Follow on X
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            Made with craft and optimism
          </p>
          <p className="text-white/30 text-sm">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
