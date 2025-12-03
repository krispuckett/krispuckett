'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.1,
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
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* About Section */}
      <section id="about" className="min-h-screen px-8 py-32">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerChildren}
            className="space-y-8"
          >
            {/* Main story */}
            <motion.p
              className="text-[#b0b0b0] text-lg md:text-xl leading-relaxed"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              There once was a lonely wannabe designer. He sat in a late night coffee shop,
              nursing a decaf americano with Sketch open. He moved some shapes on a screen and
              dreamt of being part of the design industry. Over 10 years later, dozens of
              incredible apps and projects, and hundreds of new friends (more to come hopefully),
              I can&apos;t say thank you enough.
            </motion.p>

            {/* Work history */}
            <motion.p
              className="text-[#b0b0b0] text-lg md:text-xl leading-relaxed"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              Currently, support design teams at Shopify. I&apos;ve led design teams for Mercury,
              designed for Dropbox and Facebook, and I&apos;m the retired co-host of Epicurrence.
            </motion.p>

            {/* Acknowledgments intro */}
            <motion.p
              className="text-[#b0b0b0] text-lg md:text-xl leading-relaxed"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              Here&apos;s an ongoing list of people I deeply owe: for encouragement, for advice,
              for opening doors, for inviting me to go on this wild journey.
            </motion.p>

            {/* Two-column names list */}
            <motion.div
              className="grid grid-cols-2 gap-x-16 gap-y-1 pt-8"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-1">
                {namesLeft.map((name) => (
                  <p
                    key={name}
                    className="text-[#808080] text-sm"
                    style={{ fontFamily: 'ui-monospace, "SF Mono", Monaco, monospace' }}
                  >
                    {name}
                  </p>
                ))}
              </div>
              <div className="space-y-1">
                {namesRight.map((name) => (
                  <p
                    key={name}
                    className="text-[#808080] text-sm"
                    style={{ fontFamily: 'ui-monospace, "SF Mono", Monaco, monospace' }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </motion.div>

            {/* Signature */}
            <motion.div
              className="pt-12"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <div className="w-8 h-px bg-[#808080] mb-4" />
              <p
                className="text-[#b0b0b0] text-base"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Kris
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Words Section */}
      <section id="words" className="min-h-screen px-8 py-32 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-2xl font-medium text-white/90 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Words
          </motion.h2>

          <div className="space-y-12">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3
                    className="text-lg text-[#b0b0b0] group-hover:text-white transition-colors"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {post.title}
                  </h3>
                  <span className="text-[#606060] text-sm flex-shrink-0">{post.date}</span>
                </div>
                <p
                  className="text-[#707070] text-base"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {post.excerpt}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-[50vh] flex items-center justify-center px-8 py-32 border-t border-white/5">
        <motion.div
          className="text-center max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-2xl md:text-3xl text-[#b0b0b0] mb-8"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Let&apos;s chat
          </h2>
          <p
            className="text-[#707070] text-lg mb-10"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Always happy to connect with fellow designers, founders, and anyone
            building interesting things.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@krispuckett.com"
              className="px-6 py-3 bg-white/10 text-white/90 text-sm font-medium rounded-full hover:bg-white/15 transition-colors"
            >
              Send an Email
            </a>
            <a
              href="https://twitter.com/krispuckett"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-white/10 text-white/70 text-sm font-medium rounded-full hover:bg-white/5 transition-colors"
            >
              Follow on X
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-[#505050] text-xs">
            Made with craft and optimism
          </p>
          <p className="text-[#404040] text-xs">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
