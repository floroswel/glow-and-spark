import { useState, useEffect, useCallback, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/* ───── 200 Romanian names: 60 male + 140 female ───── */
const MALE = [
  "Andrei","Alexandru","Adrian","Bogdan","Cristian","Daniel","Dragoș","Eduard","Emil","Florin",
  "Gabriel","George","Horia","Ilie","Ion","Iulian","Laurențiu","Liviu","Lucian","Marcel",
  "Marian","Mihai","Mircea","Nicolae","Ovidiu","Paul","Petru","Radu","Răzvan","Robert",
  "Sebastian","Sergiu","Silviu","Sorin","Ștefan","Teodor","Traian","Tudor","Valentin","Vasile",
  "Victor","Vlad","Viorel","Cosmin","Ciprian","Dan","Dorin","Felix","Ionuț","Marius",
  "Cătălin","Claudiu","Constantin","Darius","Denis","Eugen","Filip","Horațiu","Matei","Nicu",
];
const FEMALE = [
  "Ana","Andreea","Alexandra","Alina","Amalia","Anca","Bianca","Camelia","Carmen","Carla",
  "Catalina","Cezara","Clara","Claudia","Corina","Cristina","Daciana","Dana","Daniela","Daria",
  "Delia","Denisa","Diana","Dora","Dorina","Ecaterina","Elena","Elisa","Emanuela","Emma",
  "Eva","Florentina","Gabriela","Georgiana","Ileana","Ioana","Ionela","Irina","Isabela","Iulia",
  "Jana","Larisa","Laura","Lavinia","Liana","Liliana","Livia","Loredana","Lucia","Luminița",
  "Madalina","Mara","Maria","Marina","Marta","Melania","Mihaela","Mirela","Monica","Nadia",
  "Natalia","Nicoleta","Oana","Olga","Otilia","Paula","Petronela","Raluca","Ramona","Rebeca",
  "Roberta","Rodica","Roxana","Ruxandra","Sabina","Sandra","Sara","Silvia","Simona","Sofia",
  "Sorina","Stefania","Tamara","Tatiana","Teodora","Valentina","Valerica","Vanessa","Vera","Veronica",
  "Victoria","Violeta","Virginia","Viviana","Adelina","Adriana","Antonia","Aurora","Beatrice","Carina",
  "Cerasela","Codruța","Cosmina","Damiana","Despina","Dumitra","Edith","Eleonora","Emilia","Erica",
  "Estera","Felicia","Flavia","Geanina","Gilda","Hortensia","Ina","Izabela","Jasmina","Lelia",
  "Leontina","Lidia","Lorena","Luciana","Magdalena","Marcela","Margareta","Melisa","Mirabela","Narcisa",
  "Noemi","Octavia","Patricia","Petruta","Riana","Romina","Sanda","Smaranda","Stela","Timeea",
];
const ALL_NAMES = [...MALE, ...FEMALE];

const CITIES = [
  "București","Cluj-Napoca","Timișoara","Iași","Constanța","Brașov","Craiova","Galați",
  "Oradea","Ploiești","Sibiu","Bacău","Arad","Pitești","Baia Mare","Buzău",
  "Botoșani","Suceava","Târgu Mureș","Focșani","Satu Mare","Râmnicu Vâlcea",
  "Drobeta-Turnu Severin","Piatra Neamț","Alba Iulia","Deva","Reșița","Bistrița",
  "Slobozia","Vaslui","Giurgiu","Tulcea","Zalău","Târgoviște","Mediaș","Hunedoara",
];

const PRODUCTS = [
  "Lumânare Vanilla & Santal","Lumânare Lavandă","Set Cadou Trandafir","Diffuzor Aromat",
  "Lumânare Pilar Cedru","Lumânare Caramel","Set Relaxare Spa","Lumânare Bumbac Proaspăt",
  "Diffuzor Bambus","Lumânare Scorțișoară","Set Premium 3 Lumânări","Lumânare Trandafir",
  "Ceară Topită Vanilie","Lumânare Iasomie","Lumânare Bergamotă","Set Cadou Deluxe",
  "Lumânare Mosc Alb","Lumânare Lemn de Santal","Diffuzor Eucalipt","Lumânare Miere",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

interface ProofEntry { name: string; city: string; product: string; }

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SocialProofToast() {
  const { social_proof } = useSiteSettings();
  const [current, setCurrent] = useState<ProofEntry | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<ProofEntry[]>([]);
  const lastRef = useRef("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const show = social_proof?.show !== false;
  const interval = (social_proof?.interval_seconds || 20) * 1000;

  const buildQueue = useCallback((): ProofEntry[] => {
    const entries: ProofEntry[] = Array.from({ length: 30 }, () => ({
      name: pick(ALL_NAMES),
      city: pick(CITIES),
      product: pick(PRODUCTS),
    }));
    return shuffleArray(entries);
  }, []);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) queueRef.current = buildQueue();
    let entry = queueRef.current.shift()!;
    let tries = 0;
    while (entry && entry.name === lastRef.current && queueRef.current.length > 0 && tries < 5) {
      queueRef.current.push(entry);
      entry = queueRef.current.shift()!;
      tries++;
    }
    if (!entry) return;
    lastRef.current = entry.name;
    setCurrent(entry);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  }, [buildQueue]);

  useEffect(() => {
    if (!show || !mounted) return;
    const t1 = setTimeout(showNext, 8000);
    const t2 = setInterval(showNext, interval + 6000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [show, interval, showNext, mounted]);

  if (!mounted || !show || !visible || !current) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[90] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex w-[320px] items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-2xl">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-2xl">
          🕯️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Acum {Math.floor(Math.random() * 15) + 1} minute</p>
          <p className="text-sm font-semibold text-foreground truncate">
            {current.name} din {current.city}
          </p>
          <p className="text-xs text-muted-foreground truncate">a cumpărat: {current.product}</p>
        </div>
        <span className="shrink-0 text-green-600 text-xs font-bold">✔ Verificat</span>
      </div>
    </div>
  );
}
