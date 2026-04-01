"use client";

import ProgressBar from "@/components/ProgressBar";
import DarkModeToggle from "@/components/DarkModeToggle";
import BackToTop from "@/components/BackToTop";
import Terminal from "@/components/Terminal";
import ScrollReveal from "@/components/ScrollReveal";
import PullQuote from "@/components/PullQuote";
import Orbs from "@/components/Orbs";

export default function Home() {
  return (
    <>
      <ProgressBar />
      <Orbs />

      {/* Navigation */}
      <nav className="site-nav">
        <a href="/">Kris Puckett</a>
        <DarkModeToggle />
      </nav>

      <article className="essay">
        {/* Dots divider */}
        <div className="divider-dots" aria-hidden="true">
          · &nbsp; · &nbsp; · &nbsp; · &nbsp; · &nbsp; ·
        </div>

        {/* Hero */}
        <header className="hero">
          <h1 className="hero-title">Field Notes from the In-Between</h1>
          <p className="hero-subtitle">What Happens When a Designer Stops Waiting</p>
          <p className="hero-meta">Kris Puckett · 12 min read</p>
        </header>

        <div className="divider-dots" aria-hidden="true">
          · &nbsp; · &nbsp; · &nbsp; · &nbsp; · &nbsp; ·
        </div>

        {/* === SECTION 1: THE SPACE BETWEEN === */}
        <section>
          <ScrollReveal>
            <p className="drop-cap">
              There is a space between knowing what you want to build and believing you
              can build it. I lived in that space for years. Not stuck, exactly — I could
              sketch interfaces, spec interactions, hand off redlines with the best of
              them. But the distance between a design and a working thing felt
              uncrossable. It was a canyon I&apos;d learned to decorate the edges of
              rather than bridge.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              I am a design leader. That&apos;s the title, the LinkedIn summary, the
              conference bio. I grow teams, build culture, coach craft. I have opinions
              about type scales and spacing systems. I have spent years caring about the
              difference between 4 pixels and 8 pixels and I will die on that hill. But
              I had never shipped a piece of software by myself. Not once.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              This is the story of what happened when I stopped waiting for permission —
              from an engineering team, from a roadmap, from some future version of
              myself who&apos;d finally learned Swift or React — and started building
              something real. With an AI. In the middle of the night. While my kids
              slept.
            </p>
          </ScrollReveal>
        </section>

        <div className="divider" aria-hidden="true">✦</div>

        {/* === SECTION 2: THE IDEA === */}
        <section>
          <ScrollReveal>
            <h2>The Idea That Wouldn&apos;t Leave</h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="drop-cap">
              Epilogue started as frustration. I read constantly — novels, essays,
              histories, the kind of dense non-fiction that takes three months and makes
              you feel slightly smarter at dinner parties. I tracked my reading in apps
              that treated books like tasks. Check it off. Rate it. Next. But books
              aren&apos;t tasks. The good ones change you, and I wanted something that
              remembered that.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              I wanted an app that felt like a personal library — not a spreadsheet with
              cover images. Something that cared about the <em>experience</em> of
              reading: the color of a cover, the mood of a passage, the connections
              between books you didn&apos;t know were connected until you saw them side
              by side. I sketched it in Figma for two years. It stayed in Figma.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <PullQuote>
              The designs were beautiful. They were also dead. Pixels that would never
              respond to a tap, data that would never load, animations that would never
              play.
            </PullQuote>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              I showed the mockups to engineer friends. They&apos;d nod politely. &ldquo;Cool
              concept.&rdquo; Which is what engineers say when they mean &ldquo;I&apos;m
              not going to build this for you.&rdquo; Fair enough. They had their own
              projects. And I had my beautifully inert Figma file.
            </p>
          </ScrollReveal>
        </section>

        <div className="divider" aria-hidden="true">✦</div>

        {/* === SECTION 3: THE FIRST CONVERSATION === */}
        <section>
          <ScrollReveal>
            <h2>The First Conversation</h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="drop-cap">
              I don&apos;t remember the exact date I opened Claude for the first time
              with the intention of building Epilogue. I remember the feeling: half
              skepticism, half desperation. I&apos;d seen the demos. I&apos;d read the
              threads. &ldquo;Non-technical founder builds entire app with AI.&rdquo; It
              sounded like marketing. It sounded impossible. It sounded like something I
              should probably try at 11 PM on a Tuesday.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <Terminal
              lines={[
                {
                  role: "human",
                  text: "I want to build a reading companion app for iOS. I'm a designer, not an engineer. I have Figma mockups. Can you help me build this in Swift?",
                },
                {
                  role: "ai",
                  text: "I'd be happy to help you build this. Let's start with the core data model — what does a book look like in your app? What information do you want to track for each one?",
                },
                {
                  role: "human",
                  text: "Title, author, cover image, reading status, date started, date finished. And here's the thing — I want to extract the dominant colors from the cover art. That's a core design element.",
                },
                {
                  role: "ai",
                  text: "Color extraction from cover images — that's a great feature. We can use Core Image's CIAreaAverage filter, or if you want more nuanced palettes, we can implement k-means clustering on the pixel data. Let me show you both approaches.",
                },
              ]}
            />
          </ScrollReveal>

          <ScrollReveal>
            <p>
              That was the moment. Not the technical answer — the{" "}
              <em>engagement</em>. It didn&apos;t say &ldquo;cool concept.&rdquo; It
              said &ldquo;let me show you both approaches.&rdquo; And then it did.
              Actual Swift code. Code I could read, mostly. Code that referenced
              frameworks I&apos;d heard of but never touched.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              I pasted it into Xcode. It didn&apos;t compile. Of course it didn&apos;t.
              Nothing works the first time. But the error messages were specific, and
              when I brought them back to Claude, it fixed them. Not with vague
              suggestions — with corrected code and an explanation of <em>why</em> the
              original approach failed. We were iterating. I was building.
            </p>
          </ScrollReveal>
        </section>

        <div className="divider" aria-hidden="true">✦</div>

        {/* === SECTION 4: THE COLOR PROBLEM === */}
        <section>
          <ScrollReveal>
            <h2>The Color Problem</h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="drop-cap">
              The cover color extraction worked — mostly. We&apos;d built a k-means
              clustering algorithm that analyzed cover art and pulled the three most
              dominant colors. For most books, it was beautiful. The deep crimson of{" "}
              <em>The Lord of the Rings</em>. The weathered teal of a vintage{" "}
              <em>Odyssey</em>. The colors became the app&apos;s visual signature —
              each book surrounded by its own palette, like a frame that understood its
              painting.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              And then <em>The Silmarillion</em> broke everything.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <PullQuote>
              The cover was a deep forest green. The algorithm returned blue. Not
              close-to-green blue. Not teal. Blue. I stared at the hex values at 2 AM
              and felt genuinely betrayed by a math function.
            </PullQuote>
          </ScrollReveal>

          <ScrollReveal>
            <Terminal
              lines={[
                {
                  role: "human",
                  text: "The color extraction is returning #2A4858 for this cover. It should be green, like #1B5E3B. The cover is clearly green. What's happening?",
                },
                {
                  role: "ai",
                  text: "This is a classic k-means clustering issue. The algorithm is converging on a local minimum that's blending the green cover with the dark background regions. The cover likely has significant dark areas that are pulling the centroid toward blue-gray.",
                },
                {
                  role: "human",
                  text: "So it's averaging the green with the shadows?",
                },
                {
                  role: "ai",
                  text: "Exactly. We have a few options: we can increase k to 5 clusters instead of 3, add a pre-processing step to crop the margins, or weight pixels by saturation so vivid colors aren't diluted by neutral backgrounds. I'd recommend the saturation weighting — it preserves the perceptual 'truth' of the cover.",
                },
              ]}
            />
          </ScrollReveal>

          <ScrollReveal>
            <p>
              Saturation weighting. I didn&apos;t know those words three months earlier.
              Now I was debating color space math with an AI at 2 AM, and I had
              opinions. The green came back. Not exactly <em>#1B5E3B</em>, but close
              enough that when I showed an engineer friend, he squinted at the screen
              and said: &ldquo;Huh. Well, it works.&rdquo;
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              &ldquo;Huh. Well, it works&rdquo; might be the most validating thing
              anyone has ever said to me about code.
            </p>
          </ScrollReveal>
        </section>

        <div className="divider" aria-hidden="true">✦</div>

        {/* === SECTION 5: WHAT I LEARNED IN THE DARK === */}
        <section>
          <ScrollReveal>
            <h2>What I Learned in the Dark</h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="drop-cap">
              Building Epilogue took four months of nights and weekends. I didn&apos;t
              learn to code in any traditional sense. I can&apos;t whiteboard a binary
              search tree. I still google how to write a for loop in Swift sometimes.
              What I learned was something different: how to have a conversation with a
              tool that knows more than I do, without losing the thread of what I&apos;m
              trying to make.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              The design skills transferred in ways I didn&apos;t expect. I could see
              when a layout was wrong before I could explain why in code. I could feel
              when an animation&apos;s easing curve was off, even if I didn&apos;t know
              the cubic-bezier values. I knew when the spacing was 12px and needed to be
              16px. These weren&apos;t coding skills — they were craft instincts,
              applied to a new medium.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <PullQuote>
              The gap between design and development didn&apos;t disappear. But it
              stopped being a canyon. It became a seam — visible, narrow, crossable.
            </PullQuote>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              There were nights I wanted to quit. A SwiftUI view that rendered perfectly
              in preview and crashed on device. A Core Data migration that ate test
              data. An App Store review rejection for a metadata issue I didn&apos;t
              understand. Each obstacle felt terminal until I described it to Claude and
              we worked through it. Not always on the first try. Sometimes not on the
              fifth. But always eventually.
            </p>
          </ScrollReveal>
        </section>

        <div className="divider" aria-hidden="true">✦</div>

        {/* === SECTION 6: THE IN-BETWEEN === */}
        <section>
          <ScrollReveal>
            <h2>The In-Between</h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="drop-cap">
              I don&apos;t call myself an engineer. I don&apos;t call myself a
              &ldquo;no-code founder&rdquo; or an &ldquo;AI-assisted developer&rdquo;
              or whatever the current label is. I am a designer who builds things now.
              That&apos;s the in-between: not one thing or the other, but something that
              didn&apos;t have a name until enough of us started doing it.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              Epilogue is on the App Store. It has users — not millions, but enough that
              strangers send me emails about books they&apos;ve logged. Someone in
              Melbourne told me the color extraction feature made them notice their
              bookshelf differently. They started arranging physical books by cover
              color. That&apos;s not a metric I can put in a pitch deck, but it&apos;s
              the kind of thing that makes me think this mattered.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <Terminal
              lines={[
                {
                  role: "human",
                  text: "We actually shipped this thing.",
                },
                {
                  role: "ai",
                  text: "You shipped it. I just helped with the syntax.",
                },
              ]}
            />
          </ScrollReveal>

          <ScrollReveal>
            <p>
              That last exchange isn&apos;t true, exactly. Claude did more than help with
              syntax. But it isn&apos;t false, either. The idea was mine. The design
              decisions were mine. The 2 AM stubbornness was mine. The willingness to
              build something I wasn&apos;t qualified to build — that was mine too.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <PullQuote>
              The tools didn&apos;t give me permission. I gave myself permission. The
              tools just made it possible to act on it before the feeling faded.
            </PullQuote>
          </ScrollReveal>
        </section>

        <div className="divider" aria-hidden="true">✦</div>

        {/* === SECTION 7: NOTES FOR THE NEXT PERSON === */}
        <section>
          <ScrollReveal>
            <h2>Notes for the Next Person</h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="drop-cap">
              If you&apos;re a designer reading this — or a writer, or a product
              manager, or anyone who&apos;s ever had an idea that lived and died in a
              document — here&apos;s what I&apos;d tell you over coffee:
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              Start with the thing you care about. Not a tutorial project. Not a
              to-do app. The thing that&apos;s been living rent-free in your head. You
              already know what it should feel like, and that knowledge is more
              valuable than you think.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              Your taste is a technical skill. The years you spent learning what{" "}
              <em>good</em> looks like — that transfers. You will catch visual bugs that
              engineers miss. You will feel when an interaction is 100ms too slow. You
              will care about the details that make software feel crafted rather than
              assembled.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              The hard part isn&apos;t the code. The hard part is sitting with the
              discomfort of not knowing what you&apos;re doing and doing it anyway.
              Every error message is a conversation you haven&apos;t had yet. Every
              crash is a question you haven&apos;t asked.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              And the thing you build won&apos;t be perfect. Epilogue has bugs I know
              about and bugs I don&apos;t. The architecture would make a senior iOS
              engineer wince. But it exists. It works. People use it to remember
              what they&apos;ve read and why it mattered.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p>
              That&apos;s enough. That&apos;s more than enough.
            </p>
          </ScrollReveal>
        </section>

        <div className="divider-dots" aria-hidden="true">
          · &nbsp; · &nbsp; · &nbsp; · &nbsp; · &nbsp; ·
        </div>

        {/* Footer */}
        <footer className="essay-footer">
          <div className="share-links">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            >
              Copy link
            </button>
          </div>
          <p>
            Kris Puckett is a design leader building at the intersection of
            craft and code.
          </p>
        </footer>
      </article>

      <BackToTop />
    </>
  );
}
