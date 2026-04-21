import { useSiteSettings } from "@/hooks/useSiteSettings";
import storyImg from "@/assets/story-craft.jpg";

export function StorySection() {
  const { homepage } = useSiteSettings();
  if (homepage?.show_story === false) return null;

  const title = (homepage?.story_title || "Ceea ce facem diferit este\nmetoda și atenția cu care creăm").split("\n");

  return (
    <section className="bg-secondary py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={homepage?.story_image_url || storyImg}
              alt="Povestea noastră"
              className="h-80 w-full object-cover"
              loading="lazy"
              width={800}
              height={600}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {homepage?.story_label || "Povestea noastră"}
            </p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-foreground">
              {title.map((line: string, i: number) => (
                <span key={i}>{line}{i < title.length - 1 && <br />}</span>
              ))}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {homepage?.story_text || "Folosim doar ceară pură, uleiuri esențiale premium și fitile din lemn natural."}
            </p>
            <a
              href={homepage?.story_cta_url || "/page/despre-noi"}
              className="mt-6 inline-block text-sm font-semibold text-foreground underline underline-offset-4 hover:text-accent transition"
            >
              {homepage?.story_cta_text || "AFLĂ MAI MULT →"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
