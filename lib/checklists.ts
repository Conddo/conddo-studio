// QA checklists per job type — mirrors backend V9 seed (studio.job_types.qa_checklist).
// When the backend exposes the checklist on the job detail (or via /admin/job-types),
// switch to that as the source of truth; this constant is the V1 stopgap so the
// reviewer UI can render the right items without an extra fetch.

export type ChecklistItem = { id: string; label: string; required: boolean; section: string };

export const CHECKLISTS: Record<string, ChecklistItem[]> = {
  WEBSITE_BUILD: [
    { id: "no_placeholder",  label: "No placeholder text anywhere on the page",            required: true, section: "Content" },
    { id: "all_sections",    label: "All required sections present and populated",         required: true, section: "Content" },
    { id: "copy_natural",    label: "Copy reads naturally — not like a form was filled",   required: true, section: "Content" },
    { id: "contact_accurate", label: "Contact details match the business brief exactly",   required: true, section: "Content" },
    { id: "logo_placed",     label: "Logo correctly placed and sized — not stretched",     required: true, section: "Visual"  },
    { id: "brand_colours",   label: "Brand colours applied consistently throughout",       required: true, section: "Visual"  },
    { id: "images_quality",  label: "All images are high quality — no blur or pixelation", required: true, section: "Visual"  },
    { id: "typography",      label: "Typography is consistent throughout",                 required: true, section: "Visual"  },
    { id: "mobile_view",     label: "Mobile view correct at 375px",                        required: true, section: "Technical" },
    { id: "tablet_view",     label: "Tablet view correct at 768px",                        required: true, section: "Technical" },
    { id: "cta_buttons",     label: "CTA buttons present and clearly labelled",            required: true, section: "Technical" },
    { id: "design_standard", label: "Meets the Conddo.io design standard library",         required: true, section: "Standard"  },
  ],
  WEBSITE_REVISION: [
    { id: "changes_applied", label: "All requested changes applied correctly",             required: true, section: "Content"   },
    { id: "no_regressions",  label: "No regressions — previously approved sections unchanged", required: true, section: "Technical" },
    { id: "mobile_check",    label: "Mobile view rechecked after changes",                 required: true, section: "Technical" },
  ],
  GRAPHIC_DESIGN: [
    { id: "brand_applied",      label: "Brand colours and logo applied correctly",   required: true, section: "Visual"    },
    { id: "correct_dimensions", label: "Correct dimensions for intended platform",   required: true, section: "Technical" },
    { id: "text_legible",       label: "All text is legible at intended display size", required: true, section: "Visual"    },
    { id: "file_format",        label: "Exported in correct file format and resolution", required: true, section: "Technical" },
  ],
  AD_CREATIVE: [
    { id: "ad_specs",       label: "Meets Meta ad specifications (1080x1080 or 1080x1920)", required: true, section: "Technical" },
    { id: "no_text_over_20", label: "Text covers less than 20% of image area",              required: true, section: "Technical" },
    { id: "brand_clear",    label: "Brand is clearly identifiable",                         required: true, section: "Visual"    },
    { id: "cta_visible",    label: "Call to action is visible and compelling",              required: true, section: "Content"   },
  ],
  BRAND_KIT: [
    { id: "logo_variations",     label: "Logo provided in all required variations", required: true,  section: "Deliverables" },
    { id: "colour_codes",        label: "All colour codes documented (HEX, RGB)",   required: true,  section: "Deliverables" },
    { id: "typography_specified", label: "Typography clearly specified with weights", required: true, section: "Deliverables" },
    { id: "usage_guidelines",    label: "Basic usage guidelines included",          required: false, section: "Deliverables" },
  ],
  CONTENT_WRITING: [
    { id: "tone_correct",     label: "Tone matches the business vertical and brand",    required: true, section: "Content" },
    { id: "no_ai_slurp",      label: "No AI slurp language (seamless, robust, leverage etc.)", required: true, section: "Content" },
    { id: "factually_accurate", label: "All facts match the business brief",            required: true, section: "Content" },
    { id: "word_count",       label: "Meets specified word count",                      required: true, section: "Content" },
  ],
};

/** Group items by section, preserving the seed order. */
export function groupChecklist(items: ChecklistItem[]): { section: string; items: ChecklistItem[] }[] {
  const order: string[] = [];
  const bySection = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    if (!bySection.has(item.section)) {
      bySection.set(item.section, []);
      order.push(item.section);
    }
    bySection.get(item.section)!.push(item);
  }
  return order.map((s) => ({ section: s, items: bySection.get(s)! }));
}
