'use client'

import { ExternalLink, BookOpen } from 'lucide-react'

const REFERENCES: { label: string; note: string; href: string }[] = [
  {
    label: 'CPCB National Air Quality Index',
    note: 'Category breakpoints and health advisories (0–500).',
    href: 'https://www.cpcb.nic.in/displaypdf.php?id=bmF0aW9uYWwtYWlyLXF1YWxpdHktaW5kZXgvQWJvdXRfQVFJLnBkZg%3D%3D',
  },
  {
    label: 'PIB — Launch of the National AQI',
    note: 'Government of India press release announcing the index.',
    href: 'https://www.pib.gov.in/newsite/printrelease.aspx?relid=110654&reg=3&lang=2',
  },
  {
    label: 'ASHRAE Technical FAQ 35 (CO2)',
    note: 'Indoor CO2 not more than ~700 ppm above outdoor ventilation guidance.',
    href: 'https://www.ashrae.org/File%20Library/Technical%20Resources/Technical%20FAQs/TC-04.03-FAQ-35.pdf',
  },
  {
    label: 'NIOSH Pocket Guide — Carbon dioxide',
    note: 'Occupational exposure limits used for the 5000 ppm threshold.',
    href: 'https://www.cdc.gov/niosh/npg/npgd0103.html',
  },
  {
    label: 'ISHRAE IEQ Standard 10001',
    note: 'Indoor environmental quality classes referenced by the eCO2 bands.',
    href: 'https://www.researchgate.net/publication/368307322_Development_and_validation_of_ISHRAE_Indoor_Environmental_Quality_Standard',
  },
]

export function StandardsReferences() {
  return (
    <section aria-label="Standards and references" className="glass-panel p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-accent" />
        <h2 className="text-lg font-semibold">Standards &amp; References</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Thresholds and category labels on this dashboard follow the sources below.
      </p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {REFERENCES.map((r) => (
          <li key={r.href}>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-border/40 bg-secondary/20 p-3.5 transition-colors hover:border-border/70 hover:bg-secondary/30"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground group-hover:text-accent">
                  {r.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {r.note}
                </span>
              </span>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
